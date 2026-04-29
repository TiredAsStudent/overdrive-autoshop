const { z } = require("zod");

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").trim(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").trim(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(
        /[\d@$!%*?&#]/,
        "Password must contain at least one number or special character",
      ),
  }),
});

const activateAccountSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Activation token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(
        /[\d@$!%*?&#]/,
        "Password must contain at least one number or special character",
      ),
    policyAgreed: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Data Integrity Policy",
    }),
  }),
});

const activateCustomerSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Activation token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    first_name: z.string().min(2, "First name is required").max(100),
    last_name: z.string().min(2, "Last name is required").max(100),
    make: z.string().min(2, "Vehicle make is required").max(50),
    model: z.string().min(1, "Vehicle model is required").max(50),
    year: z.coerce
      .number()
      .int()
      .min(1900, "Invalid year")
      .max(new Date().getFullYear() + 1, "Invalid year"),
  }),
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  activateAccountSchema,
  activateCustomerSchema,
};
