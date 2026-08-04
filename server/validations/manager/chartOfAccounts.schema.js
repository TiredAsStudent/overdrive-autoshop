const { z } = require("zod");

const createAccountSchema = z.object({
  body: z.object({
    account_code: z.string().trim().min(2, "Account code is required").max(20),
    account_name: z.string().trim().min(3, "Account name is required").max(150),
    account_type: z.enum(
      ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"],
      {
        required_error: "A valid account type is required.",
      },
    ),
    parent_id: z.number().int().positive().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    is_vat_applicable: z.boolean().optional().default(false),
  }),
});

const updateAccountSchema = z.object({
  body: z
    .object({
      account_name: z.string().trim().min(3).max(150).optional(),
      parent_id: z.number().int().positive().optional().nullable(),
      description: z.string().trim().optional().nullable(),
      is_vat_applicable: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const toggleAccountStatusSchema = z.object({
  body: z.object({
    is_active: z.boolean({
      required_error: "is_active flag is required",
    }),
  }),
});

const getAccountsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      type: z
        .enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE", "all"])
        .optional(),
      status: z.enum(["active", "inactive", "all"]).optional(),
    })
    .optional(),
});

module.exports = {
  createAccountSchema,
  updateAccountSchema,
  toggleAccountStatusSchema,
  getAccountsSchema,
};
