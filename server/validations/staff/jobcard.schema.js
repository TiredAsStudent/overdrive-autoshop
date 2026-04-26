const { z } = require("zod");

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "ONGOING", "DONE"], {
      required_error: "Job status is required",
      invalid_type_error: "Status must be PENDING, ONGOING, or DONE",
    }),
  }),
});

const assignMechanicSchema = z.object({
  body: z.object({
    mechanic_id: z.coerce
      .number()
      .int()
      .positive("Invalid mechanic ID")
      .nullable(),
  }),
});

const updateDiagnosisSchema = z.object({
  body: z.object({
    diagnostic_notes: z
      .string()
      .trim()
      .max(1000, "Notes are too long")
      .optional(),
  }),
});

module.exports = {
  updateStatusSchema,
  assignMechanicSchema,
  updateDiagnosisSchema,
};
