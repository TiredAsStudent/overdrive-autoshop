const { z } = require("zod");

const getGeneralLedgerSchema = z.object({
  params: z.object({
    accountId: z.string().regex(/^\d+$/, "Valid Account ID is required"),
  }),
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, "Page must be a valid positive number")
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/, "Limit must be a valid positive number")
        .optional(),
      search: z.string().optional(),
      branch: z.string().optional(),
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)")
        .optional()
        .or(z.literal("")),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
});

module.exports = {
  getGeneralLedgerSchema,
};
