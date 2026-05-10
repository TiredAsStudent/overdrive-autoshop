const { z } = require("zod");

const submitStaffExpenseSchema = z.object({
  body: z.object({
    supplier_id: z.number().int().positive().optional().nullable(),
    transaction_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
    total_amount: z.coerce
      .number()
      .positive("Total amount must be greater than zero"),
    vat_amount: z.coerce.number().min(0).optional(),
    apply_standard_vat: z.boolean().optional(),
    receipt_image_url: z
      .string()
      .min(5, "A valid receipt image is strictly required."),
    confidence_score: z.coerce.number().min(0.1).max(1.0).optional(),
  }),
});

module.exports = { submitStaffExpenseSchema };
