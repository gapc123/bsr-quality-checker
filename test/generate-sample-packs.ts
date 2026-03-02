/**
 * Generate Sample Document Packs for Manual Testing
 *
 * Creates 3 simple test documents (good, medium, poor) that can be
 * downloaded and uploaded to the internal engine for quick testing.
 */

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'sample-documents');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * GOOD QUALITY PACK
 * Should pass most rules - comprehensive fire strategy with all required elements
 */
const goodPackDocument = `
FIRE SAFETY STRATEGY REPORT

Project: Riverside Tower - Gateway 2 Submission
Project Reference: BSR-GW2-001
Location: London, UK
Date: October 2025
Status: For Gateway 2 Submission

Prepared in accordance with:
- Building Regulations 2010 (as amended)
- Approved Document B: Fire Safety (2019 edition incorporating 2020 and 2022 amendments)
- Building Safety Act 2022
- BS 9991:2015 Fire safety in the design, management and use of residential buildings
- BS 9999:2017 Fire safety in the design, management and use of buildings

EXECUTIVE SUMMARY

This fire safety strategy demonstrates compliance with the functional requirements of Building Regulations
for a 22m high residential building comprising 7 storeys and 48 apartments.

Building Classification: Purpose Group 1(a) - Residential (dwellings)
Building Height: 22m (measured from ground level to top occupied floor)
Number of Storeys: 7 above ground
Total Residential Units: 48 apartments
Higher-Risk Building: Yes (exceeds 18m in height)

SECTION 1: BUILDING DESCRIPTION

Project: Riverside Tower, London
Height: 22m
Storeys: 7 above ground
Building Use: C3 Residential
Residential Units: 48 apartments

SECTION 2: MEANS OF ESCAPE

The building is provided with 2 protected staircases serving all residential floors in accordance with
Approved Document B requirements for buildings exceeding 18m in height.

Maximum travel distances: 18m (within Approved Document B limits)
All measurements comply with Table 3 of Approved Document B Volume 2.

Apartment entrance doors: FD60S (60-minute fire doors with smoke seals)
Corridor walls: 60 minutes fire resistance
Staircase enclosures: 60 minutes fire resistance

Evacuation Strategy: Stay Put

SECTION 3: COMPARTMENTATION

Fire resistance periods:
- Loadbearing elements: 60 minutes
- Compartment walls between apartments: 60 minutes
- Compartment floors: 60 minutes
- Protected shafts: 60 minutes

All fire resistance periods determined in accordance with Table A2 of Approved Document B.

SECTION 4: EXTERNAL FIRE SPREAD

External wall construction: Clay brick outer leaf with stone wool insulation (A1 non-combustible)

All materials achieve European Classification A2-s1, d0 (non-combustible) in accordance with
Regulation 7(2) of the Building Regulations 2010 and the ban on combustible materials in
external walls of buildings over 18m.

External wall system tested to BS 8414-1:2020 and assessed to BR 135.

Materials specification:
- Outer leaf: Clay brick (Classification A1)
- Insulation: Stone wool insulation (Classification A1)
- Inner leaf: Concrete blockwork (Classification A1)

SECTION 5: STRUCTURAL FIRE RESISTANCE

All structural elements designed for 60 minutes fire resistance in accordance with:
- BS EN 1992-1-2: Eurocode 2 - Structural fire design for concrete
- BS EN 1993-1-2: Eurocode 3 - Structural fire design for steel

Structural calculations provided separately by ABC Structural Engineers Ltd.

SECTION 6: FIRE SERVICE ACCESS

Vehicle access provided in accordance with Approved Document B Section 17.
Dry rising mains provided in each staircase to BS 9990:2015.
Firefighting lift provided in accordance with BS EN 81-72:2015.

SECTION 7: ACTIVE FIRE PROTECTION SYSTEMS

7.1 Automatic Sprinkler System
Automatic sprinkler protection provided throughout in accordance with BS EN 12845:2015+A1:2019.

System design:
- Standard: BS EN 12845:2015
- Occupancy Hazard: Ordinary Hazard Group 1 (OH1) for residential
- Coverage: All apartments, corridors, common areas, service risers

7.2 Fire Detection and Alarm
System type: L1 (Category L1 - maximum protection)
Standard: BS 5839-1:2017
Coverage: All areas including apartments and escape routes

7.3 Emergency Lighting
Emergency lighting to all escape routes in accordance with BS 5266-1:2016.
Duration: Minimum 3 hours

7.4 Smoke Control
Automatic Opening Vents (AOVs) at head of each staircase
AOV design in accordance with BS 9991 and Approved Document B

SECTION 8: MANAGEMENT

Building Safety Manager to be appointed in accordance with Building Safety Act 2022.
Fire Safety Information Box provided at ground floor level.
Resident fire safety information package to be provided.

CONCLUSION

This fire safety strategy demonstrates compliance with Building Regulations 2010 and Building Safety Act 2022.

✓ Two protected staircases (adequate means of escape)
✓ 60-minute compartmentation throughout
✓ Non-combustible external walls (compliant with Regulation 7(2))
✓ Automatic sprinkler protection throughout
✓ Fire service facilities for buildings over 18m
✓ L1 fire alarm system throughout

Prepared by:
John Smith MEng CEng MIFireE
Chartered Fire Engineer
Member of the Institution of Fire Engineers
Fire Safety Consultants Ltd
CABE Registered Fire Engineer

The author has over 15 years experience in fire safety engineering for residential high-rise buildings.

END OF FIRE SAFETY STRATEGY REPORT
`;

/**
 * MEDIUM QUALITY PACK (Borderline)
 * Should pass some rules but flag several issues for review
 */
const mediumPackDocument = `
FIRE SAFETY STRATEGY REPORT

Project: Victoria Court
Reference: BSR-GW2-005
Location: Birmingham
Date: October 2025

Prepared in accordance with:
- Building Regulations 2010
- Approved Document B

BUILDING DESCRIPTION

Project: Victoria Court, Birmingham
Height: 21m
Storeys: 7
Building Use: Residential
Units: 40 apartments

MEANS OF ESCAPE

Two staircases provided serving all floors.
Travel distances within acceptable limits.
Fire doors: FD60S
Compartmentation: 60 minutes

EXTERNAL WALLS

External wall system: Brick and mineral wool insulation
Materials: Non-combustible

FIRE PROTECTION

Sprinklers: Provided to BS EN 12845:2015
Fire alarm: L1 system to BS 5839-1
Emergency lighting: Provided

STRUCTURAL FIRE RESISTANCE

Structural elements: 60 minutes fire resistance
Design to relevant Eurocodes

Note: Some specifications require further detail during detailed design stage.

Prepared by:
Jane Doe BEng
Fire Safety Consultants Ltd

END OF REPORT
`;

/**
 * POOR QUALITY PACK
 * Should fail multiple critical rules - missing key information
 */
const poorPackDocument = `
FIRE SAFETY STRATEGY

Project: Skyline Apartments
Location: Manchester
Date: October 2025

BUILDING INFORMATION

Height: 24m
Storeys: 8
Use: Residential
Units: 60 apartments

FIRE SAFETY MEASURES

Escape routes provided.
Fire doors installed.

EXTERNAL WALLS

Aluminium composite cladding system used for aesthetics.

FIRE SAFETY SYSTEMS

Fire alarm system will be installed.

Note: Detailed specifications to be confirmed by contractor during construction.

Prepared by:
ABC Architects
Manchester

END OF REPORT
`;

// Write the files
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'GOOD-Riverside-Tower.txt'),
  goodPackDocument
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'MEDIUM-Victoria-Court.txt'),
  mediumPackDocument
);

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'POOR-Skyline-Apartments.txt'),
  poorPackDocument
);

console.log('\n✅ Sample documents generated successfully!\n');
console.log('📁 Location:', OUTPUT_DIR);
console.log('\nGenerated files:');
console.log('  1. GOOD-Riverside-Tower.txt - Should pass most rules');
console.log('  2. MEDIUM-Victoria-Court.txt - Borderline, some issues');
console.log('  3. POOR-Skyline-Apartments.txt - Should fail critical rules');
console.log('\nExpected Results:');
console.log('\n🟢 GOOD Pack:');
console.log('   - Two staircases ✓');
console.log('   - Non-combustible cladding ✓');
console.log('   - Sprinklers throughout ✓');
console.log('   - Comprehensive fire strategy ✓');
console.log('   - Qualified author credentials ✓');
console.log('   - Should PASS 50+ rules');
console.log('\n🟡 MEDIUM Pack:');
console.log('   - Has key elements but lacks detail');
console.log('   - Missing some specifications');
console.log('   - Author has basic qualifications');
console.log('   - Should PASS 40-45 rules (needs review)');
console.log('\n🔴 POOR Pack:');
console.log('   - ACM cladding (combustible) ✗ CRITICAL');
console.log('   - No sprinkler specification ✗');
console.log('   - Minimal fire strategy ✗');
console.log('   - No author credentials ✗');
console.log('   - Vague specifications ✗');
console.log('   - Should FAIL 35+ rules');
console.log('\n📤 Next Steps:');
console.log('   1. Upload each document to the internal engine');
console.log('   2. Run deterministic checks');
console.log('   3. Review which rules pass/fail for each pack');
console.log('   4. Compare actual results to expected results above\n');
