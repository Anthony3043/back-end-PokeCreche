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
  origin: ['https://back-end-poke-creche.vercel.app', 'http://localhost:3000'],
  credentials: true 
}));
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'pokecreche_secret';

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME,
      port: process.env.MYSQLPORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+00:00'
    });
  }
  return pool;
}

// ... (suas funções ensureTables, ensureTablesMiddleware permanecem iguais) ...

// ===== ROTAS RENDERIZADAS COM EJS =====
app.get('/', (req, res) => {
  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  });
});

app.get('/alunos', (req, res) => {
  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  });
});

app.get('/docentes', (req, res) => {
  res.render('pages/docentes', {
    title: 'Cadastro do Docente - PokeCreche',
    currentPage: 'docentes',
    baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  });
});

// Rota de health check (importante para Vercel)
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
      vercel: !!process.env.VERCEL,
      url: process.env.VERCEL_URL
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ... (suas APIs de register/aluno, register/docente permanecem iguais) ...

// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || 3000;

// Inicialização compatível com Vercel
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  // No Vercel, não chamamos app.listen()
  console.log('🚀 Configurado para Vercel - Ready for serverless functions');
  module.exports = app;
} else {
  // Desenvolvimento local
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 PokeCreche rodando em: http://localhost:${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    
    try {
      await ensureTables();
      console.log('✅ Banco de dados conectado e tabelas verificadas');
    } catch (err) {
      console.error('❌ Erro no banco de dados:', err.message);
    }
  });
}