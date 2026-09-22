import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { ENV } from '../config/env.js';
import { UserPayload } from '../middlewares/auth.middleware.js';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  private generateToken(user: {
    usuario_id: number;
    nombre_usuario: string;
    nombre_completo: string;
    sucursal_id: number;
    rol_id: number;
    rol_nombre?: string;
  }): string {
    const payload: UserPayload = {
      usuario_id: user.usuario_id,
      nombre_usuario: user.nombre_usuario,
      nombre_completo: user.nombre_completo,
      sucursal_id: user.sucursal_id,
      rol_id: user.rol_id,
      rol_nombre: (user.rol_nombre as any) || 'cajero'
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any
    });
  }

  async loginWithPassword(nombre_usuario: string, password: string) {
    if (!nombre_usuario || !password) {
      throw new AppError('Usuario y contraseña son requeridos', 400);
    }

    const user = await this.userRepo.findByUsername(nombre_usuario);
    if (!user) {
      throw new AppError('Credenciales incorrectas o usuario inactivo', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    const token = this.generateToken(user);
    return {
      token,
      usuario: {
        usuario_id: user.usuario_id,
        nombre_usuario: user.nombre_usuario,
        nombre_completo: user.nombre_completo,
        sucursal_id: user.sucursal_id,
        rol: user.rol_nombre
      }
    };
  }

  async loginWithPin(pin: string) {
    if (!pin || pin.trim().length === 0) {
      throw new AppError('PIN de acceso requerido', 400);
    }

    const users = await this.userRepo.findAllActiveWithPin();

    for (const user of users) {
      if (user.pin_rapido) {
        const isMatch = await bcrypt.compare(pin, user.pin_rapido);
        if (isMatch) {
          const token = this.generateToken(user);
          return {
            token,
            usuario: {
              usuario_id: user.usuario_id,
              nombre_usuario: user.nombre_usuario,
              nombre_completo: user.nombre_completo,
              sucursal_id: user.sucursal_id,
              rol: user.rol_nombre
            }
          };
        }
      }
    }

    throw new AppError('PIN incorrecto o no asignado a ningún cajero', 401);
  }

  async requestPasswordReset(identifier: string) {
    if (!identifier) {
      throw new AppError('Ingresa tu nombre de usuario o correo registrado', 400);
    }

    const user = await this.userRepo.findByEmailOrUsername(identifier);
    if (!user) {
      // Por seguridad no revelamos si existe o no
      return { mensaje: 'Si el usuario existe, se ha generado el código de recuperación' };
    }

    // Código numérico aleatorio de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.userRepo.createRecoveryCode(user.usuario_id, code, expiresAt);

    return {
      mensaje: 'Código de recuperación generado exitosamente',
      usuario_id: user.usuario_id,
      codigo_demo: ENV.NODE_ENV === 'development' ? code : undefined
    };
  }

  async resetPassword(usuario_id: number, codigo: string, nuevoPassword: string) {
    if (!usuario_id || !codigo || !nuevoPassword) {
      throw new AppError('Datos incompletos para restablecer contraseña', 400);
    }

    if (nuevoPassword.length < 6) {
      throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
    }

    const isValid = await this.userRepo.findValidRecoveryCode(usuario_id, codigo);
    if (!isValid) {
      throw new AppError('Código de recuperación inválido o expirado', 400);
    }

    const passwordHash = await bcrypt.hash(nuevoPassword, 10);
    await this.userRepo.updatePassword(usuario_id, passwordHash);
    await this.userRepo.markRecoveryCodeUsed(usuario_id, codigo);

    return { mensaje: 'Contraseña actualizada exitosamente' };
  }

  async adminResetCredentials(usuario_id: number, nuevoPassword?: string, nuevoPin?: string) {
    const user = await this.userRepo.findById(usuario_id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (nuevoPassword) {
      const passHash = await bcrypt.hash(nuevoPassword, 10);
      await this.userRepo.updatePassword(usuario_id, passHash);
    }

    if (nuevoPin) {
      const pinHash = await bcrypt.hash(nuevoPin, 10);
      await this.userRepo.updatePin(usuario_id, pinHash);
    }

    return { mensaje: 'Credenciales del usuario actualizadas por el administrador' };
  }
}
