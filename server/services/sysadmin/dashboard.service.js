const { query } = require("../../config/db");

class DashboardService {
  static async getDashboardOverview() {
    const [
      branchesResult,
      usersResult,
      dbSizeResult,
      backupResult,
      settingsResult,
      activeBranchesResult,
      auditLogsResult,
    ] = await Promise.all([
      //  Structural Footprint
      query(`
        SELECT 
          COUNT(*) as total_count, 
          COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0) as active_count 
        FROM branches
      `),

      // Global Workforce Size
      query(`SELECT COUNT(*) as total_users FROM users`),

      //  Total Network Storage Used
      query(
        `SELECT COALESCE(SUM(file_size_mb), 0) as size_mb FROM backup_logs`,
      ),

      // Latest Backup Status
      query(`SELECT status FROM backup_logs ORDER BY created_at DESC LIMIT 1`),

      // Global Business Settings
      query(
        `SELECT company_name, vat_percentage, markup_percentage FROM system_settings LIMIT 1`,
      ),

      // Branch Registry Snapshot (Limited to 5 most recently updated active branches)
      query(`
        SELECT id, branch_name, branch_code, address, is_active, is_maintenance_mode 
        FROM branches 
        WHERE is_active = TRUE 
        ORDER BY updated_at DESC 
        LIMIT 5
      `),

      // Recent High-Severity Audit Logs (Limited to 5)
      query(`
        SELECT 
          a.id, 
          a.created_at, 
          a.severity, 
          a.action, 
          a.target_resource, 
          a.target_id,
          COALESCE(u.role::text, 'SYSTEM AUTOMATION') as operator
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC 
        LIMIT 5
      `),
    ]);

    // Metrics Cards Data
    const activeCount = branchesResult.rows[0].active_count;
    const totalCount = branchesResult.rows[0].total_count;

    const rawBackupStatus = backupResult.rows[0]?.status || "UNKNOWN";
    const uiBackupStatus =
      rawBackupStatus === "SUCCESS" ? "HEALTHY" : rawBackupStatus;

    const dashboardMetrics = {
      activeBranches: `${activeCount} / ${totalCount}`,
      totalUsers: usersResult.rows[0].total_users || "0",

      databaseStorage: `${Number(dbSizeResult.rows[0].size_mb).toFixed(2)} MB`,
      backupStatus: uiBackupStatus,
    };

    const settings = settingsResult.rows[0] || {};
    const businessSettings = {
      companyName: settings.company_name || "Overdrive Auto Shop",
      vatRate: `${settings.vat_percentage || "12.00"}%`,
      partsMarkup: `${settings.markup_percentage || "20.00"}%`,
    };

    const recentAuditLogs = auditLogsResult.rows.map((log) => ({
      id: log.id,
      timestamp: new Date(log.created_at).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      operator: log.operator.replace("_", " "),
      action: log.action,
      target: `${(log.target_resource || "SYSTEM").toUpperCase()} (ID: ${log.target_id || "N/A"})`,
      severity: log.severity,
    }));

    return {
      dashboardMetrics,
      businessSettings,
      branchRegistryList: activeBranchesResult.rows,
      recentAuditLogs,
    };
  }
}

module.exports = DashboardService;
