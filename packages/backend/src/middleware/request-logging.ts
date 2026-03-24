import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request Logging Middleware
 *
 * Adds request ID tracking and structured logging for better observability
 */

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Request ID middleware - generates unique ID for each request
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate or use existing request ID from header
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // Attach to request object
  req.requestId = requestId;
  req.startTime = Date.now();

  // Add to response headers for client-side correlation
  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Request logging middleware - logs all requests with structured format
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log request
  logInfo('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length'),
    };

    if (res.statusCode >= 500) {
      logError('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logWarn('Request completed with client error', logData);
    } else {
      logInfo('Request completed successfully', logData);
    }
  });

  next();
}

/**
 * Structured logging functions
 */

interface LogContext {
  requestId?: string;
  [key: string]: any;
}

function formatLog(
  level: string,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  return JSON.stringify(logEntry);
}

export function logInfo(message: string, context?: LogContext): void {
  console.log(formatLog('INFO', message, context));
}

export function logWarn(message: string, context?: LogContext): void {
  console.warn(formatLog('WARN', message, context));
}

export function logError(
  message: string,
  context?: LogContext,
  error?: Error
): void {
  const errorContext = error
    ? {
        ...context,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }
    : context;

  console.error(formatLog('ERROR', message, errorContext));
}

export function logDebug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatLog('DEBUG', message, context));
  }
}

/**
 * Logger factory - creates logger with request context
 */
export function getLogger(req: Request) {
  const requestId = req.requestId;

  return {
    info: (message: string, context?: Record<string, any>) =>
      logInfo(message, { requestId, ...context }),

    warn: (message: string, context?: Record<string, any>) =>
      logWarn(message, { requestId, ...context }),

    error: (message: string, error?: Error, context?: Record<string, any>) =>
      logError(message, { requestId, ...context }, error),

    debug: (message: string, context?: Record<string, any>) =>
      logDebug(message, { requestId, ...context }),
  };
}
