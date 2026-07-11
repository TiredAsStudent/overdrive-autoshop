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
    unit_cost: z.number().min(0, "Unit cost cannot be negative"),
    selling_price: z.number().min(0, "Selling price cannot be negative"),
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
      status: z.enum(["active", "archived", "all"]).optional(),
    })
    .optional(),
});

module.exports = {
  createInventoryItemSchema,
  getInventorySchema,
};
