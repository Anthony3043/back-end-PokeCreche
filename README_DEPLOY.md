# 🎯 CrecheApp - Guia de Deploy Completo

## 📚 Documentação Disponível

Este projeto contém toda a documentação necessária para fazer o deploy completo da aplicação.

---

## 📖 Guias Disponíveis

### 1. **DEPLOY_RAILWAY_VERCEL.md** ⭐ PRINCIPAL
Guia completo e detalhado com:
- Configuração do banco MySQL no Railway
- Deploy do backend no Vercel
- Testes da API
- Troubleshooting
- Monitoramento

**👉 Comece por aqui se é sua primeira vez!**

---

### 2. **DEPLOY_RAPIDO.md** ⚡ CHECKLIST
Checklist rápido para quem já conhece o processo:
- Passo a passo resumido
- Comandos úteis
- Tabela de problemas comuns

**👉 Use este para deploys rápidos!**

---

### 3. **FRONTEND_CONFIG.md** 📱 INTEGRAÇÃO
Como conectar o frontend com a API:
- Configuração por framework (Ionic, React, Vue)
- Endpoints disponíveis
- Uso de JWT tokens
- Deploy do frontend

**👉 Use após fazer deploy do backend!**

---

## 🚀 Início Rápido

### Opção 1: Verificação Automática
```bash
deploy-check.bat
```

### Opção 2: Manual

**1. Railway (Banco de Dados)**
```
1. https://railway.app → New Project → MySQL
2. Copiar DATABASE_URL
3. Executar database_schema.sql
```

**2. Vercel (Backend)**
```
1. https://vercel.com → Import Git
2. Adicionar variáveis:
   - DATABASE_URL
   - NODE_ENV=production
   - JWT_SECRET
3. Deploy
```

**3. Testar**
```bash
curl https://seu-app.vercel.app/api/health
```

---

## 📁 Estrutura do Projeto

```
back-end-CrecheApp/
├── api/
│   └── index.js              # Entry point Vercel
├── public/                   # Arquivos estáticos
├── views/                    # Templates EJS
├── server.js                 # Servidor principal
├── database_schema.sql       # Schema do banco
├── vercel.json              # Config Vercel
├── railway.toml             # Config Railway
├── package.json             # Dependências
├── .env                     # Config local
├── .env.production          # Config produção
│
├── DEPLOY_RAILWAY_VERCEL.md # 📖 Guia completo
├── DEPLOY_RAPIDO.md         # ⚡ Checklist
├── FRONTEND_CONFIG.md       # 📱 Integração frontend
└── README_DEPLOY.md         # 📚 Este arquivo
```

---

## 🔧 Tecnologias

- **Backend**: Node.js + Express
- **Banco**: MySQL (Railway)
- **Deploy**: Vercel (Serverless)
- **Auth**: JWT
- **Views**: EJS

---

## 🌐 URLs Após Deploy

- **API**: `https://seu-app.vercel.app`
- **Health Check**: `https://seu-app.vercel.app/api/health`
- **Cadastro Aluno**: `https://seu-app.vercel.app/alunos`
- **Cadastro Docente**: `https://seu-app.vercel.app/docentes`

---

## 📊 Endpoints Principais

### Autenticação
- `POST /login/aluno` - Login de aluno
- `POST /login/docente` - Login de docente
- `POST /register/aluno` - Cadastro de aluno
- `POST /register/docente` - Cadastro de docente

### Turmas
- `GET /turmas` - Listar turmas
- `POST /turmas` - Criar turma
- `GET /turmas/:id/alunos` - Alunos da turma

### Registros
- `POST /registros` - Criar registro
- `GET /registros/:alunoId` - Registros do aluno

---

## ⚙️ Variáveis de Ambiente

Configurar no Vercel:

```env
DATABASE_URL=mysql://user:pass@host:port/db
NODE_ENV=production
JWT_SECRET=seu_secret_forte_aqui
PORT=3000
```

---

## 🔐 Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ JWT para autenticação
- ✅ CORS configurado
- ✅ SSL/HTTPS automático (Vercel)
- ✅ Variáveis de ambiente protegidas

---

## 💰 Custos

- **Railway MySQL**: ~$5-10/mês
- **Vercel**: Grátis (até 100GB bandwidth)
- **Total**: ~$5-10/mês

---

## 📞 Suporte

**Problemas com deploy?**
1. Verifique os logs no Vercel
2. Teste o banco no Railway
3. Consulte o guia de troubleshooting
4. Revise as variáveis de ambiente

**Documentação oficial:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs

---

## ✅ Checklist Final

- [ ] Banco MySQL criado no Railway
- [ ] Schema executado (database_schema.sql)
- [ ] DATABASE_URL copiada
- [ ] Projeto no Git (GitHub/GitLab)
- [ ] Deploy no Vercel configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Health check funcionando
- [ ] Testes de login realizados
- [ ] Frontend configurado (se aplicável)
- [ ] CORS atualizado (se necessário)

---

## 🎉 Pronto!

Seu sistema está no ar! 🚀

Próximos passos:
1. Configure domínio customizado
2. Configure backup automático
3. Adicione monitoramento
4. Configure CI/CD

---

**Desenvolvido com ❤️ para CrecheApp**
