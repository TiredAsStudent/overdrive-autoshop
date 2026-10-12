const { z } = require("zod");

const getBackupsSchema = z.object({
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
    })
    .optional(),
});

module.exports = { getBackupsSchema };
