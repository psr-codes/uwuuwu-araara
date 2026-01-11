const queueService = require("../services/queueService");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    socket.on("join_queue", async () => {
      console.log(`[QUEUE] User ${socket.id} joining queue`);
      await queueService.addUser(socket.id);

      // Emit socket ID to user for debugging
      socket.emit("socket_id", socket.id);

      // Try to find a match
      const match = await queueService.findMatch((id) => {
        const isOnline = io.sockets.sockets.has(id);
        console.log(`[QUEUE] Checking if ${id} is online: ${isOnline}`);
        return isOnline;
      });

      if (match) {
        const [peer1, peer2] = match;
        console.log(`[MATCH] Found: ${peer1} <-> ${peer2}`);

        // Notify peer1 (Initiator - will create offer)
        io.to(peer1).emit("matched", {
          partnerId: peer2,
          initiator: true,
        });
        console.log(`[MATCH] Notified ${peer1} as initiator`);

        // Notify peer2 (Receiver - will answer)
        io.to(peer2).emit("matched", {
          partnerId: peer1,
          initiator: false,
        });
        console.log(`[MATCH] Notified ${peer2} as receiver`);
      } else {
        console.log(
          `[QUEUE] No match found for ${socket.id}, waiting in queue`
        );
      }
    });

    socket.on("signal", (data) => {
      const { target, signal } = data;
      console.log(
        `[SIGNAL] ${socket.id} -> ${target} (type: ${
          signal.type || "candidate"
        })`
      );
      io.to(target).emit("signal", {
        sender: socket.id,
        signal,
      });
    });

    socket.on("chat_message", (data) => {
      const { target, message } = data;
      console.log(`[CHAT] ${socket.id} -> ${target}: ${message}`);
      io.to(target).emit("chat_message", {
        sender: socket.id,
        message,
      });
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
      // Lazy removal: We don't remove from Redis here.
      // Notify partner if connected (would need to track partners)
    });
  });
};
