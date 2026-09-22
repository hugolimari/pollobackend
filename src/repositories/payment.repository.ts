import { pool, query } from '../config/db.js';
import { Pago, MetodoPago } from '../types/models.js';

export class PaymentRepository {
  async processPayment(paymentData: {
    pedido_id: number;
    turno_id: number;
    metodo_pago: MetodoPago;
    monto: number;
    monto_recibido: number;
    vuelto: number;
    referencia?: string | null;
  }): Promise<Pago> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const paymentSql = `
        INSERT INTO pagos (
          pedido_id, turno_id, metodo_pago, monto, monto_recibido, vuelto, referencia
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const paymentRes = await client.query<Pago>(paymentSql, [
        paymentData.pedido_id,
        paymentData.turno_id,
        paymentData.metodo_pago,
        paymentData.monto,
        paymentData.monto_recibido,
        paymentData.vuelto,
        paymentData.referencia || null
      ]);

      // Marcar pedido como pagado
      await client.query(
        `UPDATE pedidos SET estado_pago = 'pagado' WHERE pedido_id = $1`,
        [paymentData.pedido_id]
      );

      await client.query('COMMIT');
      return paymentRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByOrderId(pedido_id: number): Promise<Pago[]> {
    const res = await query<Pago>(
      `SELECT * FROM pagos WHERE pedido_id = $1 ORDER BY creado_en DESC`,
      [pedido_id]
    );
    return res.rows;
  }

  async findByShiftId(turno_id: number): Promise<Pago[]> {
    const res = await query<Pago>(
      `SELECT * FROM pagos WHERE turno_id = $1 ORDER BY creado_en DESC`,
      [turno_id]
    );
    return res.rows;
  }
}
