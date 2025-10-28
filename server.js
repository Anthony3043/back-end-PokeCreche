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

// ===== CONFIGURAÇÃO DO BANCO - RAILWAY =====
function getDbConfig() {
  console.log('🔧 Iniciando configuração do banco...');
  
  // Railway fornece DATABASE_URL automaticamente
  if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL encontrada!');
    const url = new URL(process.env.DATABASE_URL);
    
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1), // Remove a barra inicial
      port: url.port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+00:00'
    };
    
    console.log('📊 Configuração do Railway:', {
      host: config.host,
      user: config.user,
      database: config.database,
      port: config.port
    });
    
    return config;
  }

  // Fallback para desenvolvimento local
  console.log('⚠️  DATABASE_URL não encontrada, usando configuração local');
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

// Função para criar tabelas
async function ensureTables() {
  console.log('🗂️ Verificando/criando tabelas...');
  
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

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  
  try {
    await conn.query(createAlunos);
    console.log('✅ Tabela "alunos" criada/verificada');
    
    await conn.query(createDocentes);
    console.log('✅ Tabela "docentes" criada/verificada');
    
    // Verificar dados existentes
    const [alunoCount] = await conn.query('SELECT COUNT(*) as count FROM alunos');
    const [docenteCount] = await conn.query('SELECT COUNT(*) as count FROM docentes');
    
    console.log(`📊 Alunos no banco: ${alunoCount[0].count}`);
    console.log(`👨‍🏫 Docentes no banco: ${docenteCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// ===== ROTAS =====
app.get('/', async (req, res) => {
  console.log('🌐 Acesso à página inicial');
  try {
    await ensureTables();
    
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    console.log(`📍 Base URL: ${baseUrl}`);

    res.render('pages/alunos', {
      title: 'Cadastro do Aluno - PokeCreche',
      currentPage: 'alunos',
      baseUrl: baseUrl
    });
    
  } catch (error) {
    console.error('❌ Erro ao renderizar página:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.get('/alunos', async (req, res) => {
  console.log('📝 Acesso à página de alunos');
  try {
    await ensureTables();
    
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;

    res.render('pages/alunos', {
      title: 'Cadastro do Aluno - PokeCreche',
      currentPage: 'alunos',
      baseUrl: baseUrl
    });
    
  } catch (error) {
    console.error('❌ Erro ao renderizar alunos:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.get('/docentes', async (req, res) => {
  console.log('👨‍🏫 Acesso à página de docentes');
  try {
    await ensureTables();
    
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;

    res.render('pages/docentes', {
      title: 'Cadastro do Docente - PokeCreche',
      currentPage: 'docentes',
      baseUrl: baseUrl
    });
    
  } catch (error) {
    console.error('❌ Erro ao renderizar docentes:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Health Check
app.get('/api/health', async (req, res) => {
  console.log('❤️  Health check solicitado');
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    
    const response = { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      platform: 'railway'
    };
    
    console.log('✅ Health check passou');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Health check falhou:', error.message);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      database: 'disconnected'
    });
  }
});

// Cadastro de Aluno
app.post('/register/aluno', async (req, res) => {
  console.log('📥 Cadastro de aluno solicitado');
  
  const { nome, cpf, matricula } = req.body || {};
  
  if (!nome || !cpf || !matricula) {
    return res.status(400).json({ message: 'Campos nome, cpf e matricula são obrigatórios' });
  }

  const cpfClean = cpf.replace(/\D+/g, '');
  const matriculaStr = String(matricula).trim();

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  
  try {
    await ensureTables();
    
    const [existing] = await conn.query('SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1', [matriculaStr, cpfClean]);
    
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Aluno já cadastrado' });
    }

    const [result] = await conn.query('INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)', [nome, cpfClean, matriculaStr]);
    
    console.log('✅ Aluno cadastrado com ID:', result.insertId);
    return res.status(201).json({ 
      message: 'Aluno cadastrado com sucesso!', 
      id: result.insertId 
    });
    
  } catch (err) {
    console.error('❌ Erro ao cadastrar aluno:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno', error: err.message });
  } finally {
    conn.release();
  }
});

// Cadastro de Docente
app.post('/register/docente', async (req, res) => {
  console.log('📥 Cadastro de docente solicitado');
  
  const { nome, identificador, senha } = req.body || {};
  
  if (!nome || !identificador || !senha) {
    return res.status(400).json({ message: 'Campos nome, identificador e senha são obrigatórios' });
  }

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  
  try {
    await ensureTables();
    
    const [existing] = await conn.query('SELECT id FROM docentes WHERE identificador = ? LIMIT 1', [identificador]);
    
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Docente já cadastrado' });
    }

    const hashed = await bcrypt.hash(senha, 10);
    const [result] = await conn.query('INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)', [nome, identificador, hashed]);
    
    console.log('✅ Docente cadastrado com ID:', result.insertId);
    return res.status(201).json({ 
      message: 'Docente cadastrado com sucesso!', 
      id: result.insertId 
    });
    
  } catch (err) {
    console.error('❌ Erro ao cadastrar docente:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar docente', error: err.message });
  } finally {
    conn.release();
  }
});

// Rota de debug para verificar DATABASE_URL (sem mostrar senha)
app.get('/api/debug-db', (req, res) => {
  const debugInfo = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrl: process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente',
    environment: process.env.NODE_ENV,
    railwayStaticUrl: process.env.RAILWAY_STATIC_URL,
    port: process.env.PORT
  };
  
  console.log('🐛 Debug DB:', debugInfo);
  res.json(debugInfo);
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log('🚀 ===== POKECRECHE INICIANDO =====');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚇 Platform: Railway`);
  
  try {
    await ensureTables();
    console.log('✅ Aplicação inicializada com sucesso!');
    
    // Log adicional para debug
    console.log('🔍 Variáveis de ambiente disponíveis:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
    console.log('- RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL || 'Não definida');
    
  } catch (err) {
    console.error('❌ Erro na inicialização:', err.message);
  }
});

module.exports = app;