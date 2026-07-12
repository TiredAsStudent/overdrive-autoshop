const { pool } = require("../../config/db");
const InventoryModel = require("../../models/Inventory");
const { logSecureAction } = require("../../utils/auditLogger");

class InventoryService {
  static async createMasterItem(data, userId, ipAddress) {
    const existing = await InventoryModel.checkSkuExists(data.sku);
    if (existing) {
      throw new Error(
        `The SKU '${data.sku}' is already registered in the system.`,
      );
    }

    const client = await pool.connect();
    let newItem = null;

    try {
      await client.query("BEGIN");

      // 1. Create the Master Item
      const insertItemSql = `
        INSERT INTO inventory_items (sku, item_name, category, uom, description, unit_cost, selling_price, default_reorder_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const itemValues = [
        data.sku,
        data.item_name,
        data.category,
        data.uom || "pcs",
        data.description,
        data.unit_cost,
        data.selling_price,
        data.default_reorder_level || 5,
      ];
      const itemResult = await client.query(insertItemSql, itemValues);
      newItem = itemResult.rows[0];

      // 2. High-Performance SQL Distribution (Auto-populates to branches)
      const distributeSql = `
        INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
        SELECT id, $1, 0, $2 
        FROM branches 
        WHERE is_active = TRUE
        ON CONFLICT DO NOTHING
      `;
      await client.query(distributeSql, [
        newItem.id,
        newItem.default_reorder_level,
      ]);

      // 3. Log initial creation in the Stock Ledger (Movement History)
      const initMovementSql = `
        INSERT INTO inventory_movements (item_id, branch_id, transaction_type, transaction_reference, quantity_added, remaining_quantity, remarks, created_by)
        SELECT $1, id, 'INITIALIZATION', 'SYSTEM_MASTER_REGISTRY', 0, 0, 'Initial branch stock allocation', $2
        FROM branches
        WHERE is_active = TRUE
      `;
      await client.query(initMovementSql, [newItem.id, userId]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(
        "Database transaction failed while distributing inventory. Please try again.",
      );
    } finally {
      client.release();
    }

    await logSecureAction(
      userId,
      null,
      "MASTER_ITEM_CREATED",
      "INFO",
      ipAddress,
      "inventory_items",
      newItem.id,
      null,
      newItem,
    );
    return newItem;
  }

  static async updateMasterItem(id, data, userId, ipAddress) {
    const oldItem = await InventoryModel.findById(id);
    if (!oldItem) throw new Error("Inventory item not found.");

    const updatedItem = await InventoryModel.update(id, data);

    // Dynamic Audit Severity: Flag financial alterations
    let severity = "INFO";
    if (
      parseFloat(oldItem.unit_cost) !== parseFloat(updatedItem.unit_cost) ||
      parseFloat(oldItem.selling_price) !==
        parseFloat(updatedItem.selling_price)
    ) {
      severity = "WARNING"; // Elevated tracking for accounting security
    }

    await logSecureAction(
      userId,
      null,
      "MASTER_ITEM_UPDATED",
      severity,
      ipAddress,
      "inventory_items",
      id,
      oldItem,
      updatedItem,
    );
    return updatedItem;
  }

  static async toggleItemStatus(id, isActive, userId, ipAddress) {
    const oldItem = await InventoryModel.findById(id);
    if (!oldItem) throw new Error("Inventory item not found.");

    const updatedItem = await InventoryModel.toggleStatus(id, isActive);

    const action = isActive ? "MASTER_ITEM_RESTORED" : "MASTER_ITEM_ARCHIVED";
    await logSecureAction(
      userId,
      null,
      action,
      isActive ? "INFO" : "WARNING",
      ipAddress,
      "inventory_items",
      id,
      { is_active: oldItem.is_active },
      { is_active: updatedItem.is_active },
    );

    return updatedItem;
  }

  static async getInventoryCatalog(
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    branch = "all",
    status = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, items] = await Promise.all([
      InventoryModel.countFilteredItems(search, category, branch, status),
      InventoryModel.findPaginatedItems(
        limit,
        offset,
        search,
        category,
        branch,
        status,
      ),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getItemBranchBreakdown(itemId) {
    return await InventoryModel.getBranchBreakdown(itemId);
  }

  static async getItemMovementHistory(itemId) {
    return await InventoryModel.getMovementHistory(itemId);
  }
}

module.exports = InventoryService;
