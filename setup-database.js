const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🔧 Configurando banco de dados...\n');
  
  // Pedir DATABASE_URL
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Cole o MYSQL_URL do Railway: ', async (databaseUrl) => {
    readline.close();
    
    try {
      // Parse URL
      const url = new URL(databaseUrl);
      const config = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        port: url.port || 3306
      };

      console.log('\n📡 Conectando ao banco...');
      const connection = await mysql.createConnection(config);
      console.log('✅ Conectado!\n');

      // Ler SQL
      const sqlPath = path.join(__dirname, 'railway_complete.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Executar comandos
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);

      console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

      for (const command of commands) {
        try {
          await connection.query(command);
          console.log('✅', command.substring(0, 50) + '...');
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log('⚠️', error.message);
          }
        }
      }

      // Verificar tabelas
      const [tables] = await connection.query('SHOW TABLES');
      console.log('\n🎉 Tabelas criadas:');
      tables.forEach(t => console.log('  -', Object.values(t)[0]));

      await connection.end();
      console.log('\n✅ Banco configurado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  });
}

setupDatabase();
