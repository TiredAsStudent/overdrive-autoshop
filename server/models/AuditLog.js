const { query } = require("../config/db");

class AuditLog {
  // ==========================================
  // PAGINATED FETCH
  // ==========================================
  static async getLogs({
    limit,
    offset,
    search,
    branchId,
    severity,
    startDate,
    endDate,
  }) {
    let sql = `
      SELECT 
        al.id,
        al.created_at AS timestamp,
        COALESCE(u.first_name || ' ' || u.last_name, 'System/Deleted User') AS user_name,
        COALESCE(u.role::text, 'UNKNOWN') AS user_role,
        al.severity,
        al.action,
        al.old_values,
        al.new_values,
        COALESCE(b.branch_name, 'Enterprise Global') AS branch_context,
        al.ip_address
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN branches b ON al.branch_id = b.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (al.action ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (branchId) {
      sql += ` AND al.branch_id = $${paramIndex}`;
      values.push(branchId);
      paramIndex++;
    }
    if (severity) {
      sql += ` AND al.severity = $${paramIndex}`;
      values.push(severity);
      paramIndex++;
    }
    if (startDate && endDate) {
      sql += ` AND al.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
      paramIndex += 2;
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  // ==========================================
  // TOTAL COUNT
  // ==========================================
  static async getTotalCount({
    search,
    branchId,
    severity,
    startDate,
    endDate,
  }) {
    let sql = `
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (al.action ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (branchId) {
      sql += ` AND al.branch_id = $${paramIndex}`;
      values.push(branchId);
      paramIndex++;
    }
    if (severity) {
      sql += ` AND al.severity = $${paramIndex}`;
      values.push(severity);
      paramIndex++;
    }
    if (startDate && endDate) {
      sql += ` AND al.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
    }

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  // ==========================================
  // BULK FETCH (FOR THE CSV EXPORT ENGINE)
  // ==========================================
  static async getLogsForExport({
    search,
    branchId,
    severity,
    startDate,
    endDate,
  }) {
    let sql = `
      SELECT 
        al.created_at AS timestamp,
        COALESCE(u.first_name || ' ' || u.last_name, 'System/Deleted User') AS user_name,
        COALESCE(u.role::text, 'UNKNOWN') AS user_role,
        al.severity,
        al.action,
        al.old_values,
        al.new_values,
        COALESCE(b.branch_name, 'Enterprise Global') AS branch_context,
        al.ip_address
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN branches b ON al.branch_id = b.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (al.action ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (branchId) {
      sql += ` AND al.branch_id = $${paramIndex}`;
      values.push(branchId);
      paramIndex++;
    }
    if (severity) {
      sql += ` AND al.severity = $${paramIndex}`;
      values.push(severity);
      paramIndex++;
    }
    if (startDate && endDate) {
      sql += ` AND al.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
      paramIndex += 2;
    }

    // Limit export to 10,000 rows to prevent server memory crashes during compliance pulls
    sql += ` ORDER BY al.created_at DESC LIMIT 10000`;

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = AuditLog;
