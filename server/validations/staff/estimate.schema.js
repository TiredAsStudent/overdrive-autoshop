const { z } = require("zod");

const createEstimateSchema = z.object({
  body: z.object({
    job_card_id: z.coerce.number().int().positive("Job Card ID is required"),
    customer_id: z.coerce.number().int().positive("Customer ID is required"),
    items: z
      .array(
        z.object({
          inventory_id: z.coerce
            .number()
            .int()
            .positive()
            .nullable()
            .optional(),
          description: z.string().trim().min(2, "Description is required"),
          quantity: z.coerce.number().positive("Quantity must be at least 1"),
          unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
          is_labor: z.boolean().default(false),
        }),
      )
      .min(1, "An estimate must contain at least one line item."),
  }),
});

const updateEstimateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "APPROVED", "CANCELLED"], {
      required_error: "Status is required",
      invalid_type_error: "Invalid status state",
    }),
  }),
});

module.exports = { createEstimateSchema, updateEstimateStatusSchema };
