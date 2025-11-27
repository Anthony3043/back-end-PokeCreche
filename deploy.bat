@echo off
echo 🚀 Deploy PokeCreche Backend
echo.

echo ✅ Verificando arquivos...
if not exist "package.json" (
    echo ❌ package.json não encontrado
    pause
    exit /b 1
)

echo ✅ Adicionando arquivos ao git...
git add .

echo ✅ Fazendo commit...
set /p commit_msg="Digite a mensagem do commit: "
git commit -m "%commit_msg%"

echo ✅ Enviando para Railway...
git push origin main

echo.
echo 🎉 Deploy concluído!
echo 📍 Verifique: https://seu-app.railway.app/api/health
echo.
pause