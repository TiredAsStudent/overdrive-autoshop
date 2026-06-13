const { z } = require("zod");
const { ROLES } = require("../../constants/roles");

const getRosterSchema = z.object({
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
    })
    .optional(),
});

const inviteUserSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format").trim(),
      role: z.enum([ROLES.MANAGER, ROLES.STAFF], {
        errorMap: () => ({ message: "Role must be MANAGER or STAFF" }),
      }),
      firstName: z.string().min(1, "First name is required").trim(),
      lastName: z.string().min(1, "Last name is required").trim(),
      branchId: z.number().int().positive().nullable().optional(),
    })
    .refine(
      (data) => {
        // Strict Branch Lock Enforcement during creation
        if (data.role === ROLES.STAFF && !data.branchId) return false;
        if (data.role === ROLES.MANAGER && data.branchId) return false;
        return true;
      },
      {
        message:
          "STAFF requires a specific branch assignment. MANAGER is a global role and must not be tied to a single branch.",
        path: ["branchId"],
      },
    ),
});

const updateUserSchema = z.object({
  body: z
    .object({
      branchId: z.number().int().positive().nullable().optional(),
      isActive: z.boolean().optional(),
      role: z.enum([ROLES.MANAGER, ROLES.STAFF]).optional(),
      firstName: z.string().trim().min(1).optional(),
      lastName: z.string().trim().min(1).optional(),
      email: z.string().email().trim().optional(),
    })
    .refine(
      (data) => {
        // Enforce the lock even during updates: If you make them STAFF, they MUST have a branch.
        if (data.role === ROLES.STAFF && data.branchId === null) return false;
        if (data.role === ROLES.MANAGER && data.branchId) return false;
        return true;
      },
      {
        message:
          "Invalid configuration: STAFF must be locked to a branch, and MANAGER must be global.",
        path: ["branchId"],
      },
    ),
});

module.exports = { getRosterSchema, inviteUserSchema, updateUserSchema };
