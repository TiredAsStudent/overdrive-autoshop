const { z } = require("zod");

const createItemSchema = z.object({
  body: z.object({
    sku: z
      .string()
      .min(3, "SKU must be at least 3 characters")
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

module.exports = { createItemSchema };
