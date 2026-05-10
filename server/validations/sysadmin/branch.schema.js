const { z } = require("zod");

const createBranchSchema = z.object({
  body: z.object({
    branch_name: z
      .string()
      .min(3, "Branch name must be at least 3 characters")
      .max(100),
    branch_code: z
      .string()
      .length(
        3,
        "Prefix Logic requires Branch code to be exactly 3 characters (e.g., CAB, BIN)",
      )
      .regex(/^[a-zA-Z]+$/, "Branch code must contain only letters"),
    address: z
      .string()
      .min(5, "Official Address is required for Legal Identity"),
    tin: z
      .string()
      .min(5, "Tax Identification Number (TIN) is required for invoicing")
      .max(50),
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
    branch_code: z
      .string()
      .length(3)
      .regex(/^[a-zA-Z]+$/)
      .optional(),
    address: z.string().min(5).optional(),
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
