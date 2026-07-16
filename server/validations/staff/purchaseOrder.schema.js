const { z } = require("zod");

// Define a strict schema for the polymorphic PO item matrix
const poItemSchema = z
  .object({
    line_type: z.enum(["PART", "SUBLET"]),
    item_id: z.number().int().positive().optional().nullable(),
    sublet_description: z.string().trim().max(255).optional().nullable(),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    recorded_unit_cost: z.number().min(0, "Unit cost cannot be negative"),
    discount_amount: z.number().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.line_type === "PART") return !!data.item_id;
      if (data.line_type === "SUBLET")
        return !!data.sublet_description && data.sublet_description.length > 0;
      return false;
    },
    {
      message:
        "Invalid line item: Master PART requires an item ID, while SUBLET requires a text description.",
      path: ["line_type"],
    },
  );

const createPurchaseOrderSchema = z.object({
  body: z.object({
    vendor_id: z.number().int().positive("Valid Vendor ID is required"),
    expected_delivery_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    notes: z.string().trim().optional(),
    items: z
      .array(poItemSchema)
      .min(1, "At least one procurement item must be included"), // VR-02
    is_submitting: z.boolean().optional().default(false), // Toggle to instantly push to PENDING_APPROVAL
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
