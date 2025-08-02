import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: err.errors,
    });
    return;
  }

  // Handle other known error types
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // Default error response
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
  return;
};

/**
 * Not found middleware for handling 404 errors
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found' });
  return;
};

/**
 * Async handler to wrap async route handlers and catch errors
 */
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};