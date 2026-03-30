"""
annex4a_generator.py  —  BSR Quality Checker  |  Layer 2
=========================================================
Generates a draft Application Information Schedule (Annex 4A) from
a classified document registry.

Based on CLC Guidance Note 04 / Annex 4A (v2.0, 27/01/26):
  - Three-column schedule aligned to Building Regulations 2010 Schedule 1
  - Each file allocated to ONE primary Approved Document part only
  - Approved Document parts with no associated file are flagged
  - BFLO parts (B, F, L, O) are highlighted as critical for Regulation 38

INPUT  — JSON array (pasted or API), each item must include:
    file_reference            str   e.g. "2.1.1"
    file_title                str   e.g. "Architectural Plans, Sections and Elevations"
    primary_approved_doc_part str   e.g. "A"  |  "Part B"  |  "AD-B"
    design_entity             str   e.g. "Architect"
    submission_status         str   "With Application"  |  "AWR"  |  "Approval with Requirements"
    notes  (optional)         str

OUTPUT — dict  {  "schedule": [...rows...],  "summary": {...}  }
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Literal, Optional


# ─────────────────────────────────────────────────────────────────────────────
# Building Regulations 2010 Schedule 1 — all Approved Document parts
# ─────────────────────────────────────────────────────────────────────────────

APPROVED_DOCUMENT_PARTS: dict[str, str] = {
    "A": "Structure",
    "B": "Fire Safety",
    "C": "Site Preparation and Resistance to Contaminants and Moisture",
    "D": "Toxic Substances",
    "E": "Resistance to the Passage of Sound",
    "F": "Ventilation",
    "G": "Sanitation, Hot Water Safety and Water Efficiency",
    "H": "Drainage and Waste Disposal",
    "J": "Combustion Appliances and Fuel Storage Systems",
    "K": "Protection from Falling, Collision and Impact",
    "L": "Conservation of Fuel and Power",
    "M": "Access to and Use of Buildings",
    "O": "Overheating",
    "P": "Electrical Safety",
    "Q": "Security",
    "R": "Physical Infrastructure for High-Speed Electronic Communications",
    "S": "Infrastructure for the Charging of Electric Vehicles",
}

# Parts B, F, L, O — critical BFLO information required for Regulation 38 handover
BFLO_PARTS: frozenset[str] = frozenset({"B", "F", "L", "O"})

SubmissionStatus = Literal["With Application", "Approval with Requirements", "Unknown"]

# ─────────────────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ScheduleEntry:
    """A single row in the Application Information Schedule."""
    file_reference: str
    file_title: str
    primary_approved_doc_part: str      # normalised letter, e.g. "A"
    design_entity: str
    submission_status: SubmissionStatus
    notes: str = ""

    @property
    def part_letter(self) -> str:
        return self.primary_approved_doc_part.upper()

    @property
    def approved_doc_label(self) -> str:
        description = APPROVED_DOCUMENT_PARTS.get(self.part_letter, "Unknown")
        return f"Part {self.part_letter} — {description}"

    @property
    def is_awr(self) -> bool:
        return self.submission_status == "Approval with Requirements"

    @property
    def is_bflo(self) -> bool:
        return self.part_letter in BFLO_PARTS


@dataclass
class Annex4ASchedule:
    """The complete draft Application Information Schedule (Annex 4A)."""
    entries: list[ScheduleEntry] = field(default_factory=list)

    # ── Derived properties ─────────────────────────────────────────────────

    def parts_covered(self) -> set[str]:
        """Approved Document parts that have at least one file assigned."""
        return {e.part_letter for e in self.entries if e.part_letter in APPROVED_DOCUMENT_PARTS}

    def parts_missing(self) -> list[str]:
        """Approved Document parts with NO files assigned — must be flagged."""
        return sorted(
            [p for p in APPROVED_DOCUMENT_PARTS if p not in self.parts_covered()]
        )

    def bflo_missing(self) -> list[str]:
        """BFLO parts not covered — particularly important for Regulation 38."""
        return sorted(BFLO_PARTS - self.parts_covered())

    def entries_by_part(self) -> dict[str, list[ScheduleEntry]]:
        grouped: dict[str, list[ScheduleEntry]] = defaultdict(list)
        for e in self.entries:
            grouped[e.part_letter].append(e)
        return dict(grouped)

    # ── Serialisation ──────────────────────────────────────────────────────

    def to_dict(self) -> dict:
        """
        Returns the schedule as a structured dict, suitable for:
          - JSON output
          - Excel/XLSX generation (xlsx skill)
          - Rendering in the BSR Quality Checker UI
        """
        grouped = self.entries_by_part()
        rows: list[dict] = []

        for part in sorted(APPROVED_DOCUMENT_PARTS.keys()):
            part_entries = grouped.get(part, [])
            part_label = f"Part {part} — {APPROVED_DOCUMENT_PARTS[part]}"
            is_bflo = part in BFLO_PARTS

            if part_entries:
                for e in part_entries:
                    rows.append({
                        # Column 1: Approved Document part
                        "approved_document_part":  e.approved_doc_label,
                        "part_letter":             part,
                        "is_bflo_critical":        is_bflo,
                        # Column 2: Design entity
                        "design_entity":           e.design_entity,
                        # Column 3: Submission status
                        "submission_status":       e.submission_status,
                        "is_awr":                  e.is_awr,
                        # File identification
                        "file_reference":          e.file_reference,
                        "file_title":              e.file_title,
                        "notes":                   e.notes,
                        # Flags
                        "flag_missing":            False,
                    })
            else:
                # ⚠️ FLAG — no file assigned to this Approved Document part
                rows.append({
                    "approved_document_part":  part_label,
                    "part_letter":             part,
                    "is_bflo_critical":        is_bflo,
                    "design_entity":           "",
                    "submission_status":       "",
                    "is_awr":                  False,
                    "file_reference":          "— NO FILE ASSIGNED —",
                    "file_title":              "",
                    "notes":                   (
                        "⚠️ CRITICAL — BFLO part with no document assigned. "
                        "Required for Regulation 38 handover."
                        if is_bflo else
                        "⚠️ FLAG — No document assigned to this Approved Document part."
                    ),
                    "flag_missing":            True,
                })

        summary = {
            "total_files":               len(self.entries),
            "total_awr_files":           sum(1 for e in self.entries if e.is_awr),
            "total_with_application":    sum(1 for e in self.entries if not e.is_awr),
            "parts_covered":             sorted(self.parts_covered()),
            "parts_covered_count":       len(self.parts_covered()),
            "parts_missing":             self.parts_missing(),
            "parts_missing_count":       len(self.parts_missing()),
            "bflo_covered":              sorted(BFLO_PARTS & self.parts_covered()),
            "bflo_missing":              self.bflo_missing(),
            "bflo_missing_count":        len(self.bflo_missing()),
            "design_entities":           sorted({e.design_entity for e in self.entries if e.design_entity}),
        }

        return {
            "schedule": rows,
            "summary":  summary,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def to_flat_rows(self) -> list[dict]:
        """
        Returns rows in a flat format ready for pandas DataFrame or Excel output.
        Columns match the three-column Annex 4A layout from CLC Guidance Note 04.
        """
        result = self.to_dict()
        return result["schedule"]


# ─────────────────────────────────────────────────────────────────────────────
# Normalisation helpers
# ─────────────────────────────────────────────────────────────────────────────

def _normalise_part(raw: str) -> str:
    """
    Extract the Approved Document letter from various input formats.
    Handles: "Part A", "A", "part_a", "AD-B", "Approved Document B", "b"
    Returns the uppercase letter if recognised, else returns raw (uppercased).
    """
    raw = raw.strip().upper()
    # Try to extract a single letter from the string
    match = re.search(r'\b([A-S])\b', raw)
    if match:
        candidate = match.group(1)
        if candidate in APPROVED_DOCUMENT_PARTS:
            return candidate
    # Single-char input
    if len(raw) == 1 and raw in APPROVED_DOCUMENT_PARTS:
        return raw
    return raw  # unrecognised — returned as-is for the caller to handle


_STATUS_MAP: dict[str, SubmissionStatus] = {
    "awr":                          "Approval with Requirements",
    "approval with requirements":   "Approval with Requirements",
    "approval_with_requirements":   "Approval with Requirements",
    "deferred":                     "Approval with Requirements",
    "requirement":                  "Approval with Requirements",
    "deferred (awr)":               "Approval with Requirements",
    "with application":             "With Application",
    "with_application":             "With Application",
    "submitted":                    "With Application",
    "full":                         "With Application",
    "yes":                          "With Application",
    "included":                     "With Application",
}

def _normalise_status(raw: str) -> SubmissionStatus:
    return _STATUS_MAP.get(raw.strip().lower(), "Unknown")


# ─────────────────────────────────────────────────────────────────────────────
# Core generator function
# ─────────────────────────────────────────────────────────────────────────────

def generate_annex4a(registry: list[dict]) -> Annex4ASchedule:
    """
    Build an Annex4ASchedule from a classified document registry.

    Accepts flexible field names (aliases shown in brackets):
        file_reference            [ref, id, document_id]
        file_title                [title, filename, document_title, name]
        primary_approved_doc_part [approved_doc, part, ad_part, approved_document]
        design_entity             [entity, discipline, responsible_entity, lead_designer]
        submission_status         [status, submission, awr_flag]
        notes                     [note, comment, remarks]
    """
    entries: list[ScheduleEntry] = []

    for item in registry:

        # ── file reference ──────────────────────────────────────────────────
        ref = str(
            item.get("file_reference") or
            item.get("ref") or
            item.get("id") or
            item.get("document_id") or
            ""
        ).strip()

        # ── file title ──────────────────────────────────────────────────────
        title = str(
            item.get("file_title") or
            item.get("title") or
            item.get("filename") or
            item.get("document_title") or
            item.get("name") or
            ""
        ).strip()

        # ── approved document part ──────────────────────────────────────────
        raw_part = str(
            item.get("primary_approved_doc_part") or
            item.get("approved_doc") or
            item.get("part") or
            item.get("ad_part") or
            item.get("approved_document") or
            ""
        ).strip()
        part = _normalise_part(raw_part) if raw_part else "UNKNOWN"

        # ── design entity ────────────────────────────────────────────────────
        entity = str(
            item.get("design_entity") or
            item.get("entity") or
            item.get("discipline") or
            item.get("responsible_entity") or
            item.get("lead_designer") or
            ""
        ).strip()

        # ── submission status ────────────────────────────────────────────────
        raw_status = str(
            item.get("submission_status") or
            item.get("status") or
            item.get("submission") or
            item.get("awr_flag") or
            "With Application"
        ).strip()
        status = _normalise_status(raw_status)

        # ── notes ─────────────────────────────────────────────────────────────
        notes = str(
            item.get("notes") or
            item.get("note") or
            item.get("comment") or
            item.get("remarks") or
            ""
        ).strip()

        entries.append(ScheduleEntry(
            file_reference=ref,
            file_title=title,
            primary_approved_doc_part=part,
            design_entity=entity,
            submission_status=status,
            notes=notes,
        ))

    return Annex4ASchedule(entries=entries)


# ─────────────────────────────────────────────────────────────────────────────
# Public API — single entry point for BSR Quality Checker
# ─────────────────────────────────────────────────────────────────────────────

def generate_annex4a_from_json(json_input: str) -> dict:
    """
    Main entry point for the BSR Quality Checker.

    Accepts a JSON string (array or object with 'documents' key).
    Returns the full schedule dict:  { "schedule": [...], "summary": {...} }

    On parse error, returns:  { "error": "..." }
    """
    try:
        data = json.loads(json_input)
    except json.JSONDecodeError as exc:
        return {"error": f"Invalid JSON: {exc}"}

    # Handle wrapped format: { "documents": [...] }
    if isinstance(data, dict):
        registry = data.get("documents") or data.get("registry") or data.get("files") or []
    elif isinstance(data, list):
        registry = data
    else:
        return {"error": "Input must be a JSON array or an object containing a 'documents' key."}

    if not isinstance(registry, list):
        return {"error": "'documents' key must contain an array."}

    schedule = generate_annex4a(registry)
    return schedule.to_dict()


# ─────────────────────────────────────────────────────────────────────────────
# CLI usage (standalone test)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        # Read JSON from file path argument
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        # Read from stdin
        raw = sys.stdin.read()

    result = generate_annex4a_from_json(raw)
    print(json.dumps(result, indent=2))
