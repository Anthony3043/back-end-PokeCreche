@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 CrecheApp - Verificação de Deploy
echo ========================================
echo.

echo 📦 Verificando dependências...
if not exist "node_modules\" (
    echo ❌ node_modules não encontrado
    echo 💡 Execute: npm install
    pause
    exit /b 1
) else (
    echo ✅ node_modules OK
)

echo.
echo 📄 Verificando arquivos necessários...

if exist "package.json" (
    echo ✅ package.json
) else (
    echo ❌ package.json não encontrado
)

if exist "vercel.json" (
    echo ✅ vercel.json
) else (
    echo ❌ vercel.json não encontrado
)

if exist "api\index.js" (
    echo ✅ api\index.js
) else (
    echo ❌ api\index.js não encontrado
)

if exist "server.js" (
    echo ✅ server.js
) else (
    echo ❌ server.js não encontrado
)

if exist "database_schema.sql" (
    echo ✅ database_schema.sql
) else (
    echo ❌ database_schema.sql não encontrado
)

echo.
echo 🔍 Verificando variáveis de ambiente...
if exist ".env.production" (
    echo ✅ .env.production existe
    echo.
    echo 📋 Conteúdo do .env.production:
    type .env.production
) else (
    echo ❌ .env.production não encontrado
)

echo.
echo ========================================
echo 📝 Próximos Passos:
echo ========================================
echo.
echo 1. Railway:
echo    - Criar MySQL no Railway
echo    - Copiar DATABASE_URL
echo    - Executar database_schema.sql
echo.
echo 2. Vercel:
echo    - Import repositório Git
echo    - Adicionar variáveis de ambiente
echo    - Deploy
echo.
echo 3. Testar:
echo    - Acessar /api/health
echo.
echo 📖 Guia completo: DEPLOY_RAILWAY_VERCEL.md
echo 📖 Guia rápido: DEPLOY_RAPIDO.md
echo.
pause
