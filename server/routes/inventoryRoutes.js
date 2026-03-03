const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

// Middlewares
const { verifyToken, branchGuard } = require("../middleware/authMiddleware");

router.use(verifyToken);

// POST /api/inventory/add
router.post("/add", branchGuard, inventoryController.addItem);

// GET /api/inventory
router.get("/", inventoryController.getItems);

// PUT /api/inventory/edit/:id
router.put("/edit/:id", branchGuard, inventoryController.editItem);

// DELETE /api/inventory/delete/:id
router.delete("/delete/:id", branchGuard, inventoryController.removeItem);

module.exports = router;
