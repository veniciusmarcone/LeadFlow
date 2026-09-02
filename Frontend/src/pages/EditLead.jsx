import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Users,
    LayoutDashboard,
    LogOut,
    ArrowLeft,
    Save,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import API_URL from "../services/api";
import "./EditLead.css";

function EditLead() {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "Site",
        status: "new"
    });

    const token = localStorage.getItem("token");

    // Efeito de ondas oceânicas interativas no Canvas
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

        const fetchLead = async () => {
            try {
                const response = await fetch(`${API_URL}/leads/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Erro ao carregar lead");

                const lead = data.lead || data;
                setFormData({
                    name: lead.name || "",
                    email: lead.email || "",
                    phone: lead.phone || "",
                    company: lead.company || "",
                    source: lead.source || "Site",
                    status: lead.status || "new"
                });
            } catch (err) {
                toast.error(err.message);
                navigate("/leads");
            } finally {
                setLoading(false);
            }
        };

        fetchLead();
    }, [id, navigate, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro ao atualizar lead");

            toast.success("Lead atualizado com sucesso!");
            navigate(`/leads/${id}`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="ocean-edit-wrapper">
            <canvas ref={canvasRef} className="ocean-canvas-bg" />
            <div className="ocean-vignette-overlay" />

            <div className="edit-content-layer">
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

                <main className="edit-main-panel">
                    <header className="edit-header">
                        <div>
                            <button className="back-link-btn" onClick={() => navigate("/leads")}>
                                <ArrowLeft size={16} />
                                Voltar para Leads
                            </button>
                            <h1>Editar <span>Lead</span></h1>
                            <p>Atualize as informações comerciais e o status no pipeline.</p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="panel-card-glass">
                            <p className="empty-state">Carregando dados do lead...</p>
                        </div>
                    ) : (
                        <div className="panel-card-glass form-card-glass">
                            <form onSubmit={handleSubmit} className="futuristic-edit-form">
                                <div className="form-group-glow">
                                    <label>Nome Completo</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group-glow">
                                    <label>E-mail Corporativo</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group-glow">
                                        <label>Telefone / WhatsApp</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group-glow">
                                        <label>Empresa</label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group-glow">
                                        <label>Canal de Origem</label>
                                        <select
                                            value={formData.source}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        >
                                            <option value="Site">Site</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Indicação">Indicação</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>

                                    <div className="form-group-glow">
                                        <label>Status do Lead</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="new">Novo</option>
                                            <option value="contacted">Contactado</option>
                                            <option value="converted">Convertido</option>
                                            <option value="lost">Perdido</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-actions-bar">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => navigate("/leads")}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="primary-glow-btn"
                                        disabled={saving}
                                    >
                                        <Save size={16} />
                                        <span>{saving ? "Salvando alterações..." : "Salvar Alterações"}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default EditLead;