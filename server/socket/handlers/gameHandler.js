/**
 * Game Handler - Manages game invite/response/action flow
 */
const activeGames = new Map();

module.exports = (io, socket, activeConnections) => {
  socket.on("game:request", (data) => {
    const { target, gameId } = data;
    console.log(`[GAME] ${socket.id} requesting ${gameId} with ${target}`);
    if (!activeConnections.has(socket.id)) return;
    io.to(target).emit("game:proposal", { from: socket.id, gameId });
  });

  socket.on("game:response", (data) => {
    const { target, accepted, gameId } = data;
    console.log(
      `[GAME] ${socket.id} ${accepted ? "accepted" : "declined"} ${gameId}`,
    );
    io.to(target).emit("game:response", { from: socket.id, accepted, gameId });

    if (accepted) {
      const players = [target, socket.id];
      const starterPlayer = players[Math.floor(Math.random() * 2)];
      activeGames.set(socket.id, { gameId, partnerId: target });
      activeGames.set(target, { gameId, partnerId: socket.id });

      const payload = { gameId, players, starterPlayer };
      io.to(target).emit("game:start", payload);
      io.to(socket.id).emit("game:start", payload);
      console.log(`[GAME] Started ${gameId}, starter: ${starterPlayer}`);
    }
  });

  socket.on("game:action", (data) => {
    const { target, gameId, payload } = data;
    io.to(target).emit("game:action", { from: socket.id, gameId, payload });
  });

  socket.on("game:end", (data) => {
    const { target, gameId, reason } = data;
    console.log(`[GAME] ${socket.id} ending ${gameId}, reason: ${reason}`);
    activeGames.delete(socket.id);
    activeGames.delete(target);
    io.to(target).emit("game:end", { from: socket.id, gameId, reason });
  });

  socket.on("disconnect", () => {
    const game = activeGames.get(socket.id);
    if (game) {
      io.to(game.partnerId).emit("game:end", {
        from: socket.id,
        gameId: game.gameId,
        reason: "disconnect",
      });
      activeGames.delete(game.partnerId);
      activeGames.delete(socket.id);
    }
  });
};
