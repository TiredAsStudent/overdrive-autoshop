const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

// Middleware
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/inventory/add
router.post("/add", verifyToken, inventoryController.addItem);

// GET /api/inventory/
router.get("/", verifyToken, inventoryController.getItems);

// PUT /api/inventory/edit/:id
router.put("/edit/:id", verifyToken, inventoryController.editItem);

// DELETE /api/inventory/delete/:id
router.delete("/delete/:id", verifyToken, inventoryController.removeItem);

module.exports = router;
