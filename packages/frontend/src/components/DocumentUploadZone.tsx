/**
 * Document Upload Zone
 *
 * Drag & drop file upload with:
 * - Visual feedback for drag states
 * - File type validation
 * - Progress indicators
 * - Document type detection/suggestions
 */

import React, { useState, useCallback, useRef } from 'react';

export interface UploadedDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  documentType?: string;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  errorMessage?: string;
}

interface DocumentUploadZoneProps {
  onFilesAdded?: (files: File[]) => void;
  onDocumentRemove?: (documentId: string) => void;
  documents?: UploadedDocument[];
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  onFilesAdded,
  onDocumentRemove,
  documents = [],
  acceptedFileTypes = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.dwg'],
  maxFileSize = 50, // MB
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate files
  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        errors.push(`${file.name} exceeds ${maxFileSize}MB size limit`);
        return;
      }

      // Check file type
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.some(type => type.toLowerCase() === fileExt)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  }, [acceptedFileTypes, maxFileSize]);

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setValidationError(null);
    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setValidationError(errors.join('; '));
    }

    if (valid.length > 0) {
      onFilesAdded?.(valid);
    }
  }, [validateFiles, onFilesAdded]);

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  // Click to upload
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get document type icon
  const getDocumentIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'dwg': return '📐';
      default: return '📎';
    }
  };

  // Get status badge
  const getStatusBadge = (doc: UploadedDocument) => {
    switch (doc.status) {
      case 'uploading':
        return (
          <span className="text-xs text-blue-600 font-semibold">
            Uploading... {doc.uploadProgress}%
          </span>
        );
      case 'complete':
        return (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span>✓</span> Complete
          </span>
        );
      case 'error':
        return (
          <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
            <span>✗</span> Error
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-500 font-semibold">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-3">
          {/* Icon */}
          <div className="text-5xl">
            {isDragging ? '⬇️' : '📁'}
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              or click to browse
            </p>
          </div>

          {/* File type info */}
          <div className="text-xs text-slate-500">
            <p>Supported: {acceptedFileTypes.join(', ')}</p>
            <p className="mt-1">Max file size: {maxFileSize}MB</p>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3">
          <p className="text-sm text-red-800 flex items-start gap-2">
            <span className="text-red-600 font-bold">⚠️</span>
            <span>{validationError}</span>
          </p>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>📎</span>
            Uploaded Documents ({documents.length})
          </h3>

          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`
                  bg-white border rounded-lg p-3
                  ${doc.status === 'error' ? 'border-red-300' : 'border-slate-300'}
                `}
              >
                <div className="flex items-start justify-between">
                  {/* Document Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getDocumentIcon(doc.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {doc.name}
                        </p>
                        {getStatusBadge(doc)}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {formatFileSize(doc.size)}
                      </p>
                      {doc.documentType && (
                        <p className="text-xs text-indigo-600 mt-1 font-semibold">
                          Detected: {doc.documentType}
                        </p>
                      )}
                      {doc.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">
                          {doc.errorMessage}
                        </p>
                      )}

                      {/* Progress Bar */}
                      {doc.status === 'uploading' && doc.uploadProgress !== undefined && (
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${doc.uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  {onDocumentRemove && doc.status !== 'uploading' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentRemove(doc.id);
                      }}
                      className="ml-2 p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="Remove document"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected Documents Help */}
      {documents.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span>📋</span>
            Typically Required Documents
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Fire Safety Strategy</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Structural Design Statement</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Building Regulations Application</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Principal Designer's Declaration</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Change Control Plan</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Drawings (Plans, Sections, Elevations)</span>
            </li>
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            💡 Tip: Upload all available documents - we'll identify what's present and what's missing.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadZone;
