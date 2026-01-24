require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const socketHandler = require("./socket/socketHandler");
const { trackVisit, getAnalyticsSummary } = require("./services/analytics");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for prototype; restrict in production
    methods: ["GET", "POST"],
  },
});

// Initialize Socket Logic
socketHandler(io);

// Health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Channels API: Get available chat channels
app.get("/api/channels", (req, res) => {
  const queueService = require("./services/queueService");
  res.json(queueService.getChannels());
});

// Topics API: Get available chat topics
app.get("/api/topics", (req, res) => {
  const queueService = require("./services/queueService");
  res.json(queueService.getTopics());
});

// Analytics API: Track a visit
app.post("/api/analytics/visit", async (req, res) => {
  const { page, userAgent, referrer } = req.body;

  if (!page) {
    return res.status(400).json({ error: "page is required" });
  }

  const result = await trackVisit(page, userAgent, referrer);
  // Convert BigInt to string for JSON serialization
  res.json({ success: !!result, id: result?.id?.toString() });
});

// Analytics API: Get summary stats
app.get("/api/analytics/stats", async (req, res) => {
  const stats = await getAnalyticsSummary();
  res.json(stats || { error: "Failed to get stats" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
