const { z } = require("zod");

const createInventoryItemSchema = z.object({
  body: z.object({
    sku: z
      .string()
      .min(2, "SKU must be at least 2 characters")
      .max(50)
      .toUpperCase(),
    item_name: z
      .string()
      .min(3, "Item name must be at least 3 characters")
      .max(150),
    category: z.string().min(2, "Category is required").max(50),
    uom: z
      .string()
      .min(1, "Unit of Measure is required")
      .max(50)
      .default("pcs"),
    description: z.string().optional().nullable(),
    unit_cost: z.number().min(0, "Unit cost cannot be negative"),
    selling_price: z.number().min(0, "Selling price cannot be negative"),
    default_reorder_level: z
      .number()
      .int()
      .min(0, "Reorder level cannot be negative")
      .default(5),
  }),
});

const updateInventoryItemSchema = z.object({
  body: z
    .object({
      item_name: z.string().min(3).max(150).optional(),
      category: z.string().min(2).max(50).optional(),
      uom: z.string().min(1).max(50).optional(),
      description: z.string().optional().nullable(),
      unit_cost: z.number().min(0).optional(),
      selling_price: z.number().min(0).optional(),
      default_reorder_level: z.number().int().min(0).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const toggleInventoryStatusSchema = z.object({
  body: z.object({
    is_active: z.boolean({
      required_error: "is_active flag is required",
      invalid_type_error: "is_active must be a boolean",
    }),
  }),
});

const getInventorySchema = z.object({
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
      category: z.string().optional(),
      branch: z.string().optional(), // Added Branch Filtering
      status: z.enum(["active", "archived", "all"]).optional(),
    })
    .optional(),
});

module.exports = {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  toggleInventoryStatusSchema,
  getInventorySchema,
};
