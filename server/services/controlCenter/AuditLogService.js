const AuditLogModel = require("../../models/controlCenter/AuditLogModel");

class AuditLogService {
  static async fetchPaginatedLogs(filters) {
    const limit = parseInt(filters.limit, 10) || 20;
    const page = parseInt(filters.page, 10) || 1;
    const offset = (page - 1) * limit;

    const dbFilters = {
      ...filters,
      limit,
      offset,
    };

    // Run both queries simultaneously for maximum speed
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
}

module.exports = AuditLogService;
