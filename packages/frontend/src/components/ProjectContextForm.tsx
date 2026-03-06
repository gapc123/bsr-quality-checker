/**
 * Project Context Form
 *
 * Gathers essential project details before document upload
 * Smart validation and contextual help
 * Determines which criteria apply to the project
 */

import React, { useState, useEffect } from 'react';

export interface ProjectContext {
  isLondon: boolean;
  isHRB: boolean;
  buildingType: string;
  heightMeters: number | null;
  storeys: number | null;
  projectName: string;
  projectReference?: string;
}

interface ProjectContextFormProps {
  initialContext?: Partial<ProjectContext>;
  onContextChange?: (context: ProjectContext) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const ProjectContextForm: React.FC<ProjectContextFormProps> = ({
  initialContext,
  onContextChange,
  onValidationChange
}) => {
  const [context, setContext] = useState<ProjectContext>({
    isLondon: initialContext?.isLondon ?? false,
    isHRB: initialContext?.isHRB ?? false,
    buildingType: initialContext?.buildingType ?? '',
    heightMeters: initialContext?.heightMeters ?? null,
    storeys: initialContext?.storeys ?? null,
    projectName: initialContext?.projectName ?? '',
    projectReference: initialContext?.projectReference ?? ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Building types
  const buildingTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'mixed_use', label: 'Mixed Use' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'institutional', label: 'Institutional' },
    { value: 'other', label: 'Other' }
  ];

  // Validate form
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (!context.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }

    if (!context.buildingType) {
      newErrors.buildingType = 'Building type is required';
    }

    if (context.heightMeters !== null && context.heightMeters < 0) {
      newErrors.heightMeters = 'Height must be positive';
    }

    if (context.storeys !== null && context.storeys < 1) {
      newErrors.storeys = 'Storeys must be at least 1';
    }

    // Auto-determine HRB status based on height
    if (context.heightMeters !== null && context.heightMeters >= 18) {
      if (!context.isHRB) {
        setContext(prev => ({ ...prev, isHRB: true }));
      }
    }

    // Auto-determine storeys from height (rough estimate)
    if (context.heightMeters !== null && context.storeys === null && context.heightMeters > 0) {
      const estimatedStoreys = Math.floor(context.heightMeters / 3.5);
      if (estimatedStoreys >= 1) {
        setContext(prev => ({ ...prev, storeys: estimatedStoreys }));
      }
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0 && context.projectName.trim() !== '' && context.buildingType !== '';
    onValidationChange?.(isValid);
    onContextChange?.(context);
  }, [context, onContextChange, onValidationChange]);

  // Handlers
  const handleChange = (field: keyof ProjectContext, value: any) => {
    setContext(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof ProjectContext) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof ProjectContext) => {
    return touched[field] && errors[field];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Details</h2>
        <p className="text-sm text-slate-600">
          Provide key information about your project to determine applicable BSR requirements
        </p>
      </div>

      {/* Project Name */}
      <div>
        <label htmlFor="projectName" className="block text-sm font-semibold text-slate-900 mb-2">
          Project Name <span className="text-red-600">*</span>
        </label>
        <input
          id="projectName"
          type="text"
          value={context.projectName}
          onChange={(e) => handleChange('projectName', e.target.value)}
          onBlur={() => handleBlur('projectName')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            showError('projectName') ? 'border-red-500' : 'border-slate-300'
          }`}
          placeholder="e.g., Riverside Tower"
        />
        {showError('projectName') && (
          <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
        )}
      </div>

      {/* Project Reference (Optional) */}
      <div>
        <label htmlFor="projectReference" className="block text-sm font-semibold text-slate-900 mb-2">
          Project Reference (Optional)
        </label>
        <input
          id="projectReference"
          type="text"
          value={context.projectReference}
          onChange={(e) => handleChange('projectReference', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., RT-2024-001"
        />
      </div>

      {/* Building Type */}
      <div>
        <label htmlFor="buildingType" className="block text-sm font-semibold text-slate-900 mb-2">
          Building Type <span className="text-red-600">*</span>
        </label>
        <select
          id="buildingType"
          value={context.buildingType}
          onChange={(e) => handleChange('buildingType', e.target.value)}
          onBlur={() => handleBlur('buildingType')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            showError('buildingType') ? 'border-red-500' : 'border-slate-300'
          }`}
        >
          <option value="">Select building type...</option>
          {buildingTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {showError('buildingType') && (
          <p className="mt-1 text-sm text-red-600">{errors.buildingType}</p>
        )}
      </div>

      {/* Location & Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Height */}
        <div>
          <label htmlFor="heightMeters" className="block text-sm font-semibold text-slate-900 mb-2">
            Height (meters)
          </label>
          <input
            id="heightMeters"
            type="number"
            min="0"
            step="0.1"
            value={context.heightMeters ?? ''}
            onChange={(e) => handleChange('heightMeters', e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={() => handleBlur('heightMeters')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              showError('heightMeters') ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="e.g., 25.5"
          />
          {showError('heightMeters') && (
            <p className="mt-1 text-sm text-red-600">{errors.heightMeters}</p>
          )}
          {context.heightMeters !== null && context.heightMeters >= 18 && (
            <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
              ⚠️ Height ≥ 18m qualifies as Higher-Risk Building (HRB)
            </p>
          )}
        </div>

        {/* Storeys */}
        <div>
          <label htmlFor="storeys" className="block text-sm font-semibold text-slate-900 mb-2">
            Number of Storeys
          </label>
          <input
            id="storeys"
            type="number"
            min="1"
            step="1"
            value={context.storeys ?? ''}
            onChange={(e) => handleChange('storeys', e.target.value ? parseInt(e.target.value, 10) : null)}
            onBlur={() => handleBlur('storeys')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              showError('storeys') ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="e.g., 8"
          />
          {showError('storeys') && (
            <p className="mt-1 text-sm text-red-600">{errors.storeys}</p>
          )}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={context.isLondon}
            onChange={(e) => handleChange('isLondon', e.target.checked)}
            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <span className="text-sm font-semibold text-slate-900">London Location</span>
            <p className="text-xs text-slate-600 mt-1">
              Building is located within Greater London Authority boundaries
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={context.isHRB}
            onChange={(e) => handleChange('isHRB', e.target.checked)}
            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            disabled={context.heightMeters !== null && context.heightMeters >= 18}
          />
          <div>
            <span className="text-sm font-semibold text-slate-900">Higher-Risk Building (HRB)</span>
            <p className="text-xs text-slate-600 mt-1">
              Building is ≥18m or ≥7 storeys with residential units
            </p>
            {context.heightMeters !== null && context.heightMeters >= 18 && (
              <p className="text-xs text-indigo-600 mt-1 font-semibold">
                ✓ Auto-determined from height
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Smart Help Card */}
      {context.isHRB && (
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
          <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            HRB Requirements Apply
          </h3>
          <p className="text-sm text-indigo-800">
            As a Higher-Risk Building, your project will be assessed against the full Gateway 2 submission requirements including:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-indigo-800">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Building Safety Act 2022 compliance</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Fire Safety Strategy requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Principal Designer and Accountable Person duties</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Golden Thread documentation</span>
            </li>
          </ul>
        </div>
      )}

      {/* Summary Card */}
      {context.projectName && context.buildingType && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4">
          <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <span>✓</span>
            Project Context Captured
          </h3>
          <div className="text-sm text-emerald-800 space-y-1">
            <p><strong>Project:</strong> {context.projectName}</p>
            <p><strong>Type:</strong> {buildingTypes.find(t => t.value === context.buildingType)?.label}</p>
            {context.heightMeters && <p><strong>Height:</strong> {context.heightMeters}m</p>}
            {context.storeys && <p><strong>Storeys:</strong> {context.storeys}</p>}
            <p><strong>Location:</strong> {context.isLondon ? 'London' : 'Outside London'}</p>
            <p><strong>Risk Category:</strong> {context.isHRB ? 'Higher-Risk Building' : 'Standard Building'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectContextForm;
