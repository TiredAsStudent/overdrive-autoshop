const { z } = require("zod");

const getAuditLogsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional().default("1"),
      limit: z.string().regex(/^\d+$/).optional().default("15"),
      search: z.string().max(100).optional().or(z.literal("")),
      branchId: z.string().regex(/^\d+$/).optional().or(z.literal("")),
      severity: z.string().optional().or(z.literal("")),
      startDate: z.string().datetime().optional().or(z.literal("")),
      endDate: z.string().datetime().optional().or(z.literal("")),
    })
    .optional(),
});

module.exports = { getAuditLogsSchema };
