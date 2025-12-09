# Deploy: BD Railway + Backend Vercel

## 1. Banco de Dados no Railway

### Passo 1: Criar MySQL no Railway
1. Acesse https://railway.app
2. New Project → Add MySQL
3. Aguarde provisionar

### Passo 2: Executar Schema
1. No Railway, clique no MySQL
2. Vá em "Data" → "Query"
3. Execute o SQL:

```sql
CREATE TABLE IF NOT EXISTS alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(20) NOT NULL UNIQUE,
  matricula VARCHAR(50) NOT NULL,
  avatar TEXT,
  turma_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS docentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  identificador VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS turmas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  ano VARCHAR(10) NOT NULL,
  foto TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
);
```

### Passo 3: Copiar DATABASE_URL
- No Railway MySQL → Variables → Copie `DATABASE_URL`

## 2. Backend no Vercel

### Passo 1: Preparar projeto
```bash
npm install
```

### Passo 2: Deploy no Vercel
1. Acesse https://vercel.com
2. Import Git Repository
3. Conecte seu GitHub/repositório
4. Configure:
   - Framework: Other
   - Build Command: `npm install`
   - Output Directory: deixe vazio
   - Install Command: `npm install`

### Passo 3: Adicionar Variáveis no Vercel
```
DATABASE_URL=mysql://[sua-url-do-railway]
NODE_ENV=production
JWT_SECRET=pokecreche_secret_production
```

## 3. Testar
- Acesse: `https://seu-app.vercel.app/api/health`
- Deve retornar status "healthy"

## 4. Vantagens
✅ BD Railway: Gerenciado, backup automático
✅ Backend Vercel: Deploy automático, CDN global
✅ Separação completa de responsabilidades