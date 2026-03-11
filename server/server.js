require("dotenv").config();
const express = require("express");
const cors = require("cors");

//Import Routes
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

//Global Middleware
app.use(cors());
app.use(express.json());

//Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/customer", customerRoutes);

// Base Test Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Overdrive Auto Shop API!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});
