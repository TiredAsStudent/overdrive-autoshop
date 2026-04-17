const { z } = require("zod");

const approveReceiptSchema = z.object({
  body: z.object({
    vendor_name: z.string().min(2, "Vendor name is required").max(150),
    invoice_number: z.string().max(100).nullable().optional(),
    receipt_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    total_amount: z.coerce.number().positive("Total amount must be positive"),

    // ALIGNED WITH 007 MIGRATION
    account_category_id: z.coerce
      .number()
      .int()
      .positive("Expense Account is required"),
    payment_account_id: z.coerce
      .number()
      .int()
      .positive("Payment Source (Cash/AP) is required"),

    // The Line Items
    items: z
      .array(
        z.object({
          inventory_id: z.coerce
            .number()
            .int()
            .positive()
            .nullable()
            .optional(),
          description: z.string().max(255),
          quantity: z.coerce.number().positive(),
          unit_cost: z.coerce.number().min(0),
          total_price: z.coerce.number().min(0),
        }),
      )
      .min(1, "Receipt must have at least one line item"),
  }),
});

module.exports = { approveReceiptSchema };
