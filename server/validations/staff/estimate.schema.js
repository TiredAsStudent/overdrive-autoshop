const { z } = require("zod");

// Define a strict schema for the item matrix array
const itemSchema = z
  .object({
    line_type: z.enum(["SERVICE", "PART"]),
    service_id: z.number().int().positive().optional().nullable(),
    item_id: z.number().int().positive().optional().nullable(),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    discount: z.number().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.line_type === "SERVICE") return !!data.service_id;
      if (data.line_type === "PART") return !!data.item_id;
      return false;
    },
    {
      message:
        "Invalid line item: Missing required ID based on line type (service_id or item_id).",
      path: ["line_type"],
    },
  );

// Shared validation logic for dates
const validUntilRefine = (val) => {
  const selectedDate = new Date(val);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Strip time for pure date comparison
  return !isNaN(selectedDate.getTime()) && selectedDate >= today;
};

const createEstimateSchema = z.object({
  body: z.object({
    customer_id: z.number().int().positive("Valid Customer is required"),
    valid_until: z
      .string()
      .refine(validUntilRefine, "Valid Until date cannot be in the past"),
    notes: z.string().trim().optional(),
    terms_conditions: z.string().trim().optional(),
    items: z
      .array(itemSchema)
      .min(1, "At least one service or part must be included"),
  }),
});

const updateEstimateSchema = z.object({
  body: z.object({
    customer_id: z.number().int().positive("Valid Customer is required"),
    valid_until: z
      .string()
      .refine(validUntilRefine, "Valid Until date cannot be in the past"),
    notes: z.string().trim().optional(),
    terms_conditions: z.string().trim().optional(),
    items: z
      .array(itemSchema)
      .min(1, "At least one service or part must be included"),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"], {
      errorMap: () => ({
        message:
          "Only 'APPROVED' or 'REJECTED' statuses are permitted for direct updates.",
      }),
    }),
  }),
});

const getEstimatesSchema = z.object({
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
  createEstimateSchema,
  updateEstimateSchema,
  updateStatusSchema,
  getEstimatesSchema,
};
