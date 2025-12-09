# 🚀 Guia Completo de Deploy - CrecheApp

## Arquitetura do Deploy
- **Banco de Dados**: Railway (MySQL)
- **Backend API**: Vercel (Serverless)
- **Frontend**: Vercel (ou outra plataforma)

---

## 📦 PARTE 1: Banco de Dados no Railway

### Passo 1: Criar Projeto e MySQL
1. Acesse https://railway.app e faça login
2. Clique em **"New Project"**
3. Selecione **"Provision MySQL"**
4. Aguarde o provisionamento (1-2 minutos)

### Passo 2: Obter DATABASE_URL
1. Clique no serviço **MySQL** criado
2. Vá na aba **"Variables"**
3. Copie o valor de **`DATABASE_URL`**
   - Formato: `mysql://user:password@host:port/database`

### Passo 3: Executar Schema do Banco

**Opção A - Via Railway Query (Recomendado)**
1. No Railway, clique no MySQL
2. Vá em **"Data"** → **"Query"**
3. Cole e execute o conteúdo do arquivo `database_schema.sql`
4. Clique em **"Run Query"**

**Opção B - Via MySQL Workbench**
1. Abra o MySQL Workbench
2. Crie nova conexão usando os dados do Railway:
   - Host: (do DATABASE_URL)
   - Port: (do DATABASE_URL)
   - User: (do DATABASE_URL)
   - Password: (do DATABASE_URL)
3. Execute o arquivo `database_schema.sql`

### Passo 4: Verificar Tabelas Criadas
Execute no Railway Query:
```sql
SHOW TABLES;
```

Deve mostrar:
- alunos
- docentes
- turmas
- turma_alunos
- calendario_events
- comunicados
- comunicado_destinatarios
- rascunhos
- registros_alunos
- termos_aceitos
- sessoes

---

## 🌐 PARTE 2: Backend API no Vercel

### Passo 1: Preparar o Projeto

1. **Certifique-se que o projeto está em um repositório Git**
   ```bash
   cd back-end-CrecheApp
   git init
   git add .
   git commit -m "Preparando deploy"
   ```

2. **Envie para GitHub/GitLab/Bitbucket**
   ```bash
   git remote add origin https://github.com/seu-usuario/seu-repo.git
   git push -u origin main
   ```

### Passo 2: Deploy no Vercel

1. Acesse https://vercel.com e faça login
2. Clique em **"Add New"** → **"Project"**
3. **Import** seu repositório Git
4. Configure o projeto:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (ou `back-end-CrecheApp` se estiver em subpasta)
   - **Build Command**: `npm install`
   - **Output Directory**: deixe vazio
   - **Install Command**: `npm install`

### Passo 3: Configurar Variáveis de Ambiente

1. No Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Adicione as seguintes variáveis:

```env
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
JWT_SECRET=seu_secret_super_seguro_aqui_123
PORT=3000
```

**⚠️ IMPORTANTE:**
- Substitua `DATABASE_URL` pela URL copiada do Railway
- Gere um `JWT_SECRET` forte (use um gerador de senhas)
- Salve cada variável individualmente

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Após concluir, você receberá uma URL: `https://seu-app.vercel.app`

---

## ✅ PARTE 3: Testar a API

### Teste 1: Health Check
```bash
curl https://seu-app.vercel.app/api/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "message": "🚀 CrecheApp Online!",
  "environment": "production",
  "platform": "railway"
}
```

### Teste 2: Cadastrar Aluno
```bash
curl -X POST https://seu-app.vercel.app/register/aluno \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "12345678900",
    "matricula": "2024001"
  }'
```

### Teste 3: Login de Aluno
```bash
curl -X POST https://seu-app.vercel.app/login/aluno \
  -H "Content-Type: application/json" \
  -d '{
    "matricula": "2024001",
    "cpf": "12345678900"
  }'
```

---

## 🎨 PARTE 4: Frontend (Opcional)

Se você tem um frontend separado:

### Opção A: Deploy no Vercel
1. Repita o processo de deploy para o frontend
2. Configure a variável de ambiente:
   ```
   VITE_API_URL=https://seu-backend.vercel.app
   ```
   ou
   ```
   REACT_APP_API_URL=https://seu-backend.vercel.app
   ```

### Opção B: Atualizar CORS no Backend
No arquivo `server.js`, atualize o CORS:
```javascript
app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://localhost:4200',
    'https://seu-frontend.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

---

## 🔧 Troubleshooting

### Erro: "Database connection failed"
- Verifique se o `DATABASE_URL` está correto no Vercel
- Teste a conexão no Railway Query
- Verifique se o MySQL está ativo no Railway

### Erro: "Table doesn't exist"
- Execute novamente o `database_schema.sql` no Railway
- Verifique com `SHOW TABLES;`

### Erro 500 no Vercel
- Vá em **"Deployments"** → clique no deploy → **"View Function Logs"**
- Verifique os logs de erro

### Deploy não atualiza
- Force um novo deploy: **"Deployments"** → **"Redeploy"**
- Limpe o cache: marque **"Use existing Build Cache"** como OFF

---

## 📊 Monitoramento

### Railway
- Acesse o dashboard para ver uso de CPU/RAM/Disco
- Configure alertas de uso

### Vercel
- Veja logs em tempo real em **"Deployments"** → **"Function Logs"**
- Monitore uso em **"Analytics"**

---

## 🎯 Próximos Passos

1. ✅ Configure domínio customizado no Vercel
2. ✅ Configure backup automático no Railway
3. ✅ Adicione monitoramento de erros (Sentry)
4. ✅ Configure CI/CD para deploy automático
5. ✅ Adicione testes automatizados

---

## 💰 Custos Estimados

- **Railway MySQL**: ~$5-10/mês (plano Hobby)
- **Vercel**: Grátis até 100GB bandwidth
- **Total**: ~$5-10/mês

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no Vercel
2. Teste a conexão do banco no Railway
3. Revise as variáveis de ambiente
4. Consulte a documentação:
   - Railway: https://docs.railway.app
   - Vercel: https://vercel.com/docs