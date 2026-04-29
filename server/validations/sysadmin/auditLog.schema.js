const { z } = require("zod");

const getAuditLogsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z.string().regex(/^\d+$/).optional().default("20"),
    search: z.string().max(100).optional(),
    branchId: z.string().regex(/^\d+$/).optional(),
    severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

module.exports = { getAuditLogsSchema };
