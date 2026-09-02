import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Users,
    LayoutDashboard,
    LogOut,
    ArrowLeft,
    Edit,
    Clock,
    Mail,
    Phone,
    Building2,
    Globe,
    Sparkles,
    User
} from "lucide-react";
import { toast } from "sonner";
import API_URL from "../services/api";
import "./LeadDetails.css";

function LeadDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [lead, setLead] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    // Efeito das ondas oceânicas interativas no Canvas
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

    // Busca lead e histórico paralelamente
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchDetailsAndHistory = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };

                const [leadRes, historyRes] = await Promise.all([
                    fetch(`${API_URL}/leads/${id}`, { headers }),
                    fetch(`${API_URL}/leads/${id}/history`, { headers })
                ]);

                const leadData = await leadRes.json();
                const historyData = await historyRes.json();

                if (!leadRes.ok) throw new Error(leadData.error || "Erro ao carregar detalhes");

                setLead(leadData);
                setHistory(Array.isArray(historyData) ? historyData : []);
            } catch (err) {
                toast.error(err.message);
                navigate("/leads");
            } finally {
                setLoading(false);
            }
        };

        fetchDetailsAndHistory();
    }, [id, navigate, token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
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
        <div className="ocean-details-wrapper">
            <canvas ref={canvasRef} className="ocean-canvas-bg" />
            <div className="ocean-vignette-overlay" />

            <div className="details-content-layer">
                <aside className="sidebar-glass">
                    <div className="sidebar-logo">
                        <div className="logo-mark">
                            <Sparkles size={18} />
                        </div>
                        <span>LeadFlow <em>Core</em></span>
                    </div>

                    <nav className="sidebar-nav">
                        <button className="nav-item" onClick={() => navigate("/dashboard")}>
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>

                        <button className="nav-item active" onClick={() => navigate("/leads")}>
                            <Users size={18} />
                            Leads
                        </button>
                    </nav>

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sair
                    </button>
                </aside>

                <main className="details-main-panel">
                    <header className="details-header">
                        <div>
                            <button className="back-link-btn" onClick={() => navigate("/leads")}>
                                <ArrowLeft size={16} />
                                Voltar para Leads
                            </button>
                            <h1>Detalhes do <span>Lead</span></h1>
                            <p>Registro cadastral e linha do tempo de interações</p>
                        </div>

                        {lead && (
                            <button
                                className="primary-glow-btn"
                                onClick={() => navigate(`/leads/${lead.id}/edit`)}
                            >
                                <Edit size={16} />
                                Editar Lead
                            </button>
                        )}
                    </header>

                    {loading ? (
                        <div className="panel-card-glass">
                            <p className="empty-state">Carregando informações...</p>
                        </div>
                    ) : lead ? (
                        <div className="details-grid-layout">
                            {/* Card de Informações Cadastrais */}
                            <div className="panel-card-glass lead-info-box">
                                <div className="info-header">
                                    <div>
                                        <h2>{lead.name}</h2>
                                        <span className={`status-badge status-${lead.status}`}>
                                            {getStatusLabel(lead.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-list">
                                    <div className="info-item">
                                        <Mail size={16} />
                                        <div>
                                            <small>E-mail</small>
                                            <strong>{lead.email}</strong>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <Phone size={16} />
                                        <div>
                                            <small>Telefone</small>
                                            <strong>{lead.phone || "-"}</strong>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <Building2 size={16} />
                                        <div>
                                            <small>Empresa</small>
                                            <strong>{lead.company || "-"}</strong>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <Globe size={16} />
                                        <div>
                                            <small>Origem</small>
                                            <strong>{lead.source || "-"}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Linha do Tempo do Histórico de Auditoria */}
                            <div className="panel-card-glass timeline-box">
                                <h3>
                                    <Clock size={18} />
                                    Histórico de Auditoria
                                </h3>

                                {history.length === 0 ? (
                                    <p className="empty-state">Nenhum evento registrado até o momento.</p>
                                ) : (
                                    <div className="timeline-flow">
                                        {history.map((item) => (
                                            <div key={item.id} className="timeline-node">
                                                <div className="node-bullet" />
                                                <div className="node-content">
                                                    <p className="node-action">
                                                        {item.description || item.action || "Ação no Lead"}
                                                    </p>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                                                        <span className="node-date">
                                                            {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}
                                                        </span>
                                                        {item.user_name && (
                                                            <span style={{ fontSize: "11px", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                                <User size={11} /> {item.user_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="panel-card-glass">
                            <p className="empty-state">Lead não encontrado.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default LeadDetails;