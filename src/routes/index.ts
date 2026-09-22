import { Router } from 'express';
import authRoutes from './auth.routes.js';
import shiftRoutes from './shift.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/turnos', shiftRoutes);
router.use('/productos', productRoutes);
router.use('/pedidos', orderRoutes);
router.use('/pagos', paymentRoutes);
router.use('/reportes', reportRoutes);

export default router;
