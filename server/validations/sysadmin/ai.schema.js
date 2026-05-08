const { z } = require("zod");

const updateAiSettingsSchema = z.object({
  body: z.object({
    gemini_api_key: z.string().optional(),
    ai_confidence_threshold: z.coerce.number().min(0.1).max(1.0).optional(),
    ai_model: z.enum(["gemini-1.5-flash", "gemini-1.5-pro"]).optional(),
    ai_htr_enabled: z.boolean().optional(),
    ai_omr_enabled: z.boolean().optional(),
    ai_system_instruction: z.string().max(1000).optional(),
  }),
});

const testConnectionSchema = z.object({
  body: z.object({
    gemini_api_key: z.string().optional(),
    ai_model: z.string().optional(),
  }),
});

module.exports = { updateAiSettingsSchema, testConnectionSchema };
