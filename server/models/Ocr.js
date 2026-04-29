const { query, pool } = require("../config/db");

class OcrModel {
  static async getPendingScans() {
    const sql = `
      SELECT 
        rs.id, rs.image_url, rs.vendor_name, rs.total_amount, rs.tax_amount, rs.ai_confidence_score, rs.created_at,
        b.branch_name,
        u.first_name || ' ' || u.last_name AS uploaded_by_name
      FROM receipt_scans rs
      JOIN branches b ON rs.branch_id = b.id
      JOIN users u ON rs.uploaded_by = u.id
      WHERE rs.status = 'PENDING'
      ORDER BY rs.created_at ASC;
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async getScanDetails(id) {
    const scanSql = `SELECT * FROM receipt_scans WHERE id = $1`;
    const itemsSql = `
      SELECT rsi.*, i.item_name, i.item_code 
      FROM receipt_scan_items rsi
      LEFT JOIN inventory i ON rsi.inventory_id = i.id
      WHERE rsi.receipt_scan_id = $1
    `;

    const [scanResult, itemsResult] = await Promise.all([
      query(scanSql, [id]),
      query(itemsSql, [id]),
    ]);

    if (scanResult.rows.length === 0) return null;
    return { ...scanResult.rows[0], items: itemsResult.rows };
  }

  static async approveAndExecuteTransaction(scanId, finalData, adminId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get Branch Context from the original scan
      const scanRes = await client.query(
        `SELECT branch_id FROM receipt_scans WHERE id = $1`,
        [scanId],
      );
      const branchId = scanRes.rows[0].branch_id;

      // Update the Scan Header
      await client.query(
        `UPDATE receipt_scans 
         SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW(), 
             total_amount = $2, tax_amount = $3, vendor_name = $4, invoice_number = $5, 
             receipt_date = $6, account_category_id = $7 
         WHERE id = $8`,
        [
          adminId,
          finalData.total_amount,
          finalData.tax_amount,
          finalData.vendor_name,
          finalData.invoice_number || null,
          finalData.receipt_date,
          finalData.account_category_id,
          scanId,
        ],
      );

      // Clear old draft items and insert verified ones
      await client.query(
        `DELETE FROM receipt_scan_items WHERE receipt_scan_id = $1`,
        [scanId],
      );

      let priceInflationDetected = false;

      for (const item of finalData.items) {
        await client.query(
          `INSERT INTO receipt_scan_items (receipt_scan_id, inventory_id, description, quantity, unit_cost, total_price) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            scanId,
            item.inventory_id || null,
            item.description,
            item.quantity,
            item.unit_cost,
            item.total_price,
          ],
        );

        // === TRIPLE-ACTION A: INVENTORY UPDATES ===
        if (item.inventory_id) {
          await client.query(
            `UPDATE branch_inventory SET stock_quantity = stock_quantity + $1 WHERE branch_id = $2 AND inventory_id = $3`,
            [item.quantity, branchId, item.inventory_id],
          );

          // Inflation Guard Logic
          const invRes = await client.query(
            `SELECT unit_cost FROM inventory WHERE id = $1`,
            [item.inventory_id],
          );
          const currentCost = parseFloat(invRes.rows[0].unit_cost);
          const newCost = parseFloat(item.unit_cost);

          if (newCost > currentCost) {
            priceInflationDetected = true;
            await client.query(
              `UPDATE inventory SET unit_cost = $1 WHERE id = $2`,
              [newCost, item.inventory_id],
            );
          }
        }
      }

      // === TRIPLE-ACTION B: FINANCIAL LEDGER ENTRIES ===
      // DEBIT: The Asset/Expense acquired
      await client.query(
        `INSERT INTO financial_ledger (branch_id, account_id, amount, transaction_type, reference_type, reference_id) 
         VALUES ($1, $2, $3, 'DEBIT', 'RECEIPT_SCAN', $4)`,
        [
          branchId,
          finalData.account_category_id,
          finalData.total_amount,
          scanId,
        ],
      );

      // CREDIT: The Cash/Bank Account used to pay for it
      await client.query(
        `INSERT INTO financial_ledger (branch_id, account_id, amount, transaction_type, reference_type, reference_id) 
         VALUES ($1, $2, $3, 'CREDIT', 'RECEIPT_SCAN', $4)`,
        [
          branchId,
          finalData.payment_account_id,
          finalData.total_amount,
          scanId,
        ],
      );

      // === TRIPLE-ACTION C: REAL-TIME BALANCE UPDATES ===
      // Increase the Expense/Asset bucket
      await client.query(
        `INSERT INTO account_balances (account_id, branch_id, balance) VALUES ($1, $2, $3) 
         ON CONFLICT (account_id, branch_id) DO UPDATE SET balance = account_balances.balance + EXCLUDED.balance, updated_at = NOW()`,
        [finalData.account_category_id, branchId, finalData.total_amount],
      );

      // Decrease the Payment bucket (Cash/Bank)
      await client.query(
        `INSERT INTO account_balances (account_id, branch_id, balance) VALUES ($1, $2, $3) 
         ON CONFLICT (account_id, branch_id) DO UPDATE SET balance = account_balances.balance + EXCLUDED.balance, updated_at = NOW()`,
        [
          finalData.payment_account_id,
          branchId,
          -Math.abs(finalData.total_amount),
        ],
      );

      await client.query("COMMIT");
      return {
        success: true,
        inflationDetected: priceInflationDetected,
        branchId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async rejectScan(scanId, reason, adminId) {
    const sql = `UPDATE receipt_scans SET status = 'REJECTED', reviewed_by = $1, reviewed_at = NOW(), rejection_note = $2 WHERE id = $3`;
    await query(sql, [adminId, reason, scanId]);
    return true;
  }

  static async checkDuplicateHash(hash) {
    const sql = `SELECT id, vendor_name, receipt_date FROM receipt_scans WHERE file_hash = $1 LIMIT 1`;
    const result = await query(sql, [hash]);
    return result.rows[0];
  }

  static async createPendingScan(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Header
      const scanSql = `
        INSERT INTO receipt_scans 
        (branch_id, uploaded_by, image_url, vendor_name, invoice_number, receipt_date, total_amount, tax_amount, account_category_id, ai_metadata, ai_confidence_score, file_hash, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
        RETURNING id
      `;
      const scanRes = await client.query(scanSql, [
        data.branch_id,
        data.uploaded_by,
        data.image_url,
        data.vendor_name,
        data.invoice_number,
        data.receipt_date,
        data.total_amount,
        data.tax_amount,
        data.account_category_id,
        JSON.stringify(data.aiData || data.ai_metadata), // Fallback support depending on payload mapping
        data.ai_confidence_score || 0, // Inserts the confidence score
        data.file_hash,
      ]);
      const scanId = scanRes.rows[0].id;

      // 2. Insert Line Items
      if (data.items && data.items.length > 0) {
        const itemValues = data.items
          .map(
            (_, i) =>
              `($1, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, $${i * 5 + 6})`,
          )
          .join(", ");
        const itemParams = [scanId];
        data.items.forEach((item) =>
          itemParams.push(
            null,
            item.description,
            item.quantity,
            item.unit_cost,
            item.total_price,
          ),
        );

        await client.query(
          `INSERT INTO receipt_scan_items (receipt_scan_id, inventory_id, description, quantity, unit_cost, total_price) VALUES ${itemValues}`,
          itemParams,
        );
      }

      await client.query("COMMIT");
      return scanId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = OcrModel;
