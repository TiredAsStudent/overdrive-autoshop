const { z } = require("zod");

const createMechanicSchema = z.object({
  body: z.object({
    branch_id: z.number().int().positive("Branch ID is required"),
    first_name: z.string().min(2, "First name is too short").max(100),
    last_name: z.string().min(2, "Last name is too short").max(100),
    specialization: z.string().max(150).optional(),
    contact_number: z.string().max(50).optional(),
  }),
});

const updateMechanicSchema = z.object({
  body: z.object({
    branch_id: z.number().int().positive().optional(), // Admin can transfer them
    first_name: z.string().min(2).max(100).optional(),
    last_name: z.string().min(2).max(100).optional(),
    specialization: z.string().max(150).optional(),
    contact_number: z.string().max(50).optional(),
    is_active: z.boolean().optional(),
  }),
});

const createServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Service name must be at least 3 characters")
      .max(150),
    category: z.string().min(2, "Category is required").max(50),
    labor_fee: z.coerce.number().min(0, "Labor fee cannot be negative"),
    description: z.string().optional(),
    parts: z
      .array(
        z.object({
          inventory_id: z.coerce.number().int().positive(),
          quantity_required: z.coerce.number().positive(),
        }),
      )
      .optional()
      .default([]), // Allow services with zero parts (Labor-only)
  }),
});

const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(150).optional(),
    category: z.string().min(2).max(50).optional(),
    labor_fee: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    parts: z
      .array(
        z.object({
          inventory_id: z.coerce.number().int().positive(),
          quantity_required: z.coerce.number().positive(),
        }),
      )
      .optional(),
  }),
});

module.exports = {
  createMechanicSchema,
  updateMechanicSchema,
  createServiceSchema,
  updateServiceSchema,
};
