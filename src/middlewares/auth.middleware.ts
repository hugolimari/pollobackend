import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from './error.middleware.js';
import { RolNombre } from '../types/models.js';

export interface UserPayload {
  usuario_id: number;
  nombre_usuario: string;
  nombre_completo: string;
  sucursal_id: number;
  rol_id: number;
  rol_nombre: RolNombre;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authenticateJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Acceso denegado: Token de autorización no proporcionado', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('Token inválido o expirado. Inicia sesión nuevamente.', 401);
  }
};
