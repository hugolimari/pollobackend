import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateJwt);

// RF20: Total de ventas y métricas del día (Admin y Cajero en turno)
router.get(
  '/diario',
  requireRole(['admin', 'cajero']),
  ReportController.getDailySales
);

// RF23: Historial de cierres de caja por turno (Admin y Cajero)
router.get(
  '/turnos',
  requireRole(['admin', 'cajero']),
  ReportController.getShiftsHistory
);

// RF21: Ranking de productos más vendidos en un período (Inteligencia de Negocios - Solo Administrador: RNF09)
router.get(
  '/mas-vendidos',
  requireRole(['admin']),
  ReportController.getBestSellers
);

// RF22: Horas de mayor demanda / horas pico (Solo Administrador: RNF09)
router.get(
  '/horas-pico',
  requireRole(['admin']),
  ReportController.getPeakHours
);

export default router;
