const { z } = require("zod");

const parseBoolean = (val) => val === "true" || val === true;

const createExpenseSchema = z.object({
  body: z.object({
    expense_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid expense date format"),
    category: z.string().trim().min(2, "Expense category is required").max(100),
    description: z.string().trim().min(3, "Description is required"),

    total_amount: z.coerce
      .number()
      .positive("Total amount must be greater than zero"),

    is_vatable: z.preprocess(parseBoolean, z.boolean()).default(true),

    payment_method: z
      .enum(["CASH", "PETTY_CASH", "GCASH", "MAYA", "BANK_TRANSFER", "CHECK"])
      .default("CASH"),

    vendor_id: z.preprocess(
      (v) => (v === "" ? null : v),
      z.coerce.number().int().positive().nullable().optional(),
    ),
    vendor_name: z.string().trim().max(150).optional().nullable(),
    reference_number: z
      .string()
      .trim()
      .toUpperCase()
      .max(100)
      .optional()
      .nullable(),
    notes: z.string().trim().optional().nullable(),

    is_submitting: z
      .preprocess(parseBoolean, z.boolean())
      .optional()
      .default(false),
  }),
});

const updateExpenseSchema = z.object({
  body: z
    .object({
      expense_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .optional(),
      category: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().min(3).optional(),
      total_amount: z.coerce.number().positive().optional(),
      is_vatable: z.preprocess(parseBoolean, z.boolean()).optional(),
      payment_method: z
        .enum(["CASH", "PETTY_CASH", "GCASH", "MAYA", "BANK_TRANSFER", "CHECK"])
        .optional(),
      vendor_id: z.preprocess(
        (v) => (v === "" ? null : v),
        z.coerce.number().int().positive().nullable().optional(),
      ),
      vendor_name: z.string().trim().max(150).optional().nullable(),
      reference_number: z
        .string()
        .trim()
        .toUpperCase()
        .max(100)
        .optional()
        .nullable(),
      notes: z.string().trim().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const updateExpenseStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING_APPROVAL"], {
      required_error: "Status transition is required",
    }),
  }),
});

const getExpensesSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      category: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  updateExpenseStatusSchema,
  getExpensesSchema,
};
