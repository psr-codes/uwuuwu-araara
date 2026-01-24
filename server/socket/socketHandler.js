const queueService = require("../services/queueService");
const { trackConnection } = require("../services/analytics");
const registerGameHandler = require("./handlers/gameHandler");

module.exports = (io) => {
  // Track active connections for upgrade requests
  const activeConnections = new Map(); // socketId -> partnerId

  io.on("connection", (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Register game event handlers
    registerGameHandler(io, socket, activeConnections);

    socket.on("join_queue", async (data = {}) => {
      const channel = data.channel || "general";
      const chatMode = data.chatMode || "video";
      const topics = data.topics || ["casual"];

      console.log(
        `[QUEUE] User ${socket.id} joining queue (channel: ${channel}, mode: ${chatMode}, topics: ${topics.join(", ")})`,
      );

      const result = await queueService.addUser(
        socket.id,
        channel,
        chatMode,
        topics,
      );
      socket.emit("socket_id", socket.id);

      const match = await queueService.findMatch(
        channel,
        chatMode,
        (id) => {
          const isOnline = io.sockets.sockets.has(id);
          console.log(`[QUEUE] Checking if ${id} is online: ${isOnline}`);
          return isOnline;
        },
        result.topics,
      );

      if (match) {
        const [peer1, peer2] = match;
        console.log(
          `[MATCH] Found: ${peer1} <-> ${peer2} (channel: ${channel}, mode: ${chatMode})`,
        );

        // Track the connection
        activeConnections.set(peer1, peer2);
        activeConnections.set(peer2, peer1);

        io.to(peer1).emit("matched", { partnerId: peer2, initiator: true });
        io.to(peer2).emit("matched", { partnerId: peer1, initiator: false });

        trackConnection(chatMode, peer1, peer2);
      } else {
        console.log(
          `[QUEUE] No match for ${socket.id} in ${channel}:${chatMode}, waiting`,
        );
      }
    });

    socket.on("signal", (data) => {
      const { target, signal } = data;
      console.log(
        `[SIGNAL] ${socket.id} -> ${target} (type: ${
          signal.type || "candidate"
        })`,
      );
      io.to(target).emit("signal", { sender: socket.id, signal });
    });

    socket.on("chat_message", (data) => {
      const { target, message } = data;
      console.log(`[CHAT] ${socket.id} -> ${target}: ${message}`);
      io.to(target).emit("chat_message", { sender: socket.id, message });
    });

    // ========== UPGRADE FLOW ==========

    // User requests to upgrade chat mode
    socket.on("upgrade_request", (data) => {
      const { target, targetMode } = data;
      console.log(
        `[UPGRADE] ${socket.id} requesting upgrade to ${targetMode} with ${target}`,
      );

      io.to(target).emit("upgrade_request", {
        from: socket.id,
        targetMode,
      });
    });

    // User responds to upgrade request
    socket.on("upgrade_response", (data) => {
      const { target, accepted, targetMode } = data;
      console.log(
        `[UPGRADE] ${socket.id} ${
          accepted ? "accepted" : "rejected"
        } upgrade to ${targetMode}`,
      );

      io.to(target).emit("upgrade_response", {
        from: socket.id,
        accepted,
        targetMode,
      });

      if (accepted) {
        // Track the upgraded connection
        trackConnection(targetMode, socket.id, target);
      }
    });

    // ========== DISCONNECT ==========

    socket.on("disconnect", async () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);

      // Clean up user from all topic queues
      await queueService.cleanupUser(socket.id);

      // Notify partner of disconnect
      const partnerId = activeConnections.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit("partner_disconnected");
        activeConnections.delete(partnerId);
      }
      activeConnections.delete(socket.id);
    });
  });
};
