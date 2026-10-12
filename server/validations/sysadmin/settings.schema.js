const { z } = require("zod");

const updateSettingsSchema = z.object({
  body: z.object({
    company_name: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters.")
      .max(255, "Company name cannot exceed 255 characters.")
      .optional(),

    vat_percentage: z.coerce
      .number()
      .min(0, "VAT cannot be negative.")
      .max(100, "VAT cannot exceed 100%.")
      .optional(),

    markup_percentage: z.coerce
      .number()
      .min(0, "Markup cannot be negative.")
      .max(1000, "Markup percentage exceeds system limits.")
      .optional(),

    contact_email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format.")
      .optional()
      .or(z.literal("")),

    contact_number: z
      .string()
      .trim()
      .max(50, "Contact number exceeds maximum allowed length.")
      .optional()
      .or(z.literal("")),
  }),
});

module.exports = { updateSettingsSchema };
