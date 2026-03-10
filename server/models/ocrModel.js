const pool = require("../config/db");

const OcrIntake = {
  //Create a pending record
  createPendingRecord: async (
    branch_id,
    maker_id,
    vendor_name,
    total_amount,
    markup_suggested,
    raw_ocr_text,
  ) => {
    const result = await pool.query(
      `INSERT INTO ocr_intake (branch_id, maker_id, vendor_name, total_amount, markup_suggested, status, raw_ocr_text)
             VALUES ($1, $2, $3, $4, $5, 'Pending', $6) RETURNING *`,
      [
        branch_id,
        maker_id,
        vendor_name,
        total_amount,
        markup_suggested,
        raw_ocr_text,
      ],
    );
    return result.rows[0];
  },

  //Admin approves or rejects the record
  updateStatus: async (id, checker_id, status) => {
    const result = await pool.query(
      `UPDATE ocr_intake 
             SET status = $1, checker_id = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 RETURNING *`,
      [status, checker_id, id],
    );
    return result.rows[0];
  },

  // Get all pending records for the Master Approval Queue
  getPendingQueue: async () => {
    const result = await pool.query(
      `SELECT o.*, b.branch_name, u.full_name AS maker_name 
             FROM ocr_intake o
             LEFT JOIN branches b ON o.branch_id = b.id
             LEFT JOIN users u ON o.maker_id = u.id
             WHERE o.status = 'Pending'
             ORDER BY o.created_at ASC`,
    );
    return result.rows;
  },
};

module.exports = OcrIntake;
