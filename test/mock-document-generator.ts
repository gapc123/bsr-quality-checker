/**
 * Mock Document Generator
 *
 * Converts synthetic test pack descriptions into DocumentEvidence[] format
 * that the deterministic rules engine can process.
 *
 * This generates realistic "extracted text" from pack characteristics,
 * simulating what would be extracted from real PDFs.
 */

import fs from 'fs';
import path from 'path';

export interface DocumentEvidence {
  filename: string;
  docType: string | null;
  extractedText: string;
}

export interface PackCharacteristics {
  packId: string;
  packName: string;
  quality: 'good' | 'borderline' | 'poor';
  height: number;
  storeys: number;
  location: string;
  buildingUse: string;
  units: number;
  fireStrategyPages?: number;
  hasFireStrategy: boolean;
  hasSprinklers: boolean;
  staircaseCount: number;
  claddingType: string;
  fireResistancePeriod?: string;
  travelDistance?: string;
  documents: string[];
  issues?: string[];
  strengths?: string[];
}

/**
 * Extract characteristics from a test pack by reading its README and ground truth
 */
export function extractPackCharacteristics(packPath: string): PackCharacteristics {
  const readmePath = path.join(packPath, 'README.md');
  const groundTruthPath = path.join(packPath, 'ground-truth.json');

  const readme = fs.readFileSync(readmePath, 'utf-8');
  const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));

  // Parse key characteristics from README
  const heightMatch = readme.match(/Height[:\s]+(\d+)m/i);
  const storeysMatch = readme.match(/(\d+)\s+storey/i);
  const locationMatch = readme.match(/Location[:\s]+([^\n]+)/i);
  const unitsMatch = readme.match(/(\d+)\s+apartment|(\d+)\s+studio/i);
  const fireStrategyPagesMatch = readme.match(/(\d+)\s+pages/i);

  // Determine key features from ground truth expectations
  const hasSprinklers = groundTruth.rule_expectations['SM-005']?.expected_status === 'pass';
  const hasFireStrategy = groundTruth.rule_expectations['SM-001']?.expected_status !== 'fail' ||
                          readme.includes('Fire Strategy');

  // Parse staircase count from ground truth
  let staircaseCount = 2;
  const staircaseRule = groundTruth.rule_expectations['SM-007'];
  if (staircaseRule?.reasoning?.includes('only 1') || staircaseRule?.reasoning?.includes('Only 1')) {
    staircaseCount = 1;
  }

  // Parse cladding type
  let claddingType = 'brick and mineral wool';
  const claddingRule = groundTruth.rule_expectations['SM-004'];
  if (claddingRule?.reasoning?.includes('ACM') || claddingRule?.reasoning?.includes('combustible')) {
    claddingType = 'ACM (combustible)';
  }

  // Parse fire resistance
  let fireResistancePeriod: string | undefined;
  const compartRule = groundTruth.rule_expectations['SM-003'];
  if (compartRule?.reasoning?.includes('60')) {
    fireResistancePeriod = '60 minutes';
  } else if (compartRule?.reasoning?.includes('90')) {
    fireResistancePeriod = '90 minutes';
  }

  // Parse travel distance
  let travelDistance: string | undefined;
  const escapeRule = groundTruth.rule_expectations['SM-002'];
  if (escapeRule?.reasoning?.includes('18m') || escapeRule?.reasoning?.includes('15m')) {
    const match = escapeRule.reasoning.match(/(\d+)m/);
    travelDistance = match ? `${match[1]}m` : undefined;
  }

  // Determine document list (simplified - would be in DOCUMENTS.md)
  const documents = hasFireStrategy ? [
    '01_Application_Form.pdf',
    '02_Site_Location_Plan.pdf',
    '03_Building_Regs_Compliance_Statement.pdf',
    '04_Fire_Strategy_Report.pdf',
    '05_Fire_Risk_Assessment.pdf',
    '06_Structural_Calculations.pdf',
    '11_Design_and_Access_Statement.pdf'
  ] : [
    '01_Application_Form.pdf',
    '02_Site_Location_Plan.pdf',
    '11_Design_and_Access_Statement.pdf'
  ];

  return {
    packId: groundTruth.pack_id,
    packName: groundTruth.pack_name,
    quality: groundTruth.quality,
    height: heightMatch ? parseInt(heightMatch[1]) : 20,
    storeys: storeysMatch ? parseInt(storeysMatch[1]) : 7,
    location: locationMatch ? locationMatch[1].trim() : 'Unknown',
    buildingUse: 'C3 Residential',
    units: unitsMatch ? parseInt(unitsMatch[1] || unitsMatch[2]) : 80,
    fireStrategyPages: fireStrategyPagesMatch ? parseInt(fireStrategyPagesMatch[1]) : undefined,
    hasFireStrategy,
    hasSprinklers,
    staircaseCount,
    claddingType,
    fireResistancePeriod,
    travelDistance,
    documents,
    issues: [],
    strengths: []
  };
}

/**
 * Generate realistic extracted text for a document based on pack characteristics
 */
function generateDocumentText(filename: string, chars: PackCharacteristics): string {
  const docName = filename.toLowerCase();

  // Application Form
  if (docName.includes('application')) {
    return `
BUILDING SAFETY REGULATOR
Gateway 2 Application Form

Project Name: ${chars.packName}
Location: ${chars.location}
Building Height: ${chars.height}m
Number of Storeys: ${chars.storeys} above ground
Building Use: ${chars.buildingUse}
Residential Units: ${chars.units} apartments

Principal Designer: Fire Safety Consultants Ltd
Principal Contractor: BuildSafe Construction Ltd

Date: 2025-10-15
    `.trim();
  }

  // Fire Strategy Report
  if (docName.includes('fire_strategy') || docName.includes('fire strategy')) {
    if (!chars.hasFireStrategy) {
      return ''; // Document missing
    }

    let strategy = `
FIRE SAFETY STRATEGY REPORT

Project: ${chars.packName}
Building Height: ${chars.height}m
Storeys: ${chars.storeys}

1. INTRODUCTION
This fire safety strategy has been prepared to demonstrate compliance with Building Regulations 2010 Approved Document B.
The building is ${chars.height}m high with ${chars.storeys} storeys containing ${chars.units} residential apartments.

2. MEANS OF ESCAPE
The building is provided with ${chars.staircaseCount} protected staircase${chars.staircaseCount > 1 ? 's' : ''}.
    `.trim();

    if (chars.travelDistance) {
      strategy += `\nMaximum travel distances: ${chars.travelDistance}`;
    } else {
      strategy += `\nTravel distances to be confirmed.`;
    }

    strategy += `\n\n3. COMPARTMENTATION\n`;
    if (chars.fireResistancePeriod) {
      strategy += `Fire resistance periods: ${chars.fireResistancePeriod}\n`;
      strategy += `All compartment walls and floors will achieve ${chars.fireResistancePeriod} fire resistance.\n`;
    } else {
      strategy += `Compartmentation will be provided between apartments.\n`;
    }

    strategy += `\n4. EXTERNAL WALLS\n`;
    strategy += `External wall construction: ${chars.claddingType}\n`;

    if (chars.claddingType.includes('ACM') || chars.claddingType.includes('combustible')) {
      strategy += `The cladding comprises aluminium composite material (ACM).\n`;
    } else {
      strategy += `All external wall materials are non-combustible (Class A2-s1, d0).\n`;
      strategy += `Test certificates: BS 8414 tests provided.\n`;
    }

    strategy += `\n5. STRUCTURAL FIRE RESISTANCE\n`;
    if (chars.fireResistancePeriod) {
      strategy += `Structural elements designed for ${chars.fireResistancePeriod} fire resistance.\n`;
    }

    strategy += `\n6. FIREFIGHTING ACCESS\n`;
    strategy += `Access roads provided to building perimeter.\n`;
    if (chars.height > 18) {
      strategy += `Dry risers provided in staircases.\n`;
      if (chars.quality === 'good' || chars.quality === 'borderline') {
        strategy += `Firefighting lift provided for building over 18m.\n`;
      }
    }

    strategy += `\n7. ACTIVE FIRE PROTECTION\n`;
    if (chars.hasSprinklers) {
      strategy += `Sprinkler system: Provided throughout building to BS EN 12845:2015.\n`;
      strategy += `Fire alarm system: L1 system to BS 5839-1:2017.\n`;
    } else {
      strategy += `Fire detection system to be provided.\n`;
    }

    // Add author credentials for good packs
    if (chars.quality === 'good') {
      strategy += `\n\nPrepared by: John Smith MEng CEng MIFireE\nFire Safety Consultants Ltd\nChartered Fire Engineer\n`;
    }

    return strategy;
  }

  // Structural Calculations
  if (docName.includes('structural')) {
    let struct = `
STRUCTURAL CALCULATIONS

Project: ${chars.packName}
Engineer: ABC Structural Engineers

Dead Loads: Calculated as per BS EN 1991-1-1
Live Loads: Calculated as per BS EN 1991-1-1
Wind Loads: Calculated as per BS EN 1991-1-4
    `.trim();

    if (chars.fireResistancePeriod && (chars.quality === 'good' || chars.quality === 'borderline')) {
      struct += `\n\nFIRE RESISTANCE\nStructural elements designed for ${chars.fireResistancePeriod} fire resistance in accordance with BS EN 1992-1-2.`;
    }

    return struct;
  }

  // Design & Access Statement
  if (docName.includes('design') && docName.includes('access')) {
    return `
DESIGN AND ACCESS STATEMENT

Project: ${chars.packName}
Location: ${chars.location}

Building Description:
- Height: ${chars.height}m
- Storeys: ${chars.storeys}
- Use: Residential
- Units: ${chars.units} apartments

The design provides high quality residential accommodation in a sustainable location.
    `.trim();
  }

  // Building Regulations Compliance Statement
  if (docName.includes('building_regs') || docName.includes('compliance')) {
    return `
BUILDING REGULATIONS COMPLIANCE STATEMENT

This statement demonstrates compliance with Building Regulations 2010 (as amended).

Fire Safety (Approved Document B): Compliant - see Fire Strategy Report
Structure (Approved Document A): Compliant - see Structural Calculations
Ventilation (Approved Document F): Compliant - see Ventilation Strategy
    `.trim();
  }

  // Principal Designer Appointment
  if (docName.includes('principal_designer')) {
    if (chars.quality === 'good') {
      return `
PRINCIPAL DESIGNER APPOINTMENT

Fire Safety Consultants Ltd
Date: 2025-09-01

Competence Evidence:
- Institution of Fire Engineers (IFE) Corporate Member
- Chartered Association of Building Engineers (CABE)
- 10+ years experience on HRB projects
- Completed 15 HRB Gateway 2 submissions
      `.trim();
    } else {
      return `
PRINCIPAL DESIGNER APPOINTMENT

ABC Architects
Date: 2025-09-01

Appointed as Principal Designer for ${chars.packName}.
      `.trim();
    }
  }

  // Fire Risk Assessment
  if (docName.includes('fire_risk')) {
    return `
FIRE RISK ASSESSMENT

Building: ${chars.packName}
Assessor: Fire Safety Consultants Ltd

HAZARDS IDENTIFIED:
- Ignition sources in apartments
- Fire spread potential
- Means of escape adequacy

RISK LEVEL: Medium (with proposed controls)

RECOMMENDATIONS:
- Implement fire strategy measures
- Provide sprinkler protection
- Install fire alarm system
    `.trim();
  }

  // Default for any other document
  return `
${filename.replace(/_/g, ' ').replace('.pdf', '')}

Project: ${chars.packName}
Location: ${chars.location}
Date: 2025-10-01

[Document content]
  `.trim();
}

/**
 * Generate full set of DocumentEvidence from pack characteristics
 */
export function generateMockDocuments(packPath: string): DocumentEvidence[] {
  const chars = extractPackCharacteristics(packPath);
  const documents: DocumentEvidence[] = [];

  for (const filename of chars.documents) {
    const extractedText = generateDocumentText(filename, chars);

    documents.push({
      filename,
      docType: inferDocType(filename),
      extractedText
    });
  }

  return documents;
}

/**
 * Infer document type from filename
 */
function inferDocType(filename: string): string | null {
  const lower = filename.toLowerCase();

  if (lower.includes('fire_strategy') || lower.includes('fire strategy')) return 'fire_strategy';
  if (lower.includes('application')) return 'application_form';
  if (lower.includes('structural')) return 'structural_calculations';
  if (lower.includes('design') && lower.includes('access')) return 'design_and_access';
  if (lower.includes('compliance')) return 'compliance_statement';
  if (lower.includes('principal_designer')) return 'principal_designer_appointment';
  if (lower.includes('fire_risk')) return 'fire_risk_assessment';
  if (lower.includes('site') && lower.includes('plan')) return 'site_plan';

  return null;
}
