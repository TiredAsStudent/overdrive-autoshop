const { z } = require("zod");
const { ROLES } = require("../constants/roles");

const inviteUserSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format").trim(),
      role: z.enum([ROLES.ADMIN, ROLES.STAFF], {
        errorMap: () => ({ message: "Role must be either ADMIN or STAFF" }),
      }),
      firstName: z.string().min(1, "First name is required").trim(),
      lastName: z.string().min(1, "Last name is required").trim(),
      branchId: z.number().int().positive().nullable().optional(),
    })
    .refine(
      (data) => {
        // Logic: Staff MUST have a branch. Admins MUST NOT have a branch.
        if (data.role === ROLES.STAFF && !data.branchId) return false;
        if (data.role === ROLES.ADMIN && data.branchId) return false;
        return true;
      },
      {
        message:
          "STAFF requires a branch assignment. ADMIN must not have a branch assignment.",
        path: ["branchId"],
      },
    ),
});

const updateUserSchema = z.object({
  body: z.object({
    branchId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    role: z.enum([ROLES.ADMIN, ROLES.STAFF]).optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().email().trim().optional(),
  }),
});

module.exports = { inviteUserSchema, updateUserSchema };
