const { z } = require("zod");

const MECHANIC_STATUS = ["ACTIVE", "ON_LEAVE", "TERMINATED"];
const CERT_LEVELS = ["Junior", "Senior", "Master"];

const createMechanicSchema = z.object({
  body: z.object({
    branch_id: z.number().int().positive("Branch ID is required"),
    first_name: z.string().min(2, "First name is too short").max(100),
    last_name: z.string().min(2, "Last name is too short").max(100),
    specialization: z.string().max(150).optional(),
    certification_level: z.enum(CERT_LEVELS).optional().default("Junior"),
    contact_number: z.string().max(50).optional(),
    status: z.enum(MECHANIC_STATUS).optional().default("ACTIVE"),
  }),
});

const updateMechanicSchema = z.object({
  body: z.object({
    branch_id: z.number().int().positive().optional(),
    first_name: z.string().min(2).max(100).optional(),
    last_name: z.string().min(2).max(100).optional(),
    specialization: z.string().max(150).optional(),
    certification_level: z.enum(CERT_LEVELS).optional(),
    contact_number: z.string().max(50).optional(),
    status: z.enum(MECHANIC_STATUS).optional(),
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
    revenue_account_id: z.coerce
      .number()
      .int()
      .positive("Revenue Account mapping is required for accounting."),
    description: z.string().optional(),
    parts: z
      .array(
        z.object({
          inventory_id: z.coerce.number().int().positive(),
          quantity_required: z.coerce.number().positive(),
        }),
      )
      .optional()
      .default([])
      .refine(
        (items) => {
          const ids = items.map((item) => item.inventory_id);
          return new Set(ids).size === ids.length;
        },
        { message: "Duplicate parts are not allowed in the same service." },
      ),
  }),
});

const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(150).optional(),
    category: z.string().min(2).max(50).optional(),
    labor_fee: z.coerce.number().min(0).optional(),
    revenue_account_id: z.coerce.number().int().positive().optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    parts: z
      .array(
        z.object({
          inventory_id: z.coerce.number().int().positive(),
          quantity_required: z.coerce.number().positive(),
        }),
      )
      .optional()
      .refine(
        (items) => {
          if (!items) return true;
          const ids = items.map((item) => item.inventory_id);
          return new Set(ids).size === ids.length;
        },
        { message: "Duplicate parts are not allowed in the same service." },
      ),
  }),
});

module.exports = {
  createMechanicSchema,
  updateMechanicSchema,
  createServiceSchema,
  updateServiceSchema,
};
