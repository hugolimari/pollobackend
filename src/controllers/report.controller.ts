import { Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const reportService = new ReportService();

export class ReportController {
  static async getDailySales(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : req.user?.sucursal_id;
      const fecha = req.query.fecha ? String(req.query.fecha) : undefined;

      const report = await reportService.getDailySales(sucursalId, fecha);
      return res.json({
        success: true,
        reporte: report
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBestSellers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : req.user?.sucursal_id;
      const desde = req.query.desde ? String(req.query.desde) : undefined;
      const hasta = req.query.hasta ? String(req.query.hasta) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;

      const ranking = await reportService.getBestSellers({
        sucursal_id: sucursalId,
        desde,
        hasta,
        limit
      });

      return res.json({
        success: true,
        ranking
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPeakHours(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : req.user?.sucursal_id;
      const fecha = req.query.fecha ? String(req.query.fecha) : undefined;

      const horasPico = await reportService.getPeakHours(sucursalId, fecha);
      return res.json({
        success: true,
        horas_pico: horasPico
      });
    } catch (error) {
      next(error);
    }
  }

  static async getShiftsHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const history = await reportService.getShiftsHistory(sucursalId, limit);
      return res.json({
        success: true,
        historial_turnos: history
      });
    } catch (error) {
      next(error);
    }
  }
}
