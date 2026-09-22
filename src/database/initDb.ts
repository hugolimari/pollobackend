import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('🚀 Conectando a PostgreSQL e inicializando tablas y datos semilla...');
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Ejecutando schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Esquema y tablas creadas exitosamente.');

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('🌱 Ejecutando seed.sql...');
    await client.query(seedSql);
    console.log('✅ Datos iniciales insertados exitosamente.');

    console.log('\n🎉 Base de datos lista para operar con PolloPOS.');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
