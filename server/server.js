require("dotenv").config();
const express = require("express");
const cors = require("cors");

//Import Routes
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

//Global Middleware
app.use(cors());
app.use(express.json());

//Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);

// Base Test Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Overdrive Auto Shop API!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});
