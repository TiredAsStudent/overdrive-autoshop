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

module.exports = {
  createMechanicSchema,
  updateMechanicSchema,
};
