const { z } = require("zod");

const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters")
      .max(100),
    type: z.enum(["INCOME", "EXPENSE"], {
      errorMap: () => ({
        message: "Type must be exactly 'INCOME' or 'EXPENSE'",
      }),
    }),
    description: z.string().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
