const { z } = require("zod");

const createInvoiceSchema = z.object({
  body: z.object({
    sales_order_id: z
      .number()
      .int()
      .positive("A valid COMPLETED Sales Order ID is required for billing."),
    due_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    notes: z.string().trim().optional(),
  }),
});

// Update schema intentionally omits financial and status fields. Status is driven by Payments.
const updateInvoiceSchema = z.object({
  body: z
    .object({
      due_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .optional(),
      notes: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one operational field must be provided for update.",
    }),
});

const getInvoicesSchema = z.object({
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
  createInvoiceSchema,
  updateInvoiceSchema,
  getInvoicesSchema,
};
