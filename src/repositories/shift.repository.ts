import { query } from '../config/db.js';
import { Turno, MovimientoCaja, TipoMovimientoCaja } from '../types/models.js';
import { ResumenTurnoResponse } from '../types/dtos.js';

export class ShiftRepository {
  async findActiveByUserId(usuario_id: number): Promise<Turno | null> {
    const res = await query<Turno>(
      `SELECT t.*, u.nombre_completo as cajero_nombre, s.nombre as sucursal_nombre
       FROM turnos t
       INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
       INNER JOIN sucursales s ON t.sucursal_id = s.sucursal_id
       WHERE t.usuario_id = $1 AND t.estado = 'abierto'
       ORDER BY t.abierto_en DESC LIMIT 1`,
      [usuario_id]
    );
    return res.rows[0] || null;
  }

  async findActiveByBranch(sucursal_id: number): Promise<Turno[]> {
    const res = await query<Turno>(
      `SELECT t.*, u.nombre_completo as cajero_nombre, s.nombre as sucursal_nombre
       FROM turnos t
       INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
       INNER JOIN sucursales s ON t.sucursal_id = s.sucursal_id
       WHERE t.sucursal_id = $1 AND t.estado = 'abierto'
       ORDER BY t.abierto_en DESC`,
      [sucursal_id]
    );
    return res.rows;
  }

  async findById(turno_id: number): Promise<Turno | null> {
    const res = await query<Turno>(
      `SELECT t.*, u.nombre_completo as cajero_nombre, s.nombre as sucursal_nombre
       FROM turnos t
       INNER JOIN usuarios u ON t.usuario_id = u.usuario_id
       INNER JOIN sucursales s ON t.sucursal_id = s.sucursal_id
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
    const res = await query<{
      fondo_inicial: string | number;
      total_efectivo: string | number;
      total_ingresos_extra: string | number;
      total_egresos_gastos: string | number;
    }>(
      `SELECT 
         t.fondo_inicial,
         COALESCE((
           SELECT SUM(pg.monto_efectivo) 
           FROM pagos pg 
           WHERE pg.turno_id = t.turno_id
         ), 0) AS total_efectivo,
         COALESCE((
           SELECT SUM(mc.monto) 
           FROM movimientos_caja mc 
           WHERE mc.turno_id = t.turno_id AND mc.tipo = 'INGRESO'
         ), 0) AS total_ingresos_extra,
         COALESCE((
           SELECT SUM(mc.monto) 
           FROM movimientos_caja mc 
           WHERE mc.turno_id = t.turno_id AND mc.tipo = 'EGRESO'
         ), 0) AS total_egresos_gastos
       FROM turnos t
       WHERE t.turno_id = $1`,
      [turno_id]
    );

    const row = res.rows[0];
    if (!row) return 0;

    const fondo = parseFloat(String(row.fondo_inicial || 0));
    const efectivo = parseFloat(String(row.total_efectivo || 0));
    const ingresos = parseFloat(String(row.total_ingresos_extra || 0));
    const egresos = parseFloat(String(row.total_egresos_gastos || 0));

    return parseFloat((fondo + efectivo + ingresos - egresos).toFixed(2));
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

  async addCashMovement(data: {
    turno_id: number;
    usuario_id: number;
    tipo: TipoMovimientoCaja;
    monto: number;
    concepto: string;
  }): Promise<MovimientoCaja> {
    const res = await query<MovimientoCaja>(
      `INSERT INTO movimientos_caja (turno_id, usuario_id, tipo, monto, concepto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.turno_id, data.usuario_id, data.tipo, data.monto, data.concepto]
    );
    return res.rows[0];
  }

  async getMovementsByShift(turno_id: number): Promise<MovimientoCaja[]> {
    const res = await query<MovimientoCaja>(
      `SELECT mc.*, u.nombre_completo as cajero_nombre
       FROM movimientos_caja mc
       INNER JOIN usuarios u ON mc.usuario_id = u.usuario_id
       WHERE mc.turno_id = $1
       ORDER BY mc.creado_en DESC`,
      [turno_id]
    );
    return res.rows;
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

  async getShiftSummary(turno_id: number): Promise<ResumenTurnoResponse | null> {
    const res = await query<any>(
      `SELECT * FROM vw_resumen_turnos WHERE turno_id = $1`,
      [turno_id]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      turno_id: row.turno_id,
      sucursal_id: row.sucursal_id,
      usuario_id: row.usuario_id,
      cajero_nombre: row.cajero_nombre,
      fondo_inicial: parseFloat(String(row.fondo_inicial || 0)),
      total_ventas: parseFloat(String(row.total_ventas || 0)),
      total_efectivo: parseFloat(String(row.total_efectivo || 0)),
      total_tarjeta: parseFloat(String(row.total_tarjeta || 0)),
      total_qr: parseFloat(String(row.total_qr || 0)),
      total_ingresos_extra: parseFloat(String(row.total_ingresos_extra || 0)),
      total_egresos_gastos: parseFloat(String(row.total_egresos_gastos || 0)),
      total_pedidos: parseInt(String(row.total_pedidos || 0), 10),
      efectivo_esperado: parseFloat(String(row.efectivo_esperado || 0)),
      efectivo_contado: row.efectivo_contado !== null && row.efectivo_contado !== undefined ? parseFloat(String(row.efectivo_contado)) : null,
      diferencia: row.diferencia !== null && row.diferencia !== undefined ? parseFloat(String(row.diferencia)) : null,
      estado: row.estado,
      abierto_en: row.abierto_en,
      cerrado_en: row.cerrado_en
    };
  }
}
