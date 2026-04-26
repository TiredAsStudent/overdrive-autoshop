const { query, pool } = require("../config/db");

class BillingModel {
  // Fetch active Sales Orders (WIP)
  static async getSalesOrders(branchId) {
    const sql = `
      SELECT 
        bt.id, bt.reference_number, bt.status, bt.total_amount, bt.tax_amount, 
        bt.created_at, jc.id AS job_card_id,
        u.first_name || ' ' || u.last_name AS customer_name,
        v.plate_number
      FROM billing_transactions bt
      JOIN job_cards jc ON bt.job_card_id = jc.id
      JOIN users u ON bt.customer_id = u.id
      JOIN vehicles v ON jc.vehicle_id = v.id
      WHERE bt.branch_id = $1 AND bt.type = 'SALES_ORDER' AND bt.status != 'CANCELLED'
      ORDER BY bt.created_at ASC
    `;
    const result = await query(sql, [branchId]);
    return result.rows;
  }

  // Fetch finalized Invoices
  static async getInvoices(branchId) {
    const sql = `
      SELECT 
        bt.id, bt.reference_number, bt.status, bt.total_amount, bt.tax_amount, 
        bt.created_at, bt.payment_method, bt.payment_reference,
        u.first_name || ' ' || u.last_name AS customer_name,
        v.plate_number
      FROM billing_transactions bt
      JOIN job_cards jc ON bt.job_card_id = jc.id
      JOIN users u ON bt.customer_id = u.id
      JOIN vehicles v ON jc.vehicle_id = v.id
      WHERE bt.branch_id = $1 AND bt.type = 'INVOICE'
      ORDER BY bt.created_at DESC
    `;
    const result = await query(sql, [branchId]);
    return result.rows;
  }

  // The Reversion Logic (Cancellation)
  static async cancelSalesOrder(transactionId, branchId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Get the items to return to stock
      const itemsRes = await client.query(
        `SELECT inventory_id, quantity FROM billing_items WHERE transaction_id = $1 AND is_labor = FALSE`,
        [transactionId],
      );

      // 2. Revert the Reserved Status in Inventory
      for (const item of itemsRes.rows) {
        if (item.inventory_id) {
          await client.query(
            `UPDATE branch_inventory 
             SET reserved_quantity = GREATEST(reserved_quantity - $1, 0) 
             WHERE inventory_id = $2 AND branch_id = $3`,
            [item.quantity, item.inventory_id, branchId],
          );
        }
      }

      // 3. Mark transaction as Cancelled
      await client.query(
        `UPDATE billing_transactions SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 AND branch_id = $2`,
        [transactionId, branchId],
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // The Atomic Finalization (Checkout)
  static async finalizeInvoice(transactionId, branchId, paymentData, staffId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Verify Transaction
      const txCheck = await client.query(
        `SELECT * FROM billing_transactions WHERE id = $1 AND branch_id = $2 AND type = 'SALES_ORDER'`,
        [transactionId, branchId],
      );

      if (txCheck.rows.length === 0)
        throw new Error("Invalid or missing Sales Order.");
      const tx = txCheck.rows[0];

      // Backend Safety Check: Ensure they aren't underpaying
      const amountTendered = parseFloat(paymentData.amount_tendered || 0);
      if (
        paymentData.method.toUpperCase() === "CASH" &&
        amountTendered < parseFloat(tx.total_amount)
      ) {
        throw new Error("Amount tendered is less than the total amount due.");
      }

      // 2. Fetch Line Items to determine COGS and Inventory deductions
      const itemsRes = await client.query(
        `SELECT inventory_id, quantity, base_cost, total_price, is_labor 
         FROM billing_items WHERE transaction_id = $1`,
        [transactionId],
      );
      const items = itemsRes.rows;

      let totalCogs = 0;

      // 3. Deduct Physical Inventory (Moving out of Reserved and out of Stock entirely)
      for (const item of items) {
        if (!item.is_labor && item.inventory_id) {
          await client.query(
            `UPDATE branch_inventory 
             SET stock_quantity = stock_quantity - $1,
                 reserved_quantity = GREATEST(reserved_quantity - $1, 0)
             WHERE inventory_id = $2 AND branch_id = $3`,
            [item.quantity, item.inventory_id, branchId],
          );
          totalCogs += parseFloat(item.base_cost) * parseFloat(item.quantity);
        }
      }

      // 4. Update Billing Transaction to INVOICE and record Payment details
      const invoiceRef = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await client.query(
        `UPDATE billing_transactions 
         SET type = 'INVOICE', 
             status = 'PAID', 
             reference_number = $1, 
             payment_method = $2,
             payment_reference = $3,
             amount_tendered = $4,
             updated_at = NOW() 
         WHERE id = $5`,
        [
          invoiceRef,
          paymentData.method.toUpperCase(),
          paymentData.reference || null,
          amountTendered,
          transactionId,
        ],
      );

      // 5. Update Job Card to DONE
      await client.query(
        `UPDATE job_cards SET status = 'DONE', updated_at = NOW() WHERE id = $1`,
        [tx.job_card_id],
      );

      // 6. Basic Ledger Posting (Revenue)
      await client.query(
        `INSERT INTO financial_ledger (branch_id, account_id, amount, transaction_type, reference_type, reference_id) 
         VALUES ($1, (SELECT id FROM chart_of_accounts WHERE account_code = 4000 LIMIT 1), $2, 'CREDIT', 'INVOICE', $3)`,
        [branchId, tx.total_amount, transactionId],
      );

      await client.query("COMMIT");
      return {
        invoiceRef,
        totalAmount: tx.total_amount,
        cogsTracked: totalCogs,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = BillingModel;
