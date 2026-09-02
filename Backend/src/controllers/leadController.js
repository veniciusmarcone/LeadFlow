const pool = require("../config/database");
const { z } = require("zod");
const { createLeadSchema, updateLeadSchema } = require("../validations/leadValidation");

// CRIAR HISTÓRICO
const createHistory = async (leadId, userId, action, description) => {
    await pool.query(
        `INSERT INTO lead_history (lead_id, user_id, action, description)
     VALUES ($1, $2, $3, $4)`,
        [leadId, userId, action, description]
    );
};

// LISTAR LEADS COM FILTROS, BUSCA E PAGINAÇÃO
const getLeads = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        const conditions = [];
        const params = [];

        // Filtro por busca textual (nome, email ou empresa)
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR company ILIKE $${params.length})`);
        }

        // Filtro por status
        if (status && status !== 'all') {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Query para contar total de registros filtrados
        const countQuery = `SELECT COUNT(*) FROM leads ${whereClause}`;
        const totalResult = await pool.query(countQuery, params);
        const total = parseInt(totalResult.rows[0].count, 10);

        // Query paginada com os registros
        params.push(Number(limit));
        const limitIndex = params.length;
        params.push(offset);
        const offsetIndex = params.length;

        const query = `
      SELECT * FROM leads
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

        const result = await pool.query(query, params);

        return res.status(200).json({
            data: result.rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error("Erro ao buscar leads:", error.message);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// EXPORTAR LEADS EM CSV
const exportLeadsCSV = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
        const leads = result.rows;

        const headers = ["ID", "Nome", "Email", "Telefone", "Empresa", "Origem", "Status", "Notas", "Criado em"];
        const rows = leads.map(lead => [
            lead.id,
            `"${(lead.name || '').replace(/"/g, '""')}"`,
            `"${(lead.email || '').replace(/"/g, '""')}"`,
            `"${(lead.phone || '').replace(/"/g, '""')}"`,
            `"${(lead.company || '').replace(/"/g, '""')}"`,
            `"${(lead.source || '').replace(/"/g, '""')}"`,
            `"${(lead.status || '').replace(/"/g, '""')}"`,
            `"${(lead.notes || '').replace(/"/g, '""')}"`,
            `"${lead.created_at}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
        return res.status(200).send(csvContent);

    } catch (error) {
        console.error("Erro ao exportar CSV:", error.message);
        return res.status(500).json({ error: "Erro ao gerar arquivo CSV" });
    }
};

// BUSCAR LEAD POR ID
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM leads WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Lead não encontrado" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao buscar lead:", error.message);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// CRIAR LEAD (COM VALIDAÇÃO ZOD)
const createLead = async (req, res) => {
    try {
        // 1. Valida os dados da requisição
        const validatedData = createLeadSchema.parse(req.body);

        const {
            name,
            email,
            phone,
            company,
            source,
            status,
            notes,
            assigned_to
        } = validatedData;

        // 2. Insere no banco
        const result = await pool.query(
            `INSERT INTO leads
       (name, email, phone, company, source, status, notes, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                name,
                email,
                phone || null,
                company || null,
                source || null,
                status || "new",
                notes || null,
                assigned_to || null
            ]
        );

        const newLead = result.rows[0];

        // 3. Registra auditoria
        if (req.user && req.user.id) {
            await createHistory(newLead.id, req.user.id, "CREATE", "Lead criado");
        }

        return res.status(201).json(newLead);

    } catch (error) {
        // Erro de validação de dados
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Dados inválidos",
                details: error.errors.map(err => ({ campo: err.path[0], mensagem: err.message }))
            });
        }

        // Erro de constraint UNIQUE no PostgreSQL (ex: e-mail duplicado)
        if (error.code === "23505") {
            return res.status(409).json({ error: "Já existe um lead cadastrado com este e-mail" });
        }

        console.error("Erro ao criar lead:", error.message);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// ATUALIZAR LEAD (COM VALIDAÇÃO PARCIAL)
const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateLeadSchema.parse(req.body);

        const {
            name,
            email,
            phone,
            company,
            source,
            status,
            notes,
            assigned_to
        } = validatedData;

        const result = await pool.query(
            `UPDATE leads
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           company = COALESCE($4, company),
           source = COALESCE($5, source),
           status = COALESCE($6, status),
           notes = COALESCE($7, notes),
           assigned_to = COALESCE($8, assigned_to),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
            [
                name ?? null,
                email ?? null,
                phone ?? null,
                company ?? null,
                source ?? null,
                status ?? null,
                notes ?? null,
                assigned_to ?? null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Lead não encontrado" });
        }

        const updatedLead = result.rows[0];

        if (req.user && req.user.id) {
            await createHistory(updatedLead.id, req.user.id, "UPDATE", "Lead atualizado");
        }

        return res.status(200).json(updatedLead);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Dados inválidos",
                details: error.errors.map(err => ({ campo: err.path[0], mensagem: err.message }))
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({ error: "Já existe um lead cadastrado com este e-mail" });
        }

        console.error("Erro ao atualizar lead:", error.message);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// EXCLUIR LEAD
const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM leads WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Lead não encontrado" });
        }

        const lead = result.rows[0];

        if (req.user && req.user.id) {
            await createHistory(lead.id, req.user.id, "DELETE", "Lead excluído");
        }

        await pool.query("DELETE FROM leads WHERE id = $1", [id]);

        return res.status(200).json({
            message: "Lead excluído com sucesso",
            lead
        });

    } catch (error) {
        console.error("Erro ao excluir lead:", error.message);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// HISTÓRICO DO LEAD
const getLeadHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
          lh.id,
          lh.lead_id,
          lh.user_id,
          u.name AS user_name,
          u.email AS user_email,
          lh.action,
          lh.description,
          lh.created_at
       FROM lead_history lh
       LEFT JOIN users u ON u.id = lh.user_id
       WHERE lead_id = $1
       ORDER BY lh.created_at DESC`,
            [id]
        );

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error.message);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    getLeadHistory,
    exportLeadsCSV
};