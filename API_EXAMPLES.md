# 🧪 Exemplos de Requisições - API CrecheApp

## 📝 Substitua `https://seu-app.vercel.app` pela URL real da sua API

---

## 🏥 Health Check

### Verificar se a API está online

**cURL:**
```bash
curl https://seu-app.vercel.app/api/health
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "message": "🚀 CrecheApp Online!",
  "environment": "production",
  "platform": "railway"
}
```

---

## 👨‍🎓 Alunos

### 1. Cadastrar Aluno

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/register/aluno \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "12345678900",
    "matricula": "2024001"
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/register/aluno', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    cpf: '12345678900',
    matricula: '2024001'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**Resposta:**
```json
{
  "message": "🎉 Aluno cadastrado com sucesso!",
  "id": 1
}
```

---

### 2. Login de Aluno

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/login/aluno \
  -H "Content-Type: application/json" \
  -d '{
    "matricula": "2024001",
    "cpf": "12345678900"
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/login/aluno', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matricula: '2024001',
    cpf: '12345678900'
  })
})
.then(res => res.json())
.then(data => {
  console.log(data);
  localStorage.setItem('token', data.token); // Salvar token
});
```

**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nome": "João Silva",
    "matricula": "2024001"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Listar Todos os Alunos

**cURL:**
```bash
curl https://seu-app.vercel.app/alunos
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/alunos')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 👨‍🏫 Docentes

### 1. Cadastrar Docente

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/register/docente \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "identificador": "prof123",
    "senha": "senha123"
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/register/docente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Maria Santos',
    identificador: 'prof123',
    senha: 'senha123'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 2. Login de Docente

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/login/docente \
  -H "Content-Type: application/json" \
  -d '{
    "identificador": "prof123",
    "senha": "senha123"
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/login/docente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identificador: 'prof123',
    senha: 'senha123'
  })
})
.then(res => res.json())
.then(data => {
  console.log(data);
  localStorage.setItem('token', data.token);
});
```

---

## 🏫 Turmas

### 1. Listar Turmas

**cURL:**
```bash
curl https://seu-app.vercel.app/turmas
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/turmas')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 2. Criar Turma

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/turmas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Turma A",
    "ano": "2024"
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/turmas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Turma A',
    ano: '2024'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 3. Listar Alunos de uma Turma

**cURL:**
```bash
curl https://seu-app.vercel.app/turmas/1/alunos
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/turmas/1/alunos')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 4. Adicionar Aluno à Turma

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/turmas/1/alunos \
  -H "Content-Type: application/json" \
  -d '{
    "aluno_id": 1
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/turmas/1/alunos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    aluno_id: 1
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 5. Atualizar Turma

**cURL:**
```bash
curl -X PUT https://seu-app.vercel.app/turmas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Turma A - Atualizada",
    "ano": "2024"
  }'
```

---

### 6. Deletar Turma

**cURL:**
```bash
curl -X DELETE https://seu-app.vercel.app/turmas/1
```

---

## 📝 Registros

### 1. Criar Registro Diário

**cURL:**
```bash
curl -X POST https://seu-app.vercel.app/registros \
  -H "Content-Type: application/json" \
  -d '{
    "aluno_id": 1,
    "turma_id": 1,
    "data": "2024-01-15",
    "alimentacao": "Ótimo",
    "comportamento": "Bom",
    "presenca": "Presente",
    "observacoes": "Participou bem das atividades"
  }'
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/registros', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    aluno_id: 1,
    turma_id: 1,
    data: '2024-01-15',
    alimentacao: 'Ótimo',
    comportamento: 'Bom',
    presenca: 'Presente',
    observacoes: 'Participou bem das atividades'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 2. Listar Registros de um Aluno

**cURL:**
```bash
curl https://seu-app.vercel.app/registros/1
```

**JavaScript/Fetch:**
```javascript
fetch('https://seu-app.vercel.app/registros/1')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🔐 Usando JWT Token

Após fazer login, use o token nas requisições autenticadas:

**JavaScript/Fetch:**
```javascript
const token = localStorage.getItem('token');

fetch('https://seu-app.vercel.app/registros/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

**cURL:**
```bash
curl https://seu-app.vercel.app/registros/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🧪 Testando com Postman

1. Importe a coleção abaixo
2. Configure a variável `{{baseUrl}}` = `https://seu-app.vercel.app`
3. Execute as requisições

**Coleção Postman:**
```json
{
  "info": {
    "name": "CrecheApp API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://seu-app.vercel.app"
    }
  ]
}
```

---

## 📱 Exemplo Completo - Ionic/Angular

```typescript
import { HttpClient } from '@angular/common/http';

export class ApiService {
  private apiUrl = 'https://seu-app.vercel.app';

  constructor(private http: HttpClient) {}

  // Login de aluno
  loginAluno(matricula: string, cpf: string) {
    return this.http.post(`${this.apiUrl}/login/aluno`, {
      matricula,
      cpf
    });
  }

  // Cadastrar aluno
  cadastrarAluno(nome: string, cpf: string, matricula: string) {
    return this.http.post(`${this.apiUrl}/register/aluno`, {
      nome,
      cpf,
      matricula
    });
  }

  // Listar turmas
  listarTurmas() {
    return this.http.get(`${this.apiUrl}/turmas`);
  }

  // Criar registro
  criarRegistro(dados: any) {
    const token = localStorage.getItem('token');
    return this.http.post(`${this.apiUrl}/registros`, dados, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}
```

---

## ✅ Checklist de Testes

- [ ] Health check funcionando
- [ ] Cadastro de aluno
- [ ] Login de aluno
- [ ] Cadastro de docente
- [ ] Login de docente
- [ ] Criar turma
- [ ] Listar turmas
- [ ] Adicionar aluno à turma
- [ ] Criar registro
- [ ] Listar registros

---

**🎉 API pronta para uso!**
