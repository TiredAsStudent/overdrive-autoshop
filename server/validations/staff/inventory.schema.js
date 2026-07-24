const { z } = require("zod");

const getStaffInventorySchema = z.object({
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
      stock_status: z
        .enum(["in_stock", "low_stock", "out_of_stock", "all"])
        .optional(),
    })
    .optional(),
});

module.exports = {
  getStaffInventorySchema,
};
