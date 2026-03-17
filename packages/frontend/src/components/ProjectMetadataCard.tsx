/**
 * Project Metadata Card
 *
 * Displays project context information at the top of results page
 * Provides immediate visual context about the building being assessed
 *
 * UI Fix 2: Project metadata card at top of results page
 */

import React from 'react';
import { BuildingIcon, MapPinIcon } from './Icons';

interface ProjectMetadataCardProps {
  packContext: {
    buildingType: string;
    heightMeters: number | null;
    storeys: number | null;
    isLondon: boolean;
    isHRB: boolean;
  };
  packId?: string;
  versionId?: string;
  generatedAt?: string;
}

export const ProjectMetadataCard: React.FC<ProjectMetadataCardProps> = ({
  packContext,
  packId,
  versionId,
  generatedAt
}) => {
  // Format building type for display
  const formatBuildingType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="rounded-lg border-2 border-slate-300 bg-white shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-3">
        <div className="flex items-center gap-2 text-white">
          <BuildingIcon size={20} color="white" />
          <h3 className="font-semibold text-sm uppercase tracking-wide">Project Information</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Building Type */}
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Building Type
            </div>
            <div className="text-base font-semibold text-slate-900">
              {formatBuildingType(packContext.buildingType)}
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <MapPinIcon size={12} color="#64748b" />
              Location
            </div>
            <div className="text-base font-semibold text-slate-900">
              {packContext.isLondon ? 'London' : 'Outside London'}
            </div>
          </div>

          {/* Height & Storeys */}
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Building Dimensions
            </div>
            <div className="text-base font-semibold text-slate-900">
              {packContext.heightMeters !== null && (
                <span>{packContext.heightMeters}m high</span>
              )}
              {packContext.heightMeters !== null && packContext.storeys !== null && (
                <span className="text-slate-400 mx-1">•</span>
              )}
              {packContext.storeys !== null && (
                <span>{packContext.storeys} {packContext.storeys === 1 ? 'storey' : 'storeys'}</span>
              )}
              {packContext.heightMeters === null && packContext.storeys === null && (
                <span className="text-slate-400">Not specified</span>
              )}
            </div>
          </div>

          {/* HRB Status */}
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Regulatory Status
            </div>
            <div>
              {packContext.isHRB ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">
                  Higher-Risk Building
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                  Standard Building
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secondary metadata row */}
        {(generatedAt || packId) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
              {generatedAt && (
                <div>
                  <span className="font-medium">Assessment Date:</span>{' '}
                  <span className="text-slate-700">{formatDate(generatedAt)}</span>
                </div>
              )}
              {packId && (
                <div>
                  <span className="font-medium">Pack ID:</span>{' '}
                  <span className="font-mono text-slate-700">{packId.slice(0, 8)}</span>
                </div>
              )}
              {versionId && (
                <div>
                  <span className="font-medium">Version ID:</span>{' '}
                  <span className="font-mono text-slate-700">{versionId.slice(0, 8)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMetadataCard;
