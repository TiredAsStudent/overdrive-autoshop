const { z } = require("zod");

const rejectExpenseSchema = z.object({
  body: z.object({
    rejection_reason: z
      .string()
      .min(
        5,
        "You must provide a specific reason for rejection to guide the staff.",
      ),
    rejection_category: z.enum(
      [
        "IMAGE_QUALITY",
        "DATA_MISMATCH",
        "UNAUTHORIZED",
        "DUPLICATE",
        "POLICY_VIOLATION",
        "OTHER",
      ],
      {
        required_error:
          "Please select a specific rejection category for the audit trail.",
      },
    ),
  }),
});

// The Approval Schema handles the corrected/verified data from the Manager
const approveExpenseSchema = z.object({
  body: z.object({
    branch_id: z.number().int().positive().optional(),
    supplier_id: z.number().int().positive().optional().nullable(),
    base_amount: z.coerce.number().min(0),
    vat_amount: z.coerce.number().min(0),
    total_amount: z.coerce.number().min(0),
    expense_account_id: z.string().min(3),
    payment_method: z.enum(["AP", "CASH"]).default("AP"),
    items: z
      .array(
        z.object({
          inventory_item_id: z.number().int().positive(),
          quantity: z.number().int().positive(),
          unit_price: z.coerce.number().min(0),
        }),
      )
      .optional(),
  }),
});

module.exports = { rejectExpenseSchema, approveExpenseSchema };
