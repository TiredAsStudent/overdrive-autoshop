const db = require("../config/db");

class InventoryModel {
  // --- MASTER INVENTORY (THE CATALOG) ---
  static async createMasterPart(partName, unitCost, retailPrice, client = db) {
    const query = `
      INSERT INTO master_inventory (part_name, unit_cost, retail_price)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await client.query(query, [partName, unitCost, retailPrice]);
    return result.rows[0];
  }

  static async updateMasterPart(
    id,
    partName,
    unitCost,
    retailPrice,
    client = db,
  ) {
    const query = `
      UPDATE master_inventory 
      SET part_name = $1, unit_cost = $2, retail_price = $3, updated_at = NOW()
      WHERE id = $4 RETURNING *;
    `;
    const result = await client.query(query, [
      partName,
      unitCost,
      retailPrice,
      id,
    ]);
    return result.rows[0];
  }

  static async toggleMasterPartStatus(id, isActive, client = db) {
    const query = `
      UPDATE master_inventory
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *;
    `;
    const result = await client.query(query, [isActive, id]);
    return result.rows[0];
  }

  static async getAllMasterParts(onlyActive = false, client = db) {
    const activeFilter = onlyActive ? "WHERE is_active = TRUE" : "";
    const query = `SELECT * FROM master_inventory ${activeFilter} ORDER BY part_name ASC;`;
    const result = await client.query(query);
    return result.rows;
  }

  // --- LOCAL STOCK (THE SHELVES) ---
  static async getLocalStockByBranch(branchId, client = db) {
    const query = `
      SELECT 
        bls.id as local_stock_id,
        bls.quantity,
        bls.updated_at,
        mi.id as master_part_id,
        mi.part_name,
        mi.retail_price
      FROM branch_local_stock bls
      JOIN master_inventory mi ON bls.master_part_id = mi.id
      WHERE bls.branch_id = $1 AND mi.is_active = TRUE
      ORDER BY mi.part_name ASC;
    `;
    const result = await client.query(query, [branchId]);
    return result.rows;
  }

  static async deductStockSafe(
    branchId,
    masterPartId,
    qtyToDeduct,
    client = db,
  ) {
    const query = `
      UPDATE branch_local_stock
      SET quantity = quantity - $3, updated_at = NOW()
      WHERE branch_id = $1 AND master_part_id = $2 AND quantity >= $3
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      masterPartId,
      qtyToDeduct,
    ]);
    return result.rows[0];
  }

  static async addStockUpsert(branchId, masterPartId, qtyToAdd, client = db) {
    const query = `
      INSERT INTO branch_local_stock (branch_id, master_part_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (branch_id, master_part_id)
      DO UPDATE SET quantity = branch_local_stock.quantity + EXCLUDED.quantity, updated_at = NOW()
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      masterPartId,
      qtyToAdd,
    ]);
    return result.rows[0];
  }

  // Digitally reserves stock to prevent double-selling
  static async reserveStockSafe(
    branchId,
    masterPartId,
    qtyToReserve,
    client = db,
  ) {
    const query = `
      UPDATE branch_local_stock
      SET reserved_quantity = reserved_quantity + $3, updated_at = NOW()
      WHERE branch_id = $1 AND master_part_id = $2
      AND (quantity - reserved_quantity) >= $3
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      masterPartId,
      qtyToReserve,
    ]);
    return result.rows[0];
    // Returns undefined if there isn't enough unreserved stock
  }

  // Permanently deducts the reserved parts when the invoice is paid
  static async finalizeReservedStockSafe(
    branchId,
    masterPartId,
    qtyToDeduct,
    client = db,
  ) {
    const query = `
      UPDATE branch_local_stock
      SET quantity = quantity - $3, 
          reserved_quantity = reserved_quantity - $3, 
          updated_at = NOW()
      WHERE branch_id = $1 AND master_part_id = $2
      AND quantity >= $3 AND reserved_quantity >= $3
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      masterPartId,
      qtyToDeduct,
    ]);
    return result.rows[0];
  }

  // --- INVENTORY SECURITY (MAKER-CHECKER) ---
  static async createAdjustmentRequest(
    branchId,
    masterPartId,
    requestedBy,
    qtyChange,
    reason,
    client = db,
  ) {
    const query = `
      INSERT INTO inventory_adjustments (branch_id, master_part_id, requested_by, quantity_change, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      masterPartId,
      requestedBy,
      qtyChange,
      reason,
    ]);
    return result.rows[0];
  }

  static async updateAdjustmentStatus(
    adjustmentId,
    adminId,
    status,
    client = db,
  ) {
    const query = `
      UPDATE inventory_adjustments
      SET status = $1, reviewed_by = $2, updated_at = NOW()
      WHERE id = $3 AND status = 'PENDING'
      RETURNING *;
    `;
    const result = await client.query(query, [status, adminId, adjustmentId]);
    return result.rows[0];
  }

  // --- INTER-BRANCH TRANSFER REQUESTS ---
  static async createTransferRequest(
    fromBranchId,
    toBranchId,
    masterPartId,
    quantity,
    requestedBy,
    client = db,
  ) {
    const query = `
      INSERT INTO stock_transfer_requests (from_branch_id, to_branch_id, master_part_id, quantity, requested_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const result = await client.query(query, [
      fromBranchId,
      toBranchId,
      masterPartId,
      quantity,
      requestedBy,
    ]);
    return result.rows[0];
  }

  static async getTransferRequestById(requestId, client = db) {
    const query = `SELECT * FROM stock_transfer_requests WHERE id = $1;`;
    const result = await client.query(query, [requestId]);
    return result.rows[0];
  }

  static async updateTransferRequestStatus(
    requestId,
    adminId,
    status,
    client = db,
  ) {
    const query = `
      UPDATE stock_transfer_requests 
      SET status = $1, reviewed_by = $2, updated_at = NOW() 
      WHERE id = $3 AND status = 'PENDING' RETURNING *;
    `;
    const result = await client.query(query, [status, adminId, requestId]);
    return result.rows[0];
  }
}

module.exports = InventoryModel;
