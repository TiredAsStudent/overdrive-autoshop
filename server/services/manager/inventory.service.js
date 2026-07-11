const { pool } = require("../../config/db"); // Needed for ACID transactions
const InventoryModel = require("../../models/Inventory");
const { logSecureAction } = require("../../utils/auditLogger");

class InventoryService {
  static async createMasterItem(data, userId, ipAddress) {
    // Duplicate SKU Check
    const existing = await InventoryModel.checkSkuExists(data.sku);
    if (existing) {
      throw new Error(
        `The SKU '${data.sku}' is already registered in the system.`,
      );
    }

    const client = await pool.connect();
    let newItem = null;

    try {
      await client.query("BEGIN"); // Start ACID Transaction

      // 1. Create the Master Item
      const insertItemSql = `
        INSERT INTO inventory_items (sku, item_name, category, unit_cost, selling_price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const itemValues = [
        data.sku,
        data.item_name,
        data.category,
        data.unit_cost,
        data.selling_price,
      ];
      const itemResult = await client.query(insertItemSql, itemValues);
      newItem = itemResult.rows[0];

      // 2. High-Performance SQL Distribution

      const distributeSql = `
        INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
        SELECT id, $1, 0, 5 
        FROM branches 
        WHERE is_active = TRUE
        ON CONFLICT DO NOTHING
      `;
      await client.query(distributeSql, [newItem.id]);

      await client.query("COMMIT"); // Confirm Transaction
    } catch (error) {
      await client.query("ROLLBACK"); // Abort on failure
      throw new Error(
        "Database transaction failed while distributing inventory. Please try again.",
      );
    } finally {
      client.release();
    }

    // Immutable Audit Logging
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

  static async getInventoryCatalog(
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    status = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, items] = await Promise.all([
      InventoryModel.countFilteredItems(search, category, status),
      InventoryModel.findPaginatedItems(
        limit,
        offset,
        search,
        category,
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
    const breakdown = await InventoryModel.getBranchBreakdown(itemId);
    return breakdown;
  }
}

module.exports = InventoryService;
