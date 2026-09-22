import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// RNF09: Solo los usuarios con rol de administrador pueden acceder a reportes
router.use(authenticateJwt);
router.use(requireRole(['admin']));

// RF20: Total de ventas del día
router.get('/diario', ReportController.getDailySales);

// RF21: Producto más vendido en un período
router.get('/mas-vendidos', ReportController.getBestSellers);

// RF22: Horas de mayor demanda (horas pico)
router.get('/horas-pico', ReportController.getPeakHours);

// RF23: Historial de cierres de caja por turno
router.get('/turnos', ReportController.getShiftsHistory);

export default router;
