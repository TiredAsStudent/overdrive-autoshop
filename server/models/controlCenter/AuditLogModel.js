const { query } = require("../../config/db");

class AuditLogModel {
  static async getLogs({
    limit,
    offset,
    search,
    branchId,
    startDate,
    endDate,
  }) {
    let sql = `
      SELECT 
        al.id,
        al.created_at AS timestamp,
        COALESCE(u.first_name || ' ' || u.last_name, 'System/Deleted User') AS user_name,
        COALESCE(u.role::text, 'UNKNOWN') AS user_role,
        al.action,
        COALESCE(b.branch_name, 'Global/System') AS branch_context,
        al.ip_address
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN branches b ON al.branch_id = b.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Dynamic Search (Matches action or user name)
    if (search) {
      sql += ` AND (al.action ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Dynamic Filter by Branch
    if (branchId) {
      sql += ` AND al.branch_id = $${paramIndex}`;
      values.push(branchId);
      paramIndex++;
    }

    // Dynamic Filter by Date Range
    if (startDate && endDate) {
      sql += ` AND al.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
      paramIndex += 2;
    }

    // Always sort by newest first, then paginate
    sql += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  // We need the total count for the frontend to build the "Next Page" buttons
  static async getTotalCount({ search, branchId, startDate, endDate }) {
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
    if (startDate && endDate) {
      sql += ` AND al.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
    }

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = AuditLogModel;
