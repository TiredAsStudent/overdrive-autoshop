const { z } = require("zod");

const ocrSubmitSchema = z.object({
  body: z.object({
    // --- Header Data (The Receipt Summary) ---
    vendor_name: z
      .string()
      .trim()
      .min(1, "Vendor name is required")
      .max(150, "Vendor name is too long"),
    invoice_number: z
      .string()
      .trim()
      .max(100, "Invoice number is too long")
      .optional()
      .nullable(),
    receipt_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD."),
    total_amount: z.coerce
      .number()
      .positive("Total amount must be greater than zero"),
    tax_amount: z.coerce.number().nonnegative("Tax amount cannot be negative"),
    account_category_id: z.coerce
      .number()
      .int()
      .positive("Please select a valid account category"),
    payment_account_id: z.coerce
      .number()
      .int()
      .positive("Select the payment source used"),

    // --- Security & Auditing Evidence ---
    originalImage: z
      .string()
      .min(
        1,
        "Original image reference is missing. Photo evidence is mandatory.",
      ),
    fileHash: z
      .string()
      .min(1, "File hash is required for anti-duplicate security."),

    aiData: z.any().optional().nullable(),

    // --- Line Items Data (The Parts/Services) ---
    items: z
      .array(
        z.object({
          inventory_id: z.number().int().positive().optional().nullable(),
          description: z
            .string()
            .trim()
            .min(1, "Item description is required")
            .max(255, "Item description is too long"),
          quantity: z.coerce.number().positive("Quantity must be at least 1"),
          unit_cost: z.coerce
            .number()
            .nonnegative("Unit cost cannot be negative"),
          total_price: z.coerce
            .number()
            .nonnegative("Total price cannot be negative"),
        }),
      )
      .min(1, "At least one line item must be listed on the receipt"),
  }),
});

module.exports = { ocrSubmitSchema };
