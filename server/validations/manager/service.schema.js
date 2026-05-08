const { z } = require("zod");

const createServiceSchema = z.object({
  body: z.object({
    service_code: z
      .string()
      .min(3, "Service code must be at least 3 characters")
      .max(20)
      .regex(
        /^[A-Z0-9-]+$/,
        "Code can only contain uppercase letters, numbers, and hyphens (e.g., LBR-001)",
      ),
    service_name: z.string().min(3, "Service name is required").max(150),
    description: z.string().optional(),
    // Coerce converts string inputs from the frontend into strict numbers
    price: z.coerce.number().min(0, "Price cannot be negative"),
    estimated_minutes: z.coerce
      .number()
      .int()
      .min(1, "Duration must be at least 1 minute"),
    is_vatable: z.boolean().default(true),
  }),
});

const updateServiceSchema = z.object({
  body: z.object({
    service_name: z.string().min(3).max(150).optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    estimated_minutes: z.coerce.number().int().min(1).optional(),
    is_vatable: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = {
  createServiceSchema,
  updateServiceSchema,
};
