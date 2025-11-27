# 🏫 PokeCreche - Sistema de Gestão Escolar

Sistema completo para gerenciamento de creches e escolas infantis, desenvolvido com Node.js, Express e MySQL.

## ✨ Funcionalidades

- 👶 **Cadastro de Alunos** - Gerenciamento completo de estudantes
- 👨‍🏫 **Cadastro de Docentes** - Sistema de professores e funcionários  
- 🏛️ **Gerenciamento de Turmas** - Organização por classes
- 📊 **Registros Diários** - Acompanhamento de alimentação, comportamento e presença
- 🌐 **Interface Web Responsiva** - Funciona em desktop e mobile
- 🚀 **Deploy Automático** - Compatível com Railway e Vercel

## 🚀 Início Rápido

### 1. Clonar e Instalar
```bash
git clone <seu-repositorio>
cd back-end-PokeCreche
npm run setup
```

### 2. Configurar Banco de Dados
O script `npm run setup` já configura tudo automaticamente!

### 3. Executar
```bash
npm start
```

Acesse: http://localhost:3000

## 🔧 Configuração Manual

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+
- Git

### Instalação Passo a Passo

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Configurar MySQL**
   ```bash
   # Executar o script SQL
   mysql -u root -p < mysql_schema.sql
   ```

3. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Editar .env com suas configurações
   ```

4. **Inicializar banco**
   ```bash
   npm run init
   ```

5. **Executar aplicação**
   ```bash
   npm run dev
   ```

## 🌐 Deploy

### Railway (Recomendado)
1. Conecte seu repositório no [Railway](https://railway.app)
2. Adicione um serviço MySQL
3. Deploy automático!

### Vercel
1. Conecte no [Vercel](https://vercel.com)
2. Configure variáveis de ambiente
3. Use banco externo (PlanetScale, Railway MySQL, etc.)

## 📋 Variáveis de Ambiente

```env
# Servidor
NODE_ENV=development
PORT=3000
JWT_SECRET=seu_jwt_secret_aqui

# MySQL Local
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=pokecreche
DB_PORT=3306

# Produção (Railway configura automaticamente)
DATABASE_URL=mysql://user:pass@host:port/db
```

## 🛠️ Scripts Disponíveis

- `npm start` - Executar em produção
- `npm run dev` - Executar em desenvolvimento
- `npm run init` - Inicializar banco de dados
- `npm run setup` - Setup completo (install + init)

## 📊 API Endpoints

### Saúde do Sistema
- `GET /api/health` - Status da aplicação

### Alunos
- `POST /register/aluno` - Cadastrar novo aluno
- `GET /api/alunos` - Listar todos os alunos

### Docentes  
- `POST /register/docente` - Cadastrar novo docente

### Turmas
- `GET /turmas` - Listar turmas
- `POST /turmas` - Criar nova turma
- `PUT /turmas/:id` - Atualizar turma
- `DELETE /turmas/:id` - Excluir turma
- `GET /turmas/:id/alunos` - Alunos da turma
- `POST /turmas/:id/alunos` - Adicionar aluno à turma

### Registros
- `POST /registros` - Criar registro diário
- `GET /registros/:alunoId` - Registros de um aluno

## 🎨 Estrutura do Projeto

```
back-end-PokeCreche/
├── public/              # Arquivos estáticos
│   ├── css/            # Estilos CSS
│   └── js/             # JavaScript frontend
├── views/              # Templates EJS
│   ├── pages/          # Páginas principais
│   └── partials/       # Componentes reutilizáveis
├── server.js           # Servidor principal
├── init.js             # Script de inicialização
├── mysql_schema.sql    # Schema MySQL
├── supabase_schema.sql # Schema PostgreSQL
└── package.json        # Dependências
```

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Validação de dados de entrada
- Proteção contra SQL injection
- CORS configurado
- JWT para autenticação

## 🐛 Troubleshooting

### Erro de Conexão MySQL
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql
```

### Porta em Uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac  
lsof -ti:3000 | xargs kill -9
```

### Problemas de Permissão MySQL
```sql
-- Criar usuário e dar permissões
CREATE USER 'pokecreche'@'localhost' IDENTIFIED BY 'senha123';
GRANT ALL PRIVILEGES ON pokecreche.* TO 'pokecreche'@'localhost';
FLUSH PRIVILEGES;
```

## 📱 Dados de Teste

Após executar `npm run init`, você terá:

**Usuário Admin:**
- Login: `admin`
- Senha: `admin123`

**Turmas de Exemplo:**
- Turma A (2024)
- Turma B (2024)  
- Turma C (2024)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📧 Email: suporte@pokecreche.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/back-end-PokeCreche/issues)
- 📖 Documentação: [Wiki](https://github.com/seu-usuario/back-end-PokeCreche/wiki)

---

Desenvolvido com ❤️ para facilitar a gestão de creches e escolas infantis.