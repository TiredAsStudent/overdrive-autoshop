const { z } = require("zod");

const createMechanicSchema = z.object({
  body: z.object({
    first_name: z.string().min(2, "First name is required").max(100),
    last_name: z.string().min(2, "Last name is required").max(100),
    phone_number: z.string().max(50).optional(),
    branch_id: z
      .number()
      .int()
      .positive("A valid Branch Assignment is required"),
    skills: z.array(z.string()).min(1, "At least one skill tag is required"),
  }),
});

const updateMechanicSchema = z.object({
  body: z.object({
    first_name: z.string().min(2).max(100).optional(),
    last_name: z.string().min(2).max(100).optional(),
    phone_number: z.string().max(50).optional(),
    branch_id: z.number().int().positive().optional(),
    skills: z.array(z.string()).min(1).optional(),
    status: z.enum(["Active", "Inactive", "On Leave"]).optional(),
  }),
});

module.exports = { createMechanicSchema, updateMechanicSchema };
