import { ReportRepository } from '../repositories/report.repository.js';
import { ShiftRepository } from '../repositories/shift.repository.js';

export class ReportService {
  private reportRepo: ReportRepository;
  private shiftRepo: ShiftRepository;

  constructor() {
    this.reportRepo = new ReportRepository();
    this.shiftRepo = new ShiftRepository();
  }

  async getDailySales(sucursal_id?: number, fecha?: string) {
    return await this.reportRepo.getDailySales(sucursal_id, fecha);
  }

  async getBestSellers(options: {
    sucursal_id?: number;
    desde?: string;
    hasta?: string;
    limit?: number;
  }) {
    return await this.reportRepo.getBestSellers(options);
  }

  async getPeakHours(sucursal_id?: number, fecha?: string) {
    return await this.reportRepo.getPeakHours(sucursal_id, fecha);
  }

  async getShiftsHistory(sucursal_id?: number, limit = 20) {
    return await this.shiftRepo.getHistory(sucursal_id, limit);
  }
}
