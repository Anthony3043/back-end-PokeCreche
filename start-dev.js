const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 ===== POKECRECHE DEV MODE =====');
console.log('📍 Iniciando servidor de desenvolvimento...');
console.log('🌐 URL: http://localhost:3000');
console.log('⚠️  Se não tiver MySQL local, o sistema funcionará com limitações');
console.log('💡 Para produção, use Railway ou outro serviço com banco MySQL');
console.log('=====================================\n');

// Iniciar o servidor
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('close', (code) => {
  console.log(`\n📴 Servidor encerrado com código ${code}`);
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
});

// Capturar Ctrl+C para encerrar graciosamente
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.kill('SIGINT');
  process.exit(0);
});