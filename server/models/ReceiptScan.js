const { query } = require("../config/db");

class ReceiptScan {
  static async create(data) {
    const sql = `
      INSERT INTO receipt_scans (
        branch_id, uploaded_by, original_filename, file_path, 
        file_size, mime_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.branch_id,
      data.uploaded_by,
      data.original_filename,
      data.file_path,
      data.file_size,
      data.mime_type,
      data.status || "PROCESSING",
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async updateExtraction(id, extractedData, confidenceScore, rawText) {
    const sql = `
      UPDATE receipt_scans
      SET extracted_data = $1, confidence_score = $2, raw_ocr_text = $3, 
          status = 'PENDING_VERIFICATION', updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const result = await query(sql, [
      extractedData,
      confidenceScore,
      rawText,
      id,
    ]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE receipt_scans SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [status, id]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `SELECT * FROM receipt_scans WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async countHistoryFiltered(
    search,
    vendorId,
    startDate,
    endDate,
    branchId,
  ) {
    let sql = `
      SELECT COUNT(DISTINCT rs.id) 
      FROM receipt_scans rs
      INNER JOIN expenses e ON e.scan_id = rs.id
      WHERE rs.branch_id = $1 AND rs.status = 'VERIFIED'
    `;
    const values = [branchId];
    let paramIdx = 2;

    if (search) {
      sql += ` AND (e.expense_number ILIKE $${paramIdx} OR e.vendor_name ILIKE $${paramIdx} OR rs.original_filename ILIKE $${paramIdx})`;
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      sql += ` AND e.vendor_id = $${paramIdx}`;
      values.push(vendorId);
      paramIdx++;
    }
    if (startDate) {
      sql += ` AND e.expense_date >= $${paramIdx}`;
      values.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      sql += ` AND e.expense_date <= $${paramIdx}`;
      values.push(endDate);
      paramIdx++;
    }

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findHistoryPaginated(
    limit,
    offset,
    search,
    vendorId,
    startDate,
    endDate,
    branchId,
  ) {
    let sql = `
      SELECT 
        rs.id, rs.original_filename, rs.confidence_score, rs.created_at as verification_date,
        e.expense_number, e.expense_date, e.vendor_name, e.total_amount as grand_total, e.status as expense_status
      FROM receipt_scans rs
      INNER JOIN expenses e ON e.scan_id = rs.id
      WHERE rs.branch_id = $1 AND rs.status = 'VERIFIED'
    `;
    const values = [branchId];
    let paramIdx = 2;

    if (search) {
      sql += ` AND (e.expense_number ILIKE $${paramIdx} OR e.vendor_name ILIKE $${paramIdx} OR rs.original_filename ILIKE $${paramIdx})`;
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      sql += ` AND e.vendor_id = $${paramIdx}`;
      values.push(vendorId);
      paramIdx++;
    }
    if (startDate) {
      sql += ` AND e.expense_date >= $${paramIdx}`;
      values.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      sql += ` AND e.expense_date <= $${paramIdx}`;
      values.push(endDate);
      paramIdx++;
    }

    sql += ` ORDER BY rs.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async findHistoryDetailsById(id) {
    const sql = `
      SELECT 
        rs.id, rs.original_filename, rs.file_path, rs.confidence_score, rs.created_at as verification_date, rs.extracted_data,
        e.expense_number, e.expense_date, e.vendor_name, e.subtotal, e.vat_amount, e.total_amount as grand_total, 
        e.status as expense_status, e.line_items,
        u.first_name as verified_by_first, u.last_name as verified_by_last
      FROM receipt_scans rs
      INNER JOIN expenses e ON e.scan_id = rs.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE rs.id = $1 AND rs.status = 'VERIFIED'
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }
}

module.exports = ReceiptScan;
