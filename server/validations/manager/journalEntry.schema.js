const { z } = require("zod");

const journalItemSchema = z.object({
  account_id: z
    .number()
    .int()
    .positive("A valid Chart of Accounts ID is required."),
  entry_type: z.enum(["DEBIT", "CREDIT"], {
    required_error: "Line must specify DEBIT or CREDIT.",
  }),
  amount: z.number().positive("Line amount must be greater than zero."),
  line_description: z.string().trim().max(255).optional().nullable(),
});

const saveJournalEntrySchema = z.object({
  body: z.object({
    entry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    reference_number: z.string().trim().max(100).optional().nullable(),
    description: z
      .string()
      .trim()
      .min(5, "A descriptive memo is required for the journal entry."),
    branch_id: z.number().int().positive().optional().nullable(),
    status: z.enum(["DRAFT", "POSTED"]).default("DRAFT"),
    items: z
      .array(journalItemSchema)
      .min(
        2,
        "A journal entry must contain at least two line items (one debit and one credit).",
      ),
  }),
});

const getJournalEntriesSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      status: z.enum(["DRAFT", "POSTED", "all"]).optional(),
      branch: z.string().optional(),
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date")
        .optional()
        .or(z.literal("")),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
});

module.exports = {
  saveJournalEntrySchema,
  getJournalEntriesSchema,
};
