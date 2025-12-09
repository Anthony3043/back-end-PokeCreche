# Guia de Deploy Separado - PokeCreche

## 1. Configurar Banco de Dados (PlanetScale)

### Passo 1: Criar conta no PlanetScale
1. Acesse https://planetscale.com
2. Crie conta gratuita
3. Crie novo database: `pokecreche-db`

### Passo 2: Obter string de conexão
1. No dashboard, vá em "Connect"
2. Selecione "Node.js"
3. Copie a DATABASE_URL

### Passo 3: Executar schema
```sql
-- Execute no console do PlanetScale
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

## 2. Deploy do Backend (Railway)

### Passo 1: Configurar variáveis no Railway
```
DATABASE_URL=mysql://[sua-string-do-planetscale]
NODE_ENV=production
JWT_SECRET=pokecreche_secret_production
```

### Passo 2: Deploy
```bash
# No seu projeto
git add .
git commit -m "Separar backend do banco"
git push origin main
```

## 3. Alternativa: Railway MySQL Separado

### Criar serviço MySQL no Railway:
1. New Project → Add MySQL
2. Copiar DATABASE_URL
3. Adicionar no seu backend como variável

## 4. Verificar Deploy

Acesse: `https://seu-app.railway.app/api/health`

Deve retornar:
```json
{
  "status": "healthy",
  "message": "🚀 PokeCreche Online!",
  "environment": "production",
  "platform": "railway"
}
```

## 5. Vantagens da Separação

✅ **Escalabilidade**: Backend e BD podem escalar independentemente
✅ **Manutenção**: Atualizações sem afetar dados
✅ **Backup**: Banco gerenciado com backup automático
✅ **Performance**: Banco otimizado separadamente
✅ **Segurança**: Isolamento de responsabilidades