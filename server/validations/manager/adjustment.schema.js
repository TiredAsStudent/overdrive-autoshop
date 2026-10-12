const { z } = require("zod");

const getAdjustmentsSchema = z.object({
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
      status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "all"])
        .optional()
        .default("PENDING"),
      branch: z.string().optional(),
    })
    .optional(),
});

const resolveAdjustmentSchema = z.object({
  body: z.object({
    manager_remarks: z
      .string()
      .trim()
      .max(255, "Remarks cannot exceed 255 characters")
      .optional()
      .nullable(),
  }),
});

module.exports = {
  getAdjustmentsSchema,
  resolveAdjustmentSchema,
};
