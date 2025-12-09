# 📱 Configuração do Frontend

## Conectando o Frontend com a API

Após fazer o deploy do backend no Vercel, você precisa configurar o frontend para se conectar à API.

---

## 🔧 Configuração por Framework

### Ionic/Angular

**1. Criar arquivo de ambiente de produção:**

`src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://seu-app.vercel.app'
};
```

**2. Usar no serviço:**

`src/app/services/api.service.ts`
```typescript
import { environment } from '../../environments/environment';

export class ApiService {
  private apiUrl = environment.apiUrl;

  login(matricula: string, cpf: string) {
    return this.http.post(`${this.apiUrl}/login/aluno`, {
      matricula,
      cpf
    });
  }
}
```

---

### React/Vite

**1. Criar arquivo `.env.production`:**
```env
VITE_API_URL=https://seu-app.vercel.app
```

**2. Usar no código:**
```javascript
const API_URL = import.meta.env.VITE_API_URL;

async function login(matricula, cpf) {
  const response = await fetch(`${API_URL}/login/aluno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricula, cpf })
  });
  return response.json();
}
```

---

### React/Create React App

**1. Criar arquivo `.env.production`:**
```env
REACT_APP_API_URL=https://seu-app.vercel.app
```

**2. Usar no código:**
```javascript
const API_URL = process.env.REACT_APP_API_URL;

async function login(matricula, cpf) {
  const response = await fetch(`${API_URL}/login/aluno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricula, cpf })
  });
  return response.json();
}
```

---

### Vue.js

**1. Criar arquivo `.env.production`:**
```env
VUE_APP_API_URL=https://seu-app.vercel.app
```

**2. Usar no código:**
```javascript
const API_URL = process.env.VUE_APP_API_URL;

export default {
  methods: {
    async login(matricula, cpf) {
      const response = await fetch(`${API_URL}/login/aluno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula, cpf })
      });
      return response.json();
    }
  }
}
```

---

## 🔐 Endpoints Disponíveis

### Autenticação

**Login de Aluno:**
```
POST /login/aluno
Body: { "matricula": "2024001", "cpf": "12345678900" }
```

**Login de Docente:**
```
POST /login/docente
Body: { "identificador": "prof123", "senha": "senha123" }
```

**Cadastro de Aluno:**
```
POST /register/aluno
Body: { "nome": "João", "cpf": "12345678900", "matricula": "2024001" }
```

**Cadastro de Docente:**
```
POST /register/docente
Body: { "nome": "Maria", "identificador": "prof123", "senha": "senha123" }
```

### Turmas

**Listar Turmas:**
```
GET /turmas
```

**Criar Turma:**
```
POST /turmas
Body: { "nome": "Turma A", "ano": "2024" }
```

**Alunos de uma Turma:**
```
GET /turmas/:id/alunos
```

### Registros

**Criar Registro:**
```
POST /registros
Body: {
  "aluno_id": 1,
  "turma_id": 1,
  "data": "2024-01-15",
  "alimentacao": "Ótimo",
  "comportamento": "Bom",
  "presenca": "Presente",
  "observacoes": "Participou bem"
}
```

**Listar Registros de Aluno:**
```
GET /registros/:alunoId
```

---

## 🌐 Atualizar CORS no Backend

Se o frontend estiver em outro domínio, atualize o CORS no `server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://localhost:4200',
    'https://seu-frontend.vercel.app',
    'https://seu-app.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

Depois faça commit e push para atualizar no Vercel.

---

## 🔑 Usando JWT Token

Após o login, você receberá um token JWT:

```javascript
const response = await fetch(`${API_URL}/login/aluno`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ matricula, cpf })
});

const data = await response.json();
const token = data.token; // Salvar este token

// Usar em requisições autenticadas
fetch(`${API_URL}/registros/1`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📦 Deploy do Frontend no Vercel

**1. Preparar o projeto:**
```bash
cd seu-frontend
npm install
npm run build
```

**2. Deploy:**
```bash
vercel --prod
```

**3. Configurar variáveis de ambiente no Vercel:**
- `VITE_API_URL` ou `REACT_APP_API_URL` = URL do backend

---

## ✅ Checklist de Integração

- [ ] Configurar URL da API no frontend
- [ ] Testar login de aluno
- [ ] Testar login de docente
- [ ] Testar cadastro
- [ ] Atualizar CORS no backend
- [ ] Fazer deploy do frontend
- [ ] Testar em produção

---

## 🐛 Troubleshooting

**Erro: CORS blocked**
- Adicione a URL do frontend no array `origin` do CORS no `server.js`

**Erro: Network request failed**
- Verifique se a URL da API está correta
- Teste a API diretamente: `https://seu-app.vercel.app/api/health`

**Erro: 401 Unauthorized**
- Verifique se o token JWT está sendo enviado corretamente
- Token deve estar no header: `Authorization: Bearer ${token}`

**Erro: 500 Internal Server Error**
- Verifique os logs no Vercel Dashboard
- Teste a conexão do banco no Railway
