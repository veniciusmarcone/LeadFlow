import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    LayoutDashboard,
    LogOut,
    Search,
    Plus,
    Download,
    Eye,
    Edit,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import API_URL from "../services/api";
import "./Leads.css";

function Leads() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Formulário de novo lead
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "Site",
        status: "new"
    });

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

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${API_URL}/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro ao buscar leads");
            setLeads(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            toast.error(error.message);
            if (error.message.includes("Token") || error.message.includes("inválido")) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchLeads();
    }, [navigate, token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/leads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro ao criar lead");

            toast.success("Lead cadastrado com sucesso!");
            setIsModalOpen(false);
            setFormData({
                name: "",
                email: "",
                phone: "",
                company: "",
                source: "Site",
                status: "new"
            });
            fetchLeads();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleExportCSV = () => {
        if (!filteredLeads.length) {
            toast.error("Não há leads para exportar.");
            return;
        }

        const headers = ["ID", "Nome", "Email", "Telefone", "Empresa", "Origem", "Status", "Criado Em"];
        const rows = filteredLeads.map((l) => [
            l.id,
            `"${l.name || ""}"`,
            `"${l.email || ""}"`,
            `"${l.phone || ""}"`,
            `"${l.company || ""}"`,
            `"${l.source || ""}"`,
            `"${l.status || ""}"`,
            `"${l.created_at || ""}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório CSV gerado com sucesso!");
    };

    const leadList = Array.isArray(leads) ? leads : [];

    const filteredLeads = leadList.filter((lead) => {
        const matchesSearch =
            lead.name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.email?.toLowerCase().includes(search.toLowerCase()) ||
            lead.company?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

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
        <div className="ocean-leads-wrapper">
            <canvas ref={canvasRef} className="ocean-canvas-bg" />
            <div className="ocean-vignette-overlay" />

            <div className="leads-content-layer">
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

                        <button className="nav-item active">
                            <Users size={18} />
                            Leads
                        </button>
                    </nav>

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sair
                    </button>
                </aside>

                <main className="leads-main-panel">
                    <header className="leads-header">
                        <div>
                            <h1>Gestão de <span>Leads</span></h1>
                            <p>Filtre, exporte e gerencie todos os clientes em potencial.</p>
                        </div>

                        <div className="header-actions">
                            <button className="export-btn" onClick={handleExportCSV}>
                                <Download size={16} />
                                Exportar CSV
                            </button>
                            <button className="primary-glow-btn" onClick={() => setIsModalOpen(true)}>
                                <Plus size={16} />
                                Novo Lead
                            </button>
                        </div>
                    </header>

                    {/* Barra de Filtros e Busca Glass */}
                    <div className="filters-card-glass">
                        <div className="search-field">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou empresa..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="status-select-wrapper">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos os status</option>
                                <option value="new">Novos</option>
                                <option value="contacted">Contactados</option>
                                <option value="converted">Convertidos</option>
                                <option value="lost">Perdidos</option>
                            </select>
                        </div>
                    </div>

                    {/* Painel da Tabela Glass */}
                    <div className="panel-card-glass table-panel">
                        {loading ? (
                            <div className="empty-state">Carregando contatos...</div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="empty-state">Nenhum lead encontrado com estes filtros.</div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Telefone</th>
                                            <th>Empresa</th>
                                            <th>Origem</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: "right" }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td><strong>{lead.name}</strong></td>
                                                <td>{lead.email}</td>
                                                <td>{lead.phone || "-"}</td>
                                                <td>{lead.company || "-"}</td>
                                                <td>{lead.source || "-"}</td>
                                                <td>
                                                    <span className={`status-badge status-${lead.status}`}>
                                                        {getStatusLabel(lead.status)}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="row-actions">
                                                        <button
                                                            className="action-icon-btn"
                                                            title="Ver detalhes"
                                                            onClick={() => navigate(`/leads/${lead.id}`)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            className="action-icon-btn"
                                                            title="Editar"
                                                            onClick={() => navigate(`/leads/${lead.id}/edit`)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal Glassmorphism de Cadastro */}
            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-glass">
                        <div className="modal-header">
                            <h3>Cadastrar Novo Lead</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreateLead} className="modal-form">
                            <div className="form-group">
                                <label>Nome Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Ana Silva"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>E-mail *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="ana@empresa.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input
                                        type="text"
                                        placeholder="(11) 99999-9999"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Empresa</label>
                                    <input
                                        type="text"
                                        placeholder="Nome da Empresa"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
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

                                <div className="form-group">
                                    <label>Status Inicial</label>
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

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="primary-glow-btn">
                                    Salvar Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Leads;