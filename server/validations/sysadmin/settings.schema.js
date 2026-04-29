const { z } = require("zod");

const updateSettingsSchema = z.object({
  body: z.object({
    company_name: z
      .string()
      .min(2, "Company name is required")
      .max(150)
      .optional(),
    vat_percentage: z.coerce.number().min(0).max(100).optional(),
    markup_percentage: z.coerce.number().min(0).max(500).optional(),
    contact_email: z
      .string()
      .email("Invalid email format")
      .optional()
      .or(z.literal("")),
    contact_number: z.string().max(50).optional(),
  }),
});

module.exports = { updateSettingsSchema };
