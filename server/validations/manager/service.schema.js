const { z } = require("zod");

const CATEGORIES = [
  "Engine",
  "Transmission",
  "Brake System",
  "Suspension",
  "Cooling System",
  "Electrical",
  "Air Conditioning",
  "Steering",
  "Preventive Maintenance",
  "Tire Services",
  "General Repair",
];

const createServiceSchema = z.object({
  body: z.object({
    service_name: z
      .string()
      .min(3, "Service name must be at least 3 characters")
      .max(150),
    category: z.enum(CATEGORIES, {
      errorMap: () => ({ message: "Invalid automotive category selected" }),
    }),
    description: z.string().optional().nullable(),
    price: z.number().min(0, "Price cannot be negative"),
    estimated_minutes: z
      .number()
      .int()
      .min(1, "Duration must be at least 1 minute"),
    commonly_used_parts: z.array(z.string().uuid()).optional().default([]),
    is_vatable: z.boolean().optional().default(true),
  }),
});

const getServicesSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, "Page must be a valid positive number")
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/, "Limit must be a valid positive number")
        .optional(),
      search: z.string().optional(),
      category: z.enum([...CATEGORIES, "all"]).optional(),
      status: z.enum(["active", "archived", "all"]).optional(),
    })
    .optional(),
});

const toggleServiceStatusSchema = z.object({
  body: z.object({
    is_active: z.boolean({
      required_error: "is_active flag is required",
      invalid_type_error: "is_active must be a boolean",
    }),
  }),
});

module.exports = {
  createServiceSchema,
  getServicesSchema,
  toggleServiceStatusSchema,
};
