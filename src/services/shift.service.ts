import { ShiftRepository } from '../repositories/shift.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { RegistrarMovimientoDto } from '../types/dtos.js';

export class ShiftService {
  private shiftRepo: ShiftRepository;

  constructor() {
    this.shiftRepo = new ShiftRepository();
  }

  async openShift(usuario_id: number, sucursal_id: number, fondo_inicial: number) {
    if (fondo_inicial < 0) {
      throw new AppError('El fondo inicial de caja no puede ser negativo', 400);
    }

    // Verificar si el usuario ya tiene un turno abierto
    const existing = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (existing) {
      return existing;
    }

    return await this.shiftRepo.openShift(sucursal_id, usuario_id, fondo_inicial);
  }

  async getActiveShift(usuario_id: number) {
    const shift = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (!shift) {
      throw new AppError('No tienes un turno de caja actualmente abierto', 404);
    }
    return shift;
  }

  async closeShift(usuario_id: number, efectivo_contado: number) {
    if (efectivo_contado === undefined || isNaN(efectivo_contado) || efectivo_contado < 0) {
      throw new AppError('Debes ingresar un monto válido de efectivo contado (mayor o igual a cero)', 400);
    }

    const activeShift = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (!activeShift) {
      throw new AppError('No tienes un turno abierto para cerrar', 400);
    }

    // Calcular el efectivo esperado exacto (Fondo + Efectivo puro + Parte Efectivo Mixto + Ingresos - Egresos)
    const efectivoEsperado = await this.shiftRepo.calculateExpectedCash(activeShift.turno_id);
    const diferencia = parseFloat((efectivo_contado - efectivoEsperado).toFixed(2));

    const closed = await this.shiftRepo.closeShift(
      activeShift.turno_id,
      efectivoEsperado,
      efectivo_contado
    );

    const summary = await this.shiftRepo.getShiftSummary(activeShift.turno_id);

    return {
      turno: closed,
      resumen: summary,
      arqueo: {
        fondo_inicial: parseFloat(String(activeShift.fondo_inicial)),
        efectivo_esperado: efectivoEsperado,
        efectivo_contado: efectivo_contado,
        diferencia,
        estado_arqueo: diferencia === 0 ? 'CUADRADO' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'
      }
    };
  }

  async addCashMovement(usuario_id: number, dto: RegistrarMovimientoDto) {
    if (!['INGRESO', 'EGRESO'].includes(dto.tipo)) {
      throw new AppError('El tipo de movimiento debe ser INGRESO o EGRESO', 400);
    }

    if (!dto.monto || dto.monto <= 0) {
      throw new AppError('El monto del movimiento debe ser mayor a 0', 400);
    }

    if (!dto.concepto || dto.concepto.trim().length === 0) {
      throw new AppError('Debes especificar el concepto o motivo del movimiento de caja', 400);
    }

    // Determinar turno_id
    let turnoId = dto.turno_id;
    if (!turnoId) {
      const activeShift = await this.shiftRepo.findActiveByUserId(usuario_id);
      if (!activeShift) {
        throw new AppError('Debes tener un turno abierto para registrar movimientos de caja chica', 400);
      }
      turnoId = activeShift.turno_id;
    }

    return await this.shiftRepo.addCashMovement({
      turno_id: turnoId,
      usuario_id,
      tipo: dto.tipo,
      monto: parseFloat(String(dto.monto)),
      concepto: dto.concepto.trim()
    });
  }

  async getMovements(turno_id?: number, usuario_id?: number) {
    let targetTurnoId = turno_id;
    if (!targetTurnoId && usuario_id) {
      const active = await this.shiftRepo.findActiveByUserId(usuario_id);
      if (active) {
        targetTurnoId = active.turno_id;
      }
    }

    if (!targetTurnoId) {
      return [];
    }

    return await this.shiftRepo.getMovementsByShift(targetTurnoId);
  }

  async getHistory(sucursal_id?: number, limit = 20) {
    return await this.shiftRepo.getHistory(sucursal_id, limit);
  }

  async getShiftSummary(turno_id: number) {
    const summary = await this.shiftRepo.getShiftSummary(turno_id);
    if (!summary) {
      throw new AppError('Turno no encontrado', 404);
    }
    return summary;
  }

  async getActiveShiftSummary(usuario_id: number) {
    const active = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (!active) {
      throw new AppError('No hay turno activo para este usuario', 404);
    }
    return await this.getShiftSummary(active.turno_id);
  }
}
