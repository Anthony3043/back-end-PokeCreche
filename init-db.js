// Script para criar tabelas automaticamente no Railway
const mysql = require('mysql2/promise');

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não configurada');
    return;
  }

  try {
    const url = new URL(process.env.DATABASE_URL);
    const conn = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      port: url.port || 3306,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔧 Criando tabelas...');

    // Tabela de Alunos
    await conn.query(`CREATE TABLE IF NOT EXISTS alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      matricula VARCHAR(50) UNIQUE NOT NULL,
      cpf VARCHAR(14) UNIQUE NOT NULL,
      data_nascimento DATE,
      avatar TEXT,
      turma_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Docentes
    await conn.query(`CREATE TABLE IF NOT EXISTS docentes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      identificador VARCHAR(50) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Turmas
    await conn.query(`CREATE TABLE IF NOT EXISTS turmas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      ano INT,
      foto TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Eventos do Calendário
    await conn.query(`CREATE TABLE IF NOT EXISTS calendario_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NULL,
      date DATE NOT NULL,
      title VARCHAR(255) NOT NULL,
      color ENUM('red', 'blue', 'green', 'yellow', 'purple', 'orange') DEFAULT 'blue',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Comunicados
    await conn.query(`CREATE TABLE IF NOT EXISTS comunicados (
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
      data_evento DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Destinatários de Comunicados
    await conn.query(`CREATE TABLE IF NOT EXISTS comunicado_destinatarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comunicado_id INT NOT NULL,
      tipo ENUM('aluno', 'docente', 'geral') NOT NULL,
      destinatario_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela de Rascunhos
    await conn.query(`CREATE TABLE IF NOT EXISTS rascunhos (
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Registros Diários
    await conn.query(`CREATE TABLE IF NOT EXISTS registros_alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      aluno_id INT NOT NULL,
      turma_id INT NOT NULL,
      data DATE NOT NULL,
      alimentacao ENUM('Ótimo', 'Bom', 'Regular', 'Ruim'),
      comportamento ENUM('Ótimo', 'Bom', 'Regular', 'Ruim'),
      presenca ENUM('Presente', 'Ausente') DEFAULT 'Presente',
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Termos Aceitos
    await conn.query(`CREATE TABLE IF NOT EXISTS termos_aceitos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type ENUM('aluno', 'docente') NOT NULL,
      user_id INT NOT NULL,
      aceito BOOLEAN DEFAULT FALSE,
      data_aceite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      UNIQUE KEY unique_user_terms (user_type, user_id)
    )`);

    // Tabela de Sessões
    await conn.query(`CREATE TABLE IF NOT EXISTS sessoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type ENUM('aluno', 'docente') NOT NULL,
      user_id INT NOT NULL,
      token VARCHAR(500) NOT NULL,
      remember_me BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Tabela de Alunos por Turma
    await conn.query(`CREATE TABLE IF NOT EXISTS turma_alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      turma_id INT NOT NULL,
      aluno_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_turma_aluno (turma_id, aluno_id)
    )`);

    // Tabela de Registros (para compatibilidade)
    await conn.query(`CREATE TABLE IF NOT EXISTS registros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      aluno_id INT NOT NULL,
      turma_id INT NOT NULL,
      data DATE NOT NULL,
      alimentacao VARCHAR(50),
      comportamento VARCHAR(50),
      presenca VARCHAR(50),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await conn.end();
    console.log('✅ Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = initDatabase;
