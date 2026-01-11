const { createClient } = require("redis");

class QueueService {
  constructor() {
    // Support both REDIS_URL (Render) and REDIS_HOST/PORT (Docker)
    const redisUrl =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || 6379
      }`;

    console.log(
      "[REDIS] Connecting to:",
      redisUrl.replace(/\/\/.*@/, "//*****@")
    ); // Hide credentials in logs

    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err) =>
      console.error("[REDIS] Client Error", err)
    );
    this.client.on("connect", () =>
      console.log("[REDIS] Connected successfully")
    );
    this.client.connect();

    // Queue keys for different chat modes
    this.QUEUE_KEYS = {
      video: "chat_queue:video",
      audio: "chat_queue:audio",
      text: "chat_queue:text",
    };
  }

  getQueueKey(chatMode) {
    return this.QUEUE_KEYS[chatMode] || this.QUEUE_KEYS.video;
  }

  async addUser(socketId, chatMode = "video") {
    const queueKey = this.getQueueKey(chatMode);
    console.log(`[QUEUE] Adding ${socketId} to ${queueKey}`);
    await this.client.rPush(queueKey, socketId);
  }

  async findMatch(chatMode = "video", isUserOnline) {
    const queueKey = this.getQueueKey(chatMode);
    let peer1 = null;
    let peer2 = null;

    // Find first peer
    while (!peer1) {
      const id = await this.client.lPop(queueKey);
      if (!id) return null; // Queue empty

      if (isUserOnline(id)) {
        peer1 = id;
      }
    }

    // Find second peer
    while (!peer2) {
      const id = await this.client.lPop(queueKey);
      if (!id) {
        // No match found for peer1, put them back at the head of the queue
        await this.client.lPush(queueKey, peer1);
        return null;
      }

      if (isUserOnline(id)) {
        peer2 = id;
      }
    }

    return [peer1, peer2];
  }
}

module.exports = new QueueService();
