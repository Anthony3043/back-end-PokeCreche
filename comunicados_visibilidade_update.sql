-- Atualização do schema para controle de visibilidade de comunicados

-- Adicionar campos para controle de visibilidade na tabela comunicados
ALTER TABLE comunicados 
ADD COLUMN IF NOT EXISTS tipo_destinatario ENUM('geral', 'individual', 'grupo') DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS visibilidade ENUM('publico', 'privado') DEFAULT 'publico',
ADD COLUMN IF NOT EXISTS data_evento DATE NULL;

-- Criar tabela para controle de visibilidade individual
CREATE TABLE IF NOT EXISTS comunicado_visibilidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comunicado_id INT NOT NULL,
    user_type ENUM('aluno', 'docente') NOT NULL,
    user_id INT NOT NULL,
    pode_visualizar BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comunicado_id) REFERENCES comunicados(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comunicado_user (comunicado_id, user_type, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_visibilidade_comunicado ON comunicado_visibilidade(comunicado_id);
CREATE INDEX IF NOT EXISTS idx_visibilidade_user ON comunicado_visibilidade(user_type, user_id);