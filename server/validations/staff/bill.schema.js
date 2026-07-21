const { z } = require("zod");

const billItemSchema = z.object({
  item_id: z.number().int().positive("A valid inventory item is required"),
  quantity_received: z
    .number()
    .int()
    .min(1, "Quantity received must be at least 1"),
  recorded_unit_cost: z.number().min(0, "Unit cost cannot be negative"),
  discount_amount: z.number().min(0).default(0),
});

const createBillSchema = z.object({
  body: z.object({
    purchase_order_id: z
      .number()
      .int()
      .positive("A valid Purchase Order ID is required"),
    vendor_invoice_number: z
      .string()
      .trim()
      .min(2, "Vendor invoice number is required"),
    bill_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid Bill Date format"),
    notes: z.string().trim().optional(),
    items: z
      .array(billItemSchema)
      .min(1, "At least one received item is required"),
    status: z.enum(["PENDING_RECEIPT", "RECEIVED"]).default("PENDING_RECEIPT"),
  }),
});

const updateBillSchema = z.object({
  body: z
    .object({
      vendor_invoice_number: z.string().trim().min(2).optional(),
      bill_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .optional(),
      notes: z.string().trim().optional(),
      items: z.array(billItemSchema).min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const getBillsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      vendor: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createBillSchema,
  updateBillSchema,
  getBillsSchema,
};
