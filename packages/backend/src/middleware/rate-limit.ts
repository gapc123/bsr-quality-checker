import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 *
 * Protects expensive endpoints from abuse and prevents API resource exhaustion
 */

// General API rate limit - applies to all authenticated requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  },
});

// Strict limiter for expensive operations (uploads, analysis)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many upload/analysis requests, please try again later.' });
  },
});

// AI analysis rate limit - very expensive operations
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit to 20 analyses per hour
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Analysis rate limit exceeded. Please wait before running more analyses.' });
  },
});

// Export rate limit - moderate restriction
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 exports per 15 minutes
  message: 'Too many export requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Document upload rate limit
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 uploads per 15 minutes
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler to provide more context
  handler: (_req, res) => {
    const retryAfter = res.getHeader('Retry-After') || 60;
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many upload requests. Please wait before uploading more documents.',
      retryAfter,
    });
  },
});
