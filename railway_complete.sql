-- CrecheApp - Schema Completo para Railway
-- Execute este script no Railway Query

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE,
    avatar TEXT,
    turma_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Docentes
CREATE TABLE IF NOT EXISTS docentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    identificador VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Turmas
CREATE TABLE IF NOT EXISTS turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ano INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Alunos por Turma
CREATE TABLE IF NOT EXISTS turma_alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT NOT NULL,
    aluno_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_turma_aluno (turma_id, aluno_id)
);

-- Tabela de Eventos do Calendário
CREATE TABLE IF NOT EXISTS calendario_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    color ENUM('red', 'blue', 'green', 'yellow', 'purple', 'orange') DEFAULT 'blue',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES docentes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_date (teacher_id, date)
);

-- Tabela de Comunicados
CREATE TABLE IF NOT EXISTS comunicados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    destinatarios TEXT NOT NULL,
    cc TEXT,
    bcc TEXT,
    icon VARCHAR(10) DEFAULT '📝',
    tipo ENUM('default', 'urgent', 'info') DEFAULT 'default',
    data DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);

-- Tabela de Destinatários de Comunicados
CREATE TABLE IF NOT EXISTS comunicado_destinatarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comunicado_id INT NOT NULL,
    tipo ENUM('aluno', 'docente', 'geral') NOT NULL,
    destinatario_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comunicado_id) REFERENCES comunicados(id) ON DELETE CASCADE
);

-- Tabela de Rascunhos
CREATE TABLE IF NOT EXISTS rascunhos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    title VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    destinatarios TEXT,
    cc TEXT,
    bcc TEXT,
    icon VARCHAR(10) DEFAULT '📝',
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);

-- Tabela de Registros Diários dos Alunos
CREATE TABLE IF NOT EXISTS registros_alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    turma_id INT NOT NULL,
    data DATE NOT NULL,
    alimentacao ENUM('Ótimo', 'Bom', 'Regular', 'Ruim'),
    comportamento ENUM('Ótimo', 'Bom', 'Regular', 'Ruim'),
    presenca ENUM('Presente', 'Ausente') DEFAULT 'Presente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_aluno_data (aluno_id, data)
);

-- Tabela de Termos Aceitos
CREATE TABLE IF NOT EXISTS termos_aceitos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('aluno', 'docente') NOT NULL,
    user_id INT NOT NULL,
    aceito BOOLEAN DEFAULT FALSE,
    data_aceite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    UNIQUE KEY unique_user_terms (user_type, user_id)
);

-- Tabela de Sessões/Tokens
CREATE TABLE IF NOT EXISTS sessoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('aluno', 'docente') NOT NULL,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    remember_me BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices
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
