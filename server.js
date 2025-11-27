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
// Use express-ejs-layouts to automatically wrap page templates with views/layout.ejs
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.json());
app.use(cors());
// Servir arquivos estáticos
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use(express.static(path.join(__dirname, "public")));

const JWT_SECRET = process.env.JWT_SECRET || "crecheapp_secret";

// ===== CONFIGURAÇÃO DO BANCO =====
function getDbConfig() {
  // Produção: usar DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log("✅ Usando DATABASE_URL");
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      port: url.port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: "+00:00",
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  // Desenvolvimento local
  if (process.env.NODE_ENV !== "production") {
    console.log("⚠️  Usando configuração local");
    return {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "q1w2e3",
      database: process.env.DB_NAME || "crecheapp",
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: "+00:00",
    };
  }

  // Erro se não tiver configuração
  throw new Error("DATABASE_URL é obrigatória em produção");
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
  console.log("🔧 Verificando tabelas...");

  const createAlunos = `
    CREATE TABLE IF NOT EXISTS alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(20) NOT NULL UNIQUE,
      matricula VARCHAR(50) NOT NULL,
      avatar TEXT,
      turma_id INT,
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

  const createTurmas = `
    CREATE TABLE IF NOT EXISTS turmas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      ano VARCHAR(10) NOT NULL,
      foto TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;

  // Adicionar coluna foto se não existir (para bancos existentes)
  const addFotoColumn = `
    ALTER TABLE turmas 
    ADD COLUMN IF NOT EXISTS foto TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `;

  const createRegistros = `
    CREATE TABLE IF NOT EXISTS registros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      aluno_id INT NOT NULL,
      turma_id INT NOT NULL,
      data DATE NOT NULL,
      alimentacao VARCHAR(50),
      comportamento VARCHAR(50),
      presenca VARCHAR(50),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();

  try {
    await conn.query(createAlunos);
    await conn.query(createDocentes);
    await conn.query(createTurmas);
    await conn.query(createRegistros);

    // Tentar adicionar coluna foto se não existir
    try {
      await conn.query(addFotoColumn);
      console.log("✅ Coluna foto verificada/adicionada");
    } catch (alterError) {
      // Ignorar erro se coluna já existir
      console.log("ℹ️  Coluna foto já existe ou erro na migração");
    }

    console.log("✅ Tabelas verificadas/criadas");
  } catch (error) {
    console.error("❌ Erro nas tabelas:", error.message);
  } finally {
    conn.release();
  }
}

// ===== ROTAS PRINCIPAIS =====

// Página inicial
app.get("/", async (req, res) => {
  try {
    await ensureTables();
    const baseUrl =
      process.env.RAILWAY_STATIC_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    res.render("pages/alunos", {
      title: "Cadastro do Aluno - CrecheApp",
      currentPage: "alunos",
      baseUrl: baseUrl,
    });
  } catch (error) {
    res.status(500).send("Erro ao carregar página");
  }
});

app.get("/alunos", async (req, res) => {
  try {
    await ensureTables();
    const baseUrl =
      process.env.RAILWAY_STATIC_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    res.render("pages/alunos", {
      title: "Cadastro do Aluno - CrecheApp",
      currentPage: "alunos",
      baseUrl: baseUrl,
    });
  } catch (error) {
    res.status(500).send("Erro ao carregar página");
  }
});

app.get("/docentes", async (req, res) => {
  try {
    await ensureTables();
    const baseUrl =
      process.env.RAILWAY_STATIC_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    res.render("pages/docentes", {
      title: "Cadastro do Docente - CrecheApp",
      currentPage: "docentes",
      baseUrl: baseUrl,
    });
  } catch (error) {
    res.status(500).send("Erro ao carregar página");
  }
});

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query("SELECT 1");
    conn.release();

    res.json({
      status: "healthy",
      message: "🚀 CrecheApp Online!",
      environment: process.env.NODE_ENV || "development",
      platform: "railway",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: "Banco de dados não conectado",
      message: "Adicione um banco MySQL no Railway",
    });
  }
});

// Cadastro de Aluno
app.post("/register/aluno", async (req, res) => {
  const { nome, cpf, matricula } = req.body || {};

  if (!nome || !cpf || !matricula) {
    return res
      .status(400)
      .json({ message: "Campos nome, cpf e matricula são obrigatórios" });
  }

  try {
    const cpfClean = cpf.replace(/\D+/g, "");
    const matriculaStr = String(matricula).trim();

    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();

    // Verificar se já existe
    const [existing] = await conn.query(
      "SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1",
      [matriculaStr, cpfClean]
    );

    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ message: "Aluno já cadastrado" });
    }

    // Inserir novo aluno
    const [result] = await conn.query(
      "INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)",
      [nome, cpfClean, matriculaStr]
    );
    conn.release();

    return res.status(201).json({
      message: "🎉 Aluno cadastrado com sucesso!",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Erro:", error);
    return res
      .status(500)
      .json({
        message:
          "Erro ao cadastrar aluno. Verifique se o banco está configurado.",
      });
  }
});

// Cadastro de Docente
app.post("/register/docente", async (req, res) => {
  const { nome, identificador, senha } = req.body || {};

  if (!nome || !identificador || !senha) {
    return res
      .status(400)
      .json({ message: "Campos nome, identificador e senha são obrigatórios" });
  }

  try {
    const hashed = await bcrypt.hash(senha, 10);

    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();

    // Verificar se já existe
    const [existing] = await conn.query(
      "SELECT id FROM docentes WHERE identificador = ? LIMIT 1",
      [identificador]
    );

    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ message: "Docente já cadastrado" });
    }

    // Inserir novo docente
    const [result] = await conn.query(
      "INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)",
      [nome, identificador, hashed]
    );
    conn.release();

    return res.status(201).json({
      message: "🎉 Docente cadastrado com sucesso!",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Erro:", error);
    return res
      .status(500)
      .json({
        message:
          "Erro ao cadastrar docente. Verifique se o banco está configurado.",
      });
  }
});

// ===== ROTAS TURMAS =====

// Listar turmas
app.get("/turmas", async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    const [rows] = await conn.query(
      "SELECT id, nome, ano, foto FROM turmas ORDER BY nome"
    );
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    res.status(500).json({ error: "Erro ao buscar turmas" });
  }
});

// Criar turma
app.post("/turmas", async (req, res) => {
  const { nome, ano } = req.body;

  if (!nome || !ano) {
    return res.status(400).json({ error: "Nome e ano são obrigatórios" });
  }

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    const [result] = await conn.query(
      "INSERT INTO turmas (nome, ano) VALUES (?, ?)",
      [nome, ano]
    );
    conn.release();

    res.status(201).json({ id: result.insertId, nome, ano });
  } catch (error) {
    console.error("Erro ao criar turma:", error);
    res.status(500).json({ error: "Erro ao criar turma" });
  }
});

// Atualizar turma
app.put("/turmas/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, ano, foto } = req.body;

  if (!nome || !ano) {
    return res.status(400).json({ error: "Nome e ano são obrigatórios" });
  }

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();

    let query = "UPDATE turmas SET nome = ?, ano = ?";
    let params = [nome, ano];

    if (foto) {
      query += ", foto = ?";
      params.push(foto);
    }

    query += " WHERE id = ?";
    params.push(id);

    await conn.query(query, params);
    conn.release();

    res.json({ message: "Turma atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar turma:", error);
    res.status(500).json({ error: "Erro ao atualizar turma" });
  }
});

// Deletar turma
app.delete("/turmas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query("DELETE FROM turmas WHERE id = ?", [id]);
    conn.release();

    res.json({ message: "Turma excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir turma:", error);
    res.status(500).json({ error: "Erro ao excluir turma" });
  }
});

// Listar alunos de uma turma
app.get("/turmas/:id/alunos", async (req, res) => {
  const { id } = req.params;

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    const [rows] = await conn.query(
      "SELECT id, nome, matricula, avatar FROM alunos WHERE turma_id = ?",
      [id]
    );
    conn.release();

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

// Listar todos os alunos
app.get("/alunos", async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    const [rows] = await conn.query(
      "SELECT id, nome, matricula, avatar, turma_id FROM alunos ORDER BY nome"
    );
    conn.release();

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

// Adicionar aluno à turma
app.post("/turmas/:id/alunos", async (req, res) => {
  const { id } = req.params;
  const { aluno_id } = req.body;

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query("UPDATE alunos SET turma_id = ? WHERE id = ?", [
      id,
      aluno_id,
    ]);
    conn.release();

    res.json({ message: "Aluno adicionado à turma" });
  } catch (error) {
    console.error("Erro ao adicionar aluno:", error);
    res.status(500).json({ error: "Erro ao adicionar aluno à turma" });
  }
});

// Remover aluno da turma
app.delete("/turmas/:turmaId/alunos/:alunoId", async (req, res) => {
  const { alunoId } = req.params;

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    await conn.query("UPDATE alunos SET turma_id = NULL WHERE id = ?", [
      alunoId,
    ]);
    conn.release();

    res.json({ message: "Aluno removido da turma" });
  } catch (error) {
    console.error("Erro ao remover aluno:", error);
    res.status(500).json({ error: "Erro ao remover aluno da turma" });
  }
});

// ===== ROTAS REGISTROS =====

// Criar registro
app.post("/registros", async (req, res) => {
  const {
    aluno_id,
    turma_id,
    data,
    alimentacao,
    comportamento,
    presenca,
    observacoes,
  } = req.body;

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    const [result] = await conn.query(
      "INSERT INTO registros (aluno_id, turma_id, data, alimentacao, comportamento, presenca, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        aluno_id,
        turma_id,
        data,
        alimentacao,
        comportamento,
        presenca,
        observacoes,
      ]
    );
    conn.release();

    res
      .status(201)
      .json({ id: result.insertId, message: "Registro criado com sucesso" });
  } catch (error) {
    console.error("Erro ao criar registro:", error);
    res.status(500).json({ error: "Erro ao criar registro" });
  }
});

// Listar registros de um aluno
app.get("/registros/:alunoId", async (req, res) => {
  const { alunoId } = req.params;

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    const [rows] = await conn.query(
      "SELECT * FROM registros WHERE aluno_id = ? ORDER BY data DESC",
      [alunoId]
    );
    conn.release();

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar registros:", error);
    res.status(500).json({ error: "Erro ao buscar registros" });
  }
});

// Rota para verificar configuração
app.get("/api/config", (req, res) => {
  const config = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    environment: process.env.NODE_ENV,
    railwayUrl: process.env.RAILWAY_STATIC_URL,
    port: process.env.PORT,
  };
  res.json(config);
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 ===== CRECHEAPP INICIANDO =====");
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🚇 Platform: Railway`);
  console.log(
    `💡 Dica: Adicione um banco MySQL no Railway para funcionar completamente`
  );
});

module.exports = app;
