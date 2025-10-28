require('dotenv').config();

const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// CONFIGURAÇÃO EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'pokecreche_secret';

// ===== BANCO DE DADOS - SQLite (Funciona no Railway) =====
let db;

try {
  // No Railway, usa SQLite no diretório /tmp (que é persistente)
  const Database = require('better-sqlite3');
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/pokecreche.db'  // Railway tem /tmp writable
    : './pokecreche.db';    // Desenvolvimento local
  
  db = new Database(dbPath);
  console.log('✅ SQLite conectado em:', dbPath);
  
} catch (error) {
  console.error('❌ Erro ao conectar SQLite:', error);
  // Fallback para memória
  const Database = require('better-sqlite3');
  db = new Database(':memory:');
  console.log('✅ SQLite em memória como fallback');
}

// Criar tabelas no SQLite
function ensureTables() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS alunos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        matricula TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS docentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        identificador TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelas SQLite criadas/verificadas');
    
    // Contar registros existentes
    const alunoCount = db.prepare('SELECT COUNT(*) as count FROM alunos').get();
    const docenteCount = db.prepare('SELECT COUNT(*) as count FROM docentes').get();
    
    console.log(`📊 Alunos: ${alunoCount.count} | Docentes: ${docenteCount.count}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas SQLite:', error);
  }
}

// ===== FUNÇÕES DE BANCO SQLite =====
function query(sql, params = []) {
  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        return [stmt.all(...params)];
      } else {
        return [stmt.all()];
      }
    } else {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
    }
  } catch (error) {
    throw error;
  }
}

// ===== ROTAS =====
app.get('/', (req, res) => {
  console.log('🌐 Acesso à página inicial');
  ensureTables();
  
  const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  console.log('📍 Base URL:', baseUrl);

  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: baseUrl
  });
});

app.get('/alunos', (req, res) => {
  console.log('📝 Acesso à página de alunos');
  ensureTables();
  
  const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;

  res.render('pages/alunos', {
    title: 'Cadastro do Aluno - PokeCreche',
    currentPage: 'alunos',
    baseUrl: baseUrl
  });
});

app.get('/docentes', (req, res) => {
  console.log('👨‍🏫 Acesso à página de docentes');
  ensureTables();
  
  const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3000}`;

  res.render('pages/docentes', {
    title: 'Cadastro do Docente - PokeCreche',
    currentPage: 'docentes',
    baseUrl: baseUrl
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  console.log('❤️  Health check solicitado');
  try {
    ensureTables();
    
    const alunoCount = db.prepare('SELECT COUNT(*) as count FROM alunos').get();
    const docenteCount = db.prepare('SELECT COUNT(*) as count FROM docentes').get();
    
    const response = { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'sqlite',
      alunos: alunoCount.count,
      docentes: docenteCount.count,
      platform: 'railway'
    };
    
    console.log('✅ Health check:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Cadastro de Aluno
app.post('/register/aluno', (req, res) => {
  console.log('📥 Cadastro de aluno:', req.body);
  
  const { nome, cpf, matricula } = req.body || {};
  
  if (!nome || !cpf || !matricula) {
    return res.status(400).json({ message: 'Campos nome, cpf e matricula são obrigatórios' });
  }

  try {
    ensureTables();
    
    const cpfClean = cpf.replace(/\D+/g, '');
    const matriculaStr = String(matricula).trim();

    // Verificar se já existe
    const existing = db.prepare('SELECT id FROM alunos WHERE matricula = ? OR cpf = ?').get(matriculaStr, cpfClean);
    if (existing) {
      return res.status(409).json({ message: 'Aluno já cadastrado' });
    }

    // Inserir novo aluno
    const result = db.prepare('INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)').run(nome, cpfClean, matriculaStr);
    
    console.log('✅ Aluno cadastrado com ID:', result.lastInsertRowid);
    return res.status(201).json({ 
      message: 'Aluno cadastrado com sucesso!', 
      id: result.lastInsertRowid 
    });
    
  } catch (error) {
    console.error('❌ Erro ao cadastrar aluno:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno', error: error.message });
  }
});

// Cadastro de Docente
app.post('/register/docente', async (req, res) => {
  console.log('📥 Cadastro de docente:', req.body);
  
  const { nome, identificador, senha } = req.body || {};
  
  if (!nome || !identificador || !senha) {
    return res.status(400).json({ message: 'Campos nome, identificador e senha são obrigatórios' });
  }

  try {
    ensureTables();

    // Verificar se já existe
    const existing = db.prepare('SELECT id FROM docentes WHERE identificador = ?').get(identificador);
    if (existing) {
      return res.status(409).json({ message: 'Docente já cadastrado' });
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir novo docente
    const result = db.prepare('INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)').run(nome, identificador, hashedPassword);
    
    console.log('✅ Docente cadastrado com ID:', result.lastInsertRowid);
    return res.status(201).json({ 
      message: 'Docente cadastrado com sucesso!', 
      id: result.lastInsertRowid 
    });
    
  } catch (error) {
    console.error('❌ Erro ao cadastrar docente:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar docente', error: error.message });
  }
});

// Login Aluno
app.post('/login/aluno', (req, res) => {
  console.log('🔐 Login aluno:', req.body);
  
  const { matricula, cpf } = req.body || {};
  
  if (!matricula || !cpf) {
    return res.status(400).json({ success: false, message: 'Matrícula e CPF são obrigatórios' });
  }

  try {
    ensureTables();
    
    const cpfClean = cpf.replace(/\D+/g, '');
    const aluno = db.prepare('SELECT * FROM alunos WHERE matricula = ? AND cpf = ?').get(matricula, cpfClean);
    
    if (aluno) {
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
          matricula: aluno.matricula
        }
      });
    }
    
    return res.status(401).json({ success: false, message: 'Matrícula ou CPF inválidos' });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return res.status(500).json({ success: false, message: 'Erro ao fazer login' });
  }
});

// Debug - Ver todos os dados
app.get('/api/debug', (req, res) => {
  try {
    ensureTables();
    
    const alunos = db.prepare('SELECT * FROM alunos').all();
    const docentes = db.prepare('SELECT id, nome, identificador FROM docentes').all();
    
    const debugInfo = {
      environment: process.env.NODE_ENV,
      railway_url: process.env.RAILWAY_STATIC_URL,
      database: 'sqlite',
      total_alunos: alunos.length,
      total_docentes: docentes.length,
      alunos: alunos,
      docentes: docentes
    };
    
    console.log('🐛 Debug info:', debugInfo);
    res.json(debugInfo);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ===== POKECRECHE INICIANDO =====');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚇 Platform: Railway`);
  console.log(`💾 Banco: SQLite`);
  
  ensureTables();
  console.log('✅ Aplicação inicializada com sucesso!');
});

module.exports = app;