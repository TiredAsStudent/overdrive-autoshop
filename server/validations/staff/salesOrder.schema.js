const { z } = require("zod");

const createSalesOrderSchema = z.object({
  body: z.object({
    estimate_id: z
      .number()
      .int()
      .positive("A valid approved Estimate ID is required for conversion."),
    estimated_completion_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
      .optional()
      .nullable(),
    notes: z.string().trim().optional(),
  }),
});

const updateSalesOrderSchema = z.object({
  body: z
    .object({
      status: z
        .enum(["PENDING_SERVICE", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional(),
      estimated_completion_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .optional()
        .nullable(),
      notes: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one operational field must be provided for update.",
    }),
});

const getSalesOrdersSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createSalesOrderSchema,
  updateSalesOrderSchema,
  getSalesOrdersSchema,
};
