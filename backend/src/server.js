/**
 * ReviewGuard AI - Production Express Backend Server
 * Intelligent Fake Review Detection & Review Forensics System
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initDatabase, db } = require("./db");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const batchRoutes = require("./routes/batchRoutes");
const investigationRoutes = require("./routes/investigationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Graceful JSON body parser (handles malformed JSON payloads cleanly)
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf) => {
    try {
      if (buf.length) JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({
        success: false,
        error_type: "Invalid JSON",
        message: "Malformed JSON payload in request: " + e.message
      });
      throw new Error("Invalid JSON");
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// System Health & Telemetry Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ReviewGuard AI Backend API",
    version: "2.4.0",
    engine: "20-Rule Explainable Heuristic Forensics",
    database: db.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// Mount Feature API Routes
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/batch", batchRoutes);
app.use("/api/investigation", investigationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

// Global 404 Route Handler
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      error_type: "Endpoint Not Found",
      message: `The requested API route '${req.method} ${req.path}' does not exist.`
    });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.message === "Invalid JSON") return; // Already handled in verify
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error_type: "Internal Server Error",
    message: err.message || "An unexpected server error occurred."
  });
});

// Server Initialization
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`ReviewGuard AI Express Backend Server is Online`);
    console.log(`Port: ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`DB Mode: ${db.getStatus().engine}`);
    console.log(`Rule Engine: 20-Rule Weighted Heuristics (v2.4.0)`);
    console.log(`=======================================================`);
  });
}

start();

module.exports = app;
