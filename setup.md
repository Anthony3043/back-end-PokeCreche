# PokeCreche - Guia de Configuração

## 🚀 Setup Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados

#### MySQL Local
1. Instale o MySQL Server
2. Execute o script: `mysql_schema.sql`
3. Configure as variáveis no `.env`

#### Railway (Produção)
1. Crie conta no Railway.app
2. Adicione um banco MySQL
3. A variável `DATABASE_URL` será configurada automaticamente

### 3. Executar Aplicação

#### Desenvolvimento
```bash
npm run dev
```

#### Produção
```bash
npm start
```

## 📋 Variáveis de Ambiente

### Desenvolvimento Local (.env)
```
NODE_ENV=development
PORT=3000
JWT_SECRET=pokecreche_secret

# MySQL Local
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=pokecreche
DB_PORT=3306
```

### Produção (Railway)
- `DATABASE_URL` - Configurado automaticamente
- `NODE_ENV=production`
- `JWT_SECRET` - Configure manualmente

## 🌐 Deploy

### Railway
1. Conecte seu repositório GitHub
2. Adicione serviço MySQL
3. Deploy automático

### Vercel
1. Conecte repositório
2. Configure variáveis de ambiente
3. Use banco externo (PlanetScale, Railway, etc.)

## 📊 Endpoints da API

### Saúde
- `GET /api/health` - Status do sistema

### Alunos
- `POST /register/aluno` - Cadastrar aluno
- `GET /api/alunos` - Listar alunos

### Docentes
- `POST /register/docente` - Cadastrar docente

### Turmas
- `GET /turmas` - Listar turmas
- `POST /turmas` - Criar turma
- `PUT /turmas/:id` - Atualizar turma
- `DELETE /turmas/:id` - Excluir turma

## 🔧 Troubleshooting

### Erro de Conexão com Banco
1. Verifique se o MySQL está rodando
2. Confirme credenciais no `.env`
3. Execute o schema SQL

### Porta em Uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## 📱 Funcionalidades

- ✅ Cadastro de Alunos
- ✅ Cadastro de Docentes  
- ✅ Gerenciamento de Turmas
- ✅ Registros Diários
- ✅ Interface Web Responsiva
- ✅ Deploy Railway/Vercel
- ✅ Banco MySQL/PostgreSQL