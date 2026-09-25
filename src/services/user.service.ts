import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CrearUsuarioDto, ActualizarUsuarioDto, CrearSucursalDto, ActualizarSucursalDto } from '../types/dtos.js';

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getUsers(options?: { sucursal_id?: number; rol_id?: number; activo?: boolean }) {
    return await this.userRepo.findAll(options);
  }

  async getUserById(usuario_id: number) {
    const user = await this.userRepo.findById(usuario_id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    const { password_hash, pin_rapido, ...safeUser } = user;
    return {
      ...safeUser,
      tiene_pin: Boolean(pin_rapido)
    };
  }

  async createUser(dto: CrearUsuarioDto) {
    if (!dto.nombre_completo || !dto.nombre_usuario || !dto.password || !dto.rol_id || !dto.sucursal_id) {
      throw new AppError('Faltan datos obligatorios para crear el usuario (nombre_completo, nombre_usuario, password, rol_id, sucursal_id)', 400);
    }

    const existing = await this.userRepo.findByUsername(dto.nombre_usuario.trim());
    if (existing) {
      throw new AppError(`El nombre de usuario "${dto.nombre_usuario}" ya está en uso`, 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    let pinHash: string | null = null;
    if (dto.pin_rapido && dto.pin_rapido.trim().length > 0) {
      pinHash = await bcrypt.hash(dto.pin_rapido.trim(), salt);
    }

    const created = await this.userRepo.create({
      sucursal_id: dto.sucursal_id,
      rol_id: dto.rol_id,
      nombre_completo: dto.nombre_completo.trim(),
      nombre_usuario: dto.nombre_usuario.trim(),
      password_hash: passwordHash,
      pin_hash: pinHash,
      correo: dto.correo?.trim() || null,
      telefono: dto.telefono?.trim() || null
    });

    const { password_hash, pin_rapido, ...safeUser } = created;
    return {
      ...safeUser,
      tiene_pin: Boolean(pin_rapido)
    };
  }

  async updateUser(usuario_id: number, dto: ActualizarUsuarioDto) {
    const user = await this.userRepo.findById(usuario_id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password && dto.password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(dto.password, salt);
    }

    let pinHash: string | null | undefined = undefined;
    if (dto.pin_rapido !== undefined) {
      if (dto.pin_rapido && dto.pin_rapido.trim().length > 0) {
        const salt = await bcrypt.genSalt(10);
        pinHash = await bcrypt.hash(dto.pin_rapido.trim(), salt);
      } else {
        pinHash = null; // Quitar PIN
      }
    }

    const updated = await this.userRepo.update(usuario_id, {
      sucursal_id: dto.sucursal_id,
      rol_id: dto.rol_id,
      nombre_completo: dto.nombre_completo?.trim(),
      nombre_usuario: dto.nombre_usuario?.trim(),
      password_hash: passwordHash,
      pin_hash: pinHash,
      correo: dto.correo?.trim(),
      telefono: dto.telefono?.trim(),
      activo: dto.activo
    });

    const { password_hash, pin_rapido, ...safeUser } = updated;
    return {
      ...safeUser,
      tiene_pin: Boolean(pin_rapido)
    };
  }

  async toggleUserActive(usuario_id: number, activo: boolean) {
    const user = await this.userRepo.findById(usuario_id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const updated = await this.userRepo.toggleActive(usuario_id, activo);
    const { password_hash, pin_rapido, ...safeUser } = updated;
    return safeUser;
  }

  async getRoles() {
    return await this.userRepo.findAllRoles();
  }

  async getSucursales() {
    return await this.userRepo.findAllSucursales();
  }

  async createSucursal(dto: CrearSucursalDto) {
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new AppError('El nombre de la sucursal es obligatorio', 400);
    }
    return await this.userRepo.createSucursal({
      nombre: dto.nombre.trim(),
      direccion: dto.direccion?.trim(),
      telefono: dto.telefono?.trim()
    });
  }

  async updateSucursal(sucursal_id: number, dto: ActualizarSucursalDto) {
    return await this.userRepo.updateSucursal(sucursal_id, dto);
  }
}
