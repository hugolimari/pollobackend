import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateJwt);

// RF04: Registrar apertura de turno con fondo inicial
router.post('/abrir', ShiftController.open);

// Consultar turno activo actual
router.get('/activo', ShiftController.getActive);

// RF18, RF19: Cierre de caja al final del turno con cálculo de diferencia
router.post('/cerrar', ShiftController.close);

// RF23, RNF09: Historial de cierres de caja (Solo Admin)
router.get('/historial', requireRole(['admin']), ShiftController.getHistory);

export default router;
