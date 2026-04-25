const { query, pool } = require("../config/db");

class OcrModel {
  static async getPendingScans() {
    const sql = `
      SELECT 
        rs.id, rs.image_url, rs.vendor_name, rs.total_amount, rs.ai_confidence_score, rs.created_at,
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

      const scanRes = await client.query(
        `SELECT branch_id FROM receipt_scans WHERE id = $1`,
        [scanId],
      );
      const branchId = scanRes.rows[0].branch_id;

      await client.query(
        `UPDATE receipt_scans 
         SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW(), 
             total_amount = $2, vendor_name = $3, invoice_number = $4, 
             receipt_date = $5, account_category_id = $6 
         WHERE id = $7`,
        [
          adminId,
          finalData.total_amount,
          finalData.vendor_name,
          finalData.invoice_number || null,
          finalData.receipt_date,
          finalData.account_category_id,
          scanId,
        ],
      );

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

        if (item.inventory_id) {
          await client.query(
            `UPDATE branch_inventory SET stock_quantity = stock_quantity + $1 WHERE branch_id = $2 AND inventory_id = $3`,
            [item.quantity, branchId, item.inventory_id],
          );

          const invRes = await client.query(
            `SELECT unit_cost FROM inventory WHERE id = $1`,
            [item.inventory_id],
          );
          const currentCost = parseFloat(invRes.rows[0].unit_cost);
          const newCost = parseFloat(item.unit_cost);

          if (newCost !== currentCost) {
            priceInflationDetected = true;
            await client.query(
              `UPDATE inventory SET unit_cost = $1 WHERE id = $2`,
              [newCost, item.inventory_id],
            );
          }
        }
      }

      await client.query(
        `INSERT INTO financial_ledger (branch_id, account_category_id, amount, transaction_type, reference_type, reference_id) 
         VALUES ($1, $2, $3, 'DEBIT', 'RECEIPT_SCAN', $4)`,
        [
          branchId,
          finalData.account_category_id,
          finalData.total_amount,
          scanId,
        ],
      );

      await client.query(
        `INSERT INTO financial_ledger (branch_id, account_category_id, amount, transaction_type, reference_type, reference_id) 
         VALUES ($1, $2, $3, 'CREDIT', 'RECEIPT_SCAN', $4)`,
        [
          branchId,
          finalData.payment_account_id,
          finalData.total_amount,
          scanId,
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

  static async rejectScan(scanId, adminId) {
    const sql = `UPDATE receipt_scans SET status = 'REJECTED', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`;
    await query(sql, [adminId, scanId]);
    return true;
  }
}

module.exports = OcrModel;
