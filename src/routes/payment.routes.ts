import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);

// RF15, RF16: Registrar cobro de pedido y calcular vuelto
router.post('/', PaymentController.processPayment);

// RF17: Generar / obtener comprobante de venta
router.get('/recibo/:pedido_id', PaymentController.getReceipt);

export default router;
