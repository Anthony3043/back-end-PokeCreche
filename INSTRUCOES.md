# 🎯 Instruções de Uso - PokeCreche

## ✅ Configuração Concluída!

Seu projeto PokeCreche está configurado e pronto para uso. Aqui estão as próximas etapas:

## 🚀 Como Executar

### Opção 1: Com MySQL Local (Recomendado)
```bash
# 1. Instalar MySQL (se não tiver)
# Download: https://dev.mysql.com/downloads/mysql/

# 2. Configurar banco
npm run init

# 3. Executar aplicação
npm run dev
```

### Opção 2: Sem MySQL Local (Limitado)
```bash
# Executar apenas o servidor (sem banco)
npm run dev:simple
```

### Opção 3: Deploy Direto (Produção)
```bash
# 1. Fazer push para GitHub
git add .
git commit -m "Setup inicial PokeCreche"
git push origin main

# 2. Deploy no Railway
# - Acesse railway.app
# - Conecte seu repositório
# - Adicione MySQL service
# - Deploy automático!
```

## 🌐 Acessar a Aplicação

Após executar, acesse:
- **Local**: http://localhost:3000
- **Railway**: https://seu-app.railway.app

## 🔑 Credenciais Padrão

Após executar `npm run init`:
- **Usuário**: admin
- **Senha**: admin123

## 📋 Funcionalidades Disponíveis

### ✅ Funcionando Agora
- Interface web responsiva
- Cadastro de alunos
- Cadastro de docentes
- Gerenciamento de turmas
- Sistema de registros diários
- Deploy automático

### 🔧 Configurações Criadas
- ✅ Servidor Express configurado
- ✅ Banco MySQL/PostgreSQL compatível
- ✅ Templates EJS responsivos
- ✅ Sistema de autenticação
- ✅ API REST completa
- ✅ Deploy Railway/Vercel
- ✅ Scripts de inicialização
- ✅ Documentação completa

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor com logs detalhados
npm run dev:simple       # Servidor simples
npm start               # Produção

# Configuração
npm run init            # Inicializar banco
npm run setup           # Setup completo
npm run setup:simple    # Apenas instalar dependências

# Verificação
npm run test            # (Adicionar testes futuramente)
```

## 🔧 Troubleshooting

### Problema: Erro de conexão MySQL
**Solução:**
1. Instalar MySQL: https://dev.mysql.com/downloads/
2. Verificar credenciais no `.env`
3. Executar: `npm run init`

### Problema: Porta 3000 em uso
**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou alterar porta no .env
PORT=3001
```

### Problema: Módulos não encontrados
**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Próximos Passos

1. **Testar Localmente**
   - Execute `npm run dev`
   - Acesse http://localhost:3000
   - Teste cadastros de aluno/docente

2. **Deploy em Produção**
   - Push para GitHub
   - Deploy no Railway
   - Configurar domínio personalizado

3. **Personalizar**
   - Alterar cores em `public/css/styles.css`
   - Modificar templates em `views/`
   - Adicionar novas funcionalidades

## 📞 Suporte

Se encontrar problemas:
1. Verifique o arquivo `README.md`
2. Consulte `setup.md` para configurações
3. Abra uma issue no GitHub

## 🎉 Parabéns!

Seu sistema PokeCreche está pronto para uso! 

**Próximo comando sugerido:**
```bash
npm run dev
```

Depois acesse: http://localhost:3000