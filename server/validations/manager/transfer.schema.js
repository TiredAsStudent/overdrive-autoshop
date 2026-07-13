const { z } = require("zod");

const executeTransferSchema = z.object({
  body: z
    .object({
      item_id: z.number().int().positive("Valid Master Item ID is required"),
      source_branch_id: z
        .number()
        .int()
        .positive("Valid Source Branch ID is required"),
      destination_branch_id: z
        .number()
        .int()
        .positive("Valid Destination Branch ID is required"),
      quantity: z
        .number()
        .int()
        .positive("Transfer quantity must be greater than 0"),
      reason: z
        .string()
        .trim()
        .min(3, "Reason is required")
        .max(255, "Reason cannot exceed 255 characters"),
    })
    .refine((data) => data.source_branch_id !== data.destination_branch_id, {
      message:
        "Source and Destination branches must be different. Self-transfers are not allowed.",
      path: ["destination_branch_id"],
    }),
});

const getTransfersSchema = z.object({
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
      source_branch: z.string().optional(),
      dest_branch: z.string().optional(),
    })
    .optional(),
});

module.exports = { executeTransferSchema, getTransfersSchema };
