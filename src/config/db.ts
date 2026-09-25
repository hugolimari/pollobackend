import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

if (ENV.DATABASE_URL.startsWith('http://') || ENV.DATABASE_URL.startsWith('https://')) {
  console.warn(
    '[ADVERTENCIA] DATABASE_URL parece ser una URL HTTP/REST y no una cadena de conexión PostgreSQL (postgresql://user:pass@host:port/db).'
  );
}

const isCloudDb = ENV.DATABASE_URL.includes('supabase') || 
                  ENV.DATABASE_URL.includes('neon.tech') || 
                  ENV.DATABASE_URL.includes('sslmode=require') ||
                  ENV.DATABASE_URL.includes('render.com') ||
                  ENV.DATABASE_URL.includes('railway.app');

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err.message);
});

export const query = async <T extends pg.QueryResultRow = any>(
  text: string, 
  params?: any[]
): Promise<pg.QueryResult<T>> => {
  return pool.query<T>(text, params);
};
