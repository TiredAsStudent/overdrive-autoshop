const db = require("../config/db");
const InventoryModel = require("../models/inventoryModel");
const AuditModel = require("../models/auditModel");

class InventoryService {
  // --- MASTER INVENTORY HUB ---
  static async addMasterPart(adminId, branchId, data, ipAddress) {
    const { partName, unitCost, retailPrice } = data;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const part = await InventoryModel.createMasterPart(
        partName,
        unitCost,
        retailPrice,
        client,
      );
      await AuditModel.log(
        adminId,
        branchId,
        "CREATED_MASTER_PART",
        "master_inventory",
        part.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return part;
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505")
        throw new Error("A part with this name already exists.");
      throw new Error("Failed to create master part.");
    } finally {
      client.release();
    }
  }

  static async editMasterPart(adminId, adminBranchId, partId, data, ipAddress) {
    const { partName, unitCost, retailPrice } = data;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const part = await InventoryModel.updateMasterPart(
        partId,
        partName,
        unitCost,
        retailPrice,
        client,
      );
      if (!part) throw new Error("Master part not found.");

      await AuditModel.log(
        adminId,
        adminBranchId,
        "UPDATED_MASTER_PART",
        "master_inventory",
        part.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return part;
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505")
        throw new Error("A part with this name already exists.");
      throw new Error("Failed to update master part.");
    } finally {
      client.release();
    }
  }

  static async toggleMasterPartStatus(
    adminId,
    adminBranchId,
    partId,
    isActive,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const part = await InventoryModel.toggleMasterPartStatus(
        partId,
        isActive,
        client,
      );
      if (!part) throw new Error("Master part not found.");

      const action = isActive
        ? "REACTIVATED_MASTER_PART"
        : "DEACTIVATED_MASTER_PART";
      await AuditModel.log(
        adminId,
        adminBranchId,
        action,
        "master_inventory",
        part.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return part;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to change master part status.");
    } finally {
      client.release();
    }
  }

  // --- STOCK TRANSFER HUB ---
  static async executeTransfer(
    adminId,
    adminBranchId,
    data,
    ipAddress,
    clientOverride = null,
  ) {
    const { fromBranchId, toBranchId, masterPartId, quantity } = data;
    if (quantity <= 0)
      throw new Error("Transfer quantity must be greater than zero.");
    if (fromBranchId === toBranchId)
      throw new Error("Cannot transfer stock to the same branch.");

    const client = clientOverride || (await db.pool.connect());
    const shouldManageTransaction = !clientOverride;

    try {
      if (shouldManageTransaction) await client.query("BEGIN");

      const deducted = await InventoryModel.deductStockSafe(
        fromBranchId,
        masterPartId,
        quantity,
        client,
      );
      if (!deducted)
        throw new Error(
          "Insufficient stock at the source branch for this transfer.",
        );

      await InventoryModel.addStockUpsert(
        toBranchId,
        masterPartId,
        quantity,
        client,
      );
      await AuditModel.log(
        adminId,
        adminBranchId,
        `TRANSFERRED_${quantity}_UNITS_TO_BRANCH_${toBranchId}`,
        "branch_local_stock",
        masterPartId,
        ipAddress,
        client,
      );

      if (shouldManageTransaction) await client.query("COMMIT");
      return { message: `Successfully transferred ${quantity} units.` };
    } catch (error) {
      if (shouldManageTransaction) await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      if (shouldManageTransaction) client.release();
    }
  }

  // --- INVENTORY SECURITY (STATE MACHINE) ---
  static async submitAdjustmentRequest(staffId, branchId, data, ipAddress) {
    const { masterPartId, quantityChange, reason } = data;
    if (quantityChange === 0)
      throw new Error("Quantity change cannot be zero.");

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const request = await InventoryModel.createAdjustmentRequest(
        branchId,
        masterPartId,
        staffId,
        quantityChange,
        reason,
        client,
      );
      await AuditModel.log(
        staffId,
        branchId,
        "SUBMITTED_STOCK_ADJUSTMENT",
        "inventory_adjustments",
        request.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return request;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to submit adjustment request.");
    } finally {
      client.release();
    }
  }

  static async resolveAdjustment(
    adminId,
    adminBranchId,
    adjustmentId,
    isApproved,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const status = isApproved ? "APPROVED" : "REJECTED";
      const adjustment = await InventoryModel.updateAdjustmentStatus(
        adjustmentId,
        adminId,
        status,
        client,
      );

      if (!adjustment)
        throw new Error("Adjustment request not found or already resolved.");

      if (isApproved) {
        if (adjustment.quantity_change > 0) {
          await InventoryModel.addStockUpsert(
            adjustment.branch_id,
            adjustment.master_part_id,
            adjustment.quantity_change,
            client,
          );
        } else {
          const deductVal = adjustment.quantity_change * -1;
          const deducted = await InventoryModel.deductStockSafe(
            adjustment.branch_id,
            adjustment.master_part_id,
            deductVal,
            client,
          );
          if (!deducted)
            throw new Error(
              "Cannot approve: Insufficient physical stock to perform this deduction.",
            );
        }
      }

      await AuditModel.log(
        adminId,
        adminBranchId,
        `RESOLVED_ADJUSTMENT_${status}`,
        "inventory_adjustments",
        adjustment.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return adjustment;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }

  // --- INTER-BRANCH TRANSFER REQUESTS ---
  static async submitTransferRequest(staffId, staffBranchId, data, ipAddress) {
    const { fromBranchId, masterPartId, quantity } = data;
    if (quantity <= 0) throw new Error("Quantity must be greater than zero.");
    if (fromBranchId === staffBranchId)
      throw new Error("Cannot request a transfer from your own branch.");

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const request = await InventoryModel.createTransferRequest(
        fromBranchId,
        staffBranchId,
        masterPartId,
        quantity,
        staffId,
        client,
      );
      await AuditModel.log(
        staffId,
        staffBranchId,
        "SUBMITTED_TRANSFER_REQUEST",
        "stock_transfer_requests",
        request.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return request;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to submit transfer request.");
    } finally {
      client.release();
    }
  }

  static async resolveTransferRequest(
    adminId,
    adminBranchId,
    requestId,
    isApproved,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const requestDetails = await InventoryModel.getTransferRequestById(
        requestId,
        client,
      );
      if (!requestDetails) throw new Error("Transfer request not found.");

      const status = isApproved ? "APPROVED" : "REJECTED";
      const request = await InventoryModel.updateTransferRequestStatus(
        requestId,
        adminId,
        status,
        client,
      );
      if (!request) throw new Error("Request already resolved or invalid.");

      // If approved, trigger the atomic transfer within the exact same transaction bubble
      if (isApproved) {
        const transferData = {
          fromBranchId: request.from_branch_id,
          toBranchId: request.to_branch_id,
          masterPartId: request.master_part_id,
          quantity: request.quantity,
        };
        await this.executeTransfer(
          adminId,
          adminBranchId,
          transferData,
          ipAddress,
          client,
        );
      }

      await AuditModel.log(
        adminId,
        adminBranchId,
        `RESOLVED_TRANSFER_REQUEST_${status}`,
        "stock_transfer_requests",
        request.id,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return request;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }
}

module.exports = InventoryService;
