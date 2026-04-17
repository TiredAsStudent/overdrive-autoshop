const { z } = require("zod");

const createInventorySchema = z.object({
  body: z.object({
    item_code: z.string().min(2, "SKU/Item Code is too short").max(100),
    item_name: z
      .string()
      .min(3, "Item name must be at least 3 characters")
      .max(200),
    category: z.string().min(2, "Category is required").max(50),
    unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
    reorder_level: z.coerce
      .number()
      .int()
      .min(0, "Reorder level cannot be negative")
      .default(5),
  }),
});

const updateInventorySchema = z.object({
  body: z.object({
    item_code: z.string().min(2).max(100).optional(),
    item_name: z.string().min(3).max(200).optional(),
    category: z.string().min(2).max(50).optional(),
    unit_cost: z.coerce.number().min(0).optional(),
    reorder_level: z.coerce.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = {
  createInventorySchema,
  updateInventorySchema,
};
