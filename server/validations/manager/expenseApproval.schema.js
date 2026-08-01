const { z } = require("zod");

const getExpenseApprovalsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      category: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

const approveExpenseSchema = z.object({
  body: z.object({
    remarks: z.string().trim().max(255).optional().nullable(),
  }),
});

const rejectExpenseSchema = z.object({
  body: z.object({
    remarks: z
      .string()
      .trim()
      .min(5, "Rejection requires a detailed reason (minimum 5 characters).")
      .max(255),
  }),
});

module.exports = {
  getExpenseApprovalsSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
};
