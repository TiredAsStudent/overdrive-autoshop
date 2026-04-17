const { z } = require("zod");

const updateFinancialsSchema = z.object({
  body: z.object({
    markupPercentage: z
      .number()
      .min(0, "Markup cannot be negative")
      .max(1000, "Markup exceeds reasonable limit (1000%)"),
    vatPercentage: z
      .number()
      .min(0, "VAT cannot be negative")
      .max(100, "VAT cannot exceed 100%"),
  }),
});

const updateBranchSchema = z.object({
  body: z.object({
    address: z.string().trim().max(255).optional().nullable(),
    contactNumber: z.string().trim().max(50).optional().nullable(),
  }),
});

module.exports = {
  updateFinancialsSchema,
  updateBranchSchema,
};
