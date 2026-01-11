const { PrismaClient } = require("@prisma/client");

// Use a global variable to prevent multiple instances in development
const globalForPrisma = global;

// Prisma 7: Uses DATABASE_URL from environment automatically
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

module.exports = prisma;
