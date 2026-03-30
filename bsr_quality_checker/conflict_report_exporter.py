"""
conflict_report_exporter.py  —  BSR Quality Checker  |  Layer 4 output
=======================================================================
Conflict & Completeness Report Exporter.

Merges Layer 4 coordination conflicts and Layer 3 completeness gaps into a
single prioritised report, exportable as JSON or Markdown.

INPUTS
------
  coordination_conflicts : list[CoordinationConflict]
      Each CoordinationConflict carries:
        conflict_id             str   optional; generated if absent
        approved_document_part  str   e.g. "A"
        severity                str   "HIGH" | "MEDIUM" | "LOW"
        description             str   human-readable conflict description
        document_a              dict  { file_reference, file_title, page,
                                        section, extract }
        document_b              dict  same shape as document_a
        suggested_action        str
        bsr_rejection_reference str   verbatim BSR quote if available; else ""

  completeness_gaps : list[GapItem]
      Output rows from completeness_check.run_completeness_check() — each
      carrying approved_document_part, severity, missing_topic,
      bsr_rejection_reference, closest_document, recommended_action.

  project_name : str
  report_date  : str   ISO 8601 preferred, e.g. "2026-03-30"

OUTPUTS
-------
  to_json()     — JSON string, schema documented below
  to_markdown() — human-readable Markdown string

  Unified item schema:
    item_id                 str   COORD-001 | COMP-001
    source                  str   "COORDINATION" | "COMPLETENESS"
    severity                str   "HIGH" | "MEDIUM" | "LOW"
    approved_document_part  str
    description             str
    citations               list[Citation]
      { file_reference, file_title, page, section, extract }
    suggested_action        str   single imperative sentence
    bsr_rejection_reference str

Sort order: HIGH → MEDIUM → LOW; within tier, Part A before B before C … T.
"""

from __future__ import annotations

import json
import re
import textwrap
from typing import Literal


# ─────────────────────────────────────────────────────────────────────────────
# Part ordering
# ─────────────────────────────────────────────────────────────────────────────

_PART_ORDER: list[str] = [
    "A", "B", "C", "D", "E", "F1", "F2",
    "G", "H", "J", "K", "L", "M", "N",
    "O", "P", "Q", "R", "S", "T",
]
_PART_RANK: dict[str, int] = {p: i for i, p in enumerate(_PART_ORDER)}

_SEVERITY_RANK: dict[str, int] = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


def _part_rank(part: str) -> int:
    return _PART_RANK.get(part.upper(), 99)


def _severity_rank(severity: str) -> int:
    return _SEVERITY_RANK.get(severity.upper(), 9)


# ─────────────────────────────────────────────────────────────────────────────
# Normalisation — CoordinationConflict → ReportItem
# ─────────────────────────────────────────────────────────────────────────────

def _norm_citation(doc: dict) -> dict:
    """Normalise a document_a / document_b dict into a Citation."""
    return {
        "file_reference": str(doc.get("file_reference") or ""),
        "file_title":     str(doc.get("file_title") or ""),
        "page":           str(doc.get("page") or doc.get("page_number") or ""),
        "section":        str(doc.get("section") or doc.get("section_heading") or ""),
        "extract":        str(doc.get("extract") or doc.get("raw_text") or "")[:300],
    }


def _from_coordination(conflict: dict, index: int) -> dict:
    """Convert a CoordinationConflict dict to a unified ReportItem."""
    item_id = conflict.get("conflict_id") or f"COORD-{index + 1:03d}"

    citations: list[dict] = []
    if conflict.get("document_a"):
        citations.append(_norm_citation(conflict["document_a"]))
    if conflict.get("document_b"):
        citations.append(_norm_citation(conflict["document_b"]))

    # Accept additional citations list if the caller passes one
    for extra in conflict.get("citations", []):
        citations.append(_norm_citation(extra))

    return {
        "item_id":                item_id,
        "source":                 "COORDINATION",
        "severity":               str(conflict.get("severity", "MEDIUM")).upper(),
        "approved_document_part": str(conflict.get("approved_document_part", "")),
        "description":            str(conflict.get("description", "")),
        "citations":              citations,
        "suggested_action":       str(conflict.get("suggested_action", "")),
        "bsr_rejection_reference": str(conflict.get("bsr_rejection_reference", "")),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Normalisation — GapItem (completeness_check output) → ReportItem
# ─────────────────────────────────────────────────────────────────────────────

def _from_gap(gap: dict, index: int) -> dict:
    """Convert a completeness GapItem dict to a unified ReportItem."""
    item_id = gap.get("gap_id") or f"COMP-{index + 1:03d}"

    citations: list[dict] = []
    closest = gap.get("closest_document")
    if closest and isinstance(closest, dict):
        # closest_document schema from completeness_check:
        # { file_reference, file_title, citation: "filename: X, pages reviewed: Y" }
        citation_str = closest.get("citation", "")
        # Extract page range from "filename: X, pages reviewed: 1–24"
        page_match = re.search(r"pages reviewed:\s*([\d–\-]+)", citation_str)
        page = page_match.group(1) if page_match else ""
        citations.append({
            "file_reference": str(closest.get("file_reference") or ""),
            "file_title":     str(closest.get("file_title") or ""),
            "page":           page,
            "section":        "",
            "extract":        "",
        })

    description = str(gap.get("missing_topic") or gap.get("description") or "")

    # Derive a single imperative sentence from recommended_action
    action = str(gap.get("recommended_action") or gap.get("suggested_action") or "")
    # Strip the trailing BSR source citation if present (keep the sentence clean)
    action = re.sub(r"\s*\[Source:[^\]]+\]", "", action).strip()

    return {
        "item_id":                item_id,
        "source":                 "COMPLETENESS",
        "severity":               str(gap.get("severity", "MEDIUM")).upper(),
        "approved_document_part": str(gap.get("approved_document_part", "")),
        "description":            description,
        "citations":              citations,
        "suggested_action":       action,
        "bsr_rejection_reference": str(gap.get("bsr_rejection_reference") or ""),
    }


# ─────────────────────────────────────────────────────────────────────────────
# ConflictReport
# ─────────────────────────────────────────────────────────────────────────────

class ConflictReport:
    """
    Normalised, sorted report combining coordination conflicts and
    completeness gaps.

    Usage:
        report = ConflictReport(payload)
        json_str     = report.to_json()
        markdown_str = report.to_markdown()
    """

    def __init__(self, payload: dict) -> None:
        self.project_name = str(payload.get("project_name") or "")
        self.report_date  = str(payload.get("report_date")  or "")

        raw_conflicts = payload.get("coordination_conflicts") or []
        raw_gaps      = payload.get("completeness_gaps")      or []

        items: list[dict] = []

        for i, conflict in enumerate(raw_conflicts):
            items.append(_from_coordination(conflict, i))

        for i, gap in enumerate(raw_gaps):
            items.append(_from_gap(gap, i))

        # Sort: severity tier first, then part order within tier
        self.items: list[dict] = sorted(
            items,
            key=lambda x: (
                _severity_rank(x["severity"]),
                _part_rank(x["approved_document_part"]),
                x["source"],   # COMPLETENESS before COORDINATION within same part+severity
                x["item_id"],
            ),
        )

    # ── Summary ───────────────────────────────────────────────────────────────

    def _summary(self) -> dict:
        high   = sum(1 for i in self.items if i["severity"] == "HIGH")
        medium = sum(1 for i in self.items if i["severity"] == "MEDIUM")
        low    = sum(1 for i in self.items if i["severity"] == "LOW")
        parts  = sorted(
            {i["approved_document_part"] for i in self.items if i["approved_document_part"]},
            key=_part_rank,
        )
        return {
            "total":          len(self.items),
            "high":           high,
            "medium":         medium,
            "low":            low,
            "parts_affected": parts,
        }

    # ── JSON export ───────────────────────────────────────────────────────────

    def to_json(self, indent: int = 2) -> str:
        """
        Return the full report as a JSON string.

        Schema:
          { "project_name", "report_date", "summary": {...}, "items": [...] }
        """
        return json.dumps(
            {
                "project_name": self.project_name,
                "report_date":  self.report_date,
                "summary":      self._summary(),
                "items":        self.items,
            },
            indent=indent,
        )

    # ── Markdown export ───────────────────────────────────────────────────────

    @staticmethod
    def _citation_line(c: dict) -> str:
        """
        Format a Citation as:  Title, p.X §Section — 'extract'
        Omits absent fields gracefully.
        """
        title   = c.get("file_title")  or c.get("file_reference") or "Unknown"
        ref     = c.get("file_reference", "")
        page    = c.get("page", "")
        section = c.get("section", "")
        extract = c.get("extract", "").strip()

        # Build location tag
        loc_parts: list[str] = []
        if ref and ref != title:
            loc_parts.append(ref)
        if page:
            loc_parts.append(f"p.{page}")
        if section:
            loc_parts.append(f"§{section}")
        loc = ", ".join(loc_parts)

        line = title
        if loc:
            line += f", {loc}"
        if extract:
            # Truncate long extracts and add ellipsis
            short = extract[:120].rstrip()
            if len(extract) > 120:
                short += "…"
            line += f" — '{short}'"

        return line

    def to_markdown(self) -> str:
        """
        Return a human-readable Markdown report.

        Structure:
          # BSR Gateway 2 Report
          ## Summary
          ## HIGH SEVERITY
          ### ITEM-ID · Part X — <description prefix>
          ...
          ## MEDIUM SEVERITY
          ## LOW SEVERITY
        """
        lines: list[str] = []

        # ── Header ────────────────────────────────────────────────────────────
        lines.append("# BSR Gateway 2 — Conflict & Completeness Report")
        if self.project_name:
            lines.append(f"**Project:** {self.project_name}")
        if self.report_date:
            lines.append(f"**Date:** {self.report_date}")
        lines.append("")

        # ── Summary table ─────────────────────────────────────────────────────
        s = self._summary()
        lines.append("## Summary")
        lines.append("")
        lines.append(f"| | |")
        lines.append(f"|---|---|")
        lines.append(f"| Total items | {s['total']} |")
        lines.append(f"| HIGH | {s['high']} |")
        lines.append(f"| MEDIUM | {s['medium']} |")
        lines.append(f"| LOW | {s['low']} |")
        parts_str = ", ".join(s["parts_affected"]) if s["parts_affected"] else "—"
        lines.append(f"| Parts affected | {parts_str} |")
        lines.append("")

        if not self.items:
            lines.append("*No conflicts or gaps found.*")
            return "\n".join(lines)

        # ── Items by severity tier ────────────────────────────────────────────
        for tier in ("HIGH", "MEDIUM", "LOW"):
            tier_items = [i for i in self.items if i["severity"] == tier]
            if not tier_items:
                continue

            lines.append(f"---")
            lines.append("")
            lines.append(f"## {tier} SEVERITY  ({len(tier_items)} item{'s' if len(tier_items) != 1 else ''})")
            lines.append("")

            for item in tier_items:
                part   = item["approved_document_part"]
                source = "Coordination" if item["source"] == "COORDINATION" else "Completeness"
                desc   = item["description"]

                # Heading: item_id · Part X — first 70 chars of description
                short_desc = desc[:70].rstrip()
                if len(desc) > 70:
                    short_desc += "…"
                lines.append(
                    f"### {item['item_id']}  ·  Part {part}  —  {short_desc}"
                )
                lines.append("")
                lines.append(f"**Source:** {source}  ")
                if item["bsr_rejection_reference"]:
                    # Truncate long BSR quotes
                    bsr = item["bsr_rejection_reference"]
                    short_bsr = bsr[:160].rstrip()
                    if len(bsr) > 160:
                        short_bsr += "…"
                    lines.append(f"**BSR rejection reference:** _{short_bsr}_  ")
                lines.append("")

                # Full description
                lines.append(desc)
                lines.append("")

                # Citations
                if item["citations"]:
                    lines.append("**Citations:**")
                    for c in item["citations"]:
                        lines.append(f"- {self._citation_line(c)}")
                    lines.append("")

                # Suggested action
                action = item["suggested_action"]
                if action:
                    # Ensure it ends with a period
                    if action and action[-1] not in ".!?":
                        action += "."
                    lines.append(f"**Action:** {action}")
                    lines.append("")

        return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def export_report(
    payload: dict,
    format: Literal["json", "markdown"] = "json",
) -> str:
    """
    Build and export a conflict & completeness report.

    Parameters
    ----------
    payload : dict
        {
          "coordination_conflicts": list[CoordinationConflict],
          "completeness_gaps":      list[GapItem],
          "project_name":           str,
          "report_date":            str
        }

    format : "json" | "markdown"
        Output format. Defaults to "json".

    Returns
    -------
    str — JSON string or Markdown string.
    """
    report = ConflictReport(payload)
    if format == "markdown":
        return report.to_markdown()
    return report.to_json()


# ─────────────────────────────────────────────────────────────────────────────
# JSON entry point — mirrors package CLI conventions
# ─────────────────────────────────────────────────────────────────────────────

def export_report_from_json(json_input: str, format: Literal["json", "markdown"] = "json") -> str:
    """
    JSON entry point. Parses the input and calls export_report().
    On parse error, returns a JSON error object (or Markdown error block).
    """
    try:
        payload = json.loads(json_input)
    except json.JSONDecodeError as exc:
        if format == "markdown":
            return f"# Error\n\nInvalid JSON input: {exc}"
        return json.dumps({"error": f"Invalid JSON: {exc}"})

    if not isinstance(payload, dict):
        if format == "markdown":
            return "# Error\n\nInput must be a JSON object."
        return json.dumps({"error": "Input must be a JSON object."})

    return export_report(payload, format=format)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    fmt: Literal["json", "markdown"] = "json"
    if "--markdown" in sys.argv or "-m" in sys.argv:
        fmt = "markdown"

    if len(sys.argv) > 1 and sys.argv[1] not in ("--markdown", "-m"):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    print(export_report_from_json(raw, format=fmt))
