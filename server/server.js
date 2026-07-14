require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import Database & Utilities
const { connectDB, query } = require("./config/db");
const { sendError } = require("./utils/responseHandler");
const { STATUS_CODES } = require("./constants/statusCodes");

const app = express();

// --- SECURITY & GLOBAL MIDDLEWARE ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.set("trust proxy", 1);

const allowedOrigin =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL_PROD;

//Global Middleware
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log API requests in the terminal during development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --- INITIALIZE DATABASE ---
connectDB();

// --- HEALTH CHECK ENDPOINT ---
app.get("/api/health", async (req, res, next) => {
  try {
    const dbResult = await query("SELECT NOW()");
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Overdrive Auto Shop API is running.",
      database_time: dbResult.rows[0].now,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    next(error);
  }
});

// --- STATIC FILES (Uploads) ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -- Mount Routes --
app.use("/api/v1/auth", require("./routes/v1/auth.routes"));
app.use("/api/v1/manager", require("./routes/v1/manager.routes"));
app.use("/api/v1/staff", require("./routes/v1/staff.routes"));
app.use("/api/v1/sysadmin", require("./routes/v1/sysadmin.routes"));

// --- GLOBAL ERROR CATCHING ---
// Handle 404 - Route Not Found
app.use((req, res, next) => {
  return sendError(res, STATUS_CODES.NOT_FOUND, "API Route Not Found");
});

// Handle 500 - Internal Server Errors
app.use((err, req, res, next) => {
  console.error("Global Error Caught:", err);
  return sendError(
    res,
    STATUS_CODES.INTERNAL_ERROR,
    "An unexpected server error occurred.",
    err.message,
  );
});

// --- AUTOMATED BACKGROUND JOBS ---
const cron = require("node-cron");
const BackupService = require("./services/sysadmin/backup.service");

// Runs exactly at Midnight (00:00) server time, every single day
cron.schedule("0 0 * * *", async () => {
  console.log("[CRON] Initiating scheduled automated database backup...");
  try {
    await BackupService.generateBackup(null, "127.0.0.1", false);
    console.log("[CRON] Automated database snapshot completed successfully.");

    const deletedCount = await BackupService.cleanOldBackups(7);
    console.log(
      `[CRON] Cleanup routine finished. Safely purged ${deletedCount} old backup archives.`,
    );
  } catch (err) {
    console.error("[CRON] Automated backup failed:", err.message);
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server is successfully running on port ${PORT} [${process.env.NODE_ENV}]`,
  );
});
