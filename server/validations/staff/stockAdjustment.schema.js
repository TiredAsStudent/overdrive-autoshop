const { z } = require("zod");

const createStockAdjustmentSchema = z.object({
  body: z.object({
    item_id: z
      .number()
      .int()
      .positive("A valid inventory item must be selected."),
    physical_count: z
      .number()
      .int()
      .min(0, "Physical count cannot be negative."),
    reason: z.enum(
      [
        "DAMAGED",
        "STOLEN_OR_LOST",
        "STOCK_COUNT_RECONCILIATION",
        "CLERICAL_ERROR",
        "PROMOTIONAL_GIVEAWAY",
      ],
      {
        required_error: "A valid accounting reason code is required.",
      },
    ),
    staff_remarks: z
      .string()
      .trim()
      .min(5, "Please provide a detailed explanation (at least 5 characters).")
      .max(500, "Remarks cannot exceed 500 characters."),
  }),
});

const getStockAdjustmentsSchema = z.object({
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
      status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "all"])
        .optional()
        .default("all"),
    })
    .optional(),
});

module.exports = {
  createStockAdjustmentSchema,
  getStockAdjustmentsSchema,
};
