import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetails from "./pages/LeadDetails";
import EditLead from "./pages/EditLead";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
    return (
        <BrowserRouter>
            {/* O Toaster fica aqui no topo */}
            <Toaster position="top-right" richColors closeButton duration={3000} />

            <Routes>
                {/* Rota pública */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Rotas protegidas */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/leads"
                        element={<Leads />}
                    />

                    <Route
                        path="/leads/:id"
                        element={<LeadDetails />}
                    />

                    <Route
                        path="/leads/:id/edit"
                        element={<EditLead />}
                    />
                </Route>

                {/* Qualquer rota desconhecida */}
                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;