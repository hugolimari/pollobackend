import { query } from '../config/db.js';
import { Usuario } from '../types/models.js';

export class UserRepository {
  async findByUsername(nombre_usuario: string): Promise<Usuario | null> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       WHERE u.nombre_usuario = $1 AND u.activo = TRUE`,
      [nombre_usuario]
    );
    return res.rows[0] || null;
  }

  async findById(usuario_id: number): Promise<Usuario | null> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       WHERE u.usuario_id = $1`,
      [usuario_id]
    );
    return res.rows[0] || null;
  }

  async findAllActiveWithPin(): Promise<Usuario[]> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       WHERE u.activo = TRUE AND u.pin_rapido IS NOT NULL`
    );
    return res.rows;
  }

  async findByEmailOrUsername(identifier: string): Promise<Usuario | null> {
    const res = await query<Usuario>(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.rol_id
       WHERE (u.nombre_usuario = $1 OR u.correo = $1) AND u.activo = TRUE`,
      [identifier]
    );
    return res.rows[0] || null;
  }

  async createRecoveryCode(usuario_id: number, codigo: string, expira_en: Date): Promise<void> {
    await query(
      `INSERT INTO recuperacion_password (usuario_id, codigo, expira_en)
       VALUES ($1, $2, $3)`,
      [usuario_id, codigo, expira_en]
    );
  }

  async findValidRecoveryCode(usuario_id: number, codigo: string): Promise<boolean> {
    const res = await query(
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
}
