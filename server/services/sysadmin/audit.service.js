const AuditLogModel = require("../../models/AuditLog");

class AuditLogService {
  static async getSeverities() {
    return await AuditLogModel.getSeverities();
  }

  static async fetchPaginatedLogs(
    page,
    limit,
    search,
    branchId,
    severity,
    startDate,
    endDate,
  ) {
    const offset = (page - 1) * limit;
    const dbFilters = {
      search,
      branchId,
      severity,
      startDate,
      endDate,
      limit,
      offset,
    };

    // Parallel processing for maximum speed
    const [logs, totalItems] = await Promise.all([
      AuditLogModel.getLogs(dbFilters),
      AuditLogModel.getTotalCount(dbFilters),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      logs,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  // ==========================================
  // ISO 25010 CSV GENERATOR
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
      "Target Resource",
      "Target ID (Transaction Link)",
      "Branch",
      "IP Address",
      "Old Data",
      "New Data",
    ];

    const csvRows = logs.map((log) => {
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
        log.target_resource || "N/A",
        log.target_id ? String(log.target_id) : "N/A",
        log.branch_context,
        log.ip_address,
        oldDataStr,
        newDataStr,
      ]
        .map((value) => `"${value}"`)
        .join(",");
    });

    return [headers.map((h) => `"${h}"`).join(","), ...csvRows].join("\n");
  }
}

module.exports = AuditLogService;
