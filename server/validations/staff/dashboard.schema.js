const { z } = require("zod");

const getStaffDashboardSchema = z.object({
  query: z
    .object({
      start_date: z
        .string()
        .refine(
          (val) => !isNaN(Date.parse(val)),
          "Invalid start date format (YYYY-MM-DD)",
        )
        .optional(),
      end_date: z
        .string()
        .refine(
          (val) => !isNaN(Date.parse(val)),
          "Invalid end date format (YYYY-MM-DD)",
        )
        .optional(),
    })
    .optional(),
});

module.exports = {
  getStaffDashboardSchema,
};
