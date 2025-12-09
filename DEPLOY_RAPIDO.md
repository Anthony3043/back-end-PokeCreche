# 🚀 Deploy Rápido - Checklist

## ✅ Pré-requisitos
- [ ] Conta no Railway (https://railway.app)
- [ ] Conta no Vercel (https://vercel.com)
- [ ] Código no GitHub/GitLab/Bitbucket

---

## 📋 Passo a Passo

### 1️⃣ Railway - Banco de Dados (5 min)

```
1. Railway → New Project → Provision MySQL
2. Copiar DATABASE_URL (aba Variables)
3. Ir em Data → Query → Colar database_schema.sql → Run Query
4. Verificar: SHOW TABLES;
```

**DATABASE_URL copiada:** `mysql://...`

---

### 2️⃣ Vercel - Backend API (5 min)

```
1. Vercel → Add New → Project
2. Import seu repositório Git
3. Root Directory: ./
4. Deploy
```

**Adicionar Environment Variables:**
```
DATABASE_URL = [colar a URL do Railway]
NODE_ENV = production
JWT_SECRET = [gerar senha forte]
PORT = 3000
```

**URL da API:** `https://seu-app.vercel.app`

---

### 3️⃣ Testar (2 min)

**Health Check:**
```bash
curl https://seu-app.vercel.app/api/health
```

**Cadastrar Aluno:**
```bash
curl -X POST https://seu-app.vercel.app/register/aluno \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","cpf":"12345678900","matricula":"2024001"}'
```

**Login:**
```bash
curl -X POST https://seu-app.vercel.app/login/aluno \
  -H "Content-Type: application/json" \
  -d '{"matricula":"2024001","cpf":"12345678900"}'
```

---

### 4️⃣ Frontend (Opcional)

**Se usar Ionic/Angular/React, configure:**
```typescript
// environment.prod.ts ou .env.production
API_URL = 'https://seu-app.vercel.app'
```

**Atualizar CORS no backend (server.js):**
```javascript
origin: [
  'http://localhost:8100',
  'https://seu-frontend.vercel.app'
]
```

---

## 🔧 Comandos Úteis

**Forçar novo deploy no Vercel:**
```bash
vercel --prod
```

**Ver logs do Vercel:**
```
Vercel Dashboard → Deployments → View Function Logs
```

**Testar banco Railway:**
```sql
-- No Railway Query
SELECT * FROM alunos;
SELECT * FROM docentes;
```

---

## ⚠️ Problemas Comuns

| Erro | Solução |
|------|---------|
| Database connection failed | Verificar DATABASE_URL no Vercel |
| Table doesn't exist | Executar database_schema.sql no Railway |
| CORS error | Adicionar URL do frontend no server.js |
| 500 Internal Error | Ver logs no Vercel Deployments |

---

## 📱 URLs Importantes

- **API Backend:** https://seu-app.vercel.app
- **Health Check:** https://seu-app.vercel.app/api/health
- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## ✨ Pronto!

Seu sistema está no ar com:
- ✅ Banco MySQL gerenciado (Railway)
- ✅ API serverless (Vercel)
- ✅ Deploy automático via Git
- ✅ SSL/HTTPS incluído
