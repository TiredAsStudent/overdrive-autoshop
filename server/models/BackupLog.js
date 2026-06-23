const { query } = require("../config/db");

class BackupLog {
  static async create(data) {
    const sql = `
      INSERT INTO backup_logs (file_name, backup_type, file_size_mb, status, executed_by, error_message) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const values = [
      data.file_name,
      data.backup_type,
      data.file_size_mb,
      data.status,
      data.executed_by || null,
      data.error_message || null,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async countFiltered(search) {
    let sql = `SELECT COUNT(*) FROM backup_logs`;
    const values = [];

    if (search) {
      sql += ` WHERE file_name ILIKE $1 OR backup_type ILIKE $1`;
      values.push(`%${search}%`);
    }

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search) {
    let sql = `
      SELECT b.*, 
             COALESCE(u.first_name || ' ' || u.last_name, 'System Admin') AS operator_name 
      FROM backup_logs b
      LEFT JOIN users u ON b.executed_by = u.id
    `;
    const values = [];
    let paramIdx = 1;

    if (search) {
      sql += ` WHERE b.file_name ILIKE $${paramIdx} OR b.backup_type ILIKE $${paramIdx}`;
      values.push(`%${search}%`);
      paramIdx++;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = BackupLog;
