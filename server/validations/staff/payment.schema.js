const { z } = require("zod");

const createPaymentSchema = z.object({
  body: z
    .object({
      invoice_id: z
        .number()
        .int()
        .positive("A valid Invoice ID is required to record a payment."),
      amount_received: z
        .number()
        .positive("Payment amount must be greater than zero."),
      payment_method: z.enum(["CASH", "GCASH", "MAYA", "BANK_TRANSFER"], {
        errorMap: () => ({ message: "Invalid payment method selected." }),
      }),
      payment_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .refine((val) => {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

          return val <= todayStr;
        }, "Payment Date cannot be in the future.")
        .optional(),
      reference_number: z.string().trim().max(100).optional().nullable(),
      notes: z.string().trim().optional().nullable(),
    })
    .refine(
      (data) => {
        // VR-07: Require reference number for digital payments
        if (["GCASH", "MAYA", "BANK_TRANSFER"].includes(data.payment_method)) {
          return !!data.reference_number && data.reference_number.length > 0;
        }
        return true;
      },
      {
        message:
          "A Transaction Reference Number is required for digital and bank transfers.",
        path: ["reference_number"],
      },
    ),
});

const getPaymentsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
      method: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
});

module.exports = { createPaymentSchema, getPaymentsSchema };
