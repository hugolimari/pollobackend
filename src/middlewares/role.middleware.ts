import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import { AppError } from './error.middleware.js';
import { RolNombre } from '../types/models.js';

export const requireRole = (allowedRoles: RolNombre[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    if (!allowedRoles.includes(req.user.rol_nombre)) {
      return next(
        new AppError(
          `Acceso denegado: Se requiere rol [${allowedRoles.join(', ')}]. Tu rol es '${req.user.rol_nombre}'`,
          403
        )
      );
    }

    next();
  };
};
