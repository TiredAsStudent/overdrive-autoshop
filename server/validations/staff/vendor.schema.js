const { z } = require("zod");

const createVendorSchema = z.object({
  body: z.object({
    business_name: z
      .string()
      .trim()
      .min(2, "Business name is required")
      .max(150),
    contact_person: z
      .string()
      .trim()
      .min(2, "Contact person is required")
      .max(100),
    business_address: z
      .string()
      .trim()
      .min(5, "A valid business address is required"),
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
      .or(z.literal("").transform(() => null)),
    tin: z
      .string()
      .trim()
      .regex(/^(\d{9}|\d{12})$/, "TIN must be exactly 9 or 12 digits.")
      .optional()
      .or(z.literal("").transform(() => null)),
    is_vat_registered: z.boolean().optional().default(false),
    notes: z.string().trim().optional(),
    branch_id: z.number().int().positive().optional(),
  }),
});

const updateVendorSchema = z.object({
  body: z
    .object({
      business_name: z.string().trim().min(2).max(150).optional(),
      contact_person: z.string().trim().min(2).max(100).optional(),
      business_address: z.string().trim().min(5).optional(),
      contact_number: z.string().trim().min(7).max(30).optional(),
      email: z
        .string()
        .trim()
        .email()
        .max(150)
        .optional()
        .or(z.literal("").transform(() => null)),
      tin: z
        .string()
        .trim()
        .regex(/^(\d{9}|\d{12})$/, "TIN must be exactly 9 or 12 digits.")
        .optional()
        .or(z.literal("").transform(() => null)),
      is_vat_registered: z.boolean().optional(),
      is_active: z.boolean().optional(),
      notes: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const getVendorsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      status: z.enum(["active", "inactive", "all"]).optional(),
      vat_status: z.enum(["vat", "non_vat", "all"]).optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

module.exports = { createVendorSchema, updateVendorSchema, getVendorsSchema };
