@echo off
echo 🚀 Deploy PokeCreche - Railway BD + Vercel Backend
echo.

echo ✅ Instalando Vercel CLI...
npm install -g vercel

echo ✅ Fazendo deploy...
vercel --prod

echo.
echo 🎉 Deploy concluído!
echo 📝 Não esqueça de:
echo    1. Configurar DATABASE_URL no Vercel Dashboard
echo    2. Testar /api/health
echo.
pause