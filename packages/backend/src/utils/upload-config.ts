import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

/**
 * Configuration options for creating a multer upload instance
 */
export interface UploadConfig {
  /** Directory name relative to project root (e.g., 'uploads', 'data/butler') */
  directory: string;
  /**
   * Optional function that returns a per-request subdirectory inside `directory`.
   * Use this to isolate uploads by pack ID:
   *   dynamicSubdir: (req) => req.params.id
   * Results in: /app/uploads/<pack.id>/filename.pdf
   * The subdirectory is created automatically on first upload.
   */
  dynamicSubdir?: (req: Request) => string;
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;
  /** Whether to validate PDF MIME type (default: true) */
  validatePdf?: boolean;
  /** Whether to sanitize filenames (default: false) */
  sanitizeFilename?: boolean;
  /** Filename generation strategy: 'timestamp' or 'uuid' (default: 'timestamp') */
  filenameStrategy?: 'timestamp' | 'uuid';
}

/**
 * Check if a buffer contains PDF magic bytes (%PDF-)
 */
export function isPdfFile(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString() === '%PDF-';
}

/**
 * Sanitize filename to prevent path traversal and remove special characters
 */
export function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Get the appropriate upload directory path based on environment.
 * In production (Docker/Railway): /app/{directory}
 * In development: /packages/backend/../../{directory}
 */
function getUploadDirectory(directory: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const uploadDir = isProduction
    ? path.join(process.cwd(), directory)
    : path.join(process.cwd(), '..', '..', directory);

  // Ensure base directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
}

/**
 * Generate a unique filename based on the configured strategy
 */
function generateUniqueFilename(
  originalname: string,
  strategy: 'timestamp' | 'uuid' = 'timestamp'
): string {
  if (strategy === 'uuid') {
    return `${uuidv4()}-${originalname}`;
  }

  // timestamp strategy (default)
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `${uniqueSuffix}-${originalname}`;
}

/**
 * Create a configured multer instance for file uploads
 *
 * @example
 * // For pack uploads — files land in /app/uploads/<packId>/filename.pdf
 * const upload = createUploadMiddleware({
 *   directory: 'uploads',
 *   dynamicSubdir: (req) => req.params.id,
 *   sanitizeFilename: true,
 * });
 *
 * @example
 * // For butler library
 * const upload = createUploadMiddleware({
 *   directory: 'data/butler'
 * });
 *
 * @example
 * // For temporary uploads
 * const upload = createUploadMiddleware({
 *   directory: 'temp-uploads',
 *   filenameStrategy: 'uuid'
 * });
 */
export function createUploadMiddleware(config: UploadConfig): multer.Multer {
  const {
    directory,
    dynamicSubdir,
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    validatePdf = true,
    sanitizeFilename: shouldSanitize = false,
    filenameStrategy = 'timestamp',
  } = config;

  // Base directory is resolved and created at middleware init time.
  const uploadDir = getUploadDirectory(directory);

  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      if (dynamicSubdir) {
        // Compute per-request subdirectory (e.g. pack ID) and create it lazily.
        const subdir = dynamicSubdir(req as Request);
        const finalDir = path.join(uploadDir, subdir);
        if (!fs.existsSync(finalDir)) {
          fs.mkdirSync(finalDir, { recursive: true });
        }
        cb(null, finalDir);
      } else {
        cb(null, uploadDir);
      }
    },
    filename: (_req, file, cb) => {
      const filename = generateUniqueFilename(file.originalname, filenameStrategy);
      cb(null, filename);
    },
  });

  return multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (validatePdf && file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed'));
      }

      // Sanitize filename if requested
      if (shouldSanitize) {
        file.originalname = sanitizeFilename(file.originalname);
      }

      cb(null, true);
    },
    limits: {
      fileSize: maxFileSize,
    },
  });
}
