const { z } = require("zod");

const getIncomeStatementSchema = z.object({
  query: z
    .object({
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)"),
      branch: z.string().optional().default("all"),
      hide_zero: z.enum(["true", "false"]).optional().default("false"),
    })
    .refine(
      (data) => {
        if (data.start_date && data.end_date) {
          return new Date(data.start_date) <= new Date(data.end_date);
        }
        return true;
      },
      {
        message: "Start date cannot be after end date.",
        path: ["start_date"],
      },
    ),
});

module.exports = {
  getIncomeStatementSchema,
};
