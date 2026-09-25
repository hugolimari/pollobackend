import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['admin', 'cajero']));

// RF15, RF16: Registrar cobro (Efectivo, Tarjeta, QR, Mixto) y calcular vuelto
router.post('/', PaymentController.processPayment);

// RF17: Obtener / generar comprobante de venta para impresión o visualización
router.get('/recibo/:pedido_id', PaymentController.getReceipt);

export default router;
