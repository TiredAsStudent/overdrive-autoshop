const { z } = require("zod");

// Strictly validates Inventory Parts only
const poItemSchema = z.object({
  item_id: z.number().int().positive("A valid inventory item is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  recorded_unit_cost: z.number().min(0, "Unit cost cannot be negative"),
  discount_amount: z.number().min(0).default(0),
});

const createPurchaseOrderSchema = z.object({
  body: z.object({
    vendor_id: z.number().int().positive("Valid Vendor ID is required"),
    expected_delivery_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    notes: z.string().trim().optional(),
    items: z
      .array(poItemSchema)
      .min(1, "At least one procurement item must be included"),
    is_submitting: z.boolean().optional().default(false),
  }),
});

const updatePurchaseOrderSchema = z.object({
  body: z
    .object({
      expected_delivery_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .optional(),
      notes: z.string().trim().optional(),
      items: z.array(poItemSchema).min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const updatePOStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING_APPROVAL", "CANCELLED"]),
  }),
});

const getPurchaseOrdersSchema = z.object({
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
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePOStatusSchema,
  getPurchaseOrdersSchema,
};
