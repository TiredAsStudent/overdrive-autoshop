const { z } = require("zod");

const getBalanceSheetSchema = z.object({
  query: z.object({
    as_of_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid As-of Date format (YYYY-MM-DD)"),
    branch: z.string().optional().default("all"),
    hide_zero: z.enum(["true", "false"]).optional().default("false"),
  }),
});

module.exports = {
  getBalanceSheetSchema,
};
