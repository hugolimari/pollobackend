import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const authService = new AuthService();

export class AuthController {
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const nombre_usuario = req.body.nombre_usuario || req.body.usuario || req.body.username;
      const password = req.body.password || req.body.contrasena || req.body.pass;
      const pin_rapido = req.body.pin_rapido || req.body.pin;

      if (pin_rapido) {
        const result = await authService.loginWithPin(pin_rapido);
        return res.json({ success: true, ...result });
      }

      const result = await authService.loginWithPassword(nombre_usuario, password);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { nombre_usuario_o_correo } = req.body;
      const result = await authService.requestPasswordReset(nombre_usuario_o_correo);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { usuario_id, codigo, nuevo_password } = req.body;
      const result = await authService.resetPassword(usuario_id, codigo, nuevo_password);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async adminResetCredentials(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { usuario_id, nuevo_password, nuevo_pin } = req.body;
      const result = await authService.adminResetCredentials(usuario_id, nuevo_password, nuevo_pin);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    return res.json({
      success: true,
      usuario: req.user
    });
  }
}
