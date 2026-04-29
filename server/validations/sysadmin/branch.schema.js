const { z } = require("zod");

const createBranchSchema = z.object({
  body: z.object({
    branch_name: z
      .string()
      .min(3, "Branch name must be at least 3 characters")
      .max(100),
    branch_code: z
      .string()
      .min(2, "Branch code must be at least 2 characters")
      .max(10),
    location: z.string().optional(),
    address: z.string().optional(),
    tin: z.string().max(50).optional(),
    contact_number: z.string().max(50).optional(),
    contact_email: z
      .string()
      .email("Invalid email format")
      .optional()
      .or(z.literal("")),
  }),
});

const updateBranchSchema = z.object({
  body: z.object({
    branch_name: z.string().min(3).max(100).optional(),
    branch_code: z.string().min(2).max(10).optional(),
    location: z.string().optional(),
    address: z.string().optional(),
    tin: z.string().max(50).optional(),
    contact_number: z.string().max(50).optional(),
    contact_email: z.string().email().optional().or(z.literal("")),
    is_active: z.boolean().optional(),
  }),
});

const toggleMaintenanceSchema = z.object({
  body: z.object({
    is_maintenance_mode: z.boolean({
      required_error: "is_maintenance_mode is required",
      invalid_type_error: "is_maintenance_mode must be a boolean",
    }),
  }),
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  toggleMaintenanceSchema,
};
