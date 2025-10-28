require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuração SIMPLIFICADA do pool
function createPool() {
  return mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'pokecreche',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  });
}

let pool = null;

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

// ✅ HEALTH CHECK (CRÍTICO para Vercel)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 🎯 ROTAS HTML (SEMPRE funcionam)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'alunos.html'));
});

app.get('/alunos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'alunos.html'));
});

app.get('/docentes.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'docentes.html'));
});

// 🔧 MIDDLEWARE de conexão segura
async function withConnection(req, res, next) {
  try {
    req.db = getPool();
    next();
  } catch (error) {
    console.error('Erro na conexão:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro de conexão com o banco'
    });
  }
}

// 📋 ROTA DE CADASTRO DE ALUNOS
app.post('/register/aluno', withConnection, async (req, res) => {
  let connection;
  try {
    const { nome, cpf, matricula } = req.body;
    
    if (!nome || !cpf || !matricula) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    connection = await req.db.getConnection();
    
    // Verifica se já existe
    const [existing] = await connection.execute(
      'SELECT id FROM alunos WHERE cpf = ? OR matricula = ?',
      [cpf.replace(/\D/g, ''), matricula]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Aluno já cadastrado com este CPF ou matrícula' 
      });
    }

    // Insere novo aluno
    const [result] = await connection.execute(
      'INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)',
      [nome, cpf.replace(/\D/g, ''), matricula]
    );

    res.json({ 
      success: true, 
      message: 'Aluno cadastrado com sucesso',
      id: result.insertId 
    });

  } catch (error) {
    console.error('Erro ao cadastrar aluno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno no servidor'
    });
  } finally {
    if (connection) connection.release();
  }
});

// 🎓 ROTA DE CADASTRO DE DOCENTES
app.post('/register/docente', withConnection, async (req, res) => {
  let connection;
  try {
    const { nome, identificador, senha } = req.body;
    
    if (!nome || !identificador || !senha) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    connection = await req.db.getConnection();
    
    // Verifica se já existe
    const [existing] = await connection.execute(
      'SELECT id FROM docentes WHERE identificador = ?',
      [identificador]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Docente já cadastrado com este identificador' 
      });
    }

    // Criptografa senha e insere
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const [result] = await connection.execute(
      'INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)',
      [nome, identificador, hashedPassword]
    );

    res.json({ 
      success: true, 
      message: 'Docente cadastrado com sucesso',
      id: result.insertId 
    });

  } catch (error) {
    console.error('Erro ao cadastrar docente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno no servidor'
    });
  } finally {
    if (connection) connection.release();
  }
});

// 🔐 ROTA DE LOGIN SIMPLIFICADA
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Login simulado para teste
    if (email === 'admin@escola.com' && senha === '123456') {
      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token: 'token_temporario',
        user: { id: 1, nome: 'Administrador', email: email }
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Credenciais inválidas' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
});

// 📊 ROTAS DE LISTAGEM (SIMULADAS)
app.get('/api/alunos', async (req, res) => {
  try {
    // Dados simulados
    const alunos = [
      { id: 1, nome: "João Silva", cpf: "123.456.789-00", matricula: "2024001" },
      { id: 2, nome: "Maria Santos", cpf: "987.654.321-00", matricula: "2024002" }
    ];
    
    res.json({ success: true, data: alunos });
  } catch (error) {
    res.json({ success: false, data: [], message: 'Erro ao carregar alunos' });
  }
});

app.get('/api/docentes', async (req, res) => {
  try {
    // Dados simulados
    const docentes = [
      { id: 1, nome: "Prof. Carlos", identificador: "carlos123" },
      { id: 2, nome: "Prof. Ana", identificador: "ana456" }
    ];
    
    res.json({ success: true, data: docentes });
  } catch (error) {
    res.json({ success: false, data: [], message: 'Erro ao carregar docentes' });
  }
});

// 🚀 INICIALIZAÇÃO
const PORT = process.env.PORT || 3000;

// Para Vercel
module.exports = app;

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}