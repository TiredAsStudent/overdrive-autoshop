const { z } = require("zod");

const rejectExpenseSchema = z.object({
  body: z.object({
    rejection_reason: z
      .string()
      .min(
        5,
        "You must provide a specific reason for rejection to guide the staff.",
      ),
  }),
});

// The Approval Schema handles the corrected/verified data from the Manager
const approveExpenseSchema = z.object({
  body: z.object({
    supplier_id: z.number().int().positive().optional().nullable(),
    base_amount: z.coerce.number().min(0),
    vat_amount: z.coerce.number().min(0),
    total_amount: z.coerce.number().min(0),
    expense_account_id: z.number().int().positive(), // Where to charge this (e.g., COGS, Utilities)
    items: z
      .array(
        z.object({
          inventory_item_id: z.number().int().positive(),
          quantity: z.number().int().positive(),
          unit_price: z.coerce.number().min(0),
        }),
      )
      .optional(), // Optional, only needed if buying physical parts
  }),
});

module.exports = { rejectExpenseSchema, approveExpenseSchema };
