import { ShiftRepository } from '../repositories/shift.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export class ShiftService {
  private shiftRepo: ShiftRepository;

  constructor() {
    this.shiftRepo = new ShiftRepository();
  }

  async openShift(usuario_id: number, sucursal_id: number, fondo_inicial: number) {
    if (fondo_inicial < 0) {
      throw new AppError('El fondo inicial de caja no puede ser negativo', 400);
    }

    const activeShift = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (activeShift) {
      throw new AppError('Ya tienes un turno de caja abierto en este momento', 400);
    }

    return await this.shiftRepo.openShift(sucursal_id, usuario_id, fondo_inicial);
  }

  async getActiveShift(usuario_id: number) {
    const shift = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (!shift) {
      return null;
    }

    // Calcular efectivo esperado en tiempo real
    const esperado = await this.shiftRepo.calculateExpectedCash(shift.turno_id);
    return {
      ...shift,
      efectivo_esperado_actual: esperado
    };
  }

  async closeShift(usuario_id: number, efectivo_contado: number) {
    if (efectivo_contado === undefined || efectivo_contado < 0) {
      throw new AppError('Debes ingresar el monto de efectivo contado físicamente en caja', 400);
    }

    const shift = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (!shift) {
      throw new AppError('No tienes ningún turno de caja abierto para cerrar', 400);
    }

    // 1. Calcular el efectivo esperado según ventas en efectivo + fondo inicial
    const efectivoEsperado = await this.shiftRepo.calculateExpectedCash(shift.turno_id);

    // 2. Cerrar turno en base de datos
    const closedShift = await this.shiftRepo.closeShift(
      shift.turno_id,
      efectivoEsperado,
      efectivo_contado
    );

    const diferencia = efectivo_contado - efectivoEsperado;
    let estadoCuadre = 'cuadrado';
    if (diferencia > 0) estadoCuadre = 'sobrante';
    else if (diferencia < 0) estadoCuadre = 'faltante';

    return {
      turno: closedShift,
      cuadre: {
        fondo_inicial: parseFloat(String(closedShift.fondo_inicial)),
        efectivo_esperado: efectivoEsperado,
        efectivo_contado,
        diferencia: parseFloat(diferencia.toFixed(2)),
        estado_cuadre: estadoCuadre
      }
    };
  }

  async getHistory(sucursal_id?: number, limit = 20) {
    return await this.shiftRepo.getHistory(sucursal_id, limit);
  }
}
