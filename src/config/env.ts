import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pollopos',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_pollopos_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
