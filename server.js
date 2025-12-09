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
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:8100', 'http://localhost:4200', 'https://localhost:8100'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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
      connectionLimit: 5,
      timezone: "+00:00",
      ssl: { rejectUnauthorized: false },
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

// Função para criar conexão única por request (Vercel serverless)
function createConnection() {
  const dbConfig = getDbConfig();
  return mysql.createConnection(dbConfig);
}

// Manter pool para desenvolvimento local
let pool = null;
function getPool() {
  if (process.env.VERCEL) {
    // No Vercel, usar conexão única
    return { getConnection: () => createConnection() };
  }
  
  if (!pool) {
    const dbConfig = getDbConfig();
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Criar tabelas completas se não existirem
async function ensureTables() {
  console.log("🔧 Verificando esquema completo...");
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Ler o arquivo SQL completo
    const schemaPath = path.join(__dirname, 'database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('CREATE DATABASE') && !cmd.startsWith('USE'));
    
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await conn.query(command);
        } catch (error) {
          // Ignorar erros de "já existe"
          if (!error.message.includes('already exists')) {
            console.log(`⚠️ Erro no comando SQL: ${error.message}`);
          }
        }
      }
    }
    
    if (process.env.VERCEL) {
      await conn.end();
    } else {
      conn.release();
    }
    console.log("✅ Esquema completo verificado/criado");
  } catch (error) {
    console.error("❌ Erro ao criar esquema:", error.message);
    // Fallback para criação básica
    await createBasicTables();
  }
}

// Executar atualizações adicionais
async function executeUpdates(conn) {
  try {
    const updatePath = path.join(__dirname, 'comunicados_visibilidade_update.sql');
    if (fs.existsSync(updatePath)) {
      const updates = fs.readFileSync(updatePath, 'utf8');
      const updateCommands = updates
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      for (const command of updateCommands) {
        if (command.trim()) {
          try {
            await conn.query(command);
          } catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
              console.log(`⚠️ Erro na atualização: ${error.message}`);
            }
          }
        }
      }
      console.log("✅ Atualizações aplicadas");
    }
  } catch (error) {
    console.log("⚠️ Erro ao aplicar atualizações:", error.message);
  }
}

// Fallback para criação básica
async function createBasicTables() {
  const poolInstance = getPool();
  const conn = await poolInstance.getConnection();
  
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(20) NOT NULL UNIQUE,
      matricula VARCHAR(50) NOT NULL,
      avatar LONGTEXT,
      turma_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await conn.query(`CREATE TABLE IF NOT EXISTS docentes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      identificador VARCHAR(100) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    console.log("✅ Tabelas básicas criadas");
  } catch (error) {
    console.error("❌ Erro nas tabelas básicas:", error.message);
  } finally {
    if (process.env.VERCEL) {
      await conn.end();
    } else {
      conn.release();
    }
  }
}

// ===== ROTAS DE LOGIN =====

// Login de Aluno
app.post("/login/aluno", async (req, res) => {
  console.log('📝 Tentativa de login de aluno:', req.body);
  const { matricula, cpf } = req.body || {};

  if (!matricula || !cpf) {
    console.log('❌ Campos obrigatórios faltando');
    return res.status(400).json({ 
      success: false,
      message: "Matrícula e CPF são obrigatórios" 
    });
  }

  try {
    const cpfClean = cpf.replace(/\D+/g, "");
    const matriculaStr = String(matricula).trim();

    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();

    const [rows] = await conn.query(
      "SELECT id, nome, matricula FROM alunos WHERE matricula = ? AND cpf = ? LIMIT 1",
      [matriculaStr, cpfClean]
    );
    conn.release();

    if (rows.length > 0) {
      const user = rows[0];
      console.log('✅ Login de aluno bem-sucedido:', user.nome);
      return res.json({
        success: true,
        user: {
          id: user.id,
          nome: user.nome,
          matricula: user.matricula
        },
        token: jwt.sign({ id: user.id, type: 'aluno' }, JWT_SECRET, { expiresIn: '24h' })
      });
    } else {
      console.log('❌ Credenciais inválidas para aluno');
      return res.status(401).json({ 
        success: false,
        message: "Credenciais inválidas" 
      });
    }
  } catch (error) {
    console.error("🔴 Erro no login de aluno:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// Login de Docente
app.post("/login/docente", async (req, res) => {
  console.log('📝 Tentativa de login de docente:', req.body);
  const { identificador, senha } = req.body || {};

  if (!identificador || !senha) {
    console.log('❌ Campos obrigatórios faltando');
    return res.status(400).json({ 
      success: false,
      message: "Identificador e senha são obrigatórios" 
    });
  }

  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();

    const [rows] = await conn.query(
      "SELECT id, nome, identificador, senha FROM docentes WHERE identificador = ? LIMIT 1",
      [identificador]
    );
    conn.release();

    if (rows.length > 0) {
      const user = rows[0];
      const senhaValida = await bcrypt.compare(senha, user.senha);
      
      if (senhaValida) {
        console.log('✅ Login de docente bem-sucedido:', user.nome);
        return res.json({
          success: true,
          user: {
            id: user.id,
            nome: user.nome,
            identificador: user.identificador
          },
          token: jwt.sign({ id: user.id, type: 'docente' }, JWT_SECRET, { expiresIn: '24h' })
        });
      }
    }
    
    console.log('❌ Credenciais inválidas para docente');
    return res.status(401).json({ 
      success: false,
      message: "Credenciais inválidas" 
    });
  } catch (error) {
    console.error("🔴 Erro no login de docente:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// ===== ROTAS PRINCIPAIS =====

// Página inicial
app.get("/", async (req, res) => {
  try {
    const baseUrl = `https://${req.get('host')}`;
    
    // Tabelas já criadas manualmente - não precisa verificar

    res.render("pages/alunos", {
      title: "Cadastro do Aluno - CrecheApp",
      currentPage: "alunos",
      baseUrl: baseUrl,
    });
  } catch (error) {
    console.error('Erro na página inicial:', error);
    res.status(500).send("Erro ao carregar página");
  }
});

app.get("/alunos", async (req, res) => {
  try {
    const baseUrl = `https://${req.get('host')}`;
    
    try {
      await ensureTables();
    } catch (dbError) {
      console.log('⚠️ Erro ao verificar tabelas, continuando...', dbError.message);
    }

    res.render("pages/alunos", {
      title: "Cadastro do Aluno - CrecheApp",
      currentPage: "alunos",
      baseUrl: baseUrl,
    });
  } catch (error) {
    console.error('Erro na página alunos:', error);
    res.status(500).send("Erro ao carregar página");
  }
});

app.get("/docentes", async (req, res) => {
  try {
    const baseUrl = `https://${req.get('host')}`;
    
    try {
      await ensureTables();
    } catch (dbError) {
      console.log('⚠️ Erro ao verificar tabelas, continuando...', dbError.message);
    }

    res.render("pages/docentes", {
      title: "Cadastro do Docente - CrecheApp",
      currentPage: "docentes",
      baseUrl: baseUrl,
    });
  } catch (error) {
    console.error('Erro na página docentes:', error);
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
  console.log('📝 Tentativa de cadastro de aluno:', req.body);
  const { nome, cpf, matricula } = req.body || {};

  if (!nome || !cpf || !matricula) {
    console.log('❌ Campos obrigatórios faltando');
    return res
      .status(400)
      .json({ message: "Campos nome, cpf e matricula são obrigatórios" });
  }

  try {
    const cpfClean = cpf.replace(/\D+/g, "");
    const matriculaStr = String(matricula).trim();

    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();

    try {
      const [existing] = await conn.query(
        "SELECT id FROM alunos WHERE matricula = ? OR cpf = ? LIMIT 1",
        [matriculaStr, cpfClean]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: "Aluno já cadastrado" });
      }

      const [result] = await conn.query(
        "INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)",
        [nome, cpfClean, matriculaStr]
      );

      console.log('✅ Aluno cadastrado com sucesso! ID:', result.insertId);
      return res.status(201).json({
        message: "🎉 Aluno cadastrado com sucesso!",
        id: result.insertId,
      });
    } finally {
      if (process.env.VERCEL) {
        await conn.end();
      } else {
        conn.release();
      }
    }
  } catch (error) {
    console.error("🔴 Erro ao cadastrar aluno:", error);
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

    try {
      const [existing] = await conn.query(
        "SELECT id FROM docentes WHERE identificador = ? LIMIT 1",
        [identificador]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: "Docente já cadastrado" });
      }

      const [result] = await conn.query(
        "INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)",
        [nome, identificador, hashed]
      );

      return res.status(201).json({
        message: "🎉 Docente cadastrado com sucesso!",
        id: result.insertId,
      });
    } finally {
      if (process.env.VERCEL) {
        await conn.end();
      } else {
        conn.release();
      }
    }
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

// Endpoint para executar esquema manualmente
app.get("/setup-database", async (req, res) => {
  try {
    const poolInstance = getPool();
    const conn = await poolInstance.getConnection();
    
    // Criar tabelas uma por uma
    const tables = [
      `CREATE TABLE IF NOT EXISTS comunicados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        docente_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        destinatarios TEXT NOT NULL,
        cc TEXT,
        bcc TEXT,
        icon VARCHAR(10) DEFAULT '📝',
        tipo ENUM('default', 'urgent', 'info') DEFAULT 'default',
        data_evento DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS comunicado_destinatarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comunicado_id INT NOT NULL,
        tipo ENUM('aluno', 'docente', 'geral') NOT NULL,
        destinatario_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS rascunhos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        docente_id INT NOT NULL,
        title VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        destinatarios TEXT,
        cc TEXT,
        bcc TEXT,
        icon VARCHAR(10) DEFAULT '📝',
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS calendario_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NULL,
        date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        color ENUM('red', 'blue', 'green', 'yellow', 'purple', 'orange') DEFAULT 'blue',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS termos_aceitos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_type ENUM('aluno', 'docente') NOT NULL,
        user_id INT NOT NULL,
        aceito BOOLEAN DEFAULT FALSE,
        data_aceite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        UNIQUE KEY unique_user_terms (user_type, user_id)
      )`
    ];
    
    let results = [];
    for (const table of tables) {
      try {
        await conn.query(table);
        results.push('✅ Tabela criada');
      } catch (error) {
        results.push(`❌ ${error.message}`);
      }
    }
    
    conn.release();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== INICIALIZAÇÃO =====
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 ===== CRECHEAPP INICIANDO =====");
    console.log(`📍 Porta: ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`🚇 Platform: Railway`);
    console.log(`💡 Dica: Configure DATABASE_URL para funcionar completamente`);
  });
}

module.exports = app;
