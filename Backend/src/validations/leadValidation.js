const { z } = require("zod");

const createLeadSchema = z.object({
    name: z.string({ required_error: "Nome é obrigatório" }).min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string({ required_error: "E-mail é obrigatório" }).email("Formato de e-mail inválido"),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: z.enum(["new", "contacted", "qualified", "lost", "converted"]).optional().default("new"),
    notes: z.string().optional().nullable(),
    assigned_to: z.number().int().positive().optional().nullable()
});

const updateLeadSchema = createLeadSchema.partial();

module.exports = {
    createLeadSchema,
    updateLeadSchema
};