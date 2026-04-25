const { z } = require("zod");

const checkInSchema = z.object({
  body: z.object({
    plate_number: z
      .string()
      .min(3, "Plate number is too short")
      .max(20)
      .trim()
      .toUpperCase(),
    odometer: z.coerce
      .number()
      .int()
      .positive("Odometer must be a valid positive number"),
    service_intent: z.string().min(2, "Service Intent is required").max(100),
    mechanic_id: z.coerce.number().int().positive().optional().nullable(),

    // Path A: Minimal (Email required for Magic Link if Path B isn't fully used)
    email: z
      .string()
      .email("Valid email required")
      .optional()
      .or(z.literal("")),

    // Path B: Manual Fallback Data (Optional)
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    make: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  }),
});

module.exports = { checkInSchema };
