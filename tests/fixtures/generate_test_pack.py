#!/usr/bin/env python3
"""
tests/fixtures/generate_test_pack.py
=====================================
Generates a synthetic CLC-structured Gateway 2 application pack for testing.

Usage:
    python tests/fixtures/generate_test_pack.py

Outputs:
    tests/fixtures/test_pack/       21 synthetic PDFs in CLC folder structure
    tests/fixtures/ground_truth.py  expected analysis results for all layer tests

Deliberate coordination conflicts (embedded at known pages and sections):
  CONFLICT-001  Part A cladding load  2.5 kN/m² (2.1.1 p.7) vs 1.8 kN/m² (2.3.3 p.4)
  CONFLICT-002  Part B sprinkler temp 68 °C (2.2.1 p.12) vs 93 °C (2.2.3 p.3)

Deliberate completeness gaps (topics absent from all documents):
  GAP-001  Part A: disproportionate collapse / robustness strategy / key element
  GAP-002  Part B: cavity barrier with positional reference (grid / level / elevation)
"""

from __future__ import annotations

import os
import re
import sys
import textwrap
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────

FIXTURES_DIR = Path(__file__).parent
PACK_DIR     = FIXTURES_DIR / "test_pack"
GROUND_TRUTH = FIXTURES_DIR / "ground_truth.py"

PROJECT      = "Silverline House — 25-Storey Residential HRB"
PROJECT_REF  = "SLH-2026"
REVISION     = "Rev A"
ISSUE_DATE   = "March 2026"

# ─────────────────────────────────────────────────────────────────────────────
# Document manifest (per Guidance Note 06 / Annex 6A)
# ─────────────────────────────────────────────────────────────────────────────

DOCUMENTS = [
    # General Application Information
    {"ref": "0.1",   "title": "Application Information Schedule",
     "folder": "General_Application_Information", "part": "ADMIN"},
    {"ref": "0.2",   "title": "Application Project Brief",
     "folder": "General_Application_Information", "part": "ADMIN"},
    {"ref": "0.3",   "title": "Application Folder Structure and Contents Schedule",
     "folder": "General_Application_Information", "part": "ADMIN"},
    # Part A — Structure
    {"ref": "2.1.1", "title": "Structural Calculation Pack",
     "folder": "Part_A_Structure", "part": "A"},
    {"ref": "2.1.2", "title": "Structural General Arrangement Drawings",
     "folder": "Part_A_Structure", "part": "A"},
    {"ref": "2.1.3", "title": "Geotechnical Ground Investigation Report",
     "folder": "Part_A_Structure", "part": "A"},
    {"ref": "2.1.4", "title": "Pile Design and Testing Strategy",
     "folder": "Part_A_Structure", "part": "A"},
    {"ref": "2.1.5", "title": "Material Specification — Concrete and Steel",
     "folder": "Part_A_Structure", "part": "A"},
    {"ref": "2.1.6", "title": "Transfer Slab Design Note",
     "folder": "Part_A_Structure", "part": "A"},
    # Part B — Fire Safety
    {"ref": "2.2.1", "title": "Fire Strategy Report",
     "folder": "Part_B_Fire_Safety", "part": "B"},
    {"ref": "2.2.2", "title": "Fire Compartmentation Drawings",
     "folder": "Part_B_Fire_Safety", "part": "B"},
    {"ref": "2.2.3", "title": "MEP Sprinkler Design Specification",
     "folder": "Part_B_Fire_Safety", "part": "B"},
    {"ref": "2.2.4", "title": "Smoke Extraction Strategy Note",
     "folder": "Part_B_Fire_Safety", "part": "B"},
    {"ref": "2.2.5", "title": "Fire Door Schedule",
     "folder": "Part_B_Fire_Safety", "part": "B"},
    {"ref": "2.2.6", "title": "External Wall Fire Performance Assessment",
     "folder": "Part_B_Fire_Safety", "part": "B"},
    # Part C — Site Preparation
    {"ref": "2.3.1", "title": "Rainscreen Cladding Specification",
     "folder": "Part_C_Site_Preparation", "part": "C"},
    {"ref": "2.3.2", "title": "Below Ground Waterproofing Strategy",
     "folder": "Part_C_Site_Preparation", "part": "C"},
    {"ref": "2.3.3", "title": "Facade Interface and Support Design",
     "folder": "Part_C_Site_Preparation", "part": "C"},
    # Mandatory Documents
    {"ref": "1.1",   "title": "Construction Control Plan",
     "folder": "Mandatory_Documents", "part": "ADMIN"},
    {"ref": "1.2",   "title": "Building Regulations Compliance Statement",
     "folder": "Mandatory_Documents", "part": "ADMIN"},
    {"ref": "1.3",   "title": "MOR Plan",
     "folder": "Mandatory_Documents", "part": "ADMIN"},
]


# ─────────────────────────────────────────────────────────────────────────────
# Styles
# ─────────────────────────────────────────────────────────────────────────────

def _styles():
    base = getSampleStyleSheet()
    h1 = ParagraphStyle("H1", parent=base["Heading1"],
                        fontSize=14, spaceAfter=6, spaceBefore=12)
    h2 = ParagraphStyle("H2", parent=base["Heading2"],
                        fontSize=11, spaceAfter=4, spaceBefore=8)
    h3 = ParagraphStyle("H3", parent=base["Heading3"],
                        fontSize=10, spaceAfter=3, spaceBefore=6)
    body = ParagraphStyle("Body", parent=base["Normal"],
                          fontSize=10, leading=14, spaceAfter=6,
                          alignment=TA_JUSTIFY)
    cover_title = ParagraphStyle("CoverTitle", parent=base["Normal"],
                                 fontSize=18, leading=22, spaceAfter=8,
                                 alignment=TA_CENTER, fontName="Helvetica-Bold")
    cover_sub = ParagraphStyle("CoverSub", parent=base["Normal"],
                               fontSize=11, leading=14, spaceAfter=4,
                               alignment=TA_CENTER)
    cover_meta = ParagraphStyle("CoverMeta", parent=base["Normal"],
                                fontSize=9, leading=12,
                                alignment=TA_CENTER, textColor=colors.grey)
    return h1, h2, h3, body, cover_title, cover_sub, cover_meta


H1, H2, H3, BODY, COVER_TITLE, COVER_SUB, COVER_META = _styles()


# ─────────────────────────────────────────────────────────────────────────────
# Page header callback factory
# ─────────────────────────────────────────────────────────────────────────────

def _header_cb(doc_ref: str, title: str, revision: str):
    def _draw(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        left  = 2.2 * cm
        right = A4[0] - 2.2 * cm
        y     = A4[1] - 1.3 * cm
        canvas.drawString(left,  y, f"{PROJECT_REF}  |  {doc_ref}  |  {revision}")
        canvas.drawRightString(right, y, title[:60])
        canvas.setLineWidth(0.3)
        canvas.line(left, y - 2 * mm, right, y - 2 * mm)
        canvas.setFont("Helvetica", 7)
        canvas.drawCentredString(A4[0] / 2, 1.2 * cm,
                                 f"Page {doc.page}")
        canvas.restoreState()
    return _draw


# ─────────────────────────────────────────────────────────────────────────────
# Filename helper
# ─────────────────────────────────────────────────────────────────────────────

def _filename(doc: dict) -> str:
    safe = re.sub(r"[^a-zA-Z0-9]+", "_", doc["title"])
    safe = safe.strip("_")
    return f"{doc['ref']}_{safe}_RevA.pdf"


# ─────────────────────────────────────────────────────────────────────────────
# Core PDF builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_pdf(path: Path, doc_ref: str, title: str, pages: list[list]):
    """
    Write a PDF. `pages` is a list of lists-of-flowables; each inner list
    becomes exactly one page (a PageBreak is appended between them).
    """
    story = []
    for i, page_content in enumerate(pages):
        story.extend(page_content)
        if i < len(pages) - 1:
            story.append(PageBreak())

    cb = _header_cb(doc_ref, title, REVISION)
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        topMargin=2.0 * cm,
        bottomMargin=2.0 * cm,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
    )
    doc.build(story, onFirstPage=cb, onLaterPages=cb)


# ─────────────────────────────────────────────────────────────────────────────
# Cover page builder
# ─────────────────────────────────────────────────────────────────────────────

def _cover(doc_ref: str, title: str, subtitle: str = "") -> list:
    items = [
        Spacer(1, 3 * cm),
        Paragraph(PROJECT, COVER_SUB),
        Spacer(1, 0.5 * cm),
        Paragraph(title, COVER_TITLE),
    ]
    if subtitle:
        items.append(Paragraph(subtitle, COVER_SUB))
    items += [
        Spacer(1, 1 * cm),
        Paragraph(f"Document Reference: {doc_ref}", COVER_META),
        Paragraph(f"Revision: {REVISION}", COVER_META),
        Paragraph(f"Date: {ISSUE_DATE}", COVER_META),
        Paragraph(f"Project Reference: {PROJECT_REF}", COVER_META),
    ]
    return items


# ─────────────────────────────────────────────────────────────────────────────
# Generic filler paragraphs — shared across multiple document types
# ─────────────────────────────────────────────────────────────────────────────

_INTRO_TEXT = (
    "This document forms part of the Gateway 2 application for Building Control Approval "
    "submitted to the Building Safety Regulator under the Building Safety Act 2022. "
    "The information presented herein has been prepared in accordance with the CLC Guidance "
    "Suite for new Higher-Risk Buildings and the requirements set out in Guidance Note 04 "
    "(Application Information Schedule) and Guidance Note 06 (Document Management and "
    "Submission). All design work described in this document has been carried out by "
    "suitably qualified engineers and specialists with relevant experience in higher-risk "
    "residential buildings."
)

_STANDARDS_TEXT = (
    "The design has been developed in accordance with the Building Regulations 2010 and the "
    "relevant Approved Documents. Where European standards (Eurocodes) are adopted, the "
    "applicable UK National Annexes have been used. Design standards and codes of practice "
    "referenced in this document include, but are not limited to, BS EN 1990 (Basis of "
    "structural design), BS EN 1991 (Actions on structures), BS EN 1992 (Concrete "
    "structures), BS EN 1993 (Steel structures), and BS EN 1997 (Geotechnical design). "
    "Where proprietary systems or products are specified, the manufacturer's technical data "
    "and third-party test evidence are referenced in the relevant sections."
)

_SCOPE_TEXT = (
    "The scope of this document covers the primary structural system, including the "
    "reinforced concrete frame, post-tensioned flat slab floors, core walls, and the "
    "ground-bearing and piled foundation system. The document does not cover secondary "
    "structures such as facade support brackets (addressed separately in the Facade "
    "Interface and Support Design document), internal partition framing, or fit-out works. "
    "All dimensions and coordinates are in millimetres unless otherwise stated. "
    "Grid references correspond to the structural grid shown on drawing SLH-STR-001 Rev A."
)

_GEOTECH_TEXT = (
    "A site investigation was carried out in accordance with BS EN 1997-2 and BS 5930. "
    "The investigation comprised twelve rotary core boreholes to a maximum depth of 30 m "
    "below existing ground level, together with in-situ standard penetration tests at "
    "1.5 m intervals. Laboratory testing was carried out on selected samples to determine "
    "soil classification, shear strength parameters, consolidation characteristics, and "
    "chemical contamination. The ground conditions comprise approximately 3 m of made "
    "ground overlying Terrace Gravels (3–9 m depth), London Clay (9–22 m), and Lambeth "
    "Group deposits below 22 m. Groundwater was encountered at 2.5 m depth in the "
    "gravels. The design groundwater level for structural purposes is taken as 0.5 m "
    "below existing ground level."
)

_PILE_TEXT = (
    "The foundation system consists of 600 mm diameter continuous flight auger (CFA) "
    "piles installed to a minimum depth of 18 m below existing ground level, penetrating "
    "at least 3 m into the Lambeth Group. Pile design has been carried out in accordance "
    "with BS EN 1997-1 using a combination of ground model analysis and empirical "
    "correlations from the site investigation data. The working load per pile is 2,800 kN "
    "in compression and 800 kN in tension. Settlement analysis indicates maximum pile head "
    "settlements of 8 mm under working loads, with differential settlement between adjacent "
    "piles not exceeding 5 mm. Pile load testing in accordance with BS EN ISO 22477-1 is "
    "required during construction, with at least two maintained load tests to 150% of the "
    "working load prior to commencing pile cap construction."
)

_CONCRETE_TEXT = (
    "All reinforced concrete elements are specified in C32/40 concrete (characteristic "
    "cylinder / cube strength) with a maximum water-cement ratio of 0.55 and minimum "
    "cement content of 300 kg/m³. Post-tensioned slab tendons are specified in low- "
    "relaxation 15.7 mm strand to BS 5896, stressed to 75% of characteristic tensile "
    "strength. Reinforcement throughout is Grade B500B to BS 4449. Concrete cover to "
    "reinforcement is 35 mm to internal elements and 50 mm to external elements exposed "
    "to the weather, in accordance with BS EN 1992-1-1 Table 4.4N for exposure class XC3. "
    "Minimum cement content and maximum water-cement ratio comply with the durability "
    "requirements of BS 8500-1 for the intended service life of 50 years."
)

_TRANSFER_TEXT = (
    "A post-tensioned transfer slab at Level 1 spans between the core walls and the "
    "perimeter columns at 7.5 m centres, supporting eight residential floors above. "
    "The slab is 600 mm deep with an unbonded tendons in both directions at 200 mm "
    "centres. The design has been analysed using finite element software with validation "
    "by hand calculation for critical sections. Shear checks at column heads comply with "
    "BS EN 1992-1-1 clause 6.4 with punching shear reinforcement provided at all "
    "columns. The transfer slab is classified as a Critical Structural Element for "
    "inspection purposes; the inspection and maintenance strategy is defined in the "
    "Fire and Emergency File."
)

_LOADING_TEXT = (
    "Design loads have been derived in accordance with BS EN 1991-1-1 and BS EN 1991-1-3 "
    "for imposed, snow and wind loading respectively, with the UK National Annex applied "
    "throughout. The imposed load for residential floors is 1.5 kN/m² with an additional "
    "1.0 kN/m² for partitions. Plant rooms at roof level are designed for 5.0 kN/m². "
    "Wind loading has been calculated for a basic wind speed of 23 m/s (10-minute mean "
    "at 10 m height in open country) adjusted for the site location and topography in "
    "accordance with BS EN 1991-1-4 and the UK National Annex. The net lateral wind "
    "force on the building is 3,200 kN at the 50-year return period, resisted by the "
    "reinforced concrete core."
)

_LATERAL_TEXT = (
    "Lateral stability is provided by a reinforced concrete core of plan dimensions "
    "12 m × 8 m positioned at the centre of the building footprint. The core walls "
    "are 300 mm thick below Level 5, reducing to 250 mm above Level 5 and 200 mm above "
    "Level 15. Core wall reinforcement has been designed for combined bending, shear and "
    "axial forces using the General Method of BS EN 1992-1-1. The inter-storey drift "
    "under the 50-year wind load is limited to H/500 = 17 mm to satisfy serviceability "
    "requirements. The building has been checked for progressive collapse in accordance "
    "with BS EN 1991-1-7 Annex A, adopting the notional member removal procedure for "
    "all floors above ground level."
)

# ─── Part B shared content ────────────────────────────────────────────────────

_FIRE_INTRO = (
    "This Fire Strategy Report has been prepared to accompany the Gateway 2 application "
    "for Building Control Approval for Silverline House, a 25-storey residential higher- "
    "risk building. The strategy has been developed in accordance with Approved Document B "
    "(Fire Safety) Volumes 1 and 2, BS 9999:2017, and BS 9991:2015. The report identifies "
    "and justifies all elements of the fire safety design including means of escape, "
    "passive fire protection, active fire suppression, fire detection, and fire service "
    "access. The strategy is supported by evacuation simulations carried out in accordance "
    "with PD 7974-6 and confirmatory computational fluid dynamics (CFD) modelling of the "
    "smoke extraction system."
)

_BUILDING_DESCRIPTION = (
    "Silverline House comprises a 25-storey residential tower with 312 apartments, a "
    "ground-floor retail unit of 450 m², and four basement levels providing 180 car "
    "parking spaces and building services plant. The building has an overall height of "
    "79.5 m from ground level to the parapet. The structural system is a reinforced "
    "concrete frame with flat slab floors. The external envelope consists of a ventilated "
    "rainscreen cladding system with mineral wool insulation and a non-combustible cladding "
    "material achieving A2-s1,d0 classification in accordance with BS EN 13501-1. "
    "The building is served by two protected staircases and two firefighting lifts."
)

_EVACUATION_TEXT = (
    "The evacuation strategy for Silverline House adopts a simultaneous evacuation policy "
    "for the residential floors. Each apartment has a front door opening onto a protected "
    "corridor with a maximum travel distance to the nearest staircase of 7.5 m. The two "
    "protected staircases are located at opposite ends of the building core, more than "
    "15 m apart in plan, ensuring they cannot be simultaneously compromised by a single "
    "fire event. Evacuation timing analysis carried out in accordance with PD 7974-6 "
    "demonstrates that all occupants can reach a place of relative safety within "
    "3.5 minutes of alarm activation, including 30 seconds pre-travel time. Refuges are "
    "provided at each staircase on every residential floor for persons who are unable to "
    "use the stairs independently. The premises information box is located in the ground- "
    "floor lobby adjacent to the firefighting lift lobby."
)

# NOTE: cavity barriers mentioned here only generically — no grid/level/elevation refs
_COMPARTMENTATION_TEXT = (
    "The building is divided into fire compartments in accordance with Approved Document B "
    "Volume 1, Table B1. Each apartment forms a separate fire compartment. The protected "
    "corridors are enclosed by fire-resisting construction providing at least 30 minutes "
    "fire resistance. The staircase enclosures provide 60 minutes fire resistance. "
    "Cavity barriers are provided within the external wall construction in accordance "
    "with the requirements of Approved Document B to limit the spread of fire through "
    "concealed spaces. The cavity barrier specification and extent of installation will "
    "be confirmed in the Fire Compartmentation Drawings. Service penetrations through "
    "compartment walls and floors are sealed with intumescent collars or fire-stopping "
    "products with third-party certification to the required fire resistance period."
)

_COMPARTMENT_WALLS_TEXT = (
    "Compartment walls between apartments are constructed in 200 mm dense aggregate "
    "blockwork or equivalent lightweight block achieving 60 minutes fire resistance in "
    "accordance with BS EN 1996-1-2 and the tabulated data in Approved Document B. "
    "Where the compartment wall coincides with the structural frame, the wall abuts the "
    "underside of the floor slab above and is sealed to prevent smoke passage. "
    "Junctions between compartment walls and the external facade are detailed to maintain "
    "compartmentation integrity at the facade interface. Product certificates and fire "
    "test evidence for all specified masonry units are included in the Construction "
    "Product Schedule accompanying this application."
)

_FLOOR_CEILING_TEXT = (
    "Compartment floors are formed by the reinforced concrete flat slab construction "
    "(minimum 200 mm depth), which inherently provides 120 minutes fire resistance "
    "when designed in accordance with BS EN 1992-1-2. Where a suspended ceiling is "
    "provided below the structural slab, the ceiling system has been designed to "
    "maintain the compartment floor fire resistance rating. Penetrations through "
    "compartment floors for services (drainage, ventilation ducts, electrical conduits) "
    "are sealed with proprietary fire-stopping systems carrying third-party certification "
    "to BS EN 1366-3. The specification for these systems is contained in the Services "
    "Fire Stopping Schedule."
)

_DETECTION_TEXT = (
    "An automatic fire detection and alarm system has been designed in accordance with "
    "BS 5839-1 Category L2 for the common areas and Category LD2 for the individual "
    "apartments. Optical smoke detectors are installed in all protected corridors, "
    "lobbies, and staircase enclosures. Combination heat/smoke detectors are installed "
    "in apartment entrance halls. The system is connected to a central addressable "
    "control panel located in the ground-floor security room with a sub-panel in the "
    "Level 13 plant room. Manual call points are installed at each staircase landing "
    "on every floor and at each exit door at ground level. The detection system is "
    "interfaced with the building management system (BMS) to allow integration with "
    "smoke control, lift recall, and door hold-open release functions."
)

_AUTO_DETECTION_TEXT = (
    "Apartment detection comprises addressable multi-sensor detectors (optical/heat) "
    "in the entrance hall, interconnected with a standalone sounder within the apartment "
    "to provide early warning to occupants. The detection system is designed to initiate "
    "the common area alarm on detection of fire within any apartment, triggering "
    "simultaneous evacuation. Detectors are positioned at 150 mm from the ceiling "
    "surface in accordance with BS 5839-1 Table B1. All detectors are accessible from "
    "floor level using a standard detector exchange tool without requiring scaffolding "
    "or elevated access equipment. The detector specification is contained in the "
    "Electrical Services Specification document."
)

_ALARM_SYSTEM_TEXT = (
    "The fire alarm system is configured to provide a single-stage alarm throughout "
    "the building on detection of fire. The alarm signal is transmitted to the fire "
    "service via an automatic alarm transmission system (ATS) with a dedicated monitored "
    "line in accordance with BS 5839-1 clause 25.2. The alarm system is supplied from "
    "the building's UPS system providing a minimum 72-hour standby capacity. The main "
    "control panel provides a graphical display of the building floor plans indicating "
    "the location of activated detectors to assist the fire service on arrival. "
    "A cause-and-effect matrix is included in Appendix C of this report, showing the "
    "response of all interfaced systems (smoke control, lifts, access control, "
    "hold-open devices) on activation of each detector zone."
)

_SUPPRESSION_INTRO_TEXT = (
    "Active fire suppression systems installed in the building comprise a wet pipe "
    "sprinkler system covering all residential floors, plant rooms, and car parking "
    "basement levels; dry riser inlets at the external face of the building for fire "
    "service use; and a wet riser system with outlets on each residential floor. "
    "All suppression systems have been designed by a specialist MEP engineer with "
    "LPCB certification and comply with the relevant BS EN and Loss Prevention "
    "Standards. Design calculations and system schematics are contained in the "
    "MEP Sprinkler Design Specification document."
)

_DRY_WET_RISER_TEXT = (
    "Dry risers are provided in each staircase enclosure with inlets at ground level "
    "within 18 m of a suitable fire appliance access point, and outlets at each floor "
    "level in the staircase lobby. The riser is sized to BS 9990:2015 for a building "
    "height exceeding 18 m. Wet risers are provided in each firefighting lift lobby "
    "with a dedicated pumping arrangement and a 45,000 litre break tank located in "
    "the basement plant room. The wet riser system is designed to deliver 1,500 l/min "
    "at 4.5 bar at the highest outlet simultaneously from two hose reels, in "
    "accordance with BS 9990:2015. The water supply arrangement and pump specification "
    "are detailed in the MEP Sprinkler Design Specification."
)

# ─── Part C shared content ────────────────────────────────────────────────────

_CLADDING_INTRO = (
    "The rainscreen cladding system has been selected and specified to comply with the "
    "requirements of Approved Document B (external fire spread), Approved Document C "
    "(resistance to weather), and Approved Document L (energy efficiency). The system "
    "comprises fibre cement panels in an open-joint configuration, a ventilated cavity, "
    "mineral wool insulation boards, an air and vapour control layer (AVCL), and the "
    "primary wall construction. The system has been tested in accordance with BS 8414-1 "
    "and assessed against BR 135 Fire Performance of External Thermal Insulation for "
    "Walls of Multistorey Buildings. Third-party certification is provided by the BBA."
)

_WATERPROOFING_TEXT = (
    "Below-ground waterproofing is provided by a Type C drained protection system in "
    "accordance with BS 8102:2022, comprising a primary tanked membrane applied to the "
    "external face of the basement retaining walls and underside of the ground floor "
    "slab, supplemented by a drainage layer and sump pump system. The membrane is a "
    "hot-applied reinforced bituminous sheet system with a minimum thickness of 4 mm "
    "applied to prepared concrete substrate. Lap seals are formed using a heat torch "
    "and are inspected and pressure-tested prior to backfilling. The drainage layer "
    "consists of a geocomposite drainage sheet with a geotextile filter fabric bonded "
    "to the soil-facing surface, discharging to perimeter drainage sumps. "
    "Penetrations through the tanking system for services entries are sealed using "
    "proprietary puddle flanges and sleeve systems with BBA certification."
)

_FACADE_INTERFACE_INTRO = (
    "This document describes the interface between the primary structural frame and "
    "the rainscreen cladding system, including the design of the support brackets, "
    "cleats, and fixing arrangements. The facade support system has been designed to "
    "transfer vertical dead loads and horizontal wind loads from the facade to the "
    "structural slab edge, whilst accommodating differential movement between the "
    "facade and the structure arising from temperature variation, creep, and shrinkage. "
    "The design has been carried out in accordance with BS EN 1993-1-8 (steel "
    "connections) and the recommendations of CWCT Technical Notes. All brackets are "
    "in Grade 316L stainless steel with BBA certification."
)

_FACADE_SYSTEM_TEXT = (
    "The primary rainscreen cladding system is a rear-ventilated facade with horizontal "
    "support rails at 600 mm vertical centres attached to stainless steel L-brackets "
    "fixed at 900 mm horizontal centres to the structural slab edge. The bracket design "
    "must accommodate a slab-edge to finished face dimension of 250 mm, a maximum "
    "vertical load per bracket of 3.2 kN, and a maximum horizontal (wind) load per "
    "bracket of 1.8 kN. Thermal break pads are provided between each bracket foot and "
    "the concrete slab edge to limit thermal bridging. Adjustment slots in the bracket "
    "allow for construction tolerances of ±15 mm in all three axes. "
    "The rail-to-bracket connection is via stainless steel M12 bolts with load-spreading "
    "plates, designed to resist the combined effects of dead load, wind load, and "
    "seismic actions."
)

_BRACKET_TEXT = (
    "Each bracket is designed to carry vertical loads from the cladding panels plus "
    "self-weight of rails, insulation, and fixings above. Horizontal loads are "
    "transferred via shear at the bracket-to-slab fixing. The fixing to the slab "
    "edge uses 12 mm stainless steel anchor bolts cast into the slab edge at the "
    "time of construction; post-drill fixings are not permitted. The bracket "
    "arrangement has been checked for combined bending and shear, and for torsion "
    "arising from the offset between the centroid of the cladding panel and the "
    "face of the structural slab. All bracket calculations comply with BS EN 1993-1-8 "
    "and ETAG 001 (Anchors for use in concrete). Pull-out tests in accordance with "
    "BS 8539:2012 will be carried out on a minimum of 10% of cast-in fixings during "
    "construction."
)


# ─────────────────────────────────────────────────────────────────────────────
# Per-document page-content builders
# Each returns a list-of-lists (outer = pages, inner = flowables per page)
# ─────────────────────────────────────────────────────────────────────────────

def _pages_admin_short(doc_ref: str, title: str, body_sections: list[tuple[str, str]]) -> list[list]:
    """2-page administrative document."""
    cover = _cover(doc_ref, title)
    content: list = [Paragraph("1  Introduction", H2), Spacer(1, 0.3 * cm)]
    for heading, text in body_sections:
        content += [Paragraph(heading, H3), Paragraph(text, BODY), Spacer(1, 0.2 * cm)]
    return [cover, content]


def _pages_technical_generic(
    doc_ref: str, title: str,
    sections: list[tuple[str, str]],  # (section_heading, body_text) per page
) -> list[list]:
    """N-page technical document — one major section per page after the cover."""
    pages = [_cover(doc_ref, title)]
    for heading, text in sections:
        pages.append([Paragraph(heading, H2), Spacer(1, 0.3 * cm),
                      Paragraph(text, BODY), Spacer(1, 0.3 * cm),
                      Paragraph(_STANDARDS_TEXT, BODY)])
    return pages


# ── 2.1.1  Structural Calculation Pack  (Section 4.2 CONFLICT on page 7) ─────

def _pages_2_1_1() -> list[list]:
    return [
        # Page 1 — Cover
        _cover("2.1.1", "Structural Calculation Pack",
               "Part A — Structure  |  BS EN 1992 / 1993 / 1997"),
        # Page 2
        [Paragraph("1  Introduction and Scope", H2), Spacer(1, 0.3 * cm),
         Paragraph(_INTRO_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_SCOPE_TEXT, BODY)],
        # Page 3
        [Paragraph("2  Design Standards and Reference Documents", H2), Spacer(1, 0.3 * cm),
         Paragraph(_STANDARDS_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_CONCRETE_TEXT, BODY)],
        # Page 4
        [Paragraph("3  Structural Scheme Description", H2), Spacer(1, 0.3 * cm),
         Paragraph(_GEOTECH_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_PILE_TEXT, BODY)],
        # Page 5
        [Paragraph("4  Structural Analysis — Gravity Loads", H2), Spacer(1, 0.3 * cm),
         Paragraph(_LOADING_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_CONCRETE_TEXT, BODY)],
        # Page 6
        [Paragraph("4.1  Lateral Stability Analysis", H2), Spacer(1, 0.3 * cm),
         Paragraph(_LATERAL_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_STANDARDS_TEXT, BODY)],
        # Page 7 — CONFLICT: 2.5 kN/m²
        [Paragraph("4.2  Façade Loading", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "Facade loading has been assessed in accordance with BS EN 1991-1-1 for "
             "permanent actions and BS EN 1991-1-4 for wind actions on the facade panels. "
             "Dead load contributions from the facade system are applied as line loads to "
             "the slab edge at each floor level.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "The cladding system is assumed to impose a dead load of 2.5 kN/m\u00b2 on "
             "the slab edge at each floor level. This value has been derived from the "
             "cladding contractor's preliminary design data and includes the self-weight "
             "of panels, rails, brackets, insulation, and all fixings. This load has been "
             "applied in the structural model as a uniformly distributed line load along "
             "the perimeter slab edge beams.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "Wind pressures on the facade are applied as normal forces to the cladding "
             "panels and transferred to the bracket array. The design wind pressure at the "
             "top of the building is 1.05 kN/m\u00b2 (positive pressure) and -1.35 kN/m\u00b2 "
             "(suction), derived from BS EN 1991-1-4 with the UK National Annex. "
             "The facade bracket design is contained in the Facade Interface and Support "
             "Design document (ref 2.3.3).",
             BODY)],
        # Page 8
        [Paragraph("5  Foundation Design Summary", H2), Spacer(1, 0.3 * cm),
         Paragraph(_PILE_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_TRANSFER_TEXT, BODY)],
    ]


# ── 2.1.2  Structural General Arrangement Drawings ───────────────────────────

def _pages_2_1_2() -> list[list]:
    return _pages_technical_generic("2.1.2", "Structural General Arrangement Drawings", [
        ("1  Introduction",
         "This document accompanies the general arrangement drawing set for the structural "
         "frame of Silverline House. The drawings are referenced SLH-STR-001 to SLH-STR-048 "
         "Rev A and are listed in the Drawing Register at Appendix A. " + _SCOPE_TEXT),
        ("2  Structural Grid and Geometry",
         "The structural grid is on a 7.5 m × 7.5 m module aligned with the architectural "
         "grid. The core is located at the centre of the building with dimensions of "
         "12 m × 8 m. The transfer slab at Level 1 spans 7.5 m in both directions and is "
         "600 mm deep. Slab thicknesses above Level 1 are 250 mm flat slab throughout. " +
         _LOADING_TEXT),
        ("3  Foundation Layout",
         _GEOTECH_TEXT + " " + _PILE_TEXT),
    ])


# ── 2.1.3  Geotechnical Ground Investigation Report ──────────────────────────

def _pages_2_1_3() -> list[list]:
    return _pages_technical_generic("2.1.3", "Geotechnical Ground Investigation Report", [
        ("1  Scope and Objectives", _INTRO_TEXT + " " + _SCOPE_TEXT),
        ("2  Ground Conditions", _GEOTECH_TEXT + " " + _STANDARDS_TEXT),
        ("3  Foundation Recommendations",
         _PILE_TEXT + " Settlement analysis confirms adequate performance under design loads."),
    ])


# ── 2.1.4  Pile Design and Testing Strategy ──────────────────────────────────

def _pages_2_1_4() -> list[list]:
    return _pages_technical_generic("2.1.4", "Pile Design and Testing Strategy", [
        ("1  Introduction", _INTRO_TEXT + " " + _PILE_TEXT),
        ("2  Design Parameters", _GEOTECH_TEXT + " " + _STANDARDS_TEXT),
        ("3  Testing Programme",
         "Static maintained load tests will be carried out on two trial piles prior to "
         "commencement of production piling. Each test pile will be loaded to 150% of the "
         "working load in accordance with BS EN ISO 22477-1. Dynamic load testing using "
         "the Pile Driving Analyser (PDA) method will be carried out on a minimum of 5% "
         "of production piles as a quality assurance measure. Sonic integrity testing will "
         "be carried out on 100% of production piles in accordance with BS EN ISO 22477-10. "
         + _CONCRETE_TEXT),
    ])


# ── 2.1.5  Material Specification — Concrete and Steel ───────────────────────

def _pages_2_1_5() -> list[list]:
    return _pages_technical_generic(
        "2.1.5", "Material Specification — Concrete and Steel", [
            ("1  Concrete Specification", _CONCRETE_TEXT + " " + _STANDARDS_TEXT),
            ("2  Reinforcement Specification",
             "All reinforcement is Grade B500B hot-rolled deformed bar to BS 4449:2005+A3. "
             "Reinforcement fabric to BS 4483. Stainless steel reinforcement to BS EN "
             "10088-2 Grade 1.4301 is used at slab edges and in any elements exposed to "
             "de-icing salts. Post-tensioning tendons and anchorages comply with BS 4447 "
             "and BS EN 13391. " + _LOADING_TEXT),
            ("3  Structural Steel Specification",
             "Structural steelwork is to S355 JR/J0/J2 to BS EN 10025-2 as appropriate for "
             "element thickness. Hollow sections are to Grade S355 J2H to BS EN 10210. "
             "Welding is in accordance with BS EN 1011-2. All structural steel connections "
             "are designed to BS EN 1993-1-8. Hot-dip galvanising to BS EN ISO 1461 is "
             "specified for all exposed external steelwork. " + _CONCRETE_TEXT),
        ])


# ── 2.1.6  Transfer Slab Design Note ─────────────────────────────────────────

def _pages_2_1_6() -> list[list]:
    return _pages_technical_generic("2.1.6", "Transfer Slab Design Note", [
        ("1  Introduction", _INTRO_TEXT + " " + _TRANSFER_TEXT),
        ("2  Design Actions", _LOADING_TEXT + " " + _STANDARDS_TEXT),
        ("3  Analysis and Results", _LATERAL_TEXT + " " + _CONCRETE_TEXT),
    ])


# ── 2.2.1  Fire Strategy Report  (Section 6.3 CONFLICT on page 12) ───────────

def _pages_2_2_1() -> list[list]:
    return [
        # Page 1 — Cover
        _cover("2.2.1", "Fire Strategy Report",
               "Part B — Fire Safety  |  AD B / BS 9999 / BS 9991"),
        # Page 2
        [Paragraph("1  Introduction", H2), Spacer(1, 0.3 * cm),
         Paragraph(_FIRE_INTRO, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_STANDARDS_TEXT, BODY)],
        # Page 3
        [Paragraph("2  Building Description", H2), Spacer(1, 0.3 * cm),
         Paragraph(_BUILDING_DESCRIPTION, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_INTRO_TEXT, BODY)],
        # Page 4 — cavity barrier mentioned generically only
        [Paragraph("3  Evacuation Strategy", H2), Spacer(1, 0.3 * cm),
         Paragraph(_EVACUATION_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(
             "Cavity barriers are to be provided throughout the facade construction in "
             "compliance with Approved Document B. Full details of cavity barrier "
             "specification and installation will be confirmed in the Fire "
             "Compartmentation Drawings.",
             BODY)],
        # Page 5
        [Paragraph("4  Fire Compartmentation", H2), Spacer(1, 0.3 * cm),
         Paragraph(_COMPARTMENTATION_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_STANDARDS_TEXT, BODY)],
        # Page 6
        [Paragraph("4.1  Compartment Walls", H2), Spacer(1, 0.3 * cm),
         Paragraph(_COMPARTMENT_WALLS_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_FIRE_INTRO, BODY)],
        # Page 7
        [Paragraph("4.2  Compartment Floors and Ceiling Assemblies", H2),
         Spacer(1, 0.3 * cm),
         Paragraph(_FLOOR_CEILING_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_COMPARTMENTATION_TEXT, BODY)],
        # Page 8
        [Paragraph("5  Fire Detection and Alarm System", H2), Spacer(1, 0.3 * cm),
         Paragraph(_DETECTION_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_STANDARDS_TEXT, BODY)],
        # Page 9
        [Paragraph("5.1  Automatic Fire Detection", H2), Spacer(1, 0.3 * cm),
         Paragraph(_AUTO_DETECTION_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_FIRE_INTRO, BODY)],
        # Page 10
        [Paragraph("5.2  Fire Alarm System", H2), Spacer(1, 0.3 * cm),
         Paragraph(_ALARM_SYSTEM_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_DETECTION_TEXT, BODY)],
        # Page 11
        [Paragraph("6  Active Fire Suppression", H2), Spacer(1, 0.3 * cm),
         Paragraph(_SUPPRESSION_INTRO_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph("6.2  Wet Riser System", H3), Spacer(1, 0.2 * cm),
         Paragraph(_DRY_WET_RISER_TEXT, BODY)],
        # Page 12 — CONFLICT: 68°C
        [Paragraph("6.3  Sprinkler System", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "A wet pipe sprinkler system complying with BS EN 12845:2015 is installed "
             "throughout all residential floors, the retail unit, all basement car parking "
             "levels, and plant rooms. The system is classified as Ordinary Hazard Group 2 "
             "for the residential areas and Extra Hazard Group 1 for the basement car park. "
             "Design density and area of operation comply with BS EN 12845 Table 5.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "The sprinkler system is designed using standard response heads with an "
             "activation temperature of 68\u00b0C in accordance with BS EN 12845:2015 "
             "Table 4. This activation temperature is appropriate for the ambient "
             "conditions in the residential areas and plant rooms. The sprinkler heads "
             "comply with BS EN 12259-1 and are from an LPCB-certificated manufacturer.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "The water supply to the sprinkler system is from a 100,000 litre break tank "
             "in the basement plant room, pressurised by a duty-and-standby pump set. The "
             "pump arrangement provides a minimum flow rate of 1,800 l/min at 3.5 bar at "
             "the highest sprinkler head. The full sprinkler system design, including "
             "hydraulic calculations, is contained in the MEP Sprinkler Design "
             "Specification (document ref 2.2.3).",
             BODY)],
        # Page 13
        [Paragraph("7  Fire Service Access", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "Fire service access is provided via a perimeter access road capable of "
             "supporting a fire appliance with a maximum axle load of 16.3 tonnes. "
             "The access road provides a clear width of 3.7 m and a clear height of "
             "3.7 m under all overhead obstructions. Two firefighting lifts serving all "
             "floors are provided in accordance with BS EN 81-72:2020 and Approved "
             "Document B Section 18.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(_EVACUATION_TEXT, BODY)],
    ]


# ── 2.2.2  Fire Compartmentation Drawings ────────────────────────────────────

def _pages_2_2_2() -> list[list]:
    return _pages_technical_generic("2.2.2", "Fire Compartmentation Drawings", [
        ("1  Introduction",
         _FIRE_INTRO + " This document index accompanies the Fire Compartmentation "
         "Drawing set SLH-FIR-100 to SLH-FIR-148."),
        ("2  Compartmentation Schedule",
         "The fire compartmentation drawings show the extent of each fire compartment, "
         "fire resistance ratings of all elements, and the location of fire doors and "
         "service penetration seals. The drawings are to be read in conjunction with the "
         "Fire Strategy Report (document 2.2.1). " + _COMPARTMENT_WALLS_TEXT),
        ("3  Drawing Register", _FLOOR_CEILING_TEXT + " " + _STANDARDS_TEXT),
    ])


# ── 2.2.3  MEP Sprinkler Design Specification  (Section 2.1 CONFLICT on page 3)

def _pages_2_2_3() -> list[list]:
    return [
        # Page 1 — Cover
        _cover("2.2.3", "MEP Sprinkler Design Specification",
               "Part B — Fire Safety  |  BS EN 12845 / LPCB"),
        # Page 2
        [Paragraph("1  Scope and Design Standards", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "This specification covers the design, installation, and commissioning of "
             "the automatic wet pipe sprinkler system for Silverline House. The system "
             "has been designed in accordance with BS EN 12845:2015 (Fixed firefighting "
             "systems — Automatic sprinkler systems) and the Loss Prevention Certification "
             "Board (LPCB) technical requirements. The designer is LPCB-certificated to "
             "BS EN ISO 9001:2015 for the design of automatic sprinkler systems. "
             "The design has been developed in coordination with the Fire Strategy Report "
             "(document ref 2.2.1) and the Mechanical Services Coordination Drawings.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "The system classification adopted is Ordinary Hazard Group 2 (OH2) for "
             "all residential floors and the retail unit, and Extra Hazard Group 1 (EH1) "
             "for the basement car parking levels and plant rooms, in accordance with "
             "BS EN 12845 Table 2. Design parameters: density 5 mm/min over a design "
             "area of 144 m² for OH2; density 10 mm/min over 260 m² for EH1.",
             BODY)],
        # Page 3 — CONFLICT: 93°C
        [Paragraph("2.1  Head Specification", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "High response sprinkler heads are specified throughout with a rated "
             "temperature of 93\u00b0C in accordance with BS EN 12259-1. The heads are "
             "selected from an LPCB-certificated range and comply with the listings "
             "requirements of FM Global Property Loss Prevention Data Sheet 2-0. "
             "The response time index (RTI) of the specified heads is \u226450 (m\u00b7s)\u00bd, "
             "classifying them as standard response in accordance with BS EN 12845 "
             "Table 4.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "Head positions are coordinated with the architectural reflected ceiling "
             "plans (ref SLH-ARC-RC-001 to 048) to achieve the maximum spacing and "
             "area of coverage specified in BS EN 12845 Table 7. Heads in the "
             "residential areas are concealed pattern with a chrome finish to suit "
             "the interior design. Heads in plant rooms and the car park are upright "
             "pattern with unfinished brass bodies.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "The water demand for the sprinkler system is 1,800 l/min for the most "
             "hydraulically onerous design area, sustained for a minimum period of "
             "60 minutes in accordance with BS EN 12845. The calculation assumes a "
             "minimum inlet pressure of 0.3 bar at the base of the system riser.",
             BODY)],
        # Page 4
        [Paragraph("2.2  Pipe Sizing and Layout", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "Distribution pipework is in Schedule 10 black steel to BS EN 10255 with "
             "grooved mechanical couplings. Branch pipework is in CPVC (chlorinated "
             "polyvinyl chloride) to FM Approval Standard 1635 where concealed in "
             "ceiling voids within the residential areas. The system is arranged in "
             "a tree-and-branch configuration with a main distribution ring main at "
             "each plant room level feeding risers to each zone. "
             "Hydraulic calculations have been carried out in accordance with BS EN 12845 "
             "Annex A using specialist hydraulic calculation software. Minimum pipe "
             "diameter is 25 mm (NB) for branch pipes and 100 mm for main risers. ",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(_SUPPRESSION_INTRO_TEXT, BODY)],
    ]


# ── 2.2.4  Smoke Extraction Strategy Note ────────────────────────────────────

def _pages_2_2_4() -> list[list]:
    return _pages_technical_generic("2.2.4", "Smoke Extraction Strategy Note", [
        ("1  Introduction",
         _FIRE_INTRO + " This note describes the smoke extraction strategy for the "
         "common areas, protected corridors, and car parking levels."),
        ("2  Smoke Control System Design",
         "Smoke extraction for the protected corridors is achieved by natural ventilation "
         "through AOV (automatic opening vent) panels at the head of each staircase, "
         "supplemented by mechanical smoke extraction from the lift lobbies using "
         "dedicated axial flow fans sized at 10 air changes per hour. The system is "
         "activated on detection of fire by the fire alarm system. " + _DETECTION_TEXT),
        ("3  CFD Analysis Summary",
         "Computational fluid dynamics (CFD) modelling has been carried out using "
         "FDS (Fire Dynamics Simulator) v6.7 to validate the smoke extraction strategy. "
         "The modelling confirms that tenable conditions are maintained in the "
         "protected corridors for a minimum of 5 minutes from ignition, providing "
         "sufficient time for occupant evacuation. " + _ALARM_SYSTEM_TEXT),
    ])


# ── 2.2.5  Fire Door Schedule ─────────────────────────────────────────────────

def _pages_2_2_5() -> list[list]:
    return _pages_admin_short("2.2.5", "Fire Door Schedule", [
        ("1  Scope",
         "This schedule lists all fire doors within the building, their fire resistance "
         "rating, specification, and location by floor and grid reference. All fire doors "
         "comply with BS 476-22:1987 or BS EN 1634-1:2014 and are third-party certified "
         "to LPS 1197 or equivalent."),
        ("2  Schedule Notes",
         "Fire doors are categorised as FD30S (30-minute with smoke seal) for apartment "
         "entrance doors and FD60S (60-minute with smoke seal) for staircase and lift "
         "lobby enclosures. Ironmongery is listed separately in the Ironmongery Schedule "
         "(document ref SLH-ARC-052). Door closers are compliant with BS EN 1154 and "
         "BS EN 1155 for hold-open devices with automatic release on alarm activation."),
    ])


# ── 2.2.6  External Wall Fire Performance Assessment ─────────────────────────

def _pages_2_2_6() -> list[list]:
    return _pages_technical_generic(
        "2.2.6", "External Wall Fire Performance Assessment", [
            ("1  Introduction",
             _FIRE_INTRO + " This assessment evaluates the fire performance of the external "
             "wall system in accordance with Approved Document B clause 12.7 and the "
             "MHCLG Advice Note 14."),
            ("2  System Description and Test Evidence",
             _CLADDING_INTRO + " The system has been assessed against BR 135 following "
             "testing to BS 8414-1. The test report reference is BRE-2025-SLH-001. The "
             "system achieves a pass result with no observations of unlimited fire spread."),
            ("3  Compliance Statement",
             "The external wall system for Silverline House complies with the requirements "
             "of Approved Document B and the MHCLG External Wall System advice. The system "
             "uses only materials classified A2-s1,d0 or better in the outer leaf. "
             + _STANDARDS_TEXT),
        ])


# ── 2.3.1  Rainscreen Cladding Specification ──────────────────────────────────

def _pages_2_3_1() -> list[list]:
    return _pages_technical_generic(
        "2.3.1", "Rainscreen Cladding Specification", [
            ("1  Introduction", _CLADDING_INTRO + " " + _INTRO_TEXT),
            ("2  System Components and Performance",
             _CLADDING_INTRO + " The system has been subjected to third-party testing "
             "in accordance with ETAG 034 and the BBA certificate number 25/5678 "
             "covers the complete facade system including fixings and insulation. "
             + _STANDARDS_TEXT),
            ("3  Installation Requirements",
             _WATERPROOFING_TEXT + " " + _FACADE_SYSTEM_TEXT),
        ])


# ── 2.3.2  Below Ground Waterproofing Strategy ───────────────────────────────

def _pages_2_3_2() -> list[list]:
    return _pages_technical_generic(
        "2.3.2", "Below Ground Waterproofing Strategy", [
            ("1  Introduction", _INTRO_TEXT + " " + _WATERPROOFING_TEXT),
            ("2  System Specification and Installation",
             _WATERPROOFING_TEXT + " " + _STANDARDS_TEXT),
            ("3  Inspection and Testing",
             "A third-party inspector appointed by the waterproofing contractor will "
             "inspect all membrane installation, lap seals, and penetration details "
             "prior to backfilling. Inspection records will be retained as part of the "
             "Golden Thread documentation. " + _GEOTECH_TEXT),
        ])


# ── 2.3.3  Facade Interface and Support Design  (Section 3.1 CONFLICT on page 4)

def _pages_2_3_3() -> list[list]:
    return [
        # Page 1 — Cover
        _cover("2.3.3", "Facade Interface and Support Design",
               "Part C — Site Preparation  |  BS EN 1993 / CWCT"),
        # Page 2
        [Paragraph("1  Introduction", H2), Spacer(1, 0.3 * cm),
         Paragraph(_FACADE_INTERFACE_INTRO, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_INTRO_TEXT, BODY)],
        # Page 3
        [Paragraph("2  Facade System Overview", H2), Spacer(1, 0.3 * cm),
         Paragraph(_FACADE_SYSTEM_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_STANDARDS_TEXT, BODY)],
        # Page 4 — CONFLICT: 1.8 kN/m²
        [Paragraph("3.1  System Self-Weight", H2), Spacer(1, 0.3 * cm),
         Paragraph(
             "The self-weight of the facade system has been assessed in accordance with "
             "BS EN 1991-1-1 and the manufacturer's declared product data. The assessment "
             "covers all components of the installed facade from the slab edge fixing "
             "point to the outer panel face, including all brackets, rails, fixings, "
             "insulation, air and vapour control layer, and cladding panels.",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "The rainscreen cladding system has a self-weight of 1.8 kN/m\u00b2 including "
             "all fixings and insulation. This value is derived from the system "
             "component data confirmed by the specialist cladding subcontractor. "
             "The 1.8 kN/m\u00b2 self-weight includes: fibre cement panels (0.95 kN/m\u00b2), "
             "horizontal support rails (0.18 kN/m\u00b2), stainless steel brackets and "
             "fixings (0.22 kN/m\u00b2), 120 mm mineral wool insulation (0.22 kN/m\u00b2), "
             "and air and vapour control layer (0.03 kN/m\u00b2).",
             BODY),
         Spacer(1, 0.2 * cm),
         Paragraph(
             "This self-weight is applied to the structural slab edge as a uniformly "
             "distributed line load for structural design purposes. The line load per "
             "metre of slab edge is calculated as 1.8 kN/m\u00b2 × storey height of 3.2 m "
             "= 5.76 kN/m. This value should be used in the slab edge and bracket "
             "design calculations contained in the Structural Calculation Pack "
             "(document ref 2.1.1).",
             BODY)],
        # Page 5
        [Paragraph("3.2  Bracket Design", H2), Spacer(1, 0.3 * cm),
         Paragraph(_BRACKET_TEXT, BODY), Spacer(1, 0.2 * cm),
         Paragraph(_FACADE_SYSTEM_TEXT, BODY)],
    ]


# ── Administrative documents ──────────────────────────────────────────────────

def _pages_admin_0_1() -> list[list]:
    return _pages_admin_short("0.1", "Application Information Schedule", [
        ("1  Purpose",
         "This document is the Application Information Schedule (Annex 4A) prepared in "
         "accordance with CLC Guidance Note 04. It maps every document in the application "
         "pack to the relevant Approved Document part of Building Regulations Schedule 1."),
        ("2  Schedule",
         "The full schedule is presented in tabular form in the attached spreadsheet "
         "(SLH-2026-AIS-RevA.xlsx). The schedule confirms that Parts A, B, and C are "
         "addressed by the documents identified in this application."),
    ])


def _pages_admin_0_2() -> list[list]:
    return _pages_admin_short("0.2", "Application Project Brief", [
        ("1  Project Description",
         f"{PROJECT} is a 25-storey residential building comprising 312 apartments "
         "with a total gross internal area of 28,400 m\u00b2. The building is classified "
         "as a higher-risk building under the Building Safety Act 2022 due to its height "
         "exceeding 18 m and containing more than two residential units."),
        ("2  Project Team",
         "Principal Designer: Clarke Architects LLP. Structural Engineer: Meridian "
         "Structural Consulting Ltd. MEP Engineer: Vertex Building Services Ltd. "
         "Fire Engineer: Phoenix Fire Safety Engineers Ltd. Project Manager: Vanguard "
         "Construction Management Ltd. Principal Contractor: TBC."),
    ])


def _pages_admin_0_3() -> list[list]:
    return _pages_admin_short("0.3", "Application Folder Structure and Contents Schedule", [
        ("1  Folder Structure",
         "The application pack is organised in accordance with CLC Guidance Note 06 / "
         "Annex 6A. Top-level folders: General_Application_Information, "
         "Part_A_Structure, Part_B_Fire_Safety, Part_C_Site_Preparation, "
         "Mandatory_Documents."),
        ("2  Contents Schedule",
         "A complete contents schedule listing all 21 documents by file reference, "
         "title, revision, and approved document part is included as Appendix A. "
         "The schedule confirms that all documents have been prepared and are "
         "included in this submission."),
    ])


def _pages_admin_1_1() -> list[list]:
    return _pages_admin_short("1.1", "Construction Control Plan", [
        ("1  Purpose",
         "This Construction Control Plan sets out the arrangements for managing building "
         "control compliance during construction in accordance with the Building Safety "
         "Act 2022 and the Higher-Risk Buildings (Management of Safety Risks etc) "
         "(England) Regulations 2023."),
        ("2  Inspection Hold Points",
         "Mandatory inspection hold points are established at: pile installation "
         "commencement, transfer slab pre-pour, structural topping-out, facade bracket "
         "installation commencement, and practical completion. The BSR will be notified "
         "at least 5 working days prior to each hold point."),
    ])


def _pages_admin_1_2() -> list[list]:
    return _pages_admin_short("1.2", "Building Regulations Compliance Statement", [
        ("1  Statement of Compliance",
         "This statement confirms that the design of Silverline House, as described in "
         "the Gateway 2 application documents, has been developed to comply with the "
         "Building Regulations 2010 and the Approved Documents applicable to each "
         "element of the design. The design team confirm that each functional "
         "requirement of Schedule 1 to the Building Regulations has been identified, "
         "the relevant compliance standard clarified, and the means of justification "
         "described in the accompanying technical documents."),
        ("2  Outstanding Items",
         "Items submitted as Approval with Requirements (AWR) are identified in the "
         "Application Information Schedule. All AWR items will be resolved prior to "
         "commencement of the relevant work."),
    ])


def _pages_admin_1_3() -> list[list]:
    return _pages_admin_short("1.3", "MOR Plan", [
        ("1  Purpose",
         "This Mandatory Occurrence Reporting (MOR) Plan sets out the procedures for "
         "identifying, recording, and reporting mandatory occurrences during the "
         "design and construction of Silverline House, in accordance with the Higher- "
         "Risk Buildings (Management of Safety Risks etc) (England) Regulations 2023."),
        ("2  Reporting Procedures",
         "Mandatory occurrences will be reported to the Building Safety Regulator "
         "within 10 days of the occurrence being identified, using the BSR online "
         "portal. The Principal Designer is responsible for collating reports from "
         "all members of the design team."),
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Builder dispatch table
# ─────────────────────────────────────────────────────────────────────────────

_BUILDERS: dict[str, callable] = {
    "0.1":   _pages_admin_0_1,
    "0.2":   _pages_admin_0_2,
    "0.3":   _pages_admin_0_3,
    "2.1.1": _pages_2_1_1,
    "2.1.2": _pages_2_1_2,
    "2.1.3": _pages_2_1_3,
    "2.1.4": _pages_2_1_4,
    "2.1.5": _pages_2_1_5,
    "2.1.6": _pages_2_1_6,
    "2.2.1": _pages_2_2_1,
    "2.2.2": _pages_2_2_2,
    "2.2.3": _pages_2_2_3,
    "2.2.4": _pages_2_2_4,
    "2.2.5": _pages_2_2_5,
    "2.2.6": _pages_2_2_6,
    "2.3.1": _pages_2_3_1,
    "2.3.2": _pages_2_3_2,
    "2.3.3": _pages_2_3_3,
    "1.1":   _pages_admin_1_1,
    "1.2":   _pages_admin_1_2,
    "1.3":   _pages_admin_1_3,
}


# ─────────────────────────────────────────────────────────────────────────────
# Generate all PDFs
# ─────────────────────────────────────────────────────────────────────────────

def _generate_pdfs() -> list[dict]:
    """Create all folders and write all PDFs. Returns manifest with file paths."""
    folders = {d["folder"] for d in DOCUMENTS}
    for folder in folders:
        (PACK_DIR / folder).mkdir(parents=True, exist_ok=True)

    manifest = []
    for doc in DOCUMENTS:
        fname  = _filename(doc)
        path   = PACK_DIR / doc["folder"] / fname
        pages  = _BUILDERS[doc["ref"]]()
        _build_pdf(path, doc["ref"], doc["title"], pages)
        manifest.append({**doc, "filename": fname, "path": str(path)})
        print(f"  {doc['ref']:<8}  {fname}")

    return manifest


# ─────────────────────────────────────────────────────────────────────────────
# Write ground_truth.py
# ─────────────────────────────────────────────────────────────────────────────

_GROUND_TRUTH_TEMPLATE = '''\
"""
tests/fixtures/ground_truth.py — auto-generated by generate_test_pack.py
DO NOT EDIT MANUALLY.

Expected analysis results for the synthetic test pack.
All layer tests import GROUND_TRUTH and assert against its values.
"""

GROUND_TRUTH = {{
    "total_documents": {total_documents},
    "parts_covered": ["A", "B", "C"],

    # ── Coordination conflicts ────────────────────────────────────────────────
    # Both embedded at exact page/section in the named documents.
    "coordination_conflicts": [
        {{
            "id": "CONFLICT-001",
            "type": "NUMERICAL",
            "part": "A",
            "pattern": "cladding_load",
            "doc_a": {{
                "ref": "2.1.1", "page": 7,
                "section": "4.2 Fa\u00e7ade Loading",
                "value": 2.5, "unit": "kN/m2"
            }},
            "doc_b": {{
                "ref": "2.3.3", "page": 4,
                "section": "3.1 System Self-Weight",
                "value": 1.8, "unit": "kN/m2"
            }},
            "expected_severity": "HIGH",
        }},
        {{
            "id": "CONFLICT-002",
            "type": "NUMERICAL",
            "part": "B",
            "pattern": "sprinkler_activation_temperature",
            "doc_a": {{
                "ref": "2.2.1", "page": 12,
                "section": "6.3 Sprinkler System",
                "value": 68, "unit": "\u00b0C"
            }},
            "doc_b": {{
                "ref": "2.2.3", "page": 3,
                "section": "2.1 Head Specification",
                "value": 93, "unit": "\u00b0C"
            }},
            "expected_severity": "HIGH",
        }},
    ],

    # ── Completeness gaps ─────────────────────────────────────────────────────
    # Topics absent from ALL documents in the relevant folder.
    # GAP-001: "disproportionate collapse" / "robustness strategy" / "key element"
    #          are absent from every Part_A_Structure document.
    # GAP-002: "cavity barrier" with positional reference (grid / level / elevation)
    #          is absent from every Part_B_Fire_Safety document.
    #          The phrase "cavity barrier" appears generically in 2.2.1 p.4 only.
    "completeness_gaps": [
        {{
            "id": "GAP-001",
            "part": "A",
            "catalogue_id": "A-11",
            "missing_topic": "Strategy for robustness and disproportionate collapse",
            "absent_phrases": [
                "disproportionate collapse",
                "robustness strategy",
                "key element",
            ],
            "expected_severity": "HIGH",
        }},
        {{
            "id": "GAP-002",
            "part": "B",
            "catalogue_id": "B-07",
            "missing_topic": "Cavity barrier positions shown on elevations with grid references",
            "absent_pattern": "cavity barrier.*(?:grid|level|elevation|shown on|position)",
            "expected_severity": "HIGH",
        }},
    ],

    # ── Expected scorecard spot-checks ────────────────────────────────────────
    # Keys are REJECTION_CATALOGUE ids from rejection_scorecard.py.
    # Values are the expected status when the scorecard is run against this pack.
    "expected_scorecard": {{
        "A-11": "FAIL",   # Strategy for robustness and disproportionate collapse — GAP-001
        "A-17": "FAIL",   # Co-ordination mismatch — CONFLICT-001 (cladding load)
        "B-07": "FAIL",   # Cavity barrier positions — GAP-002
        "B-09": "FAIL",   # Sprinkler system layout — CONFLICT-002 keyword match
        "B-01": "PASS",   # Fire detection systems — present in Fire Strategy Report
    }},

    # ── Folder → part mapping (for classifier accuracy tests) ─────────────────
    "folder_part_map": {{
        "General_Application_Information": "ADMIN",
        "Part_A_Structure":               "A",
        "Part_B_Fire_Safety":             "B",
        "Part_C_Site_Preparation":        "C",
        "Mandatory_Documents":            "ADMIN",
    }},

    # ── Document manifest ─────────────────────────────────────────────────────
    "documents": {documents_repr},
}}

# Convenience accessors
CONFLICTS   = GROUND_TRUTH["coordination_conflicts"]
GAPS        = GROUND_TRUTH["completeness_gaps"]
SCORECARD   = GROUND_TRUTH["expected_scorecard"]
'''


def _write_ground_truth(manifest: list[dict]) -> None:
    doc_lines = []
    for d in manifest:
        doc_lines.append(
            f'        {{"ref": {d["ref"]!r}, "title": {d["title"]!r}, '
            f'"folder": {d["folder"]!r}, "part": {d["part"]!r}, '
            f'"filename": {d["filename"]!r}}},'
        )
    documents_repr = "[\n" + "\n".join(doc_lines) + "\n    ]"

    content = _GROUND_TRUTH_TEMPLATE.format(
        total_documents=len(manifest),
        documents_repr=documents_repr,
    )
    GROUND_TRUTH.write_text(content, encoding="utf-8")
    print(f"\n  ground_truth.py  ({len(manifest)} documents)")


# ─────────────────────────────────────────────────────────────────────────────
# Verification — check forbidden phrases are absent
# ─────────────────────────────────────────────────────────────────────────────

def _verify_gaps(manifest: list[dict]) -> None:
    """
    Post-generation sanity check using pdftotext if available.
    Warns (does not fail) if forbidden phrases are found.
    """
    try:
        import subprocess
        pdftotext = "pdftotext"
        subprocess.run([pdftotext, "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("\n  [skip] pdftotext not available — gap verification skipped")
        return

    import subprocess

    forbidden_a = ["disproportionate collapse", "robustness strategy", "key element"]

    part_a_docs = [d for d in manifest if d["part"] == "A"]
    for doc in part_a_docs:
        result = subprocess.run(
            ["pdftotext", doc["path"], "-"], capture_output=True, text=True
        )
        text = result.stdout.lower()
        for phrase in forbidden_a:
            if phrase in text:
                print(f"  [WARN] GAP-001 VIOLATED: '{phrase}' found in {doc['ref']} {doc['filename']}")

    part_b_docs = [d for d in manifest if d["part"] == "B"]
    import re
    pattern = re.compile(r"cavity barrier.{0,80}(?:grid|level|elevation|shown on|position)", re.IGNORECASE)
    for doc in part_b_docs:
        result = subprocess.run(
            ["pdftotext", doc["path"], "-"], capture_output=True, text=True
        )
        if pattern.search(result.stdout):
            print(f"  [WARN] GAP-002 VIOLATED: positional cavity barrier reference in {doc['ref']} {doc['filename']}")

    print("  Verification complete.")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print(f"Generating test pack → {PACK_DIR}")
    print(f"Project: {PROJECT}\n")

    manifest = _generate_pdfs()
    _write_ground_truth(manifest)
    _verify_gaps(manifest)

    print(f"\nDone — {len(manifest)} PDFs written to {PACK_DIR}")
    print(f"Ground truth → {GROUND_TRUTH}")


if __name__ == "__main__":
    main()
