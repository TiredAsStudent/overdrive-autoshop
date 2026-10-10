const { z } = require("zod");

const getStaffDashboardSchema = z.object({
  query: z
    .object({
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)")
        .optional(),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)")
        .optional(),
    })
    .optional(),
});

module.exports = {
  getStaffDashboardSchema,
};
