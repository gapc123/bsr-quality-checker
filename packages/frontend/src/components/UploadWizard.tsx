/**
 * Upload Wizard
 *
 * Multi-step wizard for guided document upload:
 * - Step 1: Project Context
 * - Step 2: Document Upload
 * - Step 3: Validation & Review
 * - Step 4: Submit for Assessment
 *
 * Progressive disclosure with smart navigation
 */

import React, { useState, useMemo } from 'react';
import ProjectContextForm, { type ProjectContext } from './ProjectContextForm';
import DocumentUploadZone, { type UploadedDocument } from './DocumentUploadZone';
import DocumentValidationCard from './DocumentValidationCard';

interface UploadWizardProps {
  onComplete?: (context: ProjectContext, documents: UploadedDocument[]) => void;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export const UploadWizard: React.FC<UploadWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [isContextValid, setIsContextValid] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step titles
  const stepTitles = {
    1: 'Project Details',
    2: 'Upload Documents',
    3: 'Validation & Review',
    4: 'Submit Assessment'
  };

  // Handle file uploads
  const handleFilesAdded = (files: File[]) => {
    const newDocuments: UploadedDocument[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending' as const
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Simulate upload with progress
    newDocuments.forEach((doc, idx) => {
      setTimeout(() => {
        setDocuments(prev =>
          prev.map(d =>
            d.id === doc.id ? { ...d, status: 'uploading' as const, uploadProgress: 0 } : d
          )
        );

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setDocuments(prev =>
            prev.map(d =>
              d.id === doc.id ? { ...d, uploadProgress: Math.min(progress, 100) } : d
            )
          );

          if (progress >= 100) {
            clearInterval(interval);
            setDocuments(prev =>
              prev.map(d =>
                d.id === doc.id
                  ? {
                      ...d,
                      status: 'complete' as const,
                      uploadProgress: 100,
                      documentType: detectDocumentType(d.name)
                    }
                  : d
              )
            );
          }
        }, 200);
      }, idx * 500);
    });
  };

  // Simple document type detection
  const detectDocumentType = (filename: string): string | undefined => {
    const lower = filename.toLowerCase();
    if (lower.includes('fire') || lower.includes('fss')) return 'Fire Safety Strategy';
    if (lower.includes('structural')) return 'Structural Design Statement';
    if (lower.includes('building') && lower.includes('reg')) return 'Building Regulations Application';
    if (lower.includes('principal') || lower.includes('designer')) return 'Principal Designer\'s Declaration';
    if (lower.includes('change') && lower.includes('control')) return 'Change Control Plan';
    if (lower.includes('drawing') || lower.includes('plan') || lower.includes('.dwg')) return 'Architectural Drawings';
    if (lower.includes('golden') && lower.includes('thread')) return 'Golden Thread Strategy';
    if (lower.includes('safety') && lower.includes('case')) return 'Safety Case Report';
    return undefined;
  };

  const handleDocumentRemove = (documentId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  // Navigation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return isContextValid;
      case 2:
        return documents.length > 0 && documents.every(d => d.status === 'complete');
      case 3:
        return documents.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, isContextValid, documents]);

  const handleNext = () => {
    if (canProceed && currentStep < 4) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleSubmit = async () => {
    if (!projectContext) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    onComplete?.(projectContext, documents);
    setIsSubmitting(false);
  };

  // Calculate overall progress
  const progressPercentage = useMemo(() => {
    return ((currentStep - 1) / 3) * 100;
  }, [currentStep]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === currentStep;
            const isComplete = step < currentStep;
            const isPending = step > currentStep;

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      transition-all duration-300
                      ${isActive ? 'bg-indigo-600 text-white scale-110' : ''}
                      ${isComplete ? 'bg-green-600 text-white' : ''}
                      ${isPending ? 'bg-slate-200 text-slate-600' : ''}
                    `}
                  >
                    {isComplete ? '✓' : step}
                  </div>
                  <div className={`text-xs mt-2 text-center font-semibold ${
                    isActive ? 'text-indigo-600' : 'text-slate-600'
                  }`}>
                    {stepTitles[step as WizardStep]}
                  </div>
                </div>
                {step < 4 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                    step < currentStep ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <p className="text-sm text-slate-600 mt-2 text-center">
          Step {currentStep} of 4 • {Math.round(progressPercentage)}% Complete
        </p>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-lg p-6 min-h-[500px]">
        {/* Step 1: Project Context */}
        {currentStep === 1 && (
          <ProjectContextForm
            initialContext={projectContext || undefined}
            onContextChange={setProjectContext}
            onValidationChange={setIsContextValid}
          />
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Documents</h2>
              <p className="text-sm text-slate-600">
                Upload all available project documents. We'll validate them against BSR requirements.
              </p>
            </div>

            <DocumentUploadZone
              onFilesAdded={handleFilesAdded}
              onDocumentRemove={handleDocumentRemove}
              documents={documents}
            />

            {projectContext && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-indigo-900 mb-2">Project Context</h3>
                <div className="text-sm text-indigo-800 space-y-1">
                  <p><strong>Name:</strong> {projectContext.projectName}</p>
                  <p><strong>Type:</strong> {projectContext.buildingType}</p>
                  {projectContext.heightMeters && <p><strong>Height:</strong> {projectContext.heightMeters}m</p>}
                  <p><strong>HRB:</strong> {projectContext.isHRB ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Validation & Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Validation & Review</h2>
              <p className="text-sm text-slate-600">
                Review validation results before submitting for full assessment
              </p>
            </div>

            <DocumentValidationCard
              documents={documents}
              projectContext={projectContext || undefined}
            />
          </div>
        )}

        {/* Step 4: Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Submit</h2>
              <p className="text-sm text-slate-600">
                Your documents will be assessed against BSR Gateway 2 requirements
              </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">📋 Submission Summary</h3>
                {projectContext && (
                  <div className="text-sm text-slate-700 space-y-1">
                    <p><strong>Project:</strong> {projectContext.projectName}</p>
                    {projectContext.projectReference && (
                      <p><strong>Reference:</strong> {projectContext.projectReference}</p>
                    )}
                    <p><strong>Building Type:</strong> {projectContext.buildingType}</p>
                    {projectContext.heightMeters && (
                      <p><strong>Height:</strong> {projectContext.heightMeters}m ({projectContext.storeys} storeys)</p>
                    )}
                    <p><strong>Location:</strong> {projectContext.isLondon ? 'London' : 'Outside London'}</p>
                    <p><strong>Risk Category:</strong> {projectContext.isHRB ? 'Higher-Risk Building' : 'Standard Building'}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-300">
                <h4 className="font-semibold text-slate-900 mb-2">📎 Documents ({documents.length})</h4>
                <div className="space-y-1 text-sm text-slate-700">
                  {documents.slice(0, 5).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <span>✓</span>
                      <span className="truncate">{doc.name}</span>
                      {doc.documentType && (
                        <span className="text-xs text-indigo-600">({doc.documentType})</span>
                      )}
                    </div>
                  ))}
                  {documents.length > 5 && (
                    <p className="text-slate-600">+ {documents.length - 5} more documents</p>
                  )}
                </div>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span>⚙️</span>
                What Happens Next
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span>1.</span>
                  <span>Documents are processed and analyzed against BSR criteria</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2.</span>
                  <span>AI identifies gaps, issues, and compliance status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>3.</span>
                  <span>Results dashboard shows submission readiness and action items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>4.</span>
                  <span>Assessment typically completes in 5-10 minutes</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-3 border-2 border-indigo-300 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
          )}
        </div>

        <div>
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Start Assessment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center text-sm text-slate-600">
        {currentStep === 1 && (
          <p>💡 Tip: Accurate project details ensure we apply the correct BSR requirements</p>
        )}
        {currentStep === 2 && (
          <p>💡 Tip: Upload all documents now - you can add more later if needed</p>
        )}
        {currentStep === 3 && (
          <p>💡 Tip: Address critical missing documents before submission to avoid delays</p>
        )}
        {currentStep === 4 && (
          <p>Need help? Contact support@attlee.ai</p>
        )}
      </div>
    </div>
  );
};

export default UploadWizard;
