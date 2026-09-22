import { Response, NextFunction } from 'express';
import { ShiftService } from '../services/shift.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const shiftService = new ShiftService();

export class ShiftController {
  static async open(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user!.usuario_id;
      const sucursalId = req.body.sucursal_id || req.user!.sucursal_id;
      const fondoInicial = parseFloat(req.body.fondo_inicial || 0);

      const shift = await shiftService.openShift(usuarioId, sucursalId, fondoInicial);
      return res.status(201).json({
        success: true,
        mensaje: 'Turno de caja abierto exitosamente',
        turno: shift
      });
    } catch (error) {
      next(error);
    }
  }

  static async getActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user!.usuario_id;
      const shift = await shiftService.getActiveShift(usuarioId);

      return res.json({
        success: true,
        turno: shift
      });
    } catch (error) {
      next(error);
    }
  }

  static async close(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user!.usuario_id;
      const efectivoContado = parseFloat(req.body.efectivo_contado);

      const result = await shiftService.closeShift(usuarioId, efectivoContado);
      return res.json({
        success: true,
        mensaje: 'Turno de caja cerrado exitosamente',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const history = await shiftService.getHistory(sucursalId, limit);
      return res.json({
        success: true,
        turnos: history
      });
    } catch (error) {
      next(error);
    }
  }
}
