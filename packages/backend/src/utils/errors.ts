import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Common API error types
 */
export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(422, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, message);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message?: string;
  stack?: string;
  path?: string;
  timestamp?: string;
}

/**
 * Central error handling middleware
 * Should be placed after all routes
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle multer-specific errors with a clear 400 response
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_UNEXPECTED_FILE'
        ? `Unexpected upload field "${err.field}". Expected field name: "documents".`
        : err.message;
    res.status(400).json({ error: msg });
    return;
  }

  // Determine if it's an operational error
  const isOperational = err instanceof ApiError && err.isOperational;
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  // Log error details for debugging
  const errorLog = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    statusCode,
    isOperational,
  };

  // Log to console (in production, this would go to a logging service)
  if (!isOperational || statusCode >= 500) {
    console.error('Error:', errorLog);
  } else {
    console.warn('Client error:', errorLog);
  }

  // Prepare error response
  const response: ErrorResponse = {
    error: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Async route handler wrapper to catch errors
 * Eliminates the need for try/catch in every route
 *
 * @example
 * router.get('/packs', catchAsync(async (req, res) => {
 *   const packs = await prisma.pack.findMany();
 *   res.json(packs);
 * }));
 */
export function catchAsync(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Helper to log and throw errors with consistent formatting
 *
 * @example
 * const pack = await prisma.pack.findUnique({ where: { id } });
 * if (!pack) {
 *   throw new NotFoundError('Pack not found');
 * }
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
