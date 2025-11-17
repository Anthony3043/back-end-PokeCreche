const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const db = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'q1w2e3',
  database: process.env.MYSQLDATABASE || 'PokeCreche',
  port: process.env.MYSQLPORT || 3306,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.message);
  } else {
    console.log('Conectado ao MySQL');
    connection.release();
  }
});



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'alunos.html'));
});

// Função para validar CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

app.post('/register/aluno', (req, res) => {
  const { nome, cpf } = req.body || {};
  if (!nome || !cpf) {
    return res.status(400).json({ message: 'Campos nome e cpf são obrigatórios' });
  }

  // Validar CPF
  if (!validarCPF(cpf)) {
    return res.status(400).json({ message: 'CPF inválido' });
  }

  // Gerar matrícula automaticamente
  db.query('SELECT COUNT(*) as total FROM alunos', (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao gerar matrícula', error: err.message });
    }

    const matricula = String(countResult[0].total + 1).padStart(6, '0');

    const sql = 'INSERT INTO alunos (nome, cpf, matricula) VALUES (?, ?, ?)';
    db.query(sql, [nome, cpf, matricula], (err, result) => {
      if (err) {
        console.error('Erro ao inserir aluno:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Aluno já cadastrado', error: err.message });
        }
        return res.status(500).json({ message: 'Erro ao cadastrar aluno', error: err.message });
      }
      return res.status(201).json({ message: 'Aluno cadastrado', id: result.insertId, matricula });
    });
  });
});

app.post('/register/docente', async (req, res) => {
  const { nome, senha } = req.body || {};
  if (!nome || !senha) {
    return res.status(400).json({ message: 'Campos nome e senha são obrigatórios' });
  }

  try {
    // Gerar identificador automaticamente
    db.query('SELECT COUNT(*) as total FROM docentes', async (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao gerar identificador', error: err.message });
      }

      const identificador = 'DOC' + String(countResult[0].total + 1).padStart(4, '0');
      const hashed = await bcrypt.hash(senha, 10);
      
      const sql = 'INSERT INTO docentes (nome, identificador, senha) VALUES (?, ?, ?)';
      db.query(sql, [nome, identificador, hashed], (err, result) => {
        if (err) {
          console.error('Erro ao inserir docente:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Identificador já existe', error: err.message });
          }
          return res.status(500).json({ message: 'Erro ao cadastrar docente', error: err.message });
        }
        return res.status(201).json({ message: 'Docente cadastrado', id: result.insertId, identificador });
      });
    });
  } catch (e) {
    console.error('Erro ao hashear senha:', e);
    return res.status(500).json({ message: 'Erro interno', error: e.message });
  }
});

app.post('/login/aluno', (req, res) => {
  const { matricula, cpf } = req.body || {};

  if (!matricula || !cpf) {
    return res.status(400).json({ 
      success: false,
      message: 'Matrícula e CPF são obrigatórios' 
    });
  }

  const sql = 'SELECT * FROM alunos WHERE matricula = ? AND cpf = ?';
  db.query(sql, [matricula, cpf], (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false,
        message: 'Erro no servidor' 
      });
    }

    if (result.length > 0) {
      const aluno = result[0];
      const token = 'token_' + aluno.id;

      res.json({ 
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: aluno.id,
          nome: aluno.nome,
          matricula: aluno.matricula,
          cpf: aluno.cpf
        }
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: 'Matrícula ou CPF inválidos' 
      });
    }
  });
});

app.post('/login/docente', async (req, res) => {
  const { identificador, senha } = req.body || {};

  if (!identificador || !senha) {
    return res.status(400).json({ 
      success: false,
      message: 'Identificador e senha são obrigatórios' 
    });
  }

  const sql = 'SELECT * FROM docentes WHERE identificador = ?';
  db.query(sql, [identificador], async (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false,
        message: 'Erro no servidor' 
      });
    }

    if (result.length > 0) {
      const docente = result[0];
      const senhaValida = await bcrypt.compare(senha, docente.senha);

      if (senhaValida) {
        const token = 'token_' + docente.id;

        res.json({ 
          success: true,
          message: 'Login realizado com sucesso',
          token,
          user: {
            id: docente.id,
            nome: docente.nome,
            identificador: docente.identificador
          }
        });
      } else {
        res.status(401).json({ 
          success: false,
          message: 'Identificador ou senha inválidos' 
        });
      }
    } else {
      res.status(401).json({ 
        success: false,
        message: 'Identificador ou senha inválidos' 
      });
    }
  });
});

// Alunos
app.get('/alunos', (req, res) => {
  db.query('SELECT id, nome, matricula, cpf, avatar FROM alunos', (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar alunos' });
    res.json(result);
  });
});

app.put('/alunos/:id/avatar', (req, res) => {
  const { avatar } = req.body;
  db.query('UPDATE alunos SET avatar = ? WHERE id = ?', [avatar, req.params.id], (err) => {
    if (err) {
      console.error('Erro ao atualizar avatar do aluno:', err);
      return res.status(500).json({ message: 'Erro ao atualizar avatar', error: err.message });
    }
    res.json({ message: 'Avatar atualizado' });
  });
});

// Docentes
app.get('/docentes', (req, res) => {
  db.query('SELECT id, nome, identificador, email, avatar FROM docentes', (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar docentes' });
    res.json(result);
  });
});

app.put('/docentes/:id/avatar', (req, res) => {
  const { avatar } = req.body;
  db.query('UPDATE docentes SET avatar = ? WHERE id = ?', [avatar, req.params.id], (err) => {
    if (err) {
      console.error('Erro ao atualizar avatar do docente:', err);
      return res.status(500).json({ message: 'Erro ao atualizar avatar', error: err.message });
    }
    res.json({ message: 'Avatar atualizado' });
  });
});

// Turmas
app.get('/turmas', (req, res) => {
  db.query('SELECT * FROM turmas', (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar turmas' });
    res.json(result);
  });
});

app.post('/turmas', (req, res) => {
  const { nome, ano } = req.body;
  db.query('INSERT INTO turmas (nome, ano) VALUES (?, ?)', [nome, ano], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao criar turma' });
    res.json({ id: result.insertId, nome, ano });
  });
});

app.put('/turmas/:id', (req, res) => {
  const { nome, ano } = req.body;
  db.query('UPDATE turmas SET nome = ?, ano = ? WHERE id = ?', [nome, ano, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao atualizar turma' });
    res.json({ message: 'Turma atualizada' });
  });
});

app.delete('/turmas/:id', (req, res) => {
  db.query('DELETE FROM turmas WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao excluir turma' });
    res.json({ message: 'Turma excluída' });
  });
});

// Alunos por Turma
app.get('/turmas/:id/alunos', (req, res) => {
  const sql = `SELECT a.* FROM alunos a 
    INNER JOIN turma_alunos ta ON a.id = ta.aluno_id 
    WHERE ta.turma_id = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar alunos da turma' });
    res.json(result);
  });
});

app.post('/turmas/:id/alunos', (req, res) => {
  const { aluno_id } = req.body;
  
  // Verificar se o aluno já está em alguma turma
  db.query('SELECT turma_id FROM turma_alunos WHERE aluno_id = ?', [aluno_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao verificar aluno' });
    
    if (result.length > 0) {
      return res.status(400).json({ message: 'Aluno já está em outra turma' });
    }
    
    db.query('INSERT INTO turma_alunos (turma_id, aluno_id) VALUES (?, ?)', [req.params.id, aluno_id], (err) => {
      if (err) return res.status(500).json({ message: 'Erro ao adicionar aluno' });
      res.json({ message: 'Aluno adicionado' });
    });
  });
});

app.delete('/turmas/:turmaId/alunos/:alunoId', (req, res) => {
  db.query('DELETE FROM turma_alunos WHERE turma_id = ? AND aluno_id = ?', [req.params.turmaId, req.params.alunoId], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao remover aluno' });
    res.json({ message: 'Aluno removido' });
  });
});

// Comunicados
app.get('/comunicados', (req, res) => {
  const { user_id, user_type } = req.query;
  
  if (user_id && user_type) {
    // Buscar comunicados filtrados por destinatário
    const sql = `
      SELECT DISTINCT c.* FROM comunicados c
      INNER JOIN comunicado_destinatarios cd ON c.id = cd.comunicado_id
      WHERE cd.tipo = 'geral' 
         OR (cd.tipo = ? AND cd.destinatario_id = ?)
      ORDER BY c.created_at DESC
    `;
    db.query(sql, [user_type, user_id], (err, result) => {
      if (err) return res.status(500).json({ message: 'Erro ao buscar comunicados' });
      res.json(result);
    });
  } else {
    // Buscar todos os comunicados
    db.query('SELECT * FROM comunicados ORDER BY created_at DESC', (err, result) => {
      if (err) return res.status(500).json({ message: 'Erro ao buscar comunicados' });
      res.json(result);
    });
  }
});

// Novo endpoint para comunicados com controle de visibilidade
app.get('/comunicados/visiveis', (req, res) => {
  const { user_id, user_type } = req.query;
  
  if (!user_id || !user_type) {
    return res.status(400).json({ message: 'user_id e user_type são obrigatórios' });
  }
  
  const sql = `
    SELECT DISTINCT c.* FROM comunicados c
    LEFT JOIN comunicado_destinatarios cd ON c.id = cd.comunicado_id
    LEFT JOIN comunicado_visibilidade cv ON c.id = cv.comunicado_id AND cv.user_type = ? AND cv.user_id = ?
    WHERE 
      (c.visibilidade = 'publico' AND cd.tipo = 'geral') OR
      (c.visibilidade = 'privado' AND cv.pode_visualizar = true) OR
      (cd.tipo = ? AND cd.destinatario_id = ?)
    ORDER BY c.created_at DESC
  `;
  
  db.query(sql, [user_type, user_id, user_type, user_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar comunicados visíveis' });
    res.json(result);
  });
});

app.post('/comunicados', (req, res) => {
  const { docente_id, title, subject, message, destinatarios, cc, bcc, icon, tipo, tipo_destinatario, destinatarios_ids, visibilidade, tipo_visibilidade } = req.body;
  const sql = 'INSERT INTO comunicados (docente_id, title, subject, message, destinatarios, cc, bcc, icon, tipo, tipo_destinatario, visibilidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [docente_id, title, subject, message, destinatarios, cc, bcc, icon, tipo, tipo_destinatario || 'geral', visibilidade || 'publico'], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao criar comunicado' });
    
    const comunicadoId = result.insertId;
    
    // Salvar destinatários
    if (tipo_destinatario === 'geral') {
      db.query('INSERT INTO comunicado_destinatarios (comunicado_id, tipo) VALUES (?, ?)', [comunicadoId, 'geral'], () => {});
    } else if (destinatarios_ids && destinatarios_ids.length > 0) {
      const values = destinatarios_ids.map(id => [comunicadoId, tipo_destinatario, id]);
      db.query('INSERT INTO comunicado_destinatarios (comunicado_id, tipo, destinatario_id) VALUES ?', [values], () => {});
      
      // Para comunicados privados, criar registros de visibilidade
      if (visibilidade === 'privado') {
        const visibilityValues = destinatarios_ids.map(id => [comunicadoId, tipo_destinatario, id, true]);
        visibilityValues.push([comunicadoId, 'docente', docente_id, true]); // Docente sempre pode ver
        db.query('INSERT INTO comunicado_visibilidade (comunicado_id, user_type, user_id, pode_visualizar) VALUES ?', [visibilityValues], () => {});
      }
    }
    
    res.json({ id: comunicadoId });
  });
});

app.put('/comunicados/:id', (req, res) => {
  const { title, subject, message, destinatarios, cc, bcc, icon } = req.body;
  const sql = 'UPDATE comunicados SET title = ?, subject = ?, message = ?, destinatarios = ?, cc = ?, bcc = ?, icon = ? WHERE id = ?';
  db.query(sql, [title, subject, message, destinatarios, cc, bcc, icon, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao atualizar comunicado' });
    res.json({ message: 'Comunicado atualizado' });
  });
});

app.delete('/comunicados/:id', (req, res) => {
  db.query('DELETE FROM comunicados WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao excluir comunicado' });
    res.json({ message: 'Comunicado excluído' });
  });
});

// Rascunhos
app.get('/rascunhos/:docente_id', (req, res) => {
  db.query('SELECT * FROM rascunhos WHERE docente_id = ? ORDER BY saved_at DESC', [req.params.docente_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar rascunhos' });
    res.json(result);
  });
});

app.post('/rascunhos', (req, res) => {
  const { docente_id, title, subject, message, destinatarios, cc, bcc, icon } = req.body;
  const sql = 'INSERT INTO rascunhos (docente_id, title, subject, message, destinatarios, cc, bcc, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [docente_id, title, subject, message, destinatarios, cc, bcc, icon], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao salvar rascunho' });
    res.json({ id: result.insertId });
  });
});

app.delete('/rascunhos/:id', (req, res) => {
  db.query('DELETE FROM rascunhos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao excluir rascunho' });
    res.json({ message: 'Rascunho excluído' });
  });
});

// Registros de Alunos
app.get('/registros/:aluno_id', (req, res) => {
  db.query('SELECT * FROM registros_alunos WHERE aluno_id = ? ORDER BY data DESC', [req.params.aluno_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar registros' });
    res.json(result);
  });
});

app.post('/registros', (req, res) => {
  const { aluno_id, turma_id, data, alimentacao, comportamento, presenca, observacoes } = req.body;
  const sql = 'INSERT INTO registros_alunos (aluno_id, turma_id, data, alimentacao, comportamento, presenca, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE alimentacao = ?, comportamento = ?, presenca = ?, observacoes = ?';
  db.query(sql, [aluno_id, turma_id, data, alimentacao, comportamento, presenca, observacoes, alimentacao, comportamento, presenca, observacoes], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao salvar registro' });
    res.json({ id: result.insertId });
  });
});

// Eventos do Calendário
app.get('/eventos', (req, res) => {
  db.query('SELECT date, title, color FROM calendario_events', (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar eventos' });
    res.json(result);
  });
});

app.post('/eventos', (req, res) => {
  const { date, title, color } = req.body;
  if (!date) {
    return res.status(400).json({ message: 'Campo obrigatório: date' });
  }
  const eventTitle = title || '';
  const eventColor = color || 'blue';
  const sql = 'INSERT INTO calendario_events (teacher_id, date, title, color) VALUES (NULL, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?, color = ?';
  db.query(sql, [date, eventTitle, eventColor, eventTitle, eventColor], (err, result) => {
    if (err) {
      console.error('Erro ao salvar evento:', err);
      return res.status(500).json({ message: 'Erro ao salvar evento', error: err.message });
    }
    res.json({ message: 'Evento salvo', id: result.insertId });
  });
});

app.delete('/eventos/:date', (req, res) => {
  db.query('DELETE FROM calendario_events WHERE date = ? AND teacher_id IS NULL', [req.params.date], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao remover evento' });
    res.json({ message: 'Evento removido' });
  });
});

// Termos Aceitos
app.post('/termos', (req, res) => {
  const { user_type, user_id, ip_address } = req.body;
  const sql = 'INSERT INTO termos_aceitos (user_type, user_id, aceito, ip_address) VALUES (?, ?, TRUE, ?) ON DUPLICATE KEY UPDATE aceito = TRUE, data_aceite = CURRENT_TIMESTAMP';
  db.query(sql, [user_type, user_id, ip_address], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao salvar aceite de termos' });
    res.json({ message: 'Termos aceitos' });
  });
});

app.get('/termos/:user_type/:user_id', (req, res) => {
  db.query('SELECT aceito FROM termos_aceitos WHERE user_type = ? AND user_id = ?', [req.params.user_type, req.params.user_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao verificar termos' });
    res.json({ aceito: result.length > 0 && result[0].aceito });
  });
});

app.use(express.static(path.join(__dirname)));

// Endpoint temporário para modificar colunas avatar para LONGTEXT
app.get('/setup-avatar-columns', (req, res) => {
  db.query('ALTER TABLE alunos MODIFY COLUMN avatar LONGTEXT', (err1) => {
    db.query('ALTER TABLE docentes MODIFY COLUMN avatar LONGTEXT', (err2) => {
      const msg1 = err1 ? err1.message : 'OK';
      const msg2 = err2 ? err2.message : 'OK';
      res.json({ success: true, alunos: msg1, docentes: msg2 });
    });
  });
});

// Endpoint para configurar tabelas de visibilidade
app.get('/setup-visibilidade', (req, res) => {
  const queries = [
    'ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS tipo_destinatario ENUM(\'geral\', \'individual\', \'grupo\') DEFAULT \'geral\'',
    'ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS visibilidade ENUM(\'publico\', \'privado\') DEFAULT \'publico\'',
    `CREATE TABLE IF NOT EXISTS comunicado_visibilidade (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comunicado_id INT NOT NULL,
      user_type ENUM('aluno', 'docente') NOT NULL,
      user_id INT NOT NULL,
      pode_visualizar BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comunicado_id) REFERENCES comunicados(id) ON DELETE CASCADE,
      UNIQUE KEY unique_comunicado_user (comunicado_id, user_type, user_id)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_visibilidade_comunicado ON comunicado_visibilidade(comunicado_id)',
    'CREATE INDEX IF NOT EXISTS idx_visibilidade_user ON comunicado_visibilidade(user_type, user_id)'
  ];
  
  let results = [];
  let completed = 0;
  
  queries.forEach((query, index) => {
    db.query(query, (err) => {
      results[index] = err ? err.message : 'OK';
      completed++;
      if (completed === queries.length) {
        res.json({ success: true, results });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});