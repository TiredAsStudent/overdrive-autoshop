const { z } = require("zod");

const updateSettingsSchema = z.object({
  body: z.object({
    company_name: z
      .string()
      .min(2, "Company name is required")
      .max(150)
      .optional(),
    // Coerce converts string inputs from FormData into strict numbers for financial safety
    vat_percentage: z.coerce
      .number()
      .min(0, "VAT cannot be negative")
      .max(100, "VAT cannot exceed 100%")
      .optional(),
    markup_percentage: z.coerce
      .number()
      .min(0, "Markup cannot be negative")
      .max(1000, "Markup percentage is exceptionally high")
      .optional(),
    contact_email: z
      .string()
      .email("Invalid email format")
      .optional()
      .or(z.literal("")),
    contact_number: z.string().max(50).optional().or(z.literal("")),
  }),
});

module.exports = { updateSettingsSchema };
