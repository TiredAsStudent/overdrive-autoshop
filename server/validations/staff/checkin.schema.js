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

    email: z
      .string()
      .email(
        "A valid email is required to generate the Customer Portal account",
      )
      .trim(),

    // Optional Fallback Data (Path B)
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    make: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  }),
});

module.exports = { checkInSchema };
