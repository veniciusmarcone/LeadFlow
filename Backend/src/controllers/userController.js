const pool = require("../config/database");
const bcrypt = require("bcrypt");


// CRIAR USUÁRIO
const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Nome, email e senha são obrigatórios"
            });
        }

        const userRole = role || "user";

        if (!["admin", "user"].includes(userRole)) {
            return res.status(400).json({
                error: "Role inválida. Use 'admin' ou 'user'"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
            (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at`,
            [
                name,
                email,
                hashedPassword,
                userRole
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erro ao criar usuário:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Email já cadastrado"
            });
        }

        res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
};


module.exports = {
    createUser
};