const { z } = require("zod");

const createCoaSchema = z.object({
  body: z.object({
    account_code: z
      .string()
      .min(3, "Account code must be at least 3 characters")
      .max(10, "Account code cannot exceed 10 characters")
      .regex(/^[0-9]+$/, "Account code must contain only numbers (e.g., 5000)"),
    account_name: z.string().min(3).max(100),
    account_type: z.enum(
      ["Asset", "Liability", "Equity", "Revenue", "Expense"],
      { required_error: "Invalid account type selected" },
    ),
    description: z.string().max(255).optional(),
    parent_id: z.number().int().positive().optional().nullable(),
  }),
});

const updateCoaSchema = z.object({
  body: z.object({
    account_name: z.string().min(3).max(100).optional(),
    description: z.string().max(255).optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
    parent_id: z.number().int().positive().optional().nullable(),
  }),
});

module.exports = {
  createCoaSchema,
  updateCoaSchema,
};
