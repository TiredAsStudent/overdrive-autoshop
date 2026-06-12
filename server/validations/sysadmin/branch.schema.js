const { z } = require("zod");

const getBranchesSchema = z.object({
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
      status: z.enum(["active", "archived", "all"]).optional(),
    })
    .optional(),
});

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
  getBranchesSchema,
  createBranchSchema,
  updateBranchSchema,
  toggleMaintenanceSchema,
};
