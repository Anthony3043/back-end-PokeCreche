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

// Função para criar tabelas se não existirem
async function ensureTables() {
  const createAlunos = `
  CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    matricula VARCHAR(50) NOT NULL
  );`;

  const createDocentes = `
  CREATE TABLE IF NOT EXISTS docentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    identificador VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
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
    console.log('Tabelas verificadas/criadas');
  } finally {
    conn.release();
  }
}

// Middleware JWT
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token ausente' });
  }
  const token = auth.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ success: false, message: 'Token inválido' });
    req.user = payload;
    next();
  });
}

function onlyDigits(str = '') {
  return (str || '').toString().replace(/\D+/g, '');
}

// Middleware para garantir que as tabelas existem
async function ensureTablesMiddleware(req, res, next) {
  try {
    await ensureTables();
    next();
  } catch (err) {
    console.error('Erro ao verificar tabelas:', err);
    return res.status(500).json({ success: false, message: 'Erro ao conectar ao banco de dados' });
  }
}

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

// ===== SUAS APIS EXISTENTES =====

// Registro aluno
app.post('/register/aluno', ensureTablesMiddleware, async (req, res) => {
  const { nome, cpf, matricula } = req.body || {};
  if (!nome || !cpf || !matricula) return res.status(400).json({ message: 'Campos nome, cpf e matricula são obrigatórios' });

  const cpfClean = onlyDigits(cpf);
  const matriculaStr = String(matricula).trim();

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [existing] = await conn.query('SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1', [matriculaStr, cpfClean]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Aluno já cadastrado', existing: existing[0] });
    }
    const [result] = await conn.query('INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)', [nome, cpfClean, matriculaStr]);
    return res.status(201).json({ message: 'Aluno cadastrado', id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar aluno:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno', error: err.message });
  } finally {
    conn.release();
  }
});

// Registro docente
app.post('/register/docente', ensureTablesMiddleware, async (req, res) => {
  const { nome, identificador, senha } = req.body || {};
  if (!nome || !identificador || !senha) return res.status(400).json({ message: 'Campos nome, identificador e senha são obrigatórios' });

  const hashed = await bcrypt.hash(senha, 10);
  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [result] = await conn.query('INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)', [nome, identificador, hashed]);
    return res.status(201).json({ message: 'Docente cadastrado', id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar docente:', err);
    return res.status(500).json({ message: 'Erro ao cadastrar docente', error: err.message });
  } finally {
    conn.release();
  }
});

// Login aluno
app.post('/login/aluno', async (req, res) => {
  const { matricula, cpf } = req.body || {};
  if (!matricula || !cpf) return res.status(400).json({ success: false, message: 'Matrícula e CPF são obrigatórios' });

  const matriculaStr = String(matricula).trim();
  const cpfClean = onlyDigits(cpf);

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM alunos WHERE matricula = ? AND cpf = ?', [matriculaStr, cpfClean]);
    if (rows.length > 0) {
      const aluno = rows[0];
      const token = jwt.sign({ id: aluno.id, type: 'aluno', matricula: aluno.matricula }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ success: true, message: 'Login realizado', token, user: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula, cpf: aluno.cpf } });
    }
    return res.status(401).json({ success: false, message: 'Matrícula ou CPF inválidos' });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ success: false, message: 'Erro ao fazer login', error: err.message });
  } finally {
    conn.release();
  }
});

// Login docente
app.post('/login/docente', async (req, res) => {
  const { identificador, senha } = req.body || {};

  if (!identificador || !senha) return res.status(400).json({ success: false, message: 'Identificador e senha são obrigatórios' });

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM docentes WHERE identificador = ?', [identificador]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Identificador ou senha inválidos' });

    const docente = rows[0];
    const senhaValida = await bcrypt.compare(senha, docente.senha);
    if (!senhaValida) return res.status(401).json({ success: false, message: 'Identificador ou senha inválidos' });

    const token = jwt.sign({ id: docente.id, identificador: docente.identificador, type: 'docente' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, message: 'Login realizado', token, user: { id: docente.id, nome: docente.nome, identificador: docente.identificador } });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ success: false, message: 'Erro ao fazer login', error: err.message });
  } finally {
    conn.release();
  }
});

// Eventos
app.get('/api/events', async (req, res) => {
  const year = parseInt(req.query.year, 10);
  const month = parseInt(req.query.month, 10);
  const teacherId = req.query.teacher_id || null;

  if (!year || !month || month < 1 || month > 12) return res.status(400).json({ success: false, message: 'Parâmetros year e month são obrigatórios' });

  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDate = new Date(year, month, 0).getDate();
  const last = `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;

  let sql = `SELECT id, teacher_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, title, color FROM calendario_events WHERE date BETWEEN ? AND ?`;
  const params = [first, last];
  if (teacherId) {
    sql += ' AND teacher_id = ?';
    params.push(teacherId);
  }

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [results] = await conn.query(sql, params);
    return res.json({ success: true, events: results });
  } catch (err) {
    console.error('Erro ao buscar eventos:', err);
    return res.status(500).json({ success: false, message: 'Erro ao buscar eventos', error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/events', authenticateJWT, async (req, res) => {
  const teacherId = req.user && req.user.id ? req.user.id : null;
  const { date, title, color } = req.body || {};
  if (!date || !title || !color) return res.status(400).json({ success: false, message: 'date, title e color são obrigatórios' });

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  try {
    const [result] = await conn.query('INSERT INTO calendario_events (teacher_id, date, title, color) VALUES (?, ?, ?, ?)', [teacherId, date, title, color]);
    return res.status(201).json({ success: true, message: 'Evento criado', id: result.insertId });
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    return res.status(500).json({ success: false, message: 'Erro ao criar evento', error: err.message });
  } finally {
    conn.release();
  }
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