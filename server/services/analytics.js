const prisma = require("../lib/prisma");

// Track a connection (match between two users)
async function trackConnection(chatMode, peer1Id, peer2Id) {
  try {
    const connection = await prisma.connection.create({
      data: {
        chatMode,
        peer1Id,
        peer2Id,
      },
    });
    console.log(
      "[ANALYTICS] Connection tracked:",
      chatMode,
      peer1Id,
      "<->",
      peer2Id
    );
    return connection;
  } catch (err) {
    console.error("[ANALYTICS] Error tracking connection:", err.message);
    return null;
  }
}

// Track a page visit
async function trackVisit(page, userAgent = null, referrer = null) {
  try {
    const visit = await prisma.visit.create({
      data: {
        page,
        userAgent,
        referrer,
      },
    });
    console.log("[ANALYTICS] Visit tracked:", page);
    return visit;
  } catch (err) {
    console.error("[ANALYTICS] Error tracking visit:", err.message);
    return null;
  }
}

// Get analytics summary
async function getAnalyticsSummary() {
  try {
    const [totalVisits, totalConnections, connectionsByMode] =
      await Promise.all([
        prisma.visit.count(),
        prisma.connection.count(),
        prisma.connection.groupBy({
          by: ["chatMode"],
          _count: { id: true },
        }),
      ]);

    return {
      totalVisits,
      totalConnections,
      connectionsByMode: connectionsByMode.reduce((acc, item) => {
        acc[item.chatMode] = item._count.id;
        return acc;
      }, {}),
    };
  } catch (err) {
    console.error("[ANALYTICS] Error getting summary:", err.message);
    return null;
  }
}

module.exports = {
  trackConnection,
  trackVisit,
  getAnalyticsSummary,
};
