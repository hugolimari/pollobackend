import app from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🍗 PolloPOS Backend API iniciado con éxito`);
  console.log(`🚀 Servidor escuchando en: http://localhost:${PORT}`);
  console.log(`📡 Rutas base de la API: http://localhost:${PORT}/api`);
  console.log(`⚙️  Entorno: ${ENV.NODE_ENV}`);
  console.log('====================================================');
});

// Manejo de apagado graceful
const handleShutdown = () => {
  console.log('\n🛑 Cerrando servidor HTTP y conexiones de PolloPOS...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente.');
    process.exit(0);
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
