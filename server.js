require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// CONFIGURAÇÃO EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(cors({ 
  origin: ['https://pokecreche-production.up.railway.app', 'http://localhost:3000'],
  credentials: true 
}));
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'pokecreche_secret';

// ===== CONFIGURAÇÃO DO BANCO - RAILWAY COMPATIBLE =====
function getDbConfig() {
  // Railway fornece DATABASE_URL no formato: mysql://user:pass@host:port/db
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      port: url.port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+00:00'
    };
  }

  // Fallback para variáveis individuais
  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'pokecreche',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+00:00'
  };
}

let pool = null;

function getPool() {
  if (!pool) {
    const dbConfig = getDbConfig();
    console.log('🔧 Configuração do banco:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Função para criar tabelas
async function ensureTables() {
  const createAlunos = `
  CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    matricula VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  const createDocentes = `
  CREATE TABLE IF NOT EXISTS docentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    identificador VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  const createEvents = `
  CREATE TABLE IF NOT EXISTS calendario_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT UNSIGNED NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    color ENUM('green','red','none') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY ux_teacher_date (teacher_id, date)
  );`;

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    await conn.query(createAlunos);
    await conn.query(createDocentes);
    await conn.query(createEvents);
    console.log('✅ Tabelas verificadas/criadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Middleware para garantir tabelas
async function ensureTablesMiddleware(req, res, next) {
  try {
    await ensureTables();
    next();
  } catch (err) {
    console.error('❌ Erro ao verificar tabelas:', err);
    return res.status(500).json({ success: false, message: 'Erro ao conectar ao banco de dados' });
  }
}

// ===== ROTAS =====
app.get('/', (req, res) => {
  const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: baseUrl
  });
});

app.get('/alunos', (req, res) => {
  const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: baseUrl
  });
});

app.get('/docentes', (req, res) => {
  const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  res.render('pages/docentes', {
    title: 'Cadastro do Docente - PokeCreche',
    currentPage: 'docentes',
    baseUrl: baseUrl
  });
});

// Health Check (importante para Railway)
app.get('/api/health', async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      platform: 'railway',
      url: process.env.RAILWAY_STATIC_URL
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// ===== SUAS APIS =====

// Registro aluno
app.post('/register/aluno', ensureTablesMiddleware, async (req, res) => {
  const { nome, cpf, matricula } = req.body || {};
  if (!nome || !cpf || !matricula) {
    return res.status(400).json({ message: 'Campos nome, cpf e matricula são obrigatórios' });
  }

  const cpfClean = cpf.replace(/\D+/g, '');
  const matriculaStr = String(matricula).trim();

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [existing] = await conn.query('SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1', [matriculaStr, cpfClean]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Aluno já cadastrado', existing: existing[0] });
    }
    const [result] = await conn.query('INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)', [nome, cpfClean, matriculaStr]);
    return res.status(201).json({ message: 'Aluno cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('❌ Erro ao cadastrar aluno:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno', error: err.message });
  } finally {
    conn.release();
  }
});

// Registro docente
app.post('/register/docente', ensureTablesMiddleware, async (req, res) => {
  const { nome, identificador, senha } = req.body || {};
  if (!nome || !identificador || !senha) {
    return res.status(400).json({ message: 'Campos nome, identificador e senha são obrigatórios' });
  }

  const hashed = await bcrypt.hash(senha, 10);
  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [result] = await conn.query('INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)', [nome, identificador, hashed]);
    return res.status(201).json({ message: 'Docente cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('❌ Erro ao cadastrar docente:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar docente', error: err.message });
  } finally {
    conn.release();
  }
});

// Login aluno
app.post('/login/aluno', ensureTablesMiddleware, async (req, res) => {
  const { matricula, cpf } = req.body || {};
  if (!matricula || !cpf) {
    return res.status(400).json({ success: false, message: 'Matrícula e CPF são obrigatórios' });
  }

  const matriculaStr = String(matricula).trim();
  const cpfClean = cpf.replace(/\D+/g, '');

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM alunos WHERE matricula = ? AND cpf = ?', [matriculaStr, cpfClean]);
    if (rows.length > 0) {
      const aluno = rows[0];
      const token = jwt.sign({ 
        id: aluno.id, 
        type: 'aluno', 
        matricula: aluno.matricula 
      }, JWT_SECRET, { expiresIn: '8h' });
      
      return res.json({ 
        success: true, 
        message: 'Login realizado', 
        token, 
        user: { 
          id: aluno.id, 
          nome: aluno.nome, 
          matricula: aluno.matricula, 
          cpf: aluno.cpf 
        } 
      });
    }
    return res.status(401).json({ success: false, message: 'Matrícula ou CPF inválidos' });
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err);
    return res.status(500).json({ success: false, message: 'Erro ao fazer login', error: err.message });
  } finally {
    conn.release();
  }
});

// Login docente
app.post('/login/docente', ensureTablesMiddleware, async (req, res) => {
  const { identificador, senha } = req.body || {};

  if (!identificador || !senha) {
    return res.status(400).json({ success: false, message: 'Identificador e senha são obrigatórios' });
  }

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM docentes WHERE identificador = ?', [identificador]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Identificador ou senha inválidos' });
    }

    const docente = rows[0];
    const senhaValida = await bcrypt.compare(senha, docente.senha);
    if (!senhaValida) {
      return res.status(401).json({ success: false, message: 'Identificador ou senha inválidos' });
    }

    const token = jwt.sign({ 
      id: docente.id, 
      identificador: docente.identificador, 
      type: 'docente' 
    }, JWT_SECRET, { expiresIn: '8h' });
    
    return res.json({ 
      success: true, 
      message: 'Login realizado', 
      token, 
      user: { 
        id: docente.id, 
        nome: docente.nome, 
        identificador: docente.identificador 
      } 
    });
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err);
    return res.status(500).json({ success: false, message: 'Erro ao fazer login', error: err.message });
  } finally {
    conn.release();
  }
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 PokeCreche rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚇 Platform: Railway`);
  
  try {
    await ensureTables();
    console.log('✅ Banco de dados conectado e tabelas verificadas');
  } catch (err) {
    console.error('❌ Erro no banco de dados:', err.message);
  }
});

module.exports = app;