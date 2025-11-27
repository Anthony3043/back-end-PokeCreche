-- PokeCreche Database Schema para MySQL
-- Execute este script no seu MySQL local

-- Criar banco se não existir
CREATE DATABASE IF NOT EXISTS pokecreche;
USE pokecreche;

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    cpf VARCHAR(20) UNIQUE NOT NULL,
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
    identificador VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Turmas
CREATE TABLE IF NOT EXISTS turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    ano VARCHAR(10) NOT NULL,
    foto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Registros Diários
CREATE TABLE IF NOT EXISTS registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    turma_id INT NOT NULL,
    data DATE NOT NULL,
    alimentacao VARCHAR(50),
    comportamento VARCHAR(50),
    presenca VARCHAR(50) DEFAULT 'Presente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_aluno_data (aluno_id, data)
);

-- Índices para melhor performance
CREATE INDEX idx_alunos_matricula ON alunos(matricula);
CREATE INDEX idx_alunos_cpf ON alunos(cpf);
CREATE INDEX idx_docentes_identificador ON docentes(identificador);
CREATE INDEX idx_registros_aluno ON registros(aluno_id);
CREATE INDEX idx_registros_data ON registros(data);
CREATE INDEX idx_alunos_turma ON alunos(turma_id);

-- Inserir dados de exemplo (opcional)
INSERT IGNORE INTO docentes (nome, identificador, senha) VALUES 
('Professor Admin', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT IGNORE INTO turmas (nome, ano) VALUES 
('Turma A', '2024'),
('Turma B', '2024'),
('Turma C', '2024');