const { z } = require("zod");

const getTrialBalanceSchema = z.object({
  query: z
    .object({
      search: z.string().optional(),
      type: z
        .enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE", "all"])
        .optional(),
      branch: z.string().optional(),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)")
        .optional()
        .or(z.literal("")),
      hide_zero: z.enum(["true", "false"]).optional().default("false"),
    })
    .optional(),
});

module.exports = {
  getTrialBalanceSchema,
};
