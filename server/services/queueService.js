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

    this.QUEUE_KEY = "chat_queue";
  }

  async addUser(socketId) {
    await this.client.rPush(this.QUEUE_KEY, socketId);
  }

  async findMatch(isUserOnline) {
    let peer1 = null;
    let peer2 = null;

    // Find first peer
    while (!peer1) {
      const id = await this.client.lPop(this.QUEUE_KEY);
      if (!id) return null; // Queue empty

      if (isUserOnline(id)) {
        peer1 = id;
      }
    }

    // Find second peer
    while (!peer2) {
      const id = await this.client.lPop(this.QUEUE_KEY);
      if (!id) {
        // No match found for peer1, put them back at the head of the queue
        await this.client.lPush(this.QUEUE_KEY, peer1);
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
