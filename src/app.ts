import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { errorHandler, AppError } from './middlewares/error.middleware.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de verificación de salud (Health Check)
app.get('/', (req: Request, res: Response) => {
  res.json({
    nombre: 'PolloPOS API (Brasa POS)',
    version: '1.0.0',
    estado: 'Operativo',
    fecha_servidor: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Rutas principales de la API
app.use('/api', apiRoutes);

// Manejador para rutas no encontradas (404)
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// Manejador centralizado de errores
app.use(errorHandler);

export default app;
