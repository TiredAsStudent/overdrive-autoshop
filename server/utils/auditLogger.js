const { query } = require("../config/db");

/**
 * Global Utility for logging immutable actions across the Overdrive System.
 * * @param {Number} userId - The ID of the user performing the action
 * @param {Number} branchId - The Branch ID (null if Global/Manager)
 * @param {String} action - The action string (e.g., 'OCR_RECEIPT_MODIFIED', 'LOGIN_FAILED')
 * @param {String} severity - 'INFO', 'WARNING', or 'CRITICAL'
 * @param {String} ipAddress - req.ip
 * @param {String} targetResource - The table affected (e.g., 'invoices', 'users')
 * @param {Number} targetId - The ID of the record affected
 * @param {Object} oldValues - JSON object of the data before the change (optional)
 * @param {Object} newValues - JSON object of the data after the change (optional)
 */
const logSecureAction = async (
  userId,
  branchId,
  action,
  severity,
  ipAddress,
  targetResource = null,
  targetId = null,
  oldValues = null,
  newValues = null,
) => {
  try {
    const sql = `
      INSERT INTO audit_logs (user_id, branch_id, action, severity, target_resource, target_id, ip_address, old_values, new_values) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await query(sql, [
      userId,
      branchId || null,
      action,
      severity || "INFO",
      targetResource,
      targetId,
      ipAddress,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
    ]);
  } catch (error) {
    console.error("FATAL AUDIT FAILURE:", error.message);
  }
};

module.exports = { logSecureAction };
