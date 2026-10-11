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

  static async getMetrics() {
    const globalSql = `
      SELECT 
        COALESCE(SUM(file_size_mb), 0) as total_volume,
        COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END), 0) as success_count
      FROM backup_logs
    `;
    const latestSql = `SELECT status FROM backup_logs ORDER BY created_at DESC LIMIT 1`;

    const [globalRes, latestRes] = await Promise.all([
      query(globalSql),
      query(latestSql),
    ]);

    return {
      totalVolume: parseFloat(globalRes.rows[0].total_volume).toFixed(2),
      successCount: parseInt(globalRes.rows[0].success_count, 10),
      lastExecution: latestRes.rows[0] ? latestRes.rows[0].status : "STANDBY",
    };
  }
}

module.exports = BackupLog;
