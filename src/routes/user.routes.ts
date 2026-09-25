import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateJwt);

// Catálogos auxiliares (Roles y Sucursales)
router.get('/roles', requireRole(['admin']), UserController.getRoles);
router.get('/sucursales', UserController.getSucursales);
router.post('/sucursales', requireRole(['admin']), UserController.createSucursal);
router.put('/sucursales/:id', requireRole(['admin']), UserController.updateSucursal);

// Gestión completa de personal / empleados (Solo Administrador)
router.get('/', requireRole(['admin']), UserController.getUsers);
router.get('/:id', requireRole(['admin']), UserController.getUserById);
router.post('/', requireRole(['admin']), UserController.create);
router.put('/:id', requireRole(['admin']), UserController.update);
router.patch('/:id/estado', requireRole(['admin']), UserController.toggleActive);

export default router;
