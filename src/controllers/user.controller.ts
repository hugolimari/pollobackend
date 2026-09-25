import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const userService = new UserService();

export class UserController {
  static async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursal_id = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : undefined;
      const rol_id = req.query.rol_id ? parseInt(String(req.query.rol_id), 10) : undefined;
      const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;

      const users = await userService.getUsers({ sucursal_id, rol_id, activo });
      return res.json({
        success: true,
        usuarios: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await userService.getUserById(id);
      return res.json({
        success: true,
        usuario: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newUser = await userService.createUser(req.body);
      return res.status(201).json({
        success: true,
        mensaje: 'Usuario registrado exitosamente',
        usuario: newUser
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await userService.updateUser(id, req.body);
      return res.json({
        success: true,
        mensaje: 'Usuario actualizado exitosamente',
        usuario: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { activo } = req.body;
      const updated = await userService.toggleUserActive(id, Boolean(activo));
      return res.json({
        success: true,
        mensaje: `Usuario ${updated.activo ? 'activado' : 'desactivado'} exitosamente`,
        usuario: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roles = await userService.getRoles();
      return res.json({
        success: true,
        roles
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSucursales(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursales = await userService.getSucursales();
      return res.json({
        success: true,
        sucursales
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSucursal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursal = await userService.createSucursal(req.body);
      return res.status(201).json({
        success: true,
        mensaje: 'Sucursal creada exitosamente',
        sucursal
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSucursal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const sucursal = await userService.updateSucursal(id, req.body);
      return res.json({
        success: true,
        mensaje: 'Sucursal actualizada exitosamente',
        sucursal
      });
    } catch (error) {
      next(error);
    }
  }
}
