-- TABELA DE USUÁRIOS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE LEADS
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30),
    company VARCHAR(150),
    source VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    notes TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE HISTÓRICO DE AÇÕES DO LEAD
CREATE TABLE lead_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA MELHORAR PERFORMANCE DAS CONSULTAS
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_lead_history_lead_id ON lead_history(lead_id);

-- Senha padrão com hash bcrypt: 'admin123'
INSERT INTO users (name, email, password, role) 
VALUES ('Administrador', 'admin@leadflow.com', '$2b$10$w0s6h5tV0vQW5Xg1tJ5Ie.K0D5I7h9e6bT9E0X2g4y1t3b7N2o1eO', 'admin')
ON CONFLICT (email) DO NOTHING;