const { z } = require("zod");

const createItemSchema = z.object({
  body: z.object({
    sku: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[A-Z0-9-]+$/),
    item_name: z.string().min(3).max(150),
    category: z.string().min(2).max(50),
    unit_cost: z.coerce.number().min(0),
    selling_price: z.coerce.number().min(0),
    initial_reorder_point: z.coerce.number().int().min(0).default(5),
  }),
});

const updateItemSchema = z.object({
  body: z.object({
    item_name: z.string().min(3).max(150).optional(),
    category: z.string().min(2).max(50).optional(),
    unit_cost: z.coerce.number().min(0).optional(),
    selling_price: z.coerce.number().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = { createItemSchema, updateItemSchema };
