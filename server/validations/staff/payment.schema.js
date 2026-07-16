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
      reference_number: z.string().trim().max(100).optional(),
      notes: z.string().trim().optional(),
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
