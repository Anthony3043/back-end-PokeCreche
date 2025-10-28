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
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'pokecreche_secret';
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'q1w2e3',
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'pokecreche',
      port: process.env.MYSQLPORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+00:00'
    });
  }
  return pool;
}

// ... (suas funções ensureTables, authenticateJWT, etc. permanecem IGUAIS) ...

// ===== ROTAS RENDERIZADAS COM EJS =====
app.get('/', (req, res) => {
  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  });
});

app.get('/alunos', (req, res) => {
  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  });
});

app.get('/docentes', (req, res) => {
  res.render('pages/docentes', {
    title: 'Cadastro do Docente - PokeCreche',
    currentPage: 'docentes',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  });
});

app.get('/calendario', (req, res) => {
  res.render('pages/calendario', {
    title: 'Calendário - PokeCreche',
    currentPage: 'calendario',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  });
});

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== SUAS APIS EXISTENTES (PERMANECEM IGUAIS) =====
app.post('/register/aluno', ensureTablesMiddleware, async (req, res) => {
  // ... seu código atual ...
});

app.post('/register/docente', ensureTablesMiddleware, async (req, res) => {
  // ... seu código atual ...
});

app.post('/login/aluno', async (req, res) => {
  // ... seu código atual ...
});

app.post('/login/docente', async (req, res) => {
  // ... seu código atual ...
});

app.get('/api/events', async (req, res) => {
  // ... seu código atual ...
});

app.post('/api/events', authenticateJWT, async (req, res) => {
  // ... seu código atual ...
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 PokeCreche EJS rodando em: http://localhost:${PORT}`);
  console.log(`📁 Views: ${path.join(__dirname, 'views')}`);
  console.log(`📂 Public: ${path.join(__dirname, 'public')}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    await ensureTables();
    console.log('✅ Tabelas verificadas/criadas com sucesso');
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas:', err);
  }
});

module.exports = app;