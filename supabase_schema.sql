-- PokeCreche Database Schema para Supabase (PostgreSQL)
-- Execute este script no SQL Editor do Supabase

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS alunos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE,
    avatar TEXT,
    turma_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Docentes
CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    identificador VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Turmas
CREATE TABLE IF NOT EXISTS turmas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ano INTEGER,
    foto TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Alunos por Turma (relacionamento N:N)
CREATE TABLE IF NOT EXISTS turma_alunos (
    id SERIAL PRIMARY KEY,
    turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(turma_id, aluno_id)
);

-- Tabela de Eventos do Calendário
CREATE TABLE IF NOT EXISTS calendario_events (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES docentes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(teacher_id, date)
);

-- Tabela de Comunicados
CREATE TABLE IF NOT EXISTS comunicados (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    destinatarios TEXT NOT NULL,
    cc TEXT,
    bcc TEXT,
    icon VARCHAR(10) DEFAULT '📝',
    tipo VARCHAR(20) DEFAULT 'default',
    data_evento DATE,
    visibilidade VARCHAR(20) DEFAULT 'publico',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Destinatários de Comunicados
CREATE TABLE IF NOT EXISTS comunicado_destinatarios (
    id SERIAL PRIMARY KEY,
    comunicado_id INTEGER NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    destinatario_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Visibilidade de Comunicados
CREATE TABLE IF NOT EXISTS comunicado_visibilidade (
    id SERIAL PRIMARY KEY,
    comunicado_id INTEGER NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL,
    user_id INTEGER NOT NULL,
    pode_visualizar BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(comunicado_id, user_type, user_id)
);

-- Tabela de Rascunhos
CREATE TABLE IF NOT EXISTS rascunhos (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    title VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    destinatarios TEXT,
    cc TEXT,
    bcc TEXT,
    icon VARCHAR(10) DEFAULT '📝',
    saved_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Registros Diários dos Alunos
CREATE TABLE IF NOT EXISTS registros_alunos (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    alimentacao VARCHAR(20),
    comportamento VARCHAR(20),
    presenca VARCHAR(20) DEFAULT 'Presente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(aluno_id, data)
);

-- Tabela de Termos Aceitos
CREATE TABLE IF NOT EXISTS termos_aceitos (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL,
    user_id INTEGER NOT NULL,
    aceito BOOLEAN DEFAULT FALSE,
    data_aceite TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    UNIQUE(user_type, user_id)
);

-- Tabela de Sessões/Tokens
CREATE TABLE IF NOT EXISTS sessoes (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL,
    user_id INTEGER NOT NULL,
    token VARCHAR(500) NOT NULL,
    remember_me BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(matricula);
CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON alunos(cpf);
CREATE INDEX IF NOT EXISTS idx_docentes_identificador ON docentes(identificador);
CREATE INDEX IF NOT EXISTS idx_calendario_date ON calendario_events(date);
CREATE INDEX IF NOT EXISTS idx_calendario_teacher ON calendario_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_docente ON comunicados(docente_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_created ON comunicados(created_at);
CREATE INDEX IF NOT EXISTS idx_registros_aluno ON registros_alunos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_alunos(data);
CREATE INDEX IF NOT EXISTS idx_turma_alunos_turma ON turma_alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_alunos_aluno ON turma_alunos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_visibilidade_comunicado ON comunicado_visibilidade(comunicado_id);
CREATE INDEX IF NOT EXISTS idx_visibilidade_user ON comunicado_visibilidade(user_type, user_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docentes_updated_at BEFORE UPDATE ON docentes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendario_updated_at BEFORE UPDATE ON calendario_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comunicados_updated_at BEFORE UPDATE ON comunicados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rascunhos_updated_at BEFORE UPDATE ON rascunhos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registros_updated_at BEFORE UPDATE ON registros_alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessoes_updated_at BEFORE UPDATE ON sessoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - Recomendado para Supabase
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicado_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicado_visibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE rascunhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE termos_aceitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir todas operações para service_role)
CREATE POLICY "Enable all for service role" ON alunos FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON docentes FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON turmas FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON turma_alunos FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON calendario_events FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON comunicados FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON comunicado_destinatarios FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON comunicado_visibilidade FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON rascunhos FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON registros_alunos FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON termos_aceitos FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON sessoes FOR ALL USING (true);
