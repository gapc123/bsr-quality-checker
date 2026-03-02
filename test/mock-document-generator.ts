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
  // packPath should be the directory containing README.md and ground-truth.json
  // Remove '/documents' if present
  const actualPackPath = packPath.replace(/\/documents$/, '');

  const readmePath = path.join(actualPackPath, 'README.md');
  const groundTruthPath = path.join(actualPackPath, 'ground-truth.json');

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

    // Generate realistic fire strategy with proper regulatory language
    let strategy = `
FIRE SAFETY STRATEGY REPORT

Project: ${chars.packName}
Project Reference: BSR-GW2-${chars.packId}
Client: ${chars.location} Developments Ltd
Date: October 2025
Revision: C
Status: For Gateway 2 Submission

Prepared in accordance with:
- Building Regulations 2010 (as amended)
- Approved Document B: Fire Safety (2019 edition incorporating 2020 and 2022 amendments)
- Building Safety Act 2022
- The Building (Higher-Risk Buildings Procedures) (England) Regulations 2023
- BS 9991:2015 Fire safety in the design, management and use of residential buildings
- BS 9999:2017 Fire safety in the design, management and use of buildings

EXECUTIVE SUMMARY

This fire safety strategy demonstrates compliance with the functional requirements of the Building Regulations
for a ${chars.height}m high residential building comprising ${chars.storeys} storeys and ${chars.units} apartments.

Building Classification: Purpose Group 1(a) - Residential (dwellings)
Building Height: ${chars.height}m (measured from ground level to top occupied floor)
Number of Storeys: ${chars.storeys} above ground
Total Residential Units: ${chars.units} apartments

This building is classified as a Higher-Risk Building under the Building Safety Act 2022 as it exceeds 18m
in height and contains residential units.

SECTION 1: INTRODUCTION AND BUILDING DESCRIPTION

1.1 Project Overview
The proposed development comprises a ${chars.height}m residential building providing ${chars.units} self-contained
apartments arranged over ${chars.storeys} storeys. The building will be located at ${chars.location}.

1.2 Building Use and Classification
Use Class: C3 Residential
Purpose Group: 1(a) Residential (dwellings)
Building Category: Higher-Risk Building (HRB) under Building Safety Act 2022

1.3 Regulatory Framework
This fire safety strategy has been prepared in accordance with Approved Document B (Fire Safety),
specifically addressing the requirements for:
- B1: Means of warning and escape
- B2: Internal fire spread (linings)
- B3: Internal fire spread (structure)
- B4: External fire spread
- B5: Access and facilities for the fire service

SECTION 2: MEANS OF ESCAPE

2.1 Escape Strategy
The building is provided with ${chars.staircaseCount} protected ${chars.staircaseCount === 1 ? 'staircase' : 'staircases'} serving all residential floors.
${chars.staircaseCount === 2 ? 'Two staircases are provided in accordance with Approved Document B requirements for buildings exceeding 18m in height.' : ''}

Each staircase is enclosed within fire-resisting construction and provides a safe route to final exit at ground level.

2.2 Travel Distances
Maximum travel distances from apartment entrance doors to the nearest staircase:
${chars.travelDistance ? `- Maximum travel distance: ${chars.travelDistance} (within Approved Document B limits of 7.5m for single direction travel, or 18m for alternative escape routes)` : '- Travel distances to be confirmed during detailed design'}

All measurements comply with Table 3 of Approved Document B Volume 2.

2.3 Protected Routes
All escape routes are protected by ${chars.fireResistancePeriod || '60-minute'} fire-resisting construction.
Apartment entrance doors: FD60S (60-minute fire doors with smoke seals)
Corridor walls and partitions: ${chars.fireResistancePeriod || '60 minutes'} fire resistance
Staircase enclosures: ${chars.fireResistancePeriod || '60 minutes'} fire resistance

2.4 Evacuation Strategy
Evacuation Strategy: Stay Put (simultaneous evacuation if fire spreads beyond compartment of origin)

The building is designed on the principle of "stay put" whereby in the event of fire, residents not directly
affected remain in their apartments while the fire service deals with the incident. This strategy is
appropriate provided adequate compartmentation and means of escape are maintained.

2.5 Route Widths
Minimum corridor width: 1.2m (in accordance with Approved Document B)
Staircase width: 1.1m minimum (adequate for building population)

SECTION 3: COMPARTMENTATION

3.1 Fire Resistance Periods
The building is divided into fire-resisting compartments in accordance with Approved Document B.

Fire resistance standards:
- Loadbearing elements of structure: ${chars.fireResistancePeriod || '60 minutes'}
- Compartment walls (between apartments): ${chars.fireResistancePeriod || '60 minutes'}
- Compartment floors: ${chars.fireResistancePeriod || '60 minutes'}
- Protected shaft walls (staircases, risers): ${chars.fireResistancePeriod || '60 minutes'}

All fire resistance periods have been determined in accordance with Table A2 of Approved Document B,
which requires ${chars.fireResistancePeriod || '60 minutes'} for residential buildings of this height.

3.2 Fire Stopping
All service penetrations through fire-resisting elements will be fire-stopped using proprietary
systems with appropriate certification. Fire stopping will maintain the fire resistance of the
element penetrated.

Products used will have certification demonstrating compliance with the required fire resistance period.

3.3 Cavity Barriers
Cavity barriers will be installed in accordance with Approved Document B Section 8 to prevent
unseen fire spread within concealed spaces.

SECTION 4: EXTERNAL FIRE SPREAD

4.1 External Wall Construction
External wall construction: ${chars.claddingType}

${chars.claddingType.includes('ACM') || chars.claddingType.includes('combustible')
  ? `The external walls incorporate aluminium composite material (ACM) cladding.

Note: The use of combustible materials in external walls of buildings over 18m is restricted under
Regulation 7(2) of the Building Regulations 2010. This specification requires review for compliance.`
  : `All materials used in the external wall construction achieve European Classification A2-s1, d0
(non-combustible) in accordance with Regulation 7(2) of the Building Regulations 2010 and the
ban on combustible materials in external walls of buildings over 18m.

External wall system tested to BS 8414-1:2020 and assessed to BR 135 (2020 edition).
Test reference: [Insert test certificate reference]

Materials specification:
- Outer leaf: Clay brick (Classification A1)
- Insulation: Stone wool/mineral fibre insulation (Classification A1)
- Inner leaf: Blockwork/concrete (Classification A1)

Cavity barriers provided at each floor level and around openings to prevent fire spread within cavities.`}

4.2 Balcony Construction
${chars.quality === 'good' ? 'Balconies constructed with non-combustible materials. Separation between balconies and prevention of fire spread between floors addressed in detailed design.' : 'Balcony fire safety to be confirmed.'}

SECTION 5: STRUCTURAL FIRE RESISTANCE

5.1 Structural Fire Protection
All structural elements are designed to maintain stability for a period of ${chars.fireResistancePeriod || '60 minutes'}
in accordance with Approved Document B and BS 9999:2017.

Structural frame: ${chars.fireResistancePeriod || '60 minutes'} fire resistance
Loadbearing walls: ${chars.fireResistancePeriod || '60 minutes'} fire resistance
Floors: ${chars.fireResistancePeriod || '60 minutes'} fire resistance

The structural fire protection design has been coordinated with the structural engineer and is detailed
in the structural calculations document.

Design standards:
- BS EN 1992-1-2: Eurocode 2: Design of concrete structures - Structural fire design
- BS EN 1993-1-2: Eurocode 3: Design of steel structures - Structural fire design

SECTION 6: ACCESS AND FACILITIES FOR THE FIRE SERVICE

6.1 Fire Service Access
Vehicle access for fire service appliances is provided in accordance with Approved Document B Section 17.

Access road specifications:
- Minimum width: 3.7m
- Minimum carrying capacity: 15 tonnes axle load
- Access to within 45m of all entry points

6.2 Fire Mains and Dry Risers
${chars.height > 18 ? `The building exceeds 18m in height and therefore dry rising mains are provided in each staircase
in accordance with BS 9990:2015.

Dry riser outlets provided at each floor level within staircases.
Inlet connections located at ground level in approved positions.` : 'Dry risers not required for building under 18m height.'}

6.3 Firefighting Lifts
${chars.height > 18 && (chars.quality === 'good' || chars.quality === 'borderline')
  ? `A firefighting lift is provided in accordance with BS EN 81-72:2015 for buildings over 18m.

The lift serves all floors and is located within a protected lobby with fire-resisting construction.`
  : chars.height > 18
    ? 'Firefighting lift provision to be confirmed.'
    : 'Firefighting lift not required for buildings under 18m.'}

6.4 Fire Service Communication
A fire service communication system is provided throughout the building in accordance with
BS 5839-9:2011.

SECTION 7: ACTIVE FIRE PROTECTION SYSTEMS

7.1 Automatic Sprinkler System
${chars.hasSprinklers
  ? `Automatic sprinkler protection is provided throughout the building in accordance with BS EN 12845:2015.

System design:
- Standard: BS EN 12845:2015+A1:2019
- Occupancy Hazard Classification: Ordinary Hazard Group 1 (OH1) for residential
- Design density: As per BS EN 12845 for residential occupancy
- Water supply: [Town mains/tank and pump - to be confirmed]
- Coverage: All apartments, corridors, common areas, and service risers

The sprinkler system provides:
- Early fire detection and suppression
- Protection of escape routes
- Limitation of fire spread between compartments
- Enhanced life safety for building occupants

For residential buildings over 11m in height, sprinkler protection is recommended best practice
and supports the stay-put evacuation strategy.`
  : `No automatic sprinkler system is specified for this building.

Note: For residential buildings over 11m in height, the lack of sprinkler protection may not align
with current best practice guidance and may affect the fire safety strategy's robustness.`}

7.2 Fire Detection and Alarm System
A fire detection and alarm system is provided throughout the building:

System type: L1 (Category L1 - maximum protection)
Standard: BS 5839-1:2017
Coverage: Detection in all areas including apartments, common areas, and escape routes

The system provides:
- Automatic fire detection in all apartments and common areas
- Manual call points at exit points and along escape routes
- Audible warning throughout the building
- Remote monitoring and alert to emergency services

7.3 Emergency Lighting
Emergency lighting is provided to all escape routes in accordance with BS 5266-1:2016.

Duration: Minimum 3 hours
Illumination levels: As per BS 5266 for escape route lighting

7.4 Smoke Control
${chars.quality === 'good'
  ? `Smoke control provisions:
- Automatic Opening Vents (AOVs) provided at the head of each staircase
- AOV size and positioning in accordance with BS 9991 and Approved Document B
- Activation via automatic fire detection system or manual control
- Natural ventilation to common corridors (where applicable)`
  : 'Smoke control measures to be confirmed in detailed design.'}

SECTION 8: MANAGEMENT AND MAINTENANCE

8.1 Building Safety Manager
A Building Safety Manager will be appointed for this Higher-Risk Building in accordance with
the Building Safety Act 2022 requirements.

8.2 Fire Safety Information
A Fire Safety Information Box will be provided at ground floor level containing:
- Building floor plans showing fire safety systems
- Key riser locations
- Firefighting equipment locations
- Emergency contacts

8.3 Resident Information
All residents will be provided with fire safety information including:
- Evacuation strategy (stay put)
- Actions in event of fire
- Use of communal fire safety systems
- Contact information for reporting defects

CONCLUSION

This fire safety strategy demonstrates that the proposed building can achieve compliance with
the functional requirements of the Building Regulations 2010 (as amended) and the Building Safety
Act 2022 for a Higher-Risk Building.

The strategy provides:
${chars.staircaseCount === 2 ? '✓ Adequate means of escape with two protected staircases' : '✗ Inadequate means of escape - only one staircase for building over 18m'}
${chars.fireResistancePeriod ? `✓ Appropriate compartmentation with ${chars.fireResistancePeriod} fire resistance` : '? Compartmentation periods to be confirmed'}
${!chars.claddingType.includes('combustible') && !chars.claddingType.includes('ACM') ? '✓ Compliant external wall construction (non-combustible)' : '✗ External wall construction may not comply with Regulation 7(2)'}
${chars.hasSprinklers ? '✓ Automatic sprinkler protection throughout' : '✗ No automatic sprinkler protection'}
${chars.height > 18 ? '✓ Fire service facilities for buildings over 18m' : '✓ Fire service facilities appropriate for building height'}

${chars.quality === 'good'
  ? `\nPrepared by:
John Smith MEng CEng MIFireE
Chartered Fire Engineer
Member of the Institution of Fire Engineers
Fire Safety Consultants Ltd
CABE Registered Fire Engineer

The author has over 15 years experience in fire safety engineering for residential high-rise buildings
and has completed fire strategies for over 30 Higher-Risk Buildings.`
  : chars.quality === 'borderline'
    ? `\nPrepared by:
Jane Doe BEng
Fire Safety Consultants Ltd
IFE Member`
    : `\nPrepared by:
ABC Architects
${chars.location}`}

END OF FIRE SAFETY STRATEGY REPORT
    `.trim();

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
