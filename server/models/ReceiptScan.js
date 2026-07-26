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
}

module.exports = ReceiptScan;
