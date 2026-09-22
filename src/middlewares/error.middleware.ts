import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Error interno del servidor';

  if (statusCode === 500) {
    console.error('[Unhandled Error]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode
  });
};
