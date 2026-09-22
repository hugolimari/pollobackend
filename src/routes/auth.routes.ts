import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// RF01: Login con usuario/contraseña o PIN
router.post('/login', AuthController.login);

// RF02: Recuperar contraseña
router.post('/recuperar-password', AuthController.requestPasswordReset);
router.post('/restablecer-password', AuthController.resetPassword);

// RF02: Restablecer credenciales por Administrador
router.post(
  '/admin/restablecer-usuario',
  authenticateJwt,
  requireRole(['admin']),
  AuthController.adminResetCredentials
);

// Perfil de usuario autenticado
router.get('/me', authenticateJwt, AuthController.me);

export default router;
