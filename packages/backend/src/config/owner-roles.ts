/**
 * Centralized Owner Role Configuration
 *
 * Single source of truth for action owner role mapping across all outputs:
 * - Compliance Matrix (XLSX)
 * - Gap Analysis PDF
 * - Submission Readiness Report PDF
 *
 * Addresses GitHub Issue #3
 */

export type OwnerRoleType =
  | 'FIRE_ENGINEER'
  | 'STRUCTURAL_ENGINEER'
  | 'MEP_CONSULTANT'
  | 'ACOUSTIC_CONSULTANT'
  | 'ARCHITECT'
  | 'PRINCIPAL_DESIGNER'
  | 'PRINCIPAL_CONTRACTOR'
  | 'CLIENT_INFO'
  | 'PROJECT_TEAM'
  | 'AI_AMENDABLE';

/**
 * Map owner role types to display names
 */
export const OWNER_ROLE_DISPLAY_NAMES: Record<OwnerRoleType, string> = {
  FIRE_ENGINEER: 'Fire Engineer',
  STRUCTURAL_ENGINEER: 'Structural Engineer',
  MEP_CONSULTANT: 'MEP Consultant',
  ACOUSTIC_CONSULTANT: 'Acoustic Consultant',
  ARCHITECT: 'Architect',
  PRINCIPAL_DESIGNER: 'Principal Designer',
  PRINCIPAL_CONTRACTOR: 'Principal Contractor',
  CLIENT_INFO: 'Client / Developer',
  PROJECT_TEAM: 'Project Team',
  AI_AMENDABLE: 'AI Amendable'
};

/**
 * Map owner role types to consultant groups (for Submission Readiness Report)
 */
export const OWNER_ROLE_TO_CONSULTANT_GROUP: Record<OwnerRoleType, string> = {
  FIRE_ENGINEER: 'FIRE ENGINEER',
  STRUCTURAL_ENGINEER: 'STRUCTURAL ENGINEER',
  MEP_CONSULTANT: 'MEP CONSULTANT',
  ACOUSTIC_CONSULTANT: 'MEP CONSULTANT', // Group with MEP
  ARCHITECT: 'ARCHITECT',
  PRINCIPAL_DESIGNER: 'PRINCIPAL DESIGNER',
  PRINCIPAL_CONTRACTOR: 'PRINCIPAL DESIGNER', // Group with Principal Designer
  CLIENT_INFO: 'CLIENT / DEVELOPER',
  PROJECT_TEAM: 'CLIENT / DEVELOPER',
  AI_AMENDABLE: 'CLIENT / DEVELOPER'
};

/**
 * Format owner role for display
 * @param ownerType - The owner role type
 * @returns Formatted display name
 */
export function formatOwnerRole(ownerType?: string): string {
  if (!ownerType) {
    return OWNER_ROLE_DISPLAY_NAMES.PROJECT_TEAM;
  }

  // Handle string literal types
  const roleType = ownerType as OwnerRoleType;
  return OWNER_ROLE_DISPLAY_NAMES[roleType] || 'Project Team';
}

/**
 * Map owner role to consultant group for grouping requests
 * @param ownerType - The owner role type
 * @returns Consultant group name
 */
export function mapOwnerToConsultantGroup(ownerType?: string): string {
  if (!ownerType) {
    return 'CLIENT / DEVELOPER';
  }

  const roleType = ownerType as OwnerRoleType;
  return OWNER_ROLE_TO_CONSULTANT_GROUP[roleType] || 'CLIENT / DEVELOPER';
}

/**
 * Detect specialist role from text (for Gap Analysis PDF backward compatibility)
 * @param text - Text to analyze
 * @returns Set of detected specialist roles
 */
export function detectSpecialistRoles(text: string): Set<string> {
  const specialists = new Set<string>();
  const lowerText = text.toLowerCase();

  if (lowerText.includes('fire')) specialists.add('Fire Engineer');
  if (lowerText.includes('structural')) specialists.add('Structural Engineer');
  if (lowerText.includes('mep')) specialists.add('MEP Consultant');
  if (lowerText.includes('acoustic')) specialists.add('Acoustic Consultant');
  if (lowerText.includes('architect')) specialists.add('Architect');
  if (lowerText.includes('principal designer')) specialists.add('Principal Designer');

  return specialists;
}
