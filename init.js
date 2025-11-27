const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDatabase() {
  console.log('🔧 Inicializando banco de dados...');
  
  // Verificar se as variáveis estão configuradas
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'q1w2e3',
    port: process.env.DB_PORT || 3306
  };
  
  console.log(`📍 Tentando conectar em: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 Usuário: ${dbConfig.user}`);
  
  try {
    // Conectar sem especificar database para criar se necessário
    const connection = await mysql.createConnection(dbConfig);

    // Criar database se não existir
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'pokecreche'}`);
    console.log('✅ Database criado/verificado');

    // Usar o database
    await connection.query(`USE ${process.env.DB_NAME || 'pokecreche'}`);

    // Criar tabelas
    const tables = [
      `CREATE TABLE IF NOT EXISTS alunos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        matricula VARCHAR(50) UNIQUE NOT NULL,
        cpf VARCHAR(20) UNIQUE NOT NULL,
        data_nascimento DATE,
        avatar TEXT,
        turma_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS docentes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        identificador VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS turmas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        ano VARCHAR(10) NOT NULL,
        foto TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS registros (
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
      )`
    ];

    for (const table of tables) {
      await connection.query(table);
    }
    console.log('✅ Tabelas criadas/verificadas');

    // Criar índices
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(matricula)',
      'CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON alunos(cpf)',
      'CREATE INDEX IF NOT EXISTS idx_docentes_identificador ON docentes(identificador)',
      'CREATE INDEX IF NOT EXISTS idx_registros_aluno ON registros(aluno_id)',
      'CREATE INDEX IF NOT EXISTS idx_registros_data ON registros(data)',
      'CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma_id)'
    ];

    for (const index of indexes) {
      try {
        await connection.query(index);
      } catch (err) {
        // Ignorar se índice já existir
      }
    }
    console.log('✅ Índices criados/verificados');

    // Inserir dados de exemplo
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await connection.query(
        'INSERT IGNORE INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)',
        ['Professor Admin', 'admin', hashedPassword]
      );
      console.log('✅ Usuário admin criado (login: admin, senha: admin123)');
    } catch (err) {
      console.log('ℹ️  Usuário admin já existe');
    }

    try {
      const turmas = [
        ['Turma A', '2024'],
        ['Turma B', '2024'],
        ['Turma C', '2024']
      ];

      for (const [nome, ano] of turmas) {
        await connection.query(
          'INSERT IGNORE INTO turmas (nome, ano) VALUES (?, ?)',
          [nome, ano]
        );
      }
      console.log('✅ Turmas de exemplo criadas');
    } catch (err) {
      console.log('ℹ️  Turmas já existem');
    }

    await connection.end();
    console.log('🎉 Inicialização concluída com sucesso!');
    console.log('📍 Acesse: http://localhost:3000');
    console.log('🔑 Login: admin | Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error.message);
    console.log('\n💡 Dicas para resolver:');
    console.log('1. Verifique se o MySQL está instalado e rodando');
    console.log('2. Confirme as credenciais no arquivo .env');
    console.log('3. Teste a conexão: mysql -u root -p');
    console.log('4. Se necessário, instale o MySQL: https://dev.mysql.com/downloads/');
    console.log('\n⚠️  O sistema funcionará sem banco local, mas precisará de um banco em produção.');
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };