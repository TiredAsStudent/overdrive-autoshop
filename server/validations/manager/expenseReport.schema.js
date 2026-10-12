const { z } = require("zod");

const getExpenseReportSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, "Page must be a positive number")
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/, "Limit must be a positive number")
        .optional(),
      search: z.string().optional(),
      branch: z.string().optional().default("all"),
      category_id: z.string().optional().default("all"),
      vendor_id: z.string().optional().default("all"),
      source_module: z
        .enum(["MANUAL_EXPENSE", "BILL", "OCR_RECEIPT", "JOURNAL_ENTRY", "all"])
        .optional()
        .default("all"),
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
  getExpenseReportSchema,
};
