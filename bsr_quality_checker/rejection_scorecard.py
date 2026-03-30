"""
rejection_scorecard.py  —  BSR Quality Checker  |  Layer 3 output
==================================================================
Rejection Scorecard.

Maps every entry in the Build UK September 2025 rejection catalogue to a
PASS / PARTIAL / FAIL status by matching each rejection reason against
completeness gaps and coordination conflicts from the analysis pipeline.

Source:
  "Reasons for the Rejection of Applications at Gateway Two"
  Build UK, September 2025, pages 3–6.

ROW ORDERING
  Primary:   BSR rejection frequency order — A, B, C, H, K, M, Q, R
  Secondary: remaining parts alphabetically — D, E, F1, F2, G, J, K*, L,
             N, O, P, S, T  (* K already in primary)
  Tertiary:  within each part — FAIL → PARTIAL → PASS

SCORING LOGIC
  For each catalogue row:
    1. Filter completeness_gaps and coordination_conflicts by
       approved_document_part.
    2. Compute keyword overlap between rejection_reason and
       missing_topic / description.
    3. FAIL   — HIGH-severity match with ≥ 40% keyword overlap, OR
                HIGH coordination conflict matching the row's part.
    4. PARTIAL — MEDIUM-severity match ≥ 20% overlap, OR
                 any match (any severity) at 20–39% overlap.
    5. PASS   — no match found.

EXPORTS
  generate_scorecard(payload) -> dict
  to_markdown(scorecard)      -> str
"""

from __future__ import annotations

import json
import re
import sys
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# Build UK Rejection Catalogue — hardcoded verbatim
# Source: Build UK, September 2025, pp. 3–6
# ID format: PART-NN  (two-digit, zero-padded per part)
# ─────────────────────────────────────────────────────────────────────────────

REJECTION_CATALOGUE: list[dict] = [

    # ── Part A — Structure (p.3) ─────────────────────────────────────────────
    {"id": "A-01", "approved_document_part": "A",
     "rejection_reason": "Calculations demonstrating design and compliance to relevant standards"},
    {"id": "A-02", "approved_document_part": "A",
     "rejection_reason": "Connection and bracket details including: balconies, facades, steelwork"},
    {"id": "A-03", "approved_document_part": "A",
     "rejection_reason": "Crack width calculations for retaining walls"},
    {"id": "A-04", "approved_document_part": "A",
     "rejection_reason": "Critical structural elements"},
    {"id": "A-05", "approved_document_part": "A",
     "rejection_reason": "Design loads including: accidental loads on precast columns, additional loads on ground beams, arches, balconies, cladding loads on slab edges, column base design calculations, horizontal loads, internal partitions, masonry, piles, snow, wind"},
    {"id": "A-06", "approved_document_part": "A",
     "rejection_reason": "Material grades e.g. concrete and steel"},
    {"id": "A-07", "approved_document_part": "A",
     "rejection_reason": "Movement joints and how movement is accommodated"},
    {"id": "A-08", "approved_document_part": "A",
     "rejection_reason": "Pile settlement analysis"},
    {"id": "A-09", "approved_document_part": "A",
     "rejection_reason": "Presence or use of transfer elements in the building"},
    {"id": "A-10", "approved_document_part": "A",
     "rejection_reason": "Service holes in reinforced concrete"},
    {"id": "A-11", "approved_document_part": "A",
     "rejection_reason": "Strategy for robustness and disproportionate collapse"},
    {"id": "A-12", "approved_document_part": "A",
     "rejection_reason": "Structural analysis of wind posts, masonry panel checks, masonry support brackets, SFS inner skin, etc."},
    {"id": "A-13", "approved_document_part": "A",
     "rejection_reason": "Vibration limits for balcony designs"},
    {"id": "A-14", "approved_document_part": "A",
     "rejection_reason": "Insufficient information regarding the fact that the building/piling is close to an existing highway's retaining wall structure and there are likely to be considerations for this which need to be taken into account."},
    {"id": "A-15", "approved_document_part": "A",
     "rejection_reason": "No reference to the testing regime of the piling proposed beyond concrete cube testing."},
    {"id": "A-16", "approved_document_part": "A",
     "rejection_reason": "Insufficient calculations to demonstrate the works had been designed to Eurocode requirements."},
    {"id": "A-17", "approved_document_part": "A",
     "rejection_reason": "Obvious lack of co-ordination between structural engineer's loading document and façade design with loading assumptions and support points not matching."},

    # ── Part B — Fire Safety (p.4) ───────────────────────────────────────────
    {"id": "B-01", "approved_document_part": "B",
     "rejection_reason": "Fire detection systems and positions"},
    {"id": "B-02", "approved_document_part": "B",
     "rejection_reason": "Fire resistance of structure, wall and ceiling linings including roof garden"},
    {"id": "B-03", "approved_document_part": "B",
     "rejection_reason": "Fire stopping and cavity barrier proposals in relation to fire strategy"},
    {"id": "B-04", "approved_document_part": "B",
     "rejection_reason": "Integrity of façade around openings"},
    {"id": "B-05", "approved_document_part": "B",
     "rejection_reason": "Layout of water suppression or sprinkler system"},
    {"id": "B-06", "approved_document_part": "B",
     "rejection_reason": "Location of premises information box"},
    {"id": "B-07", "approved_document_part": "B",
     "rejection_reason": "Position of cavity barriers"},
    {"id": "B-08", "approved_document_part": "B",
     "rejection_reason": "Smoke extraction system"},
    {"id": "B-09", "approved_document_part": "B",
     "rejection_reason": "Sprinkler system layout and water supply"},
    {"id": "B-10", "approved_document_part": "B",
     "rejection_reason": "Test data of fire-rated elements"},
    {"id": "B-11", "approved_document_part": "B",
     "rejection_reason": "Water supply for wet riser system and fire service"},
    {"id": "B-12", "approved_document_part": "B",
     "rejection_reason": "Evacuation information including: corridor lengths, management of evacuation for persons with disability, methods of releasing door hold open devices, proximity of staircases, reference to incorrect British Standards, routes through adjacent or adjoining compartments, separation distances, siting of lifts adjacent to firefighting lifts, travel times to place of safety"},
    {"id": "B-13", "approved_document_part": "B",
     "rejection_reason": "Fire strategy drawings do not provide complete details of the fire safety features such as locations of dry risers, inlets, fire alarm panels, refuges, access controls etc."},
    {"id": "B-14", "approved_document_part": "B",
     "rejection_reason": "Lack of information demonstrating how integrity of façade would be maintained around ventilation duct openings in façade."},
    {"id": "B-15", "approved_document_part": "B",
     "rejection_reason": "Insufficient information on the products proposed for the façade to demonstrate compliance with Part B requirements."},
    {"id": "B-16", "approved_document_part": "B",
     "rejection_reason": "No information on elevations showing position of cavity barriers and fire stops."},
    {"id": "B-17", "approved_document_part": "B",
     "rejection_reason": "The simulations do not include pre-travel time and the results of the study do not show that the occupants evacuate to a place of relative safety in five minutes."},
    {"id": "B-18", "approved_document_part": "B",
     "rejection_reason": "Both staircases are in close proximity, located on the same portion of corridor, and could be compromised by fire and smoke concurrently. This poses a risk to means of escape and fire services access."},

    # ── Part C — Site Preparation and Resistance to Contaminants (p.4) ──────
    {"id": "C-01", "approved_document_part": "C",
     "rejection_reason": "Certification, continuity and performance of rainscreen cladding"},
    {"id": "C-02", "approved_document_part": "C",
     "rejection_reason": "Continuity of below ground waterproofing"},
    {"id": "C-03", "approved_document_part": "C",
     "rejection_reason": "Membrane details for specific situations e.g. ground floor vs roof products"},
    {"id": "C-04", "approved_document_part": "C",
     "rejection_reason": "Waterproofing detail to contain water spillage on basins, baths etc."},

    # ── Part E — Resistance to the Passage of Sound (p.5) ───────────────────
    {"id": "E-01", "approved_document_part": "E",
     "rejection_reason": "Insufficient justification of how the proposed construction meets the acoustic requirements."},

    # ── Part G — Sanitation, Hot Water Safety and Water Efficiency (p.5) ────
    {"id": "G-01", "approved_document_part": "G",
     "rejection_reason": "Evidence/explanation required as to how temperature to baths and showers is controlled to 48°C."},

    # ── Part H — Drainage and Water Disposal (p.5) ──────────────────────────
    {"id": "H-01", "approved_document_part": "H",
     "rejection_reason": "Foul water drainage"},
    {"id": "H-02", "approved_document_part": "H",
     "rejection_reason": "Liaison with water company"},
    {"id": "H-03", "approved_document_part": "H",
     "rejection_reason": "Pumped drainage system including storage tanks"},
    {"id": "H-04", "approved_document_part": "H",
     "rejection_reason": "Rainwater drainage"},
    {"id": "H-05", "approved_document_part": "H",
     "rejection_reason": "Storage of refuse, number of bins, frequency of emptying"},

    # ── Part J — Combustion Appliances and Fuel Storage Systems (p.5) ───────
    {"id": "J-01", "approved_document_part": "J",
     "rejection_reason": "Air supply and discharge of products of combustion"},
    {"id": "J-02", "approved_document_part": "J",
     "rejection_reason": "Generator package fuel tank and pipework"},
    {"id": "J-03", "approved_document_part": "J",
     "rejection_reason": "Volume and protection of liquid fuel storage system"},

    # ── Part K — Protection from Falling, Collision and Impact (p.5) ────────
    {"id": "K-01", "approved_document_part": "K",
     "rejection_reason": "Glazing, type used and how compliance is achieved"},
    {"id": "K-02", "approved_document_part": "K",
     "rejection_reason": "Manufacturers' information on products or elements used"},
    {"id": "K-03", "approved_document_part": "K",
     "rejection_reason": "Protection against impact and trapping in relation to doors"},
    {"id": "K-04", "approved_document_part": "K",
     "rejection_reason": "Protection from falling"},
    {"id": "K-05", "approved_document_part": "K",
     "rejection_reason": "Safe access for cleaning of windows"},
    {"id": "K-06", "approved_document_part": "K",
     "rejection_reason": "Safe opening and closing of windows"},

    # ── Part L — Conservation of Fuel and Power (p.5) ───────────────────────
    {"id": "L-01", "approved_document_part": "L",
     "rejection_reason": "Insufficient explanation on how Part L is achieved"},

    # ── Part M — Access to and Use of Buildings (p.6) ───────────────────────
    {"id": "M-01", "approved_document_part": "M",
     "rejection_reason": "Heights of services and controls within the dwelling"},
    {"id": "M-02", "approved_document_part": "M",
     "rejection_reason": "Further adaptability of the bathroom units"},
    {"id": "M-03", "approved_document_part": "M",
     "rejection_reason": "Access statement and plans"},
    {"id": "M-04", "approved_document_part": "M",
     "rejection_reason": "Number of accessible rooms"},

    # ── Part Q — Security (p.6) ──────────────────────────────────────────────
    {"id": "Q-01", "approved_document_part": "Q",
     "rejection_reason": "Details for the accessible doors, windows, security devices and resilient layers not provided."},

    # ── Part R — Infrastructure for Electronic Communications (p.6) ─────────
    {"id": "R-01", "approved_document_part": "R",
     "rejection_reason": "Building work must be carried out so as to ensure that the building is equipped with a high speed ready in-building physical infrastructure, up to a network termination point for high-speed electronic communications networks."},
    {"id": "R-02", "approved_document_part": "R",
     "rejection_reason": "Details of ductwork providing a route for connection is the Building Regulations requirement. The work to connect to individual rooms and clusters is beyond scope."},

    # ── Part S — Infrastructure for the Charging of Electric Vehicles (p.6) ─
    {"id": "S-01", "approved_document_part": "S",
     "rejection_reason": "Insufficient details provided on level of parking on the site to enable assessment of provision can be assessed."},

    # ── Part T — Toilet Accommodation (p.6) ─────────────────────────────────
    {"id": "T-01", "approved_document_part": "T",
     "rejection_reason": "This applies to this application, but limited information to demonstrate compliance has been provided."},
]

# Index by part for O(1) lookup
_CATALOGUE_BY_PART: dict[str, list[dict]] = {}
for _entry in REJECTION_CATALOGUE:
    _CATALOGUE_BY_PART.setdefault(_entry["approved_document_part"], []).append(_entry)


# ─────────────────────────────────────────────────────────────────────────────
# Part ordering
# ─────────────────────────────────────────────────────────────────────────────

_PRIMARY_ORDER = ["A", "B", "C", "H", "K", "M", "Q", "R"]

# All parts that appear in the catalogue, alphabetical for the secondary group
_ALL_CATALOGUE_PARTS = sorted(
    {e["approved_document_part"] for e in REJECTION_CATALOGUE}
)
_SECONDARY_ORDER = [p for p in _ALL_CATALOGUE_PARTS if p not in _PRIMARY_ORDER]

_PART_ORDER = _PRIMARY_ORDER + _SECONDARY_ORDER
_PART_RANK: dict[str, int] = {p: i for i, p in enumerate(_PART_ORDER)}

_STATUS_RANK = {"FAIL": 0, "PARTIAL": 1, "PASS": 2}


# ─────────────────────────────────────────────────────────────────────────────
# Keyword helpers
# ─────────────────────────────────────────────────────────────────────────────

_STOPWORDS = frozenset({
    "a", "an", "the", "and", "or", "of", "to", "in", "for", "on", "with",
    "is", "are", "be", "has", "have", "by", "from", "at", "how", "not",
    "no", "its", "this", "that", "as", "etc", "eg", "ie", "vs", "any",
    "all", "both", "each", "such", "than", "into", "upon", "also", "were",
    "which", "where", "would", "could", "should", "their", "been", "will",
    "what", "when", "including", "beyond", "around",
})


def _keywords(text: str, min_len: int = 3) -> list[str]:
    tokens = re.findall(r"[a-zA-Z]{%d,}" % min_len, text.lower())
    return [t for t in tokens if t not in _STOPWORDS]


def _overlap_ratio(reason_kws: list[str], candidate: str) -> float:
    """Return fraction of reason keywords found in the candidate text."""
    if not reason_kws:
        return 0.0
    candidate_lower = candidate.lower()
    hits = sum(1 for kw in reason_kws if kw in candidate_lower)
    return hits / len(reason_kws)


# ─────────────────────────────────────────────────────────────────────────────
# Citation helpers
# ─────────────────────────────────────────────────────────────────────────────

def _citation_from_gap(gap: dict) -> Optional[dict]:
    closest = gap.get("closest_document")
    if not closest:
        return None
    citation_str = closest.get("citation", "")
    page_match = re.search(r"pages reviewed:\s*([\d–\-]+)", citation_str)
    return {
        "source":         "COMPLETENESS",
        "file_reference": str(closest.get("file_reference") or ""),
        "file_title":     str(closest.get("file_title") or ""),
        "page_number":    page_match.group(1) if page_match else "",
        "section":        "",
        "extract":        str(gap.get("missing_topic") or gap.get("description") or ""),
    }


def _citation_from_conflict(conflict: dict) -> dict:
    doc = conflict.get("document_a") or {}
    return {
        "source":         "COORDINATION",
        "file_reference": str(doc.get("file_reference") or ""),
        "file_title":     str(doc.get("file_title") or ""),
        "page_number":    str(doc.get("page") or doc.get("page_number") or ""),
        "section":        str(doc.get("section") or doc.get("section_heading") or ""),
        "extract":        str(doc.get("extract") or conflict.get("description") or "")[:200],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Scoring — single catalogue row
# ─────────────────────────────────────────────────────────────────────────────

_FAIL_THRESHOLD    = 0.40   # ≥ 40% keyword overlap → strong match
_PARTIAL_THRESHOLD = 0.20   # ≥ 20% keyword overlap → weak match


def _score_row(
    entry: dict,
    gaps_for_part: list[dict],
    conflicts_for_part: list[dict],
) -> dict:
    """
    Score one catalogue entry against the gaps and conflicts for its part.
    Returns a complete scorecard row dict.
    """
    reason      = entry["rejection_reason"]
    reason_kws  = _keywords(reason)

    best_status   = "PASS"
    best_citation: Optional[dict] = None
    best_action   = None

    # ── Check completeness gaps ───────────────────────────────────────────────
    for gap in gaps_for_part:
        candidate = " ".join([
            str(gap.get("missing_topic") or ""),
            str(gap.get("description") or ""),
            str(gap.get("bsr_rejection_reference") or ""),
        ])
        ratio    = _overlap_ratio(reason_kws, candidate)
        severity = str(gap.get("severity", "")).upper()

        if ratio >= _FAIL_THRESHOLD and severity == "HIGH":
            status    = "FAIL"
            citation  = _citation_from_gap(gap)
            action    = str(gap.get("recommended_action") or "")
            action    = re.sub(r"\s*\[Source:[^\]]+\]", "", action).strip()
            # FAIL is the maximum — keep and break early
            best_status   = status
            best_citation = citation
            best_action   = action
            break

        if ratio >= _PARTIAL_THRESHOLD:
            if best_status != "FAIL":
                best_status   = "PARTIAL"
                best_citation = _citation_from_gap(gap)
                action = str(gap.get("recommended_action") or "")
                best_action = re.sub(r"\s*\[Source:[^\]]+\]", "", action).strip()

    if best_status != "FAIL":
        # ── Check coordination conflicts ──────────────────────────────────────
        for conflict in conflicts_for_part:
            candidate  = " ".join([
                str(conflict.get("description") or ""),
                str(conflict.get("divergence_description") or ""),
            ])
            ratio      = _overlap_ratio(reason_kws, candidate)
            severity   = str(conflict.get("severity", "")).upper()

            if ratio >= _FAIL_THRESHOLD and severity == "HIGH":
                best_status   = "FAIL"
                best_citation = _citation_from_conflict(conflict)
                best_action   = str(conflict.get("suggested_action") or "")
                break

            if ratio >= _PARTIAL_THRESHOLD and best_status != "FAIL":
                best_status   = "PARTIAL"
                best_citation = _citation_from_conflict(conflict)
                best_action   = str(conflict.get("suggested_action") or "")

    return {
        "id":                     entry["id"],
        "approved_document_part": entry["approved_document_part"],
        "rejection_reason":       reason,
        "status":                 best_status,
        "citation":               best_citation if best_status != "PASS" else None,
        "recommended_action":     best_action   if best_status != "PASS" else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Core generator
# ─────────────────────────────────────────────────────────────────────────────

def generate_scorecard(payload: dict) -> dict:
    """
    Generate the rejection scorecard.

    Parameters
    ----------
    payload : dict
        {
          "completeness_gaps":      list[dict],   # from completeness_check
          "coordination_conflicts": list[dict],   # from coordination checker
          "project_name":           str
        }

    Returns
    -------
    dict  {
      "project_name": str,
      "rows":         [ScorecardRow, ...],
      "summary": {
        "total": int, "fail": int, "partial": int, "pass": int,
        "fail_parts": [str], "partial_parts": [str]
      }
    }
    """
    gaps      = payload.get("completeness_gaps")      or []
    conflicts = payload.get("coordination_conflicts") or []

    # Index by part for O(1) lookup
    gaps_by_part: dict[str, list[dict]] = {}
    for g in gaps:
        p = str(g.get("approved_document_part") or "")
        gaps_by_part.setdefault(p, []).append(g)

    conflicts_by_part: dict[str, list[dict]] = {}
    for c in conflicts:
        p = str(c.get("approved_document_part") or "")
        conflicts_by_part.setdefault(p, []).append(c)

    # Score every catalogue entry
    scored: list[dict] = []
    for entry in REJECTION_CATALOGUE:
        part = entry["approved_document_part"]
        row  = _score_row(
            entry,
            gaps_by_part.get(part, []),
            conflicts_by_part.get(part, []),
        )
        scored.append(row)

    # Sort: part order → status (FAIL first) → id
    scored.sort(key=lambda r: (
        _PART_RANK.get(r["approved_document_part"], 99),
        _STATUS_RANK.get(r["status"], 9),
        r["id"],
    ))

    # Summary
    fail_count    = sum(1 for r in scored if r["status"] == "FAIL")
    partial_count = sum(1 for r in scored if r["status"] == "PARTIAL")
    pass_count    = sum(1 for r in scored if r["status"] == "PASS")
    fail_parts    = sorted(
        {r["approved_document_part"] for r in scored if r["status"] == "FAIL"},
        key=lambda p: _PART_RANK.get(p, 99),
    )
    partial_parts = sorted(
        {r["approved_document_part"] for r in scored
         if r["status"] == "PARTIAL" and r["approved_document_part"] not in fail_parts},
        key=lambda p: _PART_RANK.get(p, 99),
    )

    return {
        "project_name": str(payload.get("project_name") or ""),
        "rows":         scored,
        "summary": {
            "total":         len(scored),
            "fail":          fail_count,
            "partial":       partial_count,
            "pass":          pass_count,
            "fail_parts":    fail_parts,
            "partial_parts": partial_parts,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Markdown renderer
# ─────────────────────────────────────────────────────────────────────────────

_STATUS_SYMBOL = {"FAIL": "✗", "PARTIAL": "~", "PASS": "✓"}


def _short_citation(citation: Optional[dict]) -> str:
    """Render a citation as a compact inline string."""
    if not citation:
        return ""
    title = citation.get("file_title") or citation.get("file_reference") or ""
    page  = citation.get("page_number", "")
    sec   = citation.get("section", "")
    parts: list[str] = [title]
    if page:
        parts.append(f"p.{page}")
    if sec:
        parts.append(f"§{sec}")
    return ", ".join(parts)


def to_markdown(scorecard: dict) -> str:
    """
    Render the scorecard as a Markdown status table.

    One section per Approved Document part; within each section a table with
    columns: Status | ID | Rejection Criterion | Citation | Action.
    """
    lines: list[str] = []
    project_name = scorecard.get("project_name", "")
    summary      = scorecard.get("summary", {})
    rows: list[dict] = scorecard.get("rows", [])

    # ── Header ────────────────────────────────────────────────────────────────
    lines.append("# BSR Gateway 2 — Rejection Scorecard")
    if project_name:
        lines.append(f"**Project:** {project_name}  ")
    lines.append("")

    # ── Summary ───────────────────────────────────────────────────────────────
    lines.append("## Summary")
    lines.append("")
    lines.append("| | |")
    lines.append("|---|---|")
    lines.append(f"| Total catalogue entries | {summary.get('total', 0)} |")
    lines.append(f"| ✗ FAIL  | {summary.get('fail', 0)} |")
    lines.append(f"| ~ PARTIAL | {summary.get('partial', 0)} |")
    lines.append(f"| ✓ PASS  | {summary.get('pass', 0)} |")
    fail_parts    = ", ".join(summary.get("fail_parts", [])) or "—"
    partial_parts = ", ".join(summary.get("partial_parts", [])) or "—"
    lines.append(f"| Parts with FAIL | {fail_parts} |")
    lines.append(f"| Parts with PARTIAL | {partial_parts} |")
    lines.append("")

    if not rows:
        lines.append("*No catalogue entries.*")
        return "\n".join(lines)

    # ── Section per part ──────────────────────────────────────────────────────
    # Group rows by part, preserving the sort order already applied
    seen_parts: list[str] = []
    rows_by_part: dict[str, list[dict]] = {}
    for row in rows:
        p = row["approved_document_part"]
        if p not in rows_by_part:
            seen_parts.append(p)
        rows_by_part.setdefault(p, []).append(row)

    for part in seen_parts:
        part_rows = rows_by_part[part]

        # Part heading — show fail/partial count if any
        fail_n    = sum(1 for r in part_rows if r["status"] == "FAIL")
        partial_n = sum(1 for r in part_rows if r["status"] == "PARTIAL")
        badge     = ""
        if fail_n:
            badge += f"  ✗ {fail_n} FAIL"
        if partial_n:
            badge += f"  ~ {partial_n} PARTIAL"

        lines.append("---")
        lines.append("")
        lines.append(f"## Part {part}{badge}")
        lines.append("")
        lines.append("| Status | ID | Rejection Criterion | Citation | Action |")
        lines.append("|--------|----|--------------------|----------|--------|")

        for row in part_rows:
            sym     = _STATUS_SYMBOL.get(row["status"], row["status"])
            status  = f"{sym} {row['status']}"
            item_id = row["id"]

            # Truncate long reason to 80 chars for table readability
            reason  = row["rejection_reason"]
            short_r = reason[:80].rstrip()
            if len(reason) > 80:
                short_r += "…"

            citation_str = _short_citation(row.get("citation"))
            action       = str(row.get("recommended_action") or "")
            # Truncate action to 60 chars for table
            short_a = action[:60].rstrip()
            if len(action) > 60:
                short_a += "…"

            # Escape pipe characters in cell content
            def _esc(s: str) -> str:
                return s.replace("|", "\\|")

            lines.append(
                f"| {_esc(status)} | {_esc(item_id)} | {_esc(short_r)} "
                f"| {_esc(citation_str)} | {_esc(short_a)} |"
            )

        lines.append("")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# JSON entry point
# ─────────────────────────────────────────────────────────────────────────────

def generate_scorecard_from_json(json_input: str) -> dict:
    """
    JSON entry point. Parses input and calls generate_scorecard().
    Returns {"error": "..."} on bad input.
    """
    try:
        payload = json.loads(json_input)
    except json.JSONDecodeError as exc:
        return {"error": f"Invalid JSON: {exc}"}
    if not isinstance(payload, dict):
        return {"error": "Input must be a JSON object."}
    return generate_scorecard(payload)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    fmt = "json"
    if "--markdown" in sys.argv or "-m" in sys.argv:
        fmt = "markdown"

    if len(sys.argv) > 1 and sys.argv[1] not in ("--markdown", "-m"):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    sc = generate_scorecard_from_json(raw)
    if fmt == "markdown":
        print(to_markdown(sc))
    else:
        print(json.dumps(sc, indent=2))
