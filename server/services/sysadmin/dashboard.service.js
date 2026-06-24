const { query } = require("../../config/db");

class DashboardService {
  static async getDashboardOverview() {
    // Execute all necessary queries simultaneously for maximum performance
    const [
      branchesResult,
      usersResult,
      dbSizeResult,
      backupResult,
      settingsResult,
      activeBranchesResult,
      auditLogsResult,
    ] = await Promise.all([
      //  Structural Footprint (Active / Total Branches)
      query(`
        SELECT 
          COUNT(*) as total_count, 
          COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0) as active_count 
        FROM branches
      `),

      // Global Workforce Size
      query(`SELECT COUNT(*) as total_users FROM users`),

      // Database Storage Size (Converted to MB directly in SQL)
      query(
        `SELECT file_size_mb as size_mb FROM backup_logs ORDER BY created_at DESC LIMIT 1`,
      ),

      // Latest Backup Status
      query(`SELECT status FROM backup_logs ORDER BY created_at DESC LIMIT 1`),

      // Global Business Settings
      query(
        `SELECT company_name, vat_percentage, markup_percentage FROM system_settings LIMIT 1`,
      ),

      // Branch Registry Matrix (Pulling only active operational nodes)
      query(`
        SELECT id, branch_name, branch_code, address, is_active, is_maintenance_mode 
        FROM branches 
        WHERE is_active = TRUE 
        ORDER BY branch_name ASC
      `),

      // Recent High-Severity Audit Logs (Limited to 5 for frontend performance)
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

    // --- DATA FORMATTING ---

    // Metrics Cards Data
    const activeCount = branchesResult.rows[0].active_count;
    const totalCount = branchesResult.rows[0].total_count;

    // Convert 'SUCCESS' from DB to 'SECURE' for the UI Badge
    const rawBackupStatus = backupResult.rows[0]?.status || "UNKNOWN";
    const uiBackupStatus =
      rawBackupStatus === "SUCCESS" ? "HEALTHY" : rawBackupStatus;

    const dashboardMetrics = {
      activeBranches: `${activeCount} / ${totalCount}`,
      totalUsers: usersResult.rows[0].total_users || "0",
      databaseStorage: `${dbSizeResult.rows[0].size_mb || "0.00"} MB`,
      backupStatus: uiBackupStatus,
    };

    // Business Settings Data
    const settings = settingsResult.rows[0] || {};
    const businessSettings = {
      companyName: settings.company_name || "Overdrive Auto Shop",
      vatRate: `${settings.vat_percentage || "12.00"}%`,
      partsMarkup: `${settings.markup_percentage || "20.00"}%`,
    };

    // Formatted Audit Logs Data
    const recentAuditLogs = auditLogsResult.rows.map((log) => ({
      id: log.id,
      // Formats timestamp to match "06/24/2026, 3:32:11 PM"
      timestamp: new Date(log.created_at).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      // Replaces underscores with spaces (e.g., SYSTEM_ADMIN -> SYSTEM ADMIN)
      operator: log.operator.replace("_", " "),
      action: log.action,
      // Formats the Transaction Link exactly as designed: "BRANCHES (ID: 1)"
      target: `${(log.target_resource || "SYSTEM").toUpperCase()} (ID: ${log.target_id || "N/A"})`,
      severity: log.severity,
    }));

    // Return the unified payload
    return {
      dashboardMetrics,
      businessSettings,
      branchRegistryList: activeBranchesResult.rows,
      recentAuditLogs,
    };
  }
}

module.exports = DashboardService;
