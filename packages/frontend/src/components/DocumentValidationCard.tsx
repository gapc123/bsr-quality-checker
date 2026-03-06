/**
 * Document Validation Card
 *
 * Real-time feedback on uploaded documents:
 * - Missing required documents
 * - Document quality checks
 * - Suggested document types
 * - Warnings about common issues
 */

import React, { useMemo } from 'react';
import type { UploadedDocument } from './DocumentUploadZone';
import type { ProjectContext } from './ProjectContextForm';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  critical: boolean;
}

interface DocumentValidationCardProps {
  documents: UploadedDocument[];
  projectContext?: ProjectContext;
  onSuggestDocument?: (docType: string) => void;
}

export const DocumentValidationCard: React.FC<DocumentValidationCardProps> = ({
  documents,
  projectContext,
  onSuggestDocument
}) => {
  // Define required documents based on project context
  const requiredDocuments = useMemo((): RequiredDocument[] => {
    const baseDocuments: RequiredDocument[] = [
      {
        id: 'fire_safety_strategy',
        name: 'Fire Safety Strategy',
        description: 'Comprehensive fire safety design and management approach',
        required: true,
        critical: true
      },
      {
        id: 'structural_design',
        name: 'Structural Design Statement',
        description: 'Structural engineer\'s design approach and calculations',
        required: true,
        critical: true
      },
      {
        id: 'building_regs',
        name: 'Building Regulations Application',
        description: 'Full Plans application with all required details',
        required: true,
        critical: true
      },
      {
        id: 'principal_designer',
        name: 'Principal Designer\'s Declaration',
        description: 'Signed declaration of competence and duties',
        required: true,
        critical: true
      },
      {
        id: 'change_control',
        name: 'Change Control Plan',
        description: 'Process for managing design and construction changes',
        required: true,
        critical: false
      },
      {
        id: 'drawings',
        name: 'Architectural Drawings',
        description: 'Plans, sections, elevations with BSR notes',
        required: true,
        critical: true
      }
    ];

    // Add HRB-specific documents
    if (projectContext?.isHRB) {
      baseDocuments.push(
        {
          id: 'golden_thread',
          name: 'Golden Thread Strategy',
          description: 'Information management plan for building lifecycle',
          required: true,
          critical: true
        },
        {
          id: 'safety_case',
          name: 'Safety Case Report',
          description: 'Demonstration of building safety throughout design',
          required: true,
          critical: true
        },
        {
          id: 'competency',
          name: 'Competency Declarations',
          description: 'Evidence of dutyholders\' competence',
          required: true,
          critical: false
        }
      );
    }

    // Add London-specific documents
    if (projectContext?.isLondon) {
      baseDocuments.push({
        id: 'london_plan',
        name: 'London Plan Compliance Statement',
        description: 'Compliance with London Plan policies',
        required: true,
        critical: false
      });
    }

    return baseDocuments;
  }, [projectContext]);

  // Check which documents are present
  const documentStatus = useMemo(() => {
    const present: string[] = [];
    const missing: RequiredDocument[] = [];
    const criticalMissing: RequiredDocument[] = [];

    requiredDocuments.forEach(reqDoc => {
      // Simple matching - in production would use more sophisticated detection
      const found = documents.some(doc =>
        doc.documentType?.toLowerCase().includes(reqDoc.id.replace(/_/g, ' ')) ||
        doc.name.toLowerCase().includes(reqDoc.name.toLowerCase().split(' ')[0])
      );

      if (found) {
        present.push(reqDoc.id);
      } else {
        missing.push(reqDoc);
        if (reqDoc.critical) {
          criticalMissing.push(reqDoc);
        }
      }
    });

    return { present, missing, criticalMissing };
  }, [documents, requiredDocuments]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (requiredDocuments.length === 0) return 0;
    return Math.round((documentStatus.present.length / requiredDocuments.length) * 100);
  }, [documentStatus, requiredDocuments]);

  // Quality checks
  const qualityIssues = useMemo(() => {
    const issues: string[] = [];

    // Check for oversized files
    const largeFiles = documents.filter(doc => doc.size > 25 * 1024 * 1024);
    if (largeFiles.length > 0) {
      issues.push(`${largeFiles.length} file(s) over 25MB - consider compression`);
    }

    // Check for uncommon file types
    const uncommonTypes = documents.filter(doc =>
      !doc.name.toLowerCase().endsWith('.pdf') &&
      !doc.name.toLowerCase().endsWith('.docx')
    );
    if (uncommonTypes.length > 0) {
      issues.push(`${uncommonTypes.length} file(s) in non-standard format - PDF preferred`);
    }

    // Check for missing document types
    const untypedDocs = documents.filter(doc => !doc.documentType);
    if (untypedDocs.length > 0) {
      issues.push(`${untypedDocs.length} file(s) couldn't be auto-classified - manual review needed`);
    }

    return issues;
  }, [documents]);

  // Determine overall status
  const getOverallStatus = () => {
    if (documentStatus.criticalMissing.length > 0) {
      return { color: 'red', icon: '🚨', label: 'CRITICAL DOCUMENTS MISSING' };
    }
    if (documentStatus.missing.length > 0) {
      return { color: 'amber', icon: '⚠️', label: 'INCOMPLETE' };
    }
    if (qualityIssues.length > 0) {
      return { color: 'blue', icon: 'ℹ️', label: 'COMPLETE WITH WARNINGS' };
    }
    return { color: 'green', icon: '✅', label: 'ALL REQUIRED DOCUMENTS PRESENT' };
  };

  const status = getOverallStatus();

  return (
    <div className="space-y-4">
      {/* Overall Status Banner */}
      <div className={`
        rounded-lg border-2 p-4
        ${status.color === 'red' ? 'bg-red-50 border-red-500' : ''}
        ${status.color === 'amber' ? 'bg-amber-50 border-amber-500' : ''}
        ${status.color === 'blue' ? 'bg-blue-50 border-blue-500' : ''}
        ${status.color === 'green' ? 'bg-green-50 border-green-500' : ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <h3 className={`font-bold ${
                status.color === 'red' ? 'text-red-900' : ''
              }${status.color === 'amber' ? 'text-amber-900' : ''}
              ${status.color === 'blue' ? 'text-blue-900' : ''}
              ${status.color === 'green' ? 'text-green-900' : ''}`}>
                {status.label}
              </h3>
              <p className={`text-sm ${
                status.color === 'red' ? 'text-red-700' : ''
              }${status.color === 'amber' ? 'text-amber-700' : ''}
              ${status.color === 'blue' ? 'text-blue-700' : ''}
              ${status.color === 'green' ? 'text-green-700' : ''}`}>
                {documentStatus.present.length} of {requiredDocuments.length} required documents uploaded
              </p>
            </div>
          </div>

          {/* Progress Ring or Check */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                status.color === 'red' ? 'text-red-900' : ''
              }${status.color === 'amber' ? 'text-amber-900' : ''}
              ${status.color === 'blue' ? 'text-blue-900' : ''}
              ${status.color === 'green' ? 'text-green-900' : ''}`}>
                {completionPercentage}%
              </div>
              <div className={`text-xs ${
                status.color === 'red' ? 'text-red-700' : ''
              }${status.color === 'amber' ? 'text-amber-700' : ''}
              ${status.color === 'blue' ? 'text-blue-700' : ''}
              ${status.color === 'green' ? 'text-green-700' : ''}`}>
                Complete
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              status.color === 'red' ? 'bg-red-600' : ''
            }${status.color === 'amber' ? 'bg-amber-600' : ''}
            ${status.color === 'blue' ? 'bg-blue-600' : ''}
            ${status.color === 'green' ? 'bg-green-600' : ''}`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Critical Missing Documents */}
      {documentStatus.criticalMissing.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
            <span>🚨</span>
            Critical Documents Missing ({documentStatus.criticalMissing.length})
          </h4>
          <div className="space-y-2">
            {documentStatus.criticalMissing.map(doc => (
              <div key={doc.id} className="bg-white border border-red-300 rounded p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-900">{doc.name}</p>
                    <p className="text-xs text-red-700 mt-1">{doc.description}</p>
                  </div>
                  {onSuggestDocument && (
                    <button
                      onClick={() => onSuggestDocument(doc.id)}
                      className="ml-2 px-3 py-1 text-xs bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors"
                    >
                      Get Template
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-800 mt-3 font-semibold">
            ⚠️ Submission will be rejected without these critical documents
          </p>
        </div>
      )}

      {/* Non-Critical Missing Documents */}
      {documentStatus.missing.length > documentStatus.criticalMissing.length && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span>📋</span>
            Additional Required Documents ({documentStatus.missing.length - documentStatus.criticalMissing.length})
          </h4>
          <div className="space-y-2">
            {documentStatus.missing.filter(doc => !doc.critical).map(doc => (
              <div key={doc.id} className="bg-white border border-amber-200 rounded p-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{doc.name}</p>
                    <p className="text-xs text-amber-700 mt-1">{doc.description}</p>
                  </div>
                  {onSuggestDocument && (
                    <button
                      onClick={() => onSuggestDocument(doc.id)}
                      className="ml-2 px-3 py-1 text-xs bg-amber-600 text-white font-semibold rounded hover:bg-amber-700 transition-colors"
                    >
                      Get Template
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Issues */}
      {qualityIssues.length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            Quality Checks ({qualityIssues.length})
          </h4>
          <ul className="space-y-1">
            {qualityIssues.map((issue, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span>•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Clear Message */}
      {documentStatus.missing.length === 0 && qualityIssues.length === 0 && documents.length > 0 && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="text-sm font-bold text-green-900 mb-1">
                Ready for Assessment
              </h4>
              <p className="text-sm text-green-800">
                All required documents are present and passed quality checks. You can proceed to submit for assessment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Checklist */}
      <details className="bg-slate-50 border border-slate-300 rounded-lg p-4">
        <summary className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600">
          View Full Document Checklist ({documentStatus.present.length}/{requiredDocuments.length})
        </summary>
        <div className="mt-3 space-y-2">
          {requiredDocuments.map(doc => {
            const isPresent = documentStatus.present.includes(doc.id);
            return (
              <div key={doc.id} className={`flex items-start gap-2 text-sm p-2 rounded ${
                isPresent ? 'bg-green-50' : 'bg-slate-100'
              }`}>
                <span className="mt-0.5">
                  {isPresent ? '✅' : '⬜'}
                </span>
                <div className="flex-1">
                  <span className={`font-semibold ${isPresent ? 'text-green-900' : 'text-slate-700'}`}>
                    {doc.name}
                  </span>
                  {doc.critical && !isPresent && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                      CRITICAL
                    </span>
                  )}
                  <p className="text-xs text-slate-600 mt-1">{doc.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
};

export default DocumentValidationCard;
