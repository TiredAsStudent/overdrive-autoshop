const { z } = require("zod");

const createCustomerSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(2, "Full name is required").max(150),
    contact_number: z
      .string()
      .trim()
      .min(7, "A valid contact number is required")
      .max(30),
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(150)
      .optional()
      .or(z.literal("")),
    address: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    branch_id: z.number().int().positive().optional(),
  }),
});

const updateCustomerSchema = z.object({
  body: z
    .object({
      full_name: z.string().trim().min(2).max(150).optional(),
      contact_number: z.string().trim().min(7).max(30).optional(),
      email: z.string().trim().email().max(150).optional().or(z.literal("")),
      address: z.string().trim().optional(),
      notes: z.string().trim().optional(),
      is_active: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const getCustomersSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      status: z.enum(["active", "archived", "all"]).optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersSchema,
};
