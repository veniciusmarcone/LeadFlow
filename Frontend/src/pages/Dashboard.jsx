import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    UserPlus,
    PhoneCall,
    CheckCircle2,
    LayoutDashboard,
    LogOut,
    ArrowRight,
    Sparkles
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from "recharts";
import API_URL from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeRange, setTimeRange] = useState("dia");

    const token = localStorage.getItem("token");

    // Efeito das ondas oceânicas interativas com o mouse
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2, speed: 0 };
        let prevMouseX = width / 2;
        let prevMouseY = height / 2;

        const handleMouseMove = (e) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;

            const dist = Math.hypot(e.clientX - prevMouseX, e.clientY - prevMouseY);
            mouse.speed = Math.min(dist * 0.15, 8);
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
        };
        window.addEventListener("mousemove", handleMouseMove);

        let step = 0;
        const linesCount = 38;

        const render = () => {
            step += 0.015;

            mouse.x += (mouse.targetX - mouse.x) * 0.08;
            mouse.y += (mouse.targetY - mouse.y) * 0.08;
            mouse.speed *= 0.94;

            ctx.fillStyle = "#050b14";
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < linesCount; i++) {
                ctx.beginPath();
                const baseY = (height / (linesCount + 2)) * (i + 2);

                const opacity = 0.08 + (i / linesCount) * 0.35;
                ctx.strokeStyle = i % 2 === 0
                    ? `rgba(14, 165, 233, ${opacity})`
                    : `rgba(37, 99, 235, ${opacity})`;
                ctx.lineWidth = 1.2;

                for (let x = 0; x <= width; x += 14) {
                    const calmWave = Math.sin(x * 0.004 + step + i * 0.25) * 6;
                    const distToMouse = Math.hypot(x - mouse.x, baseY - mouse.y);
                    const mouseRadius = 260;

                    let dynamicWave = 0;
                    if (distToMouse < mouseRadius) {
                        const force = (1 - distToMouse / mouseRadius);
                        dynamicWave = Math.sin(distToMouse * 0.08 - step * 5) * (14 + mouse.speed * 4) * force;
                    }

                    const y = baseY + calmWave + dynamicWave;

                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchLeads = async () => {
            try {
                const response = await fetch(`${API_URL}/leads`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Erro ao buscar leads");
                }

                setLeads(Array.isArray(data) ? data : data.data || []);
            } catch (error) {
                setError(error.message);

                if (
                    error.message.includes("Token") ||
                    error.message.includes("inválido")
                ) {
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, [navigate, token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const leadList = Array.isArray(leads) ? leads : [];

    const totalLeads = leadList.length;
    const newLeads = leadList.filter((lead) => lead.status === "new").length;
    const contactedLeads = leadList.filter((lead) => lead.status === "contacted").length;
    const convertedLeads = leadList.filter((lead) => lead.status === "converted").length;

    // Dados para gráfico de canais
    const sourceCounts = leadList.reduce((acc, lead) => {
        const key = lead.source || "Outro";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const sourceData = Object.keys(sourceCounts).map((source) => ({
        name: source,
        quantidade: sourceCounts[source]
    }));

    // Agrupamento temporal real
    const getTimeSeriesData = () => {
        if (!leadList.length) return [];
        const now = new Date();

        if (timeRange === "dia") {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                const label = d.toLocaleDateString("pt-BR", { weekday: "short" });

                const leadsDoDia = leadList.filter(l => l.created_at && l.created_at.startsWith(dateStr));

                days.push({
                    periodo: label.charAt(0).toUpperCase() + label.slice(1),
                    total: leadsDoDia.length,
                    contactados: leadsDoDia.filter(l => l.status === "contacted").length,
                    convertidos: leadsDoDia.filter(l => l.status === "converted").length
                });
            }
            return days;
        }

        if (timeRange === "semana") {
            const weeks = [
                { periodo: "Sem 1", diasAtras: 28 },
                { periodo: "Sem 2", diasAtras: 21 },
                { periodo: "Sem 3", diasAtras: 14 },
                { periodo: "Sem 4", diasAtras: 7 }
            ];

            return weeks.map((w) => {
                const limiteInferior = new Date();
                limiteInferior.setDate(now.getDate() - w.diasAtras);
                const limiteSuperior = new Date();
                limiteSuperior.setDate(now.getDate() - (w.diasAtras - 7));

                const leadsDaSemana = leadList.filter(l => {
                    if (!l.created_at) return false;
                    const leadDate = new Date(l.created_at);
                    return leadDate >= limiteInferior && leadDate < limiteSuperior;
                });

                return {
                    periodo: w.periodo,
                    total: leadsDaSemana.length,
                    contactados: leadsDaSemana.filter(l => l.status === "contacted").length,
                    convertidos: leadsDaSemana.filter(l => l.status === "converted").length
                };
            });
        }

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mesAno = d.toLocaleDateString("pt-BR", { month: "short" });

            const leadsDoMes = leadList.filter(l => {
                if (!l.created_at) return false;
                const leadDate = new Date(l.created_at);
                return (
                    leadDate.getMonth() === d.getMonth() &&
                    leadDate.getFullYear() === d.getFullYear()
                );
            });

            months.push({
                periodo: mesAno.charAt(0).toUpperCase() + mesAno.slice(1),
                total: leadsDoMes.length,
                contactados: leadsDoMes.filter(l => l.status === "contacted").length,
                convertidos: leadsDoMes.filter(l => l.status === "converted").length
            });
        }
        return months;
    };

    const getStatusLabel = (status) => {
        const statuses = {
            new: "Novo",
            contacted: "Contactado",
            converted: "Convertido",
            lost: "Perdido"
        };
        return statuses[status] || status;
    };

    return (
        <div className="ocean-dashboard-wrapper">
            {/* Canvas Interativo de Ondas no Fundo */}
            <canvas ref={canvasRef} className="ocean-canvas-bg" />
            <div className="ocean-vignette-overlay" />

            <div className="dashboard-content-layer">
                <aside className="sidebar-glass">
                    <div className="sidebar-logo">
                        <div className="logo-mark">
                            <Sparkles size={18} />
                        </div>
                        <span>LeadFlow <em>Core</em></span>
                    </div>

                    <nav className="sidebar-nav">
                        <button className="nav-item active">
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>

                        <button className="nav-item" onClick={() => navigate("/leads")}>
                            <Users size={18} />
                            Leads
                        </button>
                    </nav>

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sair
                    </button>
                </aside>

                <main className="dashboard-main-panel">
                    <header className="dashboard-header">
                        <div>
                            <h1>Dashboard <span>Analytics</span></h1>
                            <p>Métricas operacionais e funil de conversão em tempo real.</p>
                        </div>

                        <div className="user-avatar">U</div>
                    </header>

                    {error && <div className="dashboard-error">{error}</div>}

                    {/* Cards de Métricas Estilo Glass */}
                    <section className="stats-grid">
                        <div className="stat-card-glass">
                            <div className="stat-icon blue">
                                <Users size={22} />
                            </div>
                            <div>
                                <p>Total de Leads</p>
                                <strong>{totalLeads}</strong>
                            </div>
                        </div>

                        <div className="stat-card-glass">
                            <div className="stat-icon cyan">
                                <UserPlus size={22} />
                            </div>
                            <div>
                                <p>Novos</p>
                                <strong>{newLeads}</strong>
                            </div>
                        </div>

                        <div className="stat-card-glass">
                            <div className="stat-icon orange">
                                <PhoneCall size={22} />
                            </div>
                            <div>
                                <p>Contactados</p>
                                <strong>{contactedLeads}</strong>
                            </div>
                        </div>

                        <div className="stat-card-glass">
                            <div className="stat-icon green">
                                <CheckCircle2 size={22} />
                            </div>
                            <div>
                                <p>Convertidos</p>
                                <strong>{convertedLeads}</strong>
                            </div>
                        </div>
                    </section>

                    {/* Gráfico Temporal Interativo Glass */}
                    <section className="panel-card-glass">
                        <div className="panel-card-header">
                            <div>
                                <h3>Evolução do Pipeline</h3>
                                <p>Cadastrados, Contactados e Convertidos por período</p>
                            </div>

                            <div className="range-selector">
                                {["dia", "semana", "mes"].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={timeRange === range ? "active" : ""}
                                    >
                                        {range === "dia" ? "Dia" : range === "semana" ? "Semana" : "Mês"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: "260px", width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={getTimeSeriesData()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="periodo" stroke="#64748b" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(10, 20, 38, 0.92)",
                                            borderColor: "rgba(56, 189, 248, 0.3)",
                                            borderRadius: "10px",
                                            color: "#fff"
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                                    <Line type="monotone" dataKey="total" name="Total" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: "#38bdf8" }} />
                                    <Line type="monotone" dataKey="contactados" name="Contactados" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} />
                                    <Line type="monotone" dataKey="convertidos" name="Convertidos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Gráfico de Origem Glass */}
                    <section className="panel-card-glass">
                        <div className="panel-card-header">
                            <div>
                                <h3>Canais de Aquisição</h3>
                                <p>Volume de captação por ponto de contato</p>
                            </div>
                        </div>
                        <div style={{ height: "200px", width: "100%" }}>
                            {sourceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sourceData}>
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                            contentStyle={{
                                                background: "rgba(10, 20, 38, 0.92)",
                                                borderColor: "rgba(56, 189, 248, 0.3)",
                                                borderRadius: "10px",
                                                color: "#fff"
                                            }}
                                        />
                                        <Bar dataKey="quantidade" fill="#0284c7" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="empty-chart">Sem dados de leads cadastrados.</p>
                            )}
                        </div>
                    </section>

                    {/* Tabela de Leads Recentes Glass */}
                    <section className="panel-card-glass leads-table-panel">
                        <div className="panel-card-header">
                            <div>
                                <h3>Leads Recentes</h3>
                                <p>Últimos registros adicionados ao banco de dados</p>
                            </div>

                            <button className="view-all-btn" onClick={() => navigate("/leads")}>
                                Ver todos <ArrowRight size={14} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="empty-state">Carregando métricas...</div>
                        ) : leadList.length === 0 ? (
                            <div className="empty-state">Nenhum lead cadastrado no momento.</div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Empresa</th>
                                            <th>Origem</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leadList.slice(0, 5).map((lead) => (
                                            <tr key={lead.id}>
                                                <td><strong>{lead.name}</strong></td>
                                                <td>{lead.email}</td>
                                                <td>{lead.company || "-"}</td>
                                                <td>{lead.source || "-"}</td>
                                                <td>
                                                    <span className={`status-badge status-${lead.status}`}>
                                                        {getStatusLabel(lead.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;