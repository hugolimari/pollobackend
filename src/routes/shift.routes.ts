import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['admin', 'cajero']));

// RF04: Registrar apertura de turno con fondo inicial
router.post('/abrir', ShiftController.open);

// Consultar turno activo del usuario
router.get('/activo', ShiftController.getActive);

// Resumen financiero del turno activo en tiempo real (Arqueo X)
router.get('/activo/resumen', ShiftController.getActiveSummary);

// Resumen financiero de un turno específico por ID
router.get('/resumen/:id', ShiftController.getSummary);

// Movimientos de Caja Chica (Egresos por compras operativas / Ingresos extra)
router.post('/movimientos', ShiftController.addMovement);
router.get('/movimientos', ShiftController.getMovements);
router.get('/:id/movimientos', ShiftController.getMovements);

// RF18, RF19: Cierre formal de caja y cálculo de arqueo (Arqueo Z)
router.post('/cerrar', ShiftController.close);

// RF23: Historial de cierres de caja
router.get('/historial', ShiftController.getHistory);

export default router;
