require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import Database Connection
const db = require("./config/db");

//Import Routes
const authRoutes = require("./routes/v1/auth");

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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server is successfully running on port ${PORT} [${process.env.NODE_ENV}]`,
  );
});
