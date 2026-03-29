const db = require("../config/db");
const EstimateModel = require("../models/estimateModel");
const InventoryModel = require("../models/inventoryModel");
const AuditModel = require("../models/auditModel");
const PaymentModel = require("../models/paymentModel");

class EstimateService {
  static async generateDraftEstimate(staffId, branchId, data, ipAddress) {
    const { customerName, vehiclePlate, items } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Cannot create an estimate without line items.");
    }

    // Math Verification
    let totalParts = 0;
    let totalLabor = 0;

    const processedItems = items.map((item) => {
      // Force conversion to numbers to prevent string concatenation bugs
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const subtotal = qty * price;

      if (item.type === "PART") {
        totalParts += subtotal;
      } else {
        totalLabor += subtotal; // LABOR or PACKAGE
      }

      return { ...item, quantity: qty, unitPrice: price, subtotal };
    });

    const totals = {
      parts: totalParts,
      labor: totalLabor,
      grand: totalParts + totalLabor,
    };

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Save the Master Header
      const estimate = await EstimateModel.createEstimate(
        branchId,
        staffId,
        customerName,
        vehiclePlate,
        totals,
        client,
      );

      // Loop and Save Every Detail Line Item
      for (const item of processedItems) {
        await EstimateModel.addLineItem(estimate.id, item, client);
      }

      await AuditModel.log(
        staffId,
        branchId,
        "CREATED_DRAFT_ESTIMATE",
        "estimates",
        estimate.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return { ...estimate, items: processedItems };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to generate draft estimate.");
    } finally {
      client.release();
    }
  }

  static async updateStatus(
    staffId,
    branchId,
    estimateId,
    newStatus,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const updatedEstimate = await EstimateModel.updateEstimateStatus(
        estimateId,
        newStatus,
        client,
      );
      if (!updatedEstimate) throw new Error("Estimate not found.");

      await AuditModel.log(
        staffId,
        branchId,
        `ESTIMATE_MARKED_AS_${newStatus}`,
        "estimates",
        estimateId,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedEstimate;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }

  // --- SALES ORDER (WIP) ENGINE ---
  static async convertToWip(staffId, branchId, estimateId, ipAddress) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Fetch the full Estimate and its Line Items
      const estimate = await EstimateModel.getEstimateWithDetails(
        estimateId,
        branchId,
        client,
      );
      if (!estimate) throw new Error("Estimate not found.");
      if (!["DRAFT", "APPROVED"].includes(estimate.status)) {
        throw new Error(
          "Only DRAFT or APPROVED estimates can be converted to WIP.",
        );
      }

      // The Reservation Loop (Only reserve physical parts)
      for (const item of estimate.items) {
        if (item.item_type === "PART" && item.reference_id) {
          const reserved = await InventoryModel.reserveStockSafe(
            branchId,
            item.reference_id,
            item.quantity,
            client,
          );

          if (!reserved) {
            throw new Error(
              `Insufficient available stock for: ${item.item_name}. You need ${item.quantity}, but they are out of stock or reserved for another job.`,
            );
          }
        }
      }

      // Upgrade the Status from DRAFT to WIP
      const updatedEstimate = await EstimateModel.updateEstimateStatus(
        estimateId,
        "WIP",
        client,
      );

      // Leave an Audit Trail
      await AuditModel.log(
        staffId,
        branchId,
        "CONVERTED_ESTIMATE_TO_WIP",
        "estimates",
        estimateId,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedEstimate;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }

  // --- FINAL INVOICE & PAYMENT ENGINE ---
  static async processPayment(
    staffId,
    branchId,
    estimateId,
    paymentData,
    ipAddress,
  ) {
    const { amount, method, referenceNumber } = paymentData;

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Fetch the WIP Estimate
      const estimate = await EstimateModel.getEstimateWithDetails(
        estimateId,
        branchId,
        client,
      );
      if (!estimate) throw new Error("Estimate not found.");
      if (estimate.status !== "WIP")
        throw new Error("Only WIP jobs can be invoiced and paid.");

      // Strict Financial Validation
      if (Number(amount) !== Number(estimate.grand_total)) {
        throw new Error(
          `Payment mismatch. The exact amount due is ₱${estimate.grand_total}.`,
        );
      }

      if (
        (method === "GCASH" || method === "BANK_TRANSFER") &&
        !referenceNumber
      ) {
        throw new Error(
          `A valid Reference/Trace Number is required for ${method} payments.`,
        );
      }

      // The Permanent Inventory Cut
      for (const item of estimate.items) {
        if (item.item_type === "PART" && item.reference_id) {
          const finalized = await InventoryModel.finalizeReservedStockSafe(
            branchId,
            item.reference_id,
            item.quantity,
            client,
          );

          if (!finalized) {
            throw new Error(
              `Inventory mismatch for ${item.item_name}. Ensure it was properly reserved.`,
            );
          }
        }
      }

      // Record the Income to the Financial Ledger
      const paymentRecord = await PaymentModel.recordPayment(
        estimateId,
        branchId,
        staffId,
        amount,
        method,
        referenceNumber,
        client,
      );

      // Upgrade the Status to PAID
      const updatedEstimate = await EstimateModel.updateEstimateStatus(
        estimateId,
        "PAID",
        client,
      );

      // Leave an Audit Trail
      await AuditModel.log(
        staffId,
        branchId,
        "INVOICE_PAID_AND_FINALIZED",
        "payments",
        paymentRecord.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return { estimate: updatedEstimate, payment: paymentRecord };
    } catch (error) {
      await client.query("ROLLBACK");
      // Catch PostgreSQL unique constraint error if double-clicked
      if (error.code === "23505")
        throw new Error("This invoice has already been paid.");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }
}

module.exports = EstimateService;
