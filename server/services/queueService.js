const { createClient } = require("redis");
const channelsConfig = require("../data/channels.json");
const topicsConfig = require("../data/topics.json");

/**
 * Queue Service using Redis Sorted Sets for O(log n) operations
 *
 * Key Structure:
 * - queue:{channel}:{mode}:{topic} → ZSET { socketId: timestamp }
 * - user:{socketId}:meta → HASH { channel, mode, topics, joinedAt }
 */
class QueueService {
  constructor() {
    const redisUrl =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || 6379
      }`;

    console.log(
      "[REDIS] Connecting to:",
      redisUrl.replace(/\/\/.*@/, "//*****@"),
    );

    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err) =>
      console.error("[REDIS] Client Error", err),
    );
    this.client.on("connect", () =>
      console.log("[REDIS] Connected successfully"),
    );
    this.client.connect();

    // Valid channels and topics from configuration
    this.validChannels = new Set(channelsConfig.channels.map((c) => c.id));
    this.validTopics = new Set(topicsConfig.topics.map((t) => t.id));
  }

  /**
   * Get queue key for a specific channel, mode, and topic
   * Format: queue:{channel}:{mode}:{topic}
   */
  getQueueKey(channel, mode, topic) {
    return `queue:${channel}:${mode}:${topic}`;
  }

  /**
   * Get user metadata key
   */
  getUserMetaKey(socketId) {
    return `user:${socketId}:meta`;
  }

  /**
   * Get all channels from configuration
   */
  getChannels() {
    return channelsConfig.channels;
  }

  /**
   * Get all topics from configuration
   */
  getTopics() {
    return topicsConfig.topics;
  }

  /**
   * Validate channel ID
   */
  isValidChannel(channelId) {
    return this.validChannels.has(channelId);
  }

  /**
   * Add user to topic queues using Sorted Sets
   * Time Complexity: O(T × log n) where T = number of topics
   *
   * @param {string} socketId - User's socket ID
   * @param {string} channel - Channel (anime, movies, general)
   * @param {string} mode - Chat mode (video, audio, text)
   * @param {string[]} topics - Selected topics
   * @returns {string[]} - Validated topics the user was added to
   */
  async addUser(
    socketId,
    channel = "general",
    mode = "video",
    topics = ["casual"],
  ) {
    // Validate channel
    if (!this.validChannels.has(channel)) {
      channel = "general";
    }

    // Validate topics, default to casual
    const validatedTopics = topics.filter((t) => this.validTopics.has(t));
    if (validatedTopics.length === 0) validatedTopics.push("casual");

    const timestamp = Date.now();

    console.log(
      `[QUEUE] Adding ${socketId} to ${channel}:${mode} queues: ${validatedTopics.join(", ")}`,
    );

    // Store user metadata in a Hash (with 5 minute TTL)
    const metaKey = this.getUserMetaKey(socketId);
    await this.client.hSet(metaKey, {
      channel,
      mode,
      topics: JSON.stringify(validatedTopics),
      joinedAt: timestamp.toString(),
    });
    await this.client.expire(metaKey, 300); // 5 minute TTL

    // Add user to each selected topic queue using ZADD
    // Score = timestamp for FCFS ordering
    for (const topic of validatedTopics) {
      const queueKey = this.getQueueKey(channel, mode, topic);
      await this.client.zAdd(queueKey, { score: timestamp, value: socketId });
    }

    return { channel, mode, topics: validatedTopics };
  }

  /**
   * Find a match for a user based on channel, mode, and topics
   * Uses ZPOPMIN for O(log n) pops from Sorted Sets
   *
   * Strategy: Find users who share at least one common topic in the same channel/mode
   */
  async findMatch(channel, mode, isUserOnline, topics = ["casual"]) {
    // Validate inputs
    if (!this.validChannels.has(channel)) channel = "general";
    const validatedTopics = topics.filter((t) => this.validTopics.has(t));
    if (validatedTopics.length === 0) validatedTopics.push("casual");

    let peer1 = null;
    let peer1Meta = null;

    // Find first peer from any of the selected topic queues
    for (const topic of validatedTopics) {
      if (peer1) break;
      const queueKey = this.getQueueKey(channel, mode, topic);

      while (true) {
        // ZPOPMIN returns the member with the lowest score (oldest user)
        const result = await this.client.zPopMin(queueKey);
        if (!result) break;

        const candidateId = result.value;

        if (isUserOnline(candidateId)) {
          peer1 = candidateId;
          // Get peer1's metadata
          const metaKey = this.getUserMetaKey(candidateId);
          const meta = await this.client.hGetAll(metaKey);
          peer1Meta = {
            channel: meta.channel,
            mode: meta.mode,
            topics: meta.topics ? JSON.parse(meta.topics) : ["casual"],
          };
          break;
        }
        // If not online, user is discarded (ghost cleanup)
      }
    }

    if (!peer1) {
      console.log(
        `[QUEUE] No peer1 found in ${channel}:${mode} for topics: ${validatedTopics.join(", ")}`,
      );
      return null;
    }

    // Find overlapping topics between the search topics and peer1's topics
    const overlappingTopics = validatedTopics.filter((t) =>
      peer1Meta.topics.includes(t),
    );

    console.log(
      `[QUEUE] Found peer1 ${peer1}, looking for peer2 in overlapping topics: ${overlappingTopics.join(", ")}`,
    );

    let peer2 = null;

    // Find second peer from overlapping topic queues
    for (const topic of overlappingTopics) {
      if (peer2) break;
      const queueKey = this.getQueueKey(channel, mode, topic);

      while (true) {
        const result = await this.client.zPopMin(queueKey);
        if (!result) break;

        const candidateId = result.value;
        if (candidateId === peer1) continue; // Skip same user

        if (isUserOnline(candidateId)) {
          peer2 = candidateId;
          break;
        }
      }
    }

    if (!peer2) {
      // No match found, re-add peer1 to their queues
      console.log(`[QUEUE] No peer2 found, re-adding peer1 ${peer1} to queues`);
      await this.reAddUserToQueues(peer1, peer1Meta);
      return null;
    }

    // Clean up matched users from ALL their topic queues
    console.log(
      `[QUEUE] Match found: ${peer1} <-> ${peer2} in ${channel}:${mode}`,
    );
    await this.removeUserFromQueues(peer1);
    await this.removeUserFromQueues(peer2);

    return [peer1, peer2];
  }

  /**
   * Re-add user to the front of their topic queues (when no match found)
   * Uses original timestamp to maintain FCFS position
   */
  async reAddUserToQueues(socketId, meta) {
    const timestamp = parseInt(meta.joinedAt) || Date.now();

    for (const topic of meta.topics) {
      const queueKey = this.getQueueKey(meta.channel, meta.mode, topic);
      await this.client.zAdd(queueKey, { score: timestamp, value: socketId });
    }
  }

  /**
   * Remove user from all their topic queues
   * Time Complexity: O(T × log n) where T = number of topics
   *
   * Uses ZREM which is O(log n) per queue - much faster than LREM O(n)!
   */
  async removeUserFromQueues(socketId) {
    const metaKey = this.getUserMetaKey(socketId);
    const meta = await this.client.hGetAll(metaKey);

    if (!meta || !meta.channel) {
      console.log(
        `[QUEUE] No metadata found for ${socketId}, skipping cleanup`,
      );
      return;
    }

    const topics = meta.topics ? JSON.parse(meta.topics) : ["casual"];

    console.log(
      `[QUEUE] Removing ${socketId} from ${meta.channel}:${meta.mode} queues: ${topics.join(", ")}`,
    );

    // ZREM is O(log n) - the key improvement!
    for (const topic of topics) {
      const queueKey = this.getQueueKey(meta.channel, meta.mode, topic);
      await this.client.zRem(queueKey, socketId);
    }

    // Delete user metadata
    await this.client.del(metaKey);
  }

  /**
   * Clean up a disconnected user from all queues
   * Called on socket disconnect
   */
  async cleanupUser(socketId) {
    await this.removeUserFromQueues(socketId);
  }

  /**
   * Get queue stats for debugging
   */
  async getQueueStats(channel, mode) {
    const stats = {};
    for (const topic of topicsConfig.topics) {
      const queueKey = this.getQueueKey(channel, mode, topic.id);
      const count = await this.client.zCard(queueKey);
      if (count > 0) {
        stats[topic.id] = count;
      }
    }
    return stats;
  }
}

module.exports = new QueueService();
