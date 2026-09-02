const pool = require("../config/database");

const getStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'new')::int AS new,
                COUNT(*) FILTER (WHERE status = 'contacted')::int AS contacted,
                COUNT(*) FILTER (WHERE status = 'converted')::int AS converted,
                COUNT(*) FILTER (WHERE status = 'lost')::int AS lost
            FROM leads
        `);

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(
            "Erro ao buscar estatísticas:",
            error.message
        );

        res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
};

module.exports = {
    getStats
};