import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: number;
  path?: string;
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('API Error:', {
    error: err.name || 'Error',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.status || err.statusCode || 500;
  
  const errorResponse: ErrorResponse = {
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    timestamp: Date.now(),
    path: req.path
  };

  res.status(statusCode).json(errorResponse);
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
}

export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: Date.now(),
    path: req.path
  });
}
