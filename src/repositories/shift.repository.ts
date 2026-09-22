import { query } from '../config/db.js';
import { Turno } from '../types/models.js';

export class ShiftRepository {
  async findActiveByUserId(usuario_id: number): Promise<Turno | null> {
    const res = await query<Turno>(
      `SELECT t.*, u.nombre_completo as cajero_nombre 
       FROM turnos t
       INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
       WHERE t.usuario_id = $1 AND t.estado = 'abierto'
       ORDER BY t.abierto_en DESC LIMIT 1`,
      [usuario_id]
    );
    return res.rows[0] || null;
  }

  async findActiveByBranch(sucursal_id: number): Promise<Turno[]> {
    const res = await query<Turno>(
      `SELECT t.*, u.nombre_completo as cajero_nombre 
       FROM turnos t
       INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
       WHERE t.sucursal_id = $1 AND t.estado = 'abierto'
       ORDER BY t.abierto_en DESC`,
      [sucursal_id]
    );
    return res.rows;
  }

  async findById(turno_id: number): Promise<Turno | null> {
    const res = await query<Turno>(
      `SELECT t.*, u.nombre_completo as cajero_nombre 
       FROM turnos t
       INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
       WHERE t.turno_id = $1`,
      [turno_id]
    );
    return res.rows[0] || null;
  }

  async openShift(sucursal_id: number, usuario_id: number, fondo_inicial: number): Promise<Turno> {
    const res = await query<Turno>(
      `INSERT INTO turnos (sucursal_id, usuario_id, fondo_inicial, estado)
       VALUES ($1, $2, $3, 'abierto')
       RETURNING *`,
      [sucursal_id, usuario_id, fondo_inicial]
    );
    return res.rows[0];
  }

  async calculateExpectedCash(turno_id: number): Promise<number> {
    // Fondo inicial + suma de pagos registrados en efectivo durante el turno
    const resTurno = await query<{ fondo_inicial: string | number }>(
      `SELECT fondo_inicial FROM turnos WHERE turno_id = $1`,
      [turno_id]
    );
    const fondoInicial = parseFloat(String(resTurno.rows[0]?.fondo_inicial || '0'));

    const resPagos = await query<{ total_efectivo: string | number }>(
      `SELECT COALESCE(SUM(monto), 0) as total_efectivo
       FROM pagos
       WHERE turno_id = $1 AND metodo_pago = 'efectivo'`,
      [turno_id]
    );
    const totalEfectivo = parseFloat(String(resPagos.rows[0]?.total_efectivo || '0'));

    return fondoInicial + totalEfectivo;
  }

  async closeShift(
    turno_id: number,
    efectivo_esperado: number,
    efectivo_contado: number
  ): Promise<Turno> {
    const res = await query<Turno>(
      `UPDATE turnos
       SET estado = 'cerrado',
           cerrado_en = now(),
           efectivo_esperado = $2,
           efectivo_contado = $3
       WHERE turno_id = $1
       RETURNING *`,
      [turno_id, efectivo_esperado, efectivo_contado]
    );
    return res.rows[0];
  }

  async getHistory(sucursal_id?: number, limit = 20): Promise<Turno[]> {
    let sql = `
      SELECT t.*, u.nombre_completo as cajero_nombre, s.nombre as sucursal_nombre
      FROM turnos t
      INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
      INNER JOIN sucursales s ON t.sucursal_id = s.sucursal_id
    `;
    const params: any[] = [];

    if (sucursal_id) {
      params.push(sucursal_id);
      sql += ` WHERE t.sucursal_id = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY t.abierto_en DESC LIMIT $${params.length}`;

    const res = await query<Turno>(sql, params);
    return res.rows;
  }
}
