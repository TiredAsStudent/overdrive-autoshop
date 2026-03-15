require("dotenv").config();
const express = require("express");
const cors = require("cors");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middleware/errorMiddleware");

//Import Routes
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL_PROD]
    : [process.env.FRONTEND_URL_DEV, "http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

//Global Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Base Test Route
app.get("/", (req, res) => {
  res.json({
    message:
      "Welcome to the Overdrive Auto Shop API! Server is secure and running.",
  });
});

//Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/customer", customerRoutes);

app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

//Global Error Handler Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server is successfully running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`,
  );
});
