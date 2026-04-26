const EstimateModel = require("../models/Estimate");
const SystemSetting = require("../models/SystemSetting");
const Branch = require("../models/Branch");
const { query } = require("../config/db"); // Direct query for stock check
const { logSecureAction } = require("../utils/auditLogger");

class EstimateService {
  static async getBranchEstimates(branchId) {
    if (!branchId) throw new Error("Branch context missing.");
    return await EstimateModel.getBranchEstimates(branchId);
  }

  static async getEstimateDetails(id, branchId) {
    const estimate = await EstimateModel.getEstimateById(id, branchId);
    if (!estimate) throw new Error("Estimate not found or access denied.");
    return estimate;
  }

  static async createEstimate(data, staffUser, ipAddress) {
    // 1. Fetch Global Tax & Branch Code
    const [settings, branch] = await Promise.all([
      SystemSetting.getSettings(),
      Branch.findById(staffUser.branchId),
    ]);
    const taxRate = parseFloat(settings?.vat_percentage || 12) / 100;

    let subtotal = 0;
    const processedItems = [];

    // 2. Real-Time Stock Validation & Math Processing
    for (const item of data.items) {
      if (!item.is_labor && item.inventory_id) {
        // Verify Branch has enough available physical stock
        const stockSql = `
          SELECT (stock_quantity - reserved_quantity) AS available 
          FROM branch_inventory 
          WHERE inventory_id = $1 AND branch_id = $2
        `;
        const stockRes = await query(stockSql, [
          item.inventory_id,
          staffUser.branchId,
        ]);
        const available = stockRes.rows[0]?.available || 0;

        if (available < item.quantity) {
          throw new Error(
            `Stock Error: Only ${available} units available for ${item.description}. Cannot estimate ${item.quantity}.`,
          );
        }
      }

      const itemTotal = parseFloat(item.unit_cost) * parseFloat(item.quantity);
      subtotal += itemTotal;

      processedItems.push({
        ...item,
        total_price: itemTotal.toFixed(2),
      });
    }

    // 3. Final Calculations
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;

    // Set 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const headerData = {
      job_card_id: data.job_card_id,
      customer_id: data.customer_id,
      branch_id: staffUser.branchId,
      total_amount: grandTotal.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      expires_at: expiresAt,
    };

    // 4. Save to Database
    const newEstimate = await EstimateModel.createEstimate(
      headerData,
      processedItems,
      branch.branch_code,
    );

    // 5. Immutable Audit Log
    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      "ESTIMATE_CREATED",
      "INFO",
      ipAddress,
      "billing_transactions",
      newEstimate.id,
      null,
      { reference_number: newEstimate.reference_number, total: grandTotal },
    );

    return newEstimate;
  }

  static async updateEstimateStatus(id, status, staffUser, ipAddress) {
    const updated = await EstimateModel.updateStatus(
      id,
      staffUser.branchId,
      status,
    );
    if (!updated) throw new Error("Estimate not found.");

    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      `ESTIMATE_STATUS_${status}`,
      "INFO",
      ipAddress,
      "billing_transactions",
      id,
    );

    return updated;
  }
}

module.exports = EstimateService;
