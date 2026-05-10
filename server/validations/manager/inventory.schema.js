const { z } = require("zod");

const createItemSchema = z.object({
  body: z.object({
    sku: z
      .string()
      .min(3)
      .max(50)
      .regex(
        /^[A-Z0-9-]+$/,
        "SKU must contain only uppercase letters, numbers, and hyphens",
      ),
    item_name: z.string().min(3).max(150),
    category: z.string().min(2).max(50),
    unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
    selling_price: z.coerce.number().min(0, "Selling price cannot be negative"),
    initial_reorder_point: z.coerce.number().int().min(0).default(5),
  }),
});

const updateItemSchema = z.object({
  body: z.object({
    item_name: z.string().min(3).max(150).optional(),
    category: z.string().min(2).max(50).optional(),
    unit_cost: z.coerce.number().min(0).optional(),
    selling_price: z.coerce.number().min(0).optional(),
    initial_reorder_point: z.coerce.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = { createItemSchema, updateItemSchema };
