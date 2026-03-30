"""
completeness_knowledge_base.py  —  BSR Quality Checker  |  Layer 3
====================================================================
Knowledge base for the Layer 3 completeness check engine.

Sourced verbatim from:
  "Reasons for the Rejection of Applications at Gateway Two"
  Build UK, September 2025, pages 3–6

  Two-column table per Approved Document part:
    required_topics       ← "Insufficient and Inconsistent Information and Detail" column
    bsr_rejection_examples ← "BSR Example Reasons for Rejection" column

Priority field reflects the Attlee product plan coverage priority:
  A=1, B=2, C=3, H=4, K=5, M=6, Q=7, R=8 (high-frequency rejection parts)
  All other parts with feedback: 9
  Parts with no Build UK feedback: 10

This file is intentionally separated from completeness_check.py so that
the knowledge base can be updated independently as Build UK publishes
new rejection data without touching the engine logic.
"""

from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# BSR Requirements Knowledge Base
# ─────────────────────────────────────────────────────────────────────────────

BSR_REQUIREMENTS: dict[str, dict] = {

    # ── Part A — Structure (Build UK pp. 3–4) ────────────────────────────────
    "A": {
        "part_label": "Part A — Structure",
        "sub_parts": ["A1: Loading", "A2: Ground Movement", "A3: Disproportionate Collapse"],
        "required_topics": [
            "Calculations demonstrating design and compliance to relevant standards",
            "Connection and bracket details — balconies, facades, steelwork",
            "Crack width calculations for retaining walls",
            "Critical structural elements list with references",
            "Design loads — wind, snow, accidental loads on precast columns, balconies, cladding loads on slab edges, column base design calculations, horizontal loads, internal partitions, masonry, piles",
            "Material grades — concrete and steel",
            "Movement joints and how movement is accommodated",
            "Pile settlement analysis",
            "Presence or use of transfer elements in the building",
            "Service holes in reinforced concrete",
            "Strategy for robustness and disproportionate collapse",
            "Structural analysis — wind posts, masonry panel checks, masonry support brackets, SFS inner skin",
            "Vibration limits for balcony designs",
        ],
        "bsr_rejection_examples": [
            "Insufficient information regarding the fact that the building/piling is close to an existing highway's retaining wall structure and there are likely to be considerations for this which need to be taken into account.",
            "No reference to the testing regime of the piling proposed beyond concrete cube testing.",
            "Insufficient calculations to demonstrate the works had been designed to Eurocode requirements.",
            "Obvious lack of co-ordination between structural engineer's loading document and façade design with loading assumptions and support points not matching.",
        ],
        "has_bsr_feedback": True,
        "priority": 1,
    },

    # ── Part B — Fire Safety (Build UK p. 4) ─────────────────────────────────
    "B": {
        "part_label": "Part B — Fire Safety",
        "sub_parts": [
            "B1: Means of warning and escape",
            "B2: Internal fire spread (linings)",
            "B3: Internal fire spread (structure)",
            "B4: External fire spread",
            "B5: Access and facilities for the fire service",
        ],
        "required_topics": [
            "Fire detection systems and positions",
            "Fire resistance of structure, wall and ceiling linings including roof garden",
            "Fire stopping and cavity barrier proposals in relation to fire strategy",
            "Integrity of façade around openings",
            "Layout of water suppression or sprinkler system",
            "Location of premises information box",
            "Position of cavity barriers shown on elevations",
            "Smoke extraction system",
            "Sprinkler system layout and water supply",
            "Test data of fire-rated elements",
            "Water supply for wet riser system and fire service",
            "Evacuation strategy — corridor lengths, travel times to place of safety, management of evacuation for persons with disability, separation distances",
        ],
        "bsr_rejection_examples": [
            "Fire strategy drawings do not provide complete details of the fire safety features such as locations of dry risers, inlets, fire alarm panels, refuges, access controls etc.",
            "Lack of information demonstrating how integrity of façade would be maintained around ventilation duct openings in façade.",
            "Insufficient information on the products proposed for the façade to demonstrate compliance with Part B requirements.",
            "No information on elevations showing position of cavity barriers and fire stops.",
            "The simulations do not include pre-travel time and the results of the study do not show that the occupants evacuate to a place of relative safety in five minutes.",
            "Both staircases are in close proximity, located on the same portion of corridor, and could be compromised by fire and smoke concurrently. This poses a risk to means of escape and fire services access.",
        ],
        "has_bsr_feedback": True,
        "priority": 2,
    },

    # ── Part C — Site Preparation and Resistance to Contaminants and Moisture (Build UK p. 4) ──
    "C": {
        "part_label": "Part C — Site Preparation and Resistance to Contaminants and Moisture",
        "sub_parts": [],
        "required_topics": [
            "Certification, continuity and performance of rainscreen cladding",
            "Continuity of below ground waterproofing",
            "Membrane details for specific situations — ground floor vs roof products",
            "Waterproofing detail to contain water spillage on basins, baths etc.",
        ],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": True,
        "priority": 3,
    },

    # ── Part D — Toxic Substances (Build UK p. 4) — No feedback available ────
    "D": {
        "part_label": "Part D — Toxic Substances",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": False,
        "priority": 10,
    },

    # ── Part E — Resistance to the Passage of Sound (Build UK p. 5) ──────────
    "E": {
        "part_label": "Part E — Resistance to the Passage of Sound",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "Insufficient justification of how the proposed construction meets the acoustic requirements.",
        ],
        "has_bsr_feedback": True,
        "priority": 9,
    },

    # ── Part F1 — Ventilation: Volume 1 Dwellings (Build UK p. 5) — No feedback
    "F1": {
        "part_label": "Part F1 — Ventilation (Volume 1 — Dwellings)",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": False,
        "priority": 10,
    },

    # ── Part F2 — Ventilation: Volume 2 Buildings Other Than Dwellings (Build UK p. 5) — No feedback
    "F2": {
        "part_label": "Part F2 — Ventilation (Volume 2 — Buildings Other Than Dwellings)",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": False,
        "priority": 10,
    },

    # ── Part G — Sanitation, Hot Water Safety and Water Efficiency (Build UK p. 5) ──
    "G": {
        "part_label": "Part G — Sanitation, Hot Water Safety and Water Efficiency",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "Evidence/explanation required as to how temperature to baths and showers is controlled to 48°C.",
        ],
        "has_bsr_feedback": True,
        "priority": 9,
    },

    # ── Part H — Drainage and Water Disposal (Build UK p. 5) ─────────────────
    "H": {
        "part_label": "Part H — Drainage and Waste Disposal",
        "sub_parts": [],
        "required_topics": [
            "Foul water drainage",
            "Liaison with water company",
            "Pumped drainage system including storage tanks",
            "Rainwater drainage",
            "Storage of refuse — number of bins, frequency of emptying",
        ],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": True,
        "priority": 4,
    },

    # ── Part J — Combustion Appliances and Fuel Storage Systems (Build UK p. 5) ──
    "J": {
        "part_label": "Part J — Combustion Appliances and Fuel Storage Systems",
        "sub_parts": [],
        "required_topics": [
            "Air supply and discharge of products of combustion",
            "Generator package fuel tank and pipework",
            "Volume and protection of liquid fuel storage system",
        ],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": True,
        "priority": 9,
    },

    # ── Part K — Protection from Falling, Collision and Impact (Build UK p. 5) ──
    "K": {
        "part_label": "Part K — Protection from Falling, Collision and Impact",
        "sub_parts": [],
        "required_topics": [
            "Glazing — type used and how compliance is achieved",
            "Manufacturers' information on products or elements used",
            "Protection against impact and trapping in relation to doors",
            "Protection from falling",
            "Safe access for cleaning of windows",
            "Safe opening and closing of windows",
        ],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": True,
        "priority": 5,
    },

    # ── Part L — Conservation of Fuel and Power (Build UK p. 5) ─────────────
    "L": {
        "part_label": "Part L — Conservation of Fuel and Power",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "Insufficient explanation on how Part L is achieved",
        ],
        "has_bsr_feedback": True,
        "priority": 9,
    },

    # ── Part M — Access to and Use of Buildings (Build UK p. 6) ─────────────
    "M": {
        "part_label": "Part M — Access to and Use of Buildings",
        "sub_parts": [],
        "required_topics": [
            "Access statement and plans",
            "Further adaptability of the bathroom units",
            "Heights of services and controls within the dwelling",
            "Number of accessible rooms",
        ],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": True,
        "priority": 6,
    },

    # ── Part N — Noise (not in Build UK document) ────────────────────────────
    "N": {
        "part_label": "Part N — Noise",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": False,
        "priority": 10,
    },

    # ── Part O — Overheating (Build UK p. 6) — No feedback available ─────────
    "O": {
        "part_label": "Part O — Overheating",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": False,
        "priority": 10,
    },

    # ── Part P — Electrical Safety (Build UK p. 6) — No feedback available ───
    "P": {
        "part_label": "Part P — Electrical Safety",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [],
        "has_bsr_feedback": False,
        "priority": 10,
    },

    # ── Part Q — Security (Build UK p. 6) ────────────────────────────────────
    "Q": {
        "part_label": "Part Q — Security",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "Details for the accessible doors, windows, security devices and resilient layers not provided.",
        ],
        "has_bsr_feedback": True,
        "priority": 7,
    },

    # ── Part R — Infrastructure for Electronic Communications (Build UK p. 6) ──
    "R": {
        "part_label": "Part R — Physical Infrastructure for High-Speed Electronic Communications",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "Building work must be carried out so as to ensure that the building is equipped with a high speed ready in-building physical infrastructure, up to a network termination point for high-speed electronic communications networks.",
            "Details of ductwork providing a route for connection is the Building Regulations requirement. The work to connect to individual rooms and clusters is beyond scope.",
        ],
        "has_bsr_feedback": True,
        "priority": 8,
    },

    # ── Part S — Infrastructure for the Charging of Electric Vehicles (Build UK p. 6) ──
    "S": {
        "part_label": "Part S — Infrastructure for the Charging of Electric Vehicles",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "Insufficient details provided on level of parking on the site to enable assessment of provision can be assessed.",
        ],
        "has_bsr_feedback": True,
        "priority": 9,
    },

    # ── Part T — Toilet Accommodation (Build UK p. 6) ────────────────────────
    "T": {
        "part_label": "Part T — Toilet Accommodation",
        "sub_parts": [],
        "required_topics": [],
        "bsr_rejection_examples": [
            "This applies to this application, but limited information to demonstrate compliance has been provided.",
        ],
        "has_bsr_feedback": True,
        "priority": 9,
    },
}

# BFLO parts — critical for Regulation 38 handover
BFLO_PARTS: frozenset[str] = frozenset({"B", "F1", "F2", "L", "O"})

# Coverage priority order — per Attlee Gateway 2 Product Plan
COVERAGE_PRIORITY: list[str] = ["A", "B", "C", "H", "K", "M", "Q", "R"]
