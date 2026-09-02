const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const leadRoutes = require("./routes/leadRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "LeadFlow API funcionando!"
    });
});

const PORT = process.env.PORT || 3000;

pool.query("SELECT NOW()")
    .then(() => {
        console.log("Banco de dados conectado!");
    })
    .catch((error) => {
        console.error("Erro ao conectar ao banco:", error.message);
    });

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});