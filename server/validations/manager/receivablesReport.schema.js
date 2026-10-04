const { z } = require("zod");

const getReceivablesReportSchema = z.object({
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
      customer_id: z.string().optional().default("all"),
      payment_status: z
        .enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "all"])
        .optional()
        .default("all"),
      aging_category: z
        .enum([
          "CURRENT",
          "1_30_DAYS",
          "31_60_DAYS",
          "61_90_DAYS",
          "OVER_90_DAYS",
          "all",
        ])
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

const getCustomerReceivableDetailsSchema = z.object({
  params: z.object({
    customerId: z.string().regex(/^\d+$/, "Valid Customer ID is required"),
  }),
});

module.exports = {
  getReceivablesReportSchema,
  getCustomerReceivableDetailsSchema,
};
