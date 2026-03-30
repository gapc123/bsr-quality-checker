/**
 * bsrRejectionReasons.ts — BSR rejection reasons seed
 *
 * Source document:
 *   "Reasons for the Rejection of Applications at Gateway Two"
 *   Build UK — September 2025
 *
 * Data extracted verbatim from the three-column feedback table on pages 3–6.
 * Column assignments confirmed using spatially-preserved pdftotext -layout output.
 *
 * Column mapping:
 *   insufficientInfoItems  → "Insufficient and Inconsistent Information and Detail" (left column)
 *   bsrExampleReasons      → "BSR Example Reasons for Rejection" (right column)
 *
 * Parts not appearing in the document (N) or listed as "No feedback available"
 * are included with hasFeedback: false and empty arrays, per the interface contract.
 *
 * Part F in the document covers "Volume 1 Dwellings & Volume 2 Buildings Other Than
 * Dwellings" as a single row. It maps to both F1 and F2 in ApprovedDocumentPart;
 * both are seeded with hasFeedback: false ("No feedback available").
 */

import { ApprovedDocumentPart } from '../../types';
import prisma from '../client';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface BsrRejectionReason {
  part: ApprovedDocumentPart;
  subParts: string[];
  insufficientInfoItems: string[];
  bsrExampleReasons: string[];
  hasFeedback: boolean;
}

// ---------------------------------------------------------------------------
// Data — verbatim from Build UK, September 2025, pages 3–6
// ---------------------------------------------------------------------------

export const BSR_REJECTION_REASONS: BsrRejectionReason[] = [
  // -------------------------------------------------------------------------
  // Part A – Structure (page 3)
  // -------------------------------------------------------------------------
  {
    part: 'A',
    subParts: [
      'A1: Loading',
      'A2: Ground Movement',
      'A3: Disproportionate Collapse',
    ],
    insufficientInfoItems: [
      'Calculations demonstrating design and compliance to relevant standards',
      'Connection and bracket details including: balconies, facades, steelwork',
      'Crack width calculations for retaining walls',
      'Critical structural elements',
      'Design loads including: accidental loads on precast columns, additional loads on ground beams, arches, balconies, cladding loads on slab edges, column base design calculations, horizontal loads, internal partitions, masonry, piles, snow, wind',
      'Material grades e.g. concrete and steel',
      'Movement joints and how movement is accommodated',
      'Pile settlement analysis',
      'Presence or use of transfer elements in the building',
      'Service holes in reinforced concrete',
      'Strategy for robustness and disproportionate collapse',
      'Structural analysis of wind posts, masonry panel checks, masonry support brackets, SFS inner skin, etc.',
      'Vibration limits for balcony designs',
    ],
    bsrExampleReasons: [
      "Insufficient information regarding the fact that the building/piling is close to an existing highway's retaining wall structure and there are likely to be considerations for this which need to be taken into account.",
      'No reference to the testing regime of the piling proposed beyond concrete cube testing.',
      'Insufficient calculations to demonstrate the works had been designed to Eurocode requirements.',
      "Obvious lack of co-ordination between structural engineer's loading document and façade design with loading assumptions and support points not matching.",
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part B – Fire Safety (page 4)
  // -------------------------------------------------------------------------
  {
    part: 'B',
    subParts: [
      'B1: Means of warning and escape',
      'B2: Internal fire spread (linings)',
      'B3: Internal fire spread (structure)',
      'B4: External fire spread',
      'B5: Access and facilities for the fire service',
    ],
    insufficientInfoItems: [
      'Fire detection systems and positions',
      'Fire resistance of structure, wall and ceiling linings including roof garden',
      'Fire stopping and cavity barrier proposals in relation to fire strategy',
      'Integrity of façade around openings',
      'Layout of water suppression or sprinkler system',
      'Location of premises information box',
      'Position of cavity barriers',
      'Smoke extraction system',
      'Sprinkler system layout and water supply',
      'Test data of fire-rated elements',
      'Water supply for wet riser system and fire service',
      'Evacuation information including: corridor lengths, management of evacuation for persons with disability, methods of releasing door hold open devices, proximity of staircases, reference to incorrect British Standards, routes through adjacent or adjoining compartments, separation distances, siting of lifts adjacent to firefighting lifts, travel times to place of safety',
    ],
    bsrExampleReasons: [
      'Fire strategy drawings do not provide complete details of the fire safety features such as locations of dry risers, inlets, fire alarm panels, refuges, access controls etc.',
      'Lack of information demonstrating how integrity of façade would be maintained around ventilation duct openings in façade.',
      'Insufficient information on the products proposed for the façade to demonstrate compliance with Part B requirements.',
      'No information on elevations showing position of cavity barriers and fire stops.',
      'The simulations do not include pre-travel time and the results of the study do not show that the occupants evacuate to a place of relative safety in five minutes.',
      'Both staircases are in close proximity, located on the same portion of corridor, and could be compromised by fire and smoke concurrently. This poses a risk to means of escape and fire services access.',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part C – Site Preparation and Resistance to Contaminants and Moisture (page 4)
  // Right column (BSR Example Reasons) is blank for Part C in the source document.
  // -------------------------------------------------------------------------
  {
    part: 'C',
    subParts: [],
    insufficientInfoItems: [
      'Certification, continuity and performance of rainscreen cladding',
      'Continuity of below ground waterproofing',
      'Membrane details for specific situations e.g. ground floor vs roof products',
      'Waterproofing detail to contain water spillage on basins, baths etc.',
    ],
    bsrExampleReasons: [],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part D – Toxic Substances (page 4) — No feedback available
  // -------------------------------------------------------------------------
  {
    part: 'D',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [],
    hasFeedback: false,
  },

  // -------------------------------------------------------------------------
  // Part E – Resistant to the Passage of Sound (page 5)
  // Left column blank; right column has one BSR example reason.
  // -------------------------------------------------------------------------
  {
    part: 'E',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'Insufficient justification of how the proposed construction meets the acoustic requirements.',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part F – Ventilation: Volume 1 Dwellings & Volume 2 Buildings Other Than
  // Dwellings (page 5) — No feedback available.
  // Mapped to F1 (dwellings) per ApprovedDocumentPart.
  // -------------------------------------------------------------------------
  {
    part: 'F1',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [],
    hasFeedback: false,
  },

  // -------------------------------------------------------------------------
  // Part F – Ventilation: Volume 2 Buildings Other Than Dwellings (page 5)
  // Mapped to F2 per ApprovedDocumentPart. Same source row as F1.
  // -------------------------------------------------------------------------
  {
    part: 'F2',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [],
    hasFeedback: false,
  },

  // -------------------------------------------------------------------------
  // Part G – Sanitation, Hot Water Safety, and Water Efficiency (page 5)
  // Left column blank; right column has one BSR example reason.
  // -------------------------------------------------------------------------
  {
    part: 'G',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'Evidence/explanation required as to how temperature to baths and showers is controlled to 48°C.',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part H – Drainage and Water Disposal (page 5)
  // Right column blank in the source document.
  // -------------------------------------------------------------------------
  {
    part: 'H',
    subParts: [],
    insufficientInfoItems: [
      'Foul water drainage',
      'Liaison with water company',
      'Pumped drainage system including storage tanks',
      'Rainwater drainage',
      'Storage of refuse, number of bins, frequency of emptying',
    ],
    bsrExampleReasons: [],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part J – Combustion Appliances and Fuel Storage Systems (page 5)
  // Right column blank in the source document.
  // -------------------------------------------------------------------------
  {
    part: 'J',
    subParts: [],
    insufficientInfoItems: [
      'Air supply and discharge of products of combustion',
      'Generator package fuel tank and pipework',
      'Volume and protection of liquid fuel storage system',
    ],
    bsrExampleReasons: [],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part K – Protection from Falling, Collision and Impact (page 5)
  // Note: document spells heading as "Faling" — preserved verbatim from source.
  // Right column blank in the source document.
  // -------------------------------------------------------------------------
  {
    part: 'K',
    subParts: [],
    insufficientInfoItems: [
      'Glazing, type used and how compliance is achieved',
      "Manufacturers' information on products or elements used",
      'Protection against impact and trapping in relation to doors',
      'Protection from falling',
      'Safe access for cleaning of windows',
      'Safe opening and closing of windows',
    ],
    bsrExampleReasons: [],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part L – Conservation of Fuel and Power: Volume 1 Dwellings & Volume 2
  // Buildings Other Than Dwellings (page 5)
  // Left column blank; right column has one BSR example reason.
  // -------------------------------------------------------------------------
  {
    part: 'L',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'Insufficient explanation on how Part L is achieved',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part M – Access to and Use of Buildings: Volume 1 Dwellings & Volume 2
  // Buildings Other Than Dwellings (page 6)
  // Right column blank in the source document.
  // -------------------------------------------------------------------------
  {
    part: 'M',
    subParts: [],
    insufficientInfoItems: [
      'Heights of services and controls within the dwelling',
      'Further adaptability of the bathroom units',
      'Access statement and plans',
      'Number of accessible rooms',
    ],
    bsrExampleReasons: [],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part N – Noise
  // Not present in the source document. Included per interface contract.
  // -------------------------------------------------------------------------
  {
    part: 'N',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [],
    hasFeedback: false,
  },

  // -------------------------------------------------------------------------
  // Part O – Overheating (page 6) — No feedback available
  // -------------------------------------------------------------------------
  {
    part: 'O',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [],
    hasFeedback: false,
  },

  // -------------------------------------------------------------------------
  // Part P – Electrical Safety (page 6) — No feedback available
  // -------------------------------------------------------------------------
  {
    part: 'P',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [],
    hasFeedback: false,
  },

  // -------------------------------------------------------------------------
  // Part Q – Security (page 6)
  // Left column blank; right column has one BSR example reason.
  // -------------------------------------------------------------------------
  {
    part: 'Q',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'Details for the accessible doors, windows, security devices and resilient layers not provided.',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part R – Infrastructure for Electronic Communications:
  // Volume 1 New Dwellings & Volume 2 High-Speed Networks (page 6)
  // Left column blank; right column has two BSR example reasons.
  // -------------------------------------------------------------------------
  {
    part: 'R',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'Building work must be carried out so as to ensure that the building is equipped with a high speed ready in-building physical infrastructure, up to a network termination point for high-speed electronic communications networks.',
      'Details of ductwork providing a route for connection is the Building Regulations requirement. The work to connect to individual rooms and clusters is beyond scope.',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part S – Infrastructure for the Charging of Electric Vehicles (page 6)
  // Left column blank; right column has one BSR example reason.
  // -------------------------------------------------------------------------
  {
    part: 'S',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'Insufficient details provided on level of parking on the site to enable assessment of provision can be assessed.',
    ],
    hasFeedback: true,
  },

  // -------------------------------------------------------------------------
  // Part T – Toilet Accommodation (page 6)
  // Left column blank; right column has one BSR example reason.
  // -------------------------------------------------------------------------
  {
    part: 'T',
    subParts: [],
    insufficientInfoItems: [],
    bsrExampleReasons: [
      'This applies to this application, but limited information to demonstrate compliance has been provided.',
    ],
    hasFeedback: true,
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

export async function seedBsrRejectionReasons(): Promise<void> {
  for (const reason of BSR_REJECTION_REASONS) {
    await prisma.bsrRejectionReason.upsert({
      where: { part: reason.part },
      update: {
        subParts: JSON.stringify(reason.subParts),
        insufficientInfoItems: JSON.stringify(reason.insufficientInfoItems),
        bsrExampleReasons: JSON.stringify(reason.bsrExampleReasons),
        hasFeedback: reason.hasFeedback,
      },
      create: {
        part: reason.part,
        subParts: JSON.stringify(reason.subParts),
        insufficientInfoItems: JSON.stringify(reason.insufficientInfoItems),
        bsrExampleReasons: JSON.stringify(reason.bsrExampleReasons),
        hasFeedback: reason.hasFeedback,
      },
    });
  }

  console.log(
    `[seed] bsr_rejection_reasons upserted: ${BSR_REJECTION_REASONS.length} parts`
  );
}
