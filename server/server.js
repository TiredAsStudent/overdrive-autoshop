require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import Database Connection
const db = require("./config/db");

//Import Routes
const authRoutes = require("./routes/v1/auth");
const mechanicRoutes = require("./routes/v1/mechanic");
const financeConfigRoutes = require("./routes/v1/financeConfig");
const serviceTemplateRoutes = require("./routes/v1/serviceTemplate");
const vehicleRoutes = require("./routes/v1/vehicle");
const inventoryRoutes = require("./routes/v1/inventory");
const estimateRoutes = require("./routes/v1/estimate");
const kanbanRoutes = require("./routes/v1/kanban");
const expenseRoutes = require("./routes/v1/expense");
const analyticsRoutes = require("./routes/v1/analytics");
const bulkOrderRoutes = require("./routes/v1/bulkOrder");

const path = require("path");

const app = express();

app.use(helmet());
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

// Base Health Route
app.get("/api/health", async (req, res, next) => {
  try {
    const dbResult = await db.query("SELECT NOW()");
    res.status(200).json({
      success: true,
      message: "Overdrive Auto Shop API is running.",
      database_time: dbResult.rows[0].now,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    next(error);
  }
});

//Mount Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/mechanics", mechanicRoutes);
app.use("/api/v1/finance", financeConfigRoutes);
app.use("/api/v1/templates", serviceTemplateRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/estimates", estimateRoutes);
app.use("/api/v1/kanban", kanbanRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/bulk-orders", bulkOrderRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server is successfully running on port ${PORT} [${process.env.NODE_ENV}]`,
  );
});
