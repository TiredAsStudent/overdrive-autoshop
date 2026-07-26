const { z } = require("zod");

// Validates that the ID parameter is a strict UUID (not a standard integer)
const scanIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Scan ID format."),
  }),
});

module.exports = {
  scanIdParamSchema,
};
