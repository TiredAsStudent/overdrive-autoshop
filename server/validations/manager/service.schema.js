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
      .trim()
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
    commonly_used_parts: z.array(z.number().int()).optional().default([]),
    is_vatable: z.boolean().optional().default(true),
  }),
});

const updateServiceSchema = z.object({
  body: z
    .object({
      service_name: z.string().trim().min(3).max(150).optional(),
      category: z.enum(CATEGORIES).optional(),
      description: z.string().optional().nullable(),
      price: z.number().min(0).optional(),
      estimated_minutes: z.number().int().min(1).optional(),
      commonly_used_parts: z.array(z.number().int()).optional(),
      is_vatable: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

const getServicesSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
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
  updateServiceSchema,
  getServicesSchema,
  toggleServiceStatusSchema,
};
