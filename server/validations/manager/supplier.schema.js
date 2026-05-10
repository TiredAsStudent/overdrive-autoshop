const { z } = require("zod");

const createSupplierSchema = z.object({
  body: z.object({
    supplier_name: z.string().min(2).max(150),
    tin: z.string().max(50).optional().nullable(),
    contact_info: z.string().max(100).optional().nullable(),
    contact_person: z.string().max(100).optional().nullable(),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    is_vat_registered: z.boolean().default(true),
  }),
});

const updateSupplierSchema = z.object({
  body: z.object({
    supplier_name: z.string().min(2).max(150).optional(),
    tin: z.string().max(50).optional().nullable(),
    contact_info: z.string().max(100).optional().nullable(),
    contact_person: z.string().max(100).optional().nullable(),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    is_vat_registered: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = { createSupplierSchema, updateSupplierSchema };
