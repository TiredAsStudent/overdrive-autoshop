const db = require("../config/db");

class AuditModel {
  static async log(
    userId,
    branchId,
    action,
    targetResource = null,
    targetId = null,
    ipAddress = null,
  ) {
    const query = `
      INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at;
    `;
    const result = await db.query(query, [
      userId,
      branchId,
      action,
      targetResource,
      targetId,
      ipAddress,
    ]);
    return result.rows[0];
  }
}

module.exports = AuditModel;
