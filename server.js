require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const app = express();

// CONFIGURAÇÃO EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:8100', 'https://crecheapp.vercel.app', 'https://crecheapp1.vercel.app'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use(express.static(path.join(__dirname, "public")));

const JWT_SECRET = process.env.JWT_SECRET || "crecheapp_secret";

// Headers CORS adicionais
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
const initDatabase = require('./init-db');

// Inicializar banco na primeira execução
if (process.env.DATABASE_URL) {
  initDatabase().catch(err => console.error('Erro ao inicializar DB:', err));
}

// CONFIGURAÇÃO DO BANCO
function getDbConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      port: url.port || 3306,
      ssl: { rejectUnauthorized: false },
    };
  }
  
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "q1w2e3",
    database: process.env.DB_NAME || "crecheapp",
    port: process.env.DB_PORT || 3306,
  };
}

// Criar conexão simples
async function getConnection() {
  return await mysql.createConnection(getDbConfig());
}

// ROTAS PRINCIPAIS
app.get("/", async (req, res) => {
  const baseUrl = `https://${req.get('host')}`;
  res.render("pages/alunos", {
    title: "Cadastro do Aluno - CrecheApp",
    currentPage: "alunos",
    baseUrl: baseUrl,
  });
});

app.get("/alunos", async (req, res) => {
  const baseUrl = `https://${req.get('host')}`;
  res.render("pages/alunos", {
    title: "Cadastro do Aluno - CrecheApp",
    currentPage: "alunos",
    baseUrl: baseUrl,
  });
});

app.get("/docentes", async (req, res) => {
  const baseUrl = `https://${req.get('host')}`;
  res.render("pages/docentes", {
    title: "Cadastro do Docente - CrecheApp",
    currentPage: "docentes",
    baseUrl: baseUrl,
  });
});

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    const conn = await getConnection();
    await conn.query("SELECT 1");
    await conn.end();
    res.json({ status: "healthy", message: "🚀 CrecheApp Online!" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

// Cadastro de Aluno
app.post("/register/aluno", async (req, res) => {
  const { nome, cpf, matricula } = req.body || {};

  if (!nome || !cpf || !matricula) {
    return res.status(400).json({ message: "Campos obrigatórios faltando" });
  }

  try {
    const cpfClean = cpf.replace(/\D+/g, "");
    const conn = await getConnection();

    const [existing] = await conn.query(
      "SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1",
      [matricula, cpfClean]
    );

    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ message: "Aluno já cadastrado" });
    }

    await conn.query(
      "INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)",
      [nome, cpfClean, matricula]
    );

    await conn.end();
    return res.status(201).json({ message: "🎉 Aluno cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ message: "Erro ao cadastrar aluno" });
  }
});

// Cadastro de Docente
app.post("/register/docente", async (req, res) => {
  const { nome, identificador, senha } = req.body || {};

  if (!nome || !identificador || !senha) {
    return res.status(400).json({ message: "Campos obrigatórios faltando" });
  }

  try {
    const hashed = await bcrypt.hash(senha, 10);
    const conn = await getConnection();

    const [existing] = await conn.query(
      "SELECT id FROM docentes WHERE identificador = ? LIMIT 1",
      [identificador]
    );

    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ message: "Docente já cadastrado" });
    }

    await conn.query(
      "INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)",
      [nome, identificador, hashed]
    );

    await conn.end();
    return res.status(201).json({ message: "🎉 Docente cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ message: "Erro ao cadastrar docente" });
  }
});

// Login de Aluno
app.post("/login/aluno", async (req, res) => {
  const { matricula, cpf } = req.body || {};

  if (!matricula || !cpf) {
    return res.status(400).json({ message: "Matrícula e CPF são obrigatórios" });
  }

  try {
    const cpfClean = cpf.replace(/\D+/g, "");
    const conn = await getConnection();

    const [rows] = await conn.query(
      "SELECT id, nome, matricula FROM alunos WHERE matricula = ? AND cpf = ? LIMIT 1",
      [matricula, cpfClean]
    );

    await conn.end();

    if (rows.length > 0) {
      const user = rows[0];
      return res.json({
        success: true,
        user: { id: user.id, nome: user.nome, matricula: user.matricula },
        token: jwt.sign({ id: user.id, type: 'aluno' }, JWT_SECRET, { expiresIn: '24h' })
      });
    }

    return res.status(401).json({ message: "Credenciais inválidas" });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ message: "Erro interno" });
  }
});

// Login de Docente
app.post("/login/docente", async (req, res) => {
  const { identificador, senha } = req.body || {};

  if (!identificador || !senha) {
    return res.status(400).json({ message: "Identificador e senha são obrigatórios" });
  }

  try {
    const conn = await getConnection();

    const [rows] = await conn.query(
      "SELECT id, nome, identificador, senha FROM docentes WHERE identificador = ? LIMIT 1",
      [identificador]
    );

    await conn.end();

    if (rows.length > 0) {
      const user = rows[0];
      const senhaValida = await bcrypt.compare(senha, user.senha);
      
      if (senhaValida) {
        return res.json({
          success: true,
          user: { id: user.id, nome: user.nome, identificador: user.identificador },
          token: jwt.sign({ id: user.id, type: 'docente' }, JWT_SECRET, { expiresIn: '24h' })
        });
      }
    }

    return res.status(401).json({ message: "Credenciais inválidas" });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ message: "Erro interno" });
  }
});

// INICIALIZAÇÃO
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CrecheApp rodando na porta ${PORT}`);
  });
}

module.exports = app;
