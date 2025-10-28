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
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'pokecreche_secret';

// ===== CONFIGURAÇÃO DO BANCO =====
function getDbConfig() {
  // Railway fornece DATABASE_URL automaticamente
  if (process.env.DATABASE_URL) {
    console.log('✅ Usando DATABASE_URL do Railway');
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

  // Desenvolvimento local
  console.log('⚠️  Usando configuração local');
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'q1w2e3',
    database: process.env.DB_NAME || 'pokecreche',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+00:00'
  };
}

let pool = null;

function getPool() {
  if (!pool) {
    const dbConfig = getDbConfig();
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Criar tabelas se não existirem
async function ensureTables() {
  console.log('🔧 Verificando tabelas...');
  
  const createAlunos = `
    CREATE TABLE IF NOT EXISTS alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(20) NOT NULL UNIQUE,
      matricula VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  const createDocentes = `
    CREATE TABLE IF NOT EXISTS docentes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      identificador VARCHAR(100) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  
  try {
    await conn.query(createAlunos);
    await conn.query(createDocentes);
    console.log('✅ Tabelas verificadas/criadas');
  } catch (error) {
    console.error('❌ Erro nas tabelas:', error.message);
  } finally {
    conn.release();
  }
}

// ===== ROTAS PRINCIPAIS =====

// Página inicial
app.get('/', async (req, res) => {
  try {
    await ensureTables();
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    res.render('pages/alunos', {
      title: 'Cadastro do Aluno - PokeCreche',
      currentPage: 'alunos',
      baseUrl: baseUrl
    });
  } catch (error) {
    res.status(500).send('Erro ao carregar página');
  }
});

app.get('/alunos', async (req, res) => {
  try {
    await ensureTables();
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    res.render('pages/alunos', {
      title: 'Cadastro do Aluno - PokeCreche',
      currentPage: 'alunos',
      baseUrl: baseUrl
    });
  } catch (error) {
    res.status(500).send('Erro ao carregar página');
  }
});

app.get('/docentes', async (req, res) => {
  try {
    await ensureTables();
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    res.render('pages/docentes', {
      title: 'Cadastro do Docente - PokeCreche',
      currentPage: 'docentes',
      baseUrl: baseUrl
    });
  } catch (error) {
    res.status(500).send('Erro ao carregar página');
  }
});

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    
    res.json({ 
      status: 'healthy', 
      message: '🚀 PokeCreche Online!',
      environment: process.env.NODE_ENV || 'development',
      platform: 'railway'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: 'Banco de dados não conectado',
      message: 'Adicione um banco MySQL no Railway'
    });
  }
});

// Cadastro de Aluno
app.post('/register/aluno', async (req, res) => {
  const { nome, cpf, matricula } = req.body || {};
  
  if (!nome || !cpf || !matricula) {
    return res.status(400).json({ message: 'Campos nome, cpf e matricula são obrigatórios' });
  }

  try {
    const cpfClean = cpf.replace(/\D+/g, '');
    const matriculaStr = String(matricula).trim();

    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    
    // Verificar se já existe
    const [existing] = await conn.query('SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1', [matriculaStr, cpfClean]);
    
    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ message: 'Aluno já cadastrado' });
    }

    // Inserir novo aluno
    const [result] = await conn.query('INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)', [nome, cpfClean, matriculaStr]);
    conn.release();
    
    return res.status(201).json({ 
      message: '🎉 Aluno cadastrado com sucesso!', 
      id: result.insertId 
    });
    
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno. Verifique se o banco está configurado.' });
  }
});

// Cadastro de Docente
app.post('/register/docente', async (req, res) => {
  const { nome, identificador, senha } = req.body || {};
  
  if (!nome || !identificador || !senha) {
    return res.status(400).json({ message: 'Campos nome, identificador e senha são obrigatórios' });
  }

  try {
    const hashed = await bcrypt.hash(senha, 10);

    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    
    // Verificar se já existe
    const [existing] = await conn.query('SELECT id FROM docentes WHERE identificador = ? LIMIT 1', [identificador]);
    
    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ message: 'Docente já cadastrado' });
    }

    // Inserir novo docente
    const [result] = await conn.query('INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)', [nome, identificador, hashed]);
    conn.release();
    
    return res.status(201).json({ 
      message: '🎉 Docente cadastrado com sucesso!', 
      id: result.insertId 
    });
    
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar docente. Verifique se o banco está configurado.' });
  }
});

// Rota para verificar configuração
app.get('/api/config', (req, res) => {
  const config = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    environment: process.env.NODE_ENV,
    railwayUrl: process.env.RAILWAY_STATIC_URL,
    port: process.env.PORT
  };
  res.json(config);
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ===== POKECRECHE INICIANDO =====');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚇 Platform: Railway`);
  console.log(`💡 Dica: Adicione um banco MySQL no Railway para funcionar completamente`);
});

module.exports = app;