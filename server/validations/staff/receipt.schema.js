const { z } = require("zod");

const scanIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Scan ID format."),
  }),
});

const verifyReceiptSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Scan ID format."),
  }),
  body: z.object({
    vendor_name: z.string().trim().min(2, "Vendor name is required"),
    vendor_id: z.number().int().positive().optional().nullable(),
    receipt_number: z.string().trim().optional().nullable(),
    expense_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    category: z.string().trim().min(2, "Expense category is required"),
    payment_method: z.enum([
      "CASH",
      "PETTY_CASH",
      "GCASH",
      "MAYA",
      "BANK_TRANSFER",
      "CHECK",
    ]),
    is_vatable: z.boolean().default(true),
    subtotal: z.number().min(0, "Subtotal cannot be negative"),
    vat_amount: z.number().min(0, "VAT cannot be negative"),
    total_amount: z.number().positive("Grand total must be greater than zero"),
    line_items: z
      .array(
        z.object({
          description: z.string().min(1, "Item description required"),
          quantity: z.number().min(0.01, "Quantity must be greater than 0"),
          unit_price: z.number().min(0, "Unit price cannot be negative"),
          total_price: z.number().min(0, "Total price cannot be negative"),
        }),
      )
      .optional()
      .default([]),
  }),
});

module.exports = {
  scanIdParamSchema,
  verifyReceiptSchema,
};
