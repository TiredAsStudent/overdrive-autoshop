const AuditLogModel = require("../../models/AuditLog");

class AuditLogService {
  static async fetchPaginatedLogs(filters) {
    const limit = parseInt(filters.limit, 10) || 20;
    const page = parseInt(filters.page, 10) || 1;
    const offset = (page - 1) * limit;

    const dbFilters = { ...filters, limit, offset };

    // Parallel processing for maximum speed
    const [logs, totalRecords] = await Promise.all([
      AuditLogModel.getLogs(dbFilters),
      AuditLogModel.getTotalCount(dbFilters),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      logs,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ==========================================
  // CSV GENERATOR
  // ==========================================
  static async generateCSVExport(filters) {
    const logs = await AuditLogModel.getLogsForExport(filters);

    if (logs.length === 0) {
      throw new Error(
        "No records found for the selected date range and filters.",
      );
    }

    const headers = [
      "Timestamp",
      "User Name",
      "Role",
      "Severity",
      "Action",
      "Branch",
      "IP Address",
      "Old Data",
      "New Data",
    ];

    const csvRows = logs.map((log) => {
      // Stringify JSON fields and escape double quotes to prevent CSV breaking
      const oldDataStr = log.old_values
        ? JSON.stringify(log.old_values).replace(/"/g, '""')
        : "";
      const newDataStr = log.new_values
        ? JSON.stringify(log.new_values).replace(/"/g, '""')
        : "";

      return [
        log.timestamp.toISOString(),
        log.user_name,
        log.user_role,
        log.severity,
        log.action,
        log.branch_context,
        log.ip_address,
        oldDataStr,
        newDataStr,
      ]
        .map((value) => `"${value}"`) // Wrap every field in quotes
        .join(",");
    });

    return [headers.map((h) => `"${h}"`).join(","), ...csvRows].join("\n");
  }
}

module.exports = AuditLogService;
