const { z } = require("zod");

const transferItemSchema = z.object({
  item_id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, "Valid Master Item ID is required"),
  quantity: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, "Quantity must be greater than zero"),
});

const executeTransferSchema = z.object({
  body: z
    .object({
      source_branch_id: z
        .number()
        .int()
        .positive("Valid Source Branch ID is required"),
      destination_branch_id: z
        .number()
        .int()
        .positive("Valid Destination Branch ID is required"),
      reason: z
        .string()
        .trim()
        .min(3, "Reason is required")
        .max(255, "Reason cannot exceed 255 characters"),
      items: z
        .array(transferItemSchema)
        .min(1, "At least one item must be included in the transfer manifest.")
        .refine((items) => {
          const itemIds = items.map((i) => i.item_id);
          return new Set(itemIds).size === itemIds.length;
        }, "Duplicate items are not allowed in a single transfer manifest."),
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
      category: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    })
    .optional(),
});

module.exports = { executeTransferSchema, getTransfersSchema };
