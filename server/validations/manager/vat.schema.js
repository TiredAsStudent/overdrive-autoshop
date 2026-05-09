const { z } = require("zod");

const getLedgerSchema = z.object({
  query: z.object({
    tax_period: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Tax period must be in YYYY-MM format")
      .optional(),
    branch_id: z.string().regex(/^\d+$/).optional(),
  }),
});

const closePeriodSchema = z.object({
  body: z.object({
    tax_period: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Tax period must be in YYYY-MM format"),
  }),
});

module.exports = { getLedgerSchema, closePeriodSchema };
