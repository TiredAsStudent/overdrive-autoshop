const { z } = require("zod");

const createVendorPaymentSchema = z.object({
  body: z
    .object({
      vendor_id: z.coerce
        .number()
        .int()
        .positive("A valid Vendor ID is required."),
      bill_id: z.coerce.number().int().positive("A valid Bill ID is required."),
      amount_paid: z.coerce
        .number()
        .positive("Payment amount must be greater than zero."),
      payment_method: z.enum(
        ["CASH", "CHECK", "BANK_TRANSFER", "GCASH", "MAYA"],
        {
          errorMap: () => ({ message: "Invalid payment method selected." }),
        },
      ),
      payment_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .refine((val) => {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          return val <= todayStr;
        }, "Disbursement date cannot be in the future.")
        .optional(),
      reference_number: z.string().trim().max(100).optional().nullable(),
      notes: z.string().trim().optional().nullable(),
    })
    .refine(
      (data) => {
        // Cash does not strictly require a reference, but checks/digital transfers do.
        if (
          ["CHECK", "GCASH", "MAYA", "BANK_TRANSFER"].includes(
            data.payment_method,
          )
        ) {
          return !!data.reference_number && data.reference_number.length > 0;
        }
        return true;
      },
      {
        message:
          "A Transaction Reference Number (or Check No.) is required for this payment method.",
        path: ["reference_number"],
      },
    ),
});

const getVendorPaymentsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      method: z.string().optional(),
      branch: z.string().optional(),
      vendor: z.string().optional(),
    })
    .optional(),
});

module.exports = { createVendorPaymentSchema, getVendorPaymentsSchema };
