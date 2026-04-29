const { z } = require("zod");

const createCategorySchema = z.object({
  body: z.object({
    category_id: z.number({
      required_error: "Accounting Category is required.",
    }),
    account_code: z
      .number()
      .min(1000, "Code must be at least 1000.")
      .max(5999, "Code must follow the 4-digit standard."),
    account_name: z.string().min(2, "Technical name is required").max(100),
    staff_label: z.string().min(2, "Staff label is required").max(100),
    description: z.string().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    account_name: z.string().min(2).max(100).optional(),
    staff_label: z.string().min(2).max(100).optional(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
