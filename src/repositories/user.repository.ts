import { query } from '../config/db.js';
import { Usuario, Rol, Sucursal } from '../types/models.js';

export class UserRepository {
  async findByUsername(nombre_usuario: string): Promise<Usuario | null> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       INNER JOIN sucursales s ON u.sucursal_id = s.sucursal_id
       WHERE u.nombre_usuario = $1 AND u.activo = TRUE`,
      [nombre_usuario]
    );
    return res.rows[0] || null;
  }

  async findById(usuario_id: number): Promise<Usuario | null> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       INNER JOIN sucursales s ON u.sucursal_id = s.sucursal_id
       WHERE u.usuario_id = $1`,
      [usuario_id]
    );
    return res.rows[0] || null;
  }

  async findAll(options?: {
    sucursal_id?: number;
    rol_id?: number;
    activo?: boolean;
  }): Promise<Omit<Usuario, 'password_hash'>[]> {
    let sql = `
      SELECT u.usuario_id, u.sucursal_id, u.rol_id, u.nombre_completo,
             u.nombre_usuario, u.correo, u.telefono, u.activo, u.creado_en,
             r.nombre as rol_nombre, s.nombre as sucursal_nombre,
             CASE WHEN u.pin_rapido IS NOT NULL THEN TRUE ELSE FALSE END as tiene_pin
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.rol_id
      INNER JOIN sucursales s ON u.sucursal_id = s.sucursal_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.sucursal_id) {
      params.push(options.sucursal_id);
      sql += ` AND u.sucursal_id = $${params.length}`;
    }

    if (options?.rol_id) {
      params.push(options.rol_id);
      sql += ` AND u.rol_id = $${params.length}`;
    }

    if (options?.activo !== undefined) {
      params.push(options.activo);
      sql += ` AND u.activo = $${params.length}`;
    }

    sql += ` ORDER BY u.nombre_completo ASC`;
    const res = await query<any>(sql, params);
    return res.rows;
  }

  async findAllActiveWithPin(): Promise<Usuario[]> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       INNER JOIN sucursales s ON u.sucursal_id = s.sucursal_id
       WHERE u.activo = TRUE AND u.pin_rapido IS NOT NULL`
    );
    return res.rows;
  }

  async findByEmailOrUsername(identifier: string): Promise<Usuario | null> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       INNER JOIN sucursales s ON u.sucursal_id = s.sucursal_id
       WHERE (u.nombre_usuario = $1 OR u.correo = $1) AND u.activo = TRUE`,
      [identifier]
    );
    return res.rows[0] || null;
  }

  async create(data: {
    sucursal_id: number;
    rol_id: number;
    nombre_completo: string;
    nombre_usuario: string;
    password_hash: string;
    pin_hash?: string | null;
    correo?: string | null;
    telefono?: string | null;
  }): Promise<Usuario> {
    const res = await query<Usuario>(
      `INSERT INTO usuarios (
         sucursal_id, rol_id, nombre_completo, nombre_usuario,
         password_hash, pin_rapido, correo, telefono, activo
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING *`,
      [
        data.sucursal_id,
        data.rol_id,
        data.nombre_completo,
        data.nombre_usuario,
        data.password_hash,
        data.pin_hash || null,
        data.correo || null,
        data.telefono || null
      ]
    );
    return res.rows[0];
  }

  async update(
    usuario_id: number,
    data: {
      sucursal_id?: number;
      rol_id?: number;
      nombre_completo?: string;
      nombre_usuario?: string;
      password_hash?: string;
      pin_hash?: string | null;
      correo?: string | null;
      telefono?: string | null;
      activo?: boolean;
    }
  ): Promise<Usuario> {
    const fields: string[] = [];
    const params: any[] = [usuario_id];

    if (data.sucursal_id !== undefined) {
      params.push(data.sucursal_id);
      fields.push(`sucursal_id = $${params.length}`);
    }
    if (data.rol_id !== undefined) {
      params.push(data.rol_id);
      fields.push(`rol_id = $${params.length}`);
    }
    if (data.nombre_completo !== undefined) {
      params.push(data.nombre_completo);
      fields.push(`nombre_completo = $${params.length}`);
    }
    if (data.nombre_usuario !== undefined) {
      params.push(data.nombre_usuario);
      fields.push(`nombre_usuario = $${params.length}`);
    }
    if (data.password_hash !== undefined) {
      params.push(data.password_hash);
      fields.push(`password_hash = $${params.length}`);
    }
    if (data.pin_hash !== undefined) {
      params.push(data.pin_hash);
      fields.push(`pin_rapido = $${params.length}`);
    }
    if (data.correo !== undefined) {
      params.push(data.correo);
      fields.push(`correo = $${params.length}`);
    }
    if (data.telefono !== undefined) {
      params.push(data.telefono);
      fields.push(`telefono = $${params.length}`);
    }
    if (data.activo !== undefined) {
      params.push(data.activo);
      fields.push(`activo = $${params.length}`);
    }

    if (fields.length === 0) {
      const user = await this.findById(usuario_id);
      return user!;
    }

    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE usuario_id = $1 RETURNING *`;
    const res = await query<Usuario>(sql, params);
    return res.rows[0];
  }

  async toggleActive(usuario_id: number, activo: boolean): Promise<Usuario> {
    const res = await query<Usuario>(
      `UPDATE usuarios SET activo = $2 WHERE usuario_id = $1 RETURNING *`,
      [usuario_id, activo]
    );
    return res.rows[0];
  }

  async createRecoveryCode(usuario_id: number, codigo: string, expira_en: Date): Promise<void> {
    await query(
      `INSERT INTO recuperacion_password (usuario_id, codigo, expira_en)
       VALUES ($1, $2, $3)`,
      [usuario_id, codigo, expira_en]
    );
  }

  async findValidRecoveryCode(usuario_id: number, codigo: string): Promise<boolean> {
    const res = await query<{ recuperacion_id: number }>(
      `SELECT recuperacion_id FROM recuperacion_password
       WHERE usuario_id = $1 AND codigo = $2 AND usado = FALSE AND expira_en > now()
       ORDER BY creado_en DESC LIMIT 1`,
      [usuario_id, codigo]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async markRecoveryCodeUsed(usuario_id: number, codigo: string): Promise<void> {
    await query(
      `UPDATE recuperacion_password 
       SET usado = TRUE 
       WHERE usuario_id = $1 AND codigo = $2`,
      [usuario_id, codigo]
    );
  }

  async updatePassword(usuario_id: number, password_hash: string): Promise<void> {
    await query(
      `UPDATE usuarios SET password_hash = $1 WHERE usuario_id = $2`,
      [password_hash, usuario_id]
    );
  }

  async updatePin(usuario_id: number, pin_hash: string): Promise<void> {
    await query(
      `UPDATE usuarios SET pin_rapido = $1 WHERE usuario_id = $2`,
      [pin_hash, usuario_id]
    );
  }

  async findAllRoles(): Promise<Rol[]> {
    const res = await query<Rol>(`SELECT * FROM roles ORDER BY rol_id ASC`);
    return res.rows;
  }

  async findAllSucursales(): Promise<Sucursal[]> {
    const res = await query<Sucursal>(`SELECT * FROM sucursales ORDER BY sucursal_id ASC`);
    return res.rows;
  }

  async createSucursal(data: { nombre: string; direccion?: string; telefono?: string }): Promise<Sucursal> {
    const res = await query<Sucursal>(
      `INSERT INTO sucursales (nombre, direccion, telefono, activa)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [data.nombre, data.direccion || null, data.telefono || null]
    );
    return res.rows[0];
  }

  async updateSucursal(sucursal_id: number, data: { nombre?: string; direccion?: string; telefono?: string; activa?: boolean }): Promise<Sucursal> {
    const fields: string[] = [];
    const params: any[] = [sucursal_id];

    if (data.nombre !== undefined) {
      params.push(data.nombre);
      fields.push(`nombre = $${params.length}`);
    }
    if (data.direccion !== undefined) {
      params.push(data.direccion);
      fields.push(`direccion = $${params.length}`);
    }
    if (data.telefono !== undefined) {
      params.push(data.telefono);
      fields.push(`telefono = $${params.length}`);
    }
    if (data.activa !== undefined) {
      params.push(data.activa);
      fields.push(`activa = $${params.length}`);
    }

    const sql = `UPDATE sucursales SET ${fields.join(', ')} WHERE sucursal_id = $1 RETURNING *`;
    const res = await query<Sucursal>(sql, params);
    return res.rows[0];
  }
}
