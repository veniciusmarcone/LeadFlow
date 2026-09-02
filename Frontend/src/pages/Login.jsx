import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, Waves } from "lucide-react";
import { toast } from "sonner";
import API_URL from "../services/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

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

        // Posição e inércia do cursor
        let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2, speed: 0 };
        let prevMouseX = width / 2;
        let prevMouseY = height / 2;

        const handleMouseMove = (e) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;

            // Calcula velocidade de deslocamento do mouse para intensificar as ondas
            const dist = Math.hypot(e.clientX - prevMouseX, e.clientY - prevMouseY);
            mouse.speed = Math.min(dist * 0.15, 8);
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
        };
        window.addEventListener("mousemove", handleMouseMove);

        let step = 0;
        const linesCount = 38; // Densidade de linhas de água

        const render = () => {
            step += 0.015;

            // Amortecimento suave da posição do mouse
            mouse.x += (mouse.targetX - mouse.x) * 0.08;
            mouse.y += (mouse.targetY - mouse.y) * 0.08;
            mouse.speed *= 0.94; // Decaimento da perturbação

            // Fundo escuro azul-abissal
            ctx.fillStyle = "#050b14";
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < linesCount; i++) {
                ctx.beginPath();
                const baseY = (height / (linesCount + 2)) * (i + 2);

                // Variação de cores oceânicas (azul marinho profundo para turquesa)
                const opacity = 0.12 + (i / linesCount) * 0.4;
                ctx.strokeStyle = i % 2 === 0
                    ? `rgba(14, 165, 233, ${opacity})`
                    : `rgba(37, 99, 235, ${opacity})`;
                ctx.lineWidth = 1.3;

                for (let x = 0; x <= width; x += 12) {
                    // Ondulação natural sutil de mar calmo
                    const calmWave = Math.sin(x * 0.004 + step + i * 0.25) * 6;

                    // Interação com o mouse: perturbação radial tipo onda na água
                    const distToMouse = Math.hypot(x - mouse.x, baseY - mouse.y);
                    const mouseRadius = 260;

                    let dynamicWave = 0;
                    if (distToMouse < mouseRadius) {
                        const force = (1 - distToMouse / mouseRadius);
                        // Cria oscilações circulares que expandem com o movimento
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Credenciais inválidas");
            }

            localStorage.setItem("token", data.token);
            toast.success("Acesso autorizado. Bem-vindo!");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.message || "Erro ao autenticar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ocean-login-wrapper">
            {/* Canvas Interativo de Ondas Marítimas */}
            <canvas ref={canvasRef} className="ocean-canvas" />

            {/* Vinheta escura nas bordas para profundidade */}
            <div className="ocean-vignette" />

            {/* Cartão de Login com Glassmorphism */}
            <div className="login-card-glass">
                <div className="brand-header">
                    <div className="brand-icon-box">
                        <Waves size={22} className="ocean-icon" />
                    </div>
                    <h2>LeadFlow <span>Core</span></h2>
                    <p>Entre com suas credenciais de operador comercial</p>
                </div>

                <form onSubmit={handleSubmit} className="futuristic-form">
                    <div className="input-group-glow">
                        <label>E-mail Corporativo</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="field-icon" />
                            <input
                                type="email"
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group-glow">
                        <label>Chave de Acesso</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="field-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="ocean-submit-btn" disabled={loading}>
                        <span>{loading ? "Autenticando..." : "Acessar Sistema"}</span>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="security-footer">
                    <ShieldCheck size={16} />
                    <span>Conexão criptografada ponta a ponta</span>
                </div>
            </div>
        </div>
    );
}

export default Login;