"""
completeness_check.py  —  BSR Quality Checker  |  Layer 3
==========================================================
Completeness Check Engine.

Takes the Layer 2 Annex 4A output and checks each Approved Document part
against the Build UK rejection catalogue knowledge base to identify
information gaps that are known grounds for BSR rejection.

Based on:
  - "Reasons for the Rejection of Applications at Gateway Two"
    Build UK, September 2025 (knowledge base: completeness_knowledge_base.py)
  - CLC Guidance Note 04, Annex 4A v2.0 (27/01/26)
  - Attlee Gateway 2 Product Plan — Layer 3 specification

INPUTS
------
  annex4a : dict
      Output from annex4a_generator.generate_annex4a_from_json()
      i.e. { "schedule": [...rows...], "summary": {...} }

  document_index : list[dict]
      Classified document registry from Layer 1. Each item carries:
        file_reference    str   e.g. "2.1.1"
        file_title        str   e.g. "Structural General Arrangement Drawings"
        page_count        int   (optional)
        extracted_topics  list[str]   key topics found in the document
        provenance        dict  { filename, pages_sampled, section_headings }

OUTPUTS
-------
  dict  {
    "gaps": [...GapItem...],
    "summary": {
      "total_gaps": int,
      "high_severity": int,
      "parts_with_gaps": [...],
      "parts_fully_covered": [...],
      "parts_not_in_submission": [...]
    }
  }

  GapItem:
    approved_document_part   str    e.g. "A"
    part_label               str    e.g. "Part A — Structure"
    priority                 int    1 = highest (per product plan coverage order)
    severity                 str    "HIGH" | "MEDIUM" | "LOW"
    missing_topic            str    the unaddressed required topic or BSR criterion
    bsr_rejection_reference  str    verbatim BSR example reason, if applicable; else ""
    closest_document         dict | None
        file_reference  str
        file_title      str
        citation        str   "filename: X, pages reviewed: Y"
    recommended_action       str
"""

from __future__ import annotations

import json
import re
import sys
from typing import Optional

try:
    from .completeness_knowledge_base import BSR_REQUIREMENTS, BFLO_PARTS, COVERAGE_PRIORITY
except ImportError:
    from completeness_knowledge_base import BSR_REQUIREMENTS, BFLO_PARTS, COVERAGE_PRIORITY


# ─────────────────────────────────────────────────────────────────────────────
# Keyword helpers
# ─────────────────────────────────────────────────────────────────────────────

_STOPWORDS = frozenset({
    "a", "an", "the", "and", "or", "of", "to", "in", "for", "on", "with",
    "is", "are", "be", "has", "have", "by", "from", "at", "how", "not",
    "no", "its", "this", "that", "as", "etc", "eg", "ie", "vs",
    "including", "beyond", "whether", "which", "where", "would", "could",
    "should", "their", "into", "upon", "also", "any", "all", "both",
    "each", "such", "than",
})


def _extract_keywords(text: str) -> list[str]:
    """Extract meaningful tokens from a requirement string."""
    tokens = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return [t for t in tokens if t not in _STOPWORDS]


def _keyword_overlap(keywords: list[str], candidate: str) -> int:
    """Count how many keywords appear in the candidate string."""
    candidate_lower = candidate.lower()
    return sum(1 for kw in keywords if kw in candidate_lower)


def _topic_addressed(topic: str, topic_texts: list[str], threshold: float = 0.4) -> bool:
    """
    Return True if the topic is addressed in any of the candidate texts.
    Uses keyword overlap: requires >= threshold fraction of keywords to match.
    Minimum 1 hit for short keyword lists.
    """
    keywords = _extract_keywords(topic)
    if not keywords:
        return False
    min_hits = max(1, int(len(keywords) * threshold))
    for text in topic_texts:
        if _keyword_overlap(keywords, text) >= min_hits:
            return True
    return False


def _best_matching_document(
    topic: str,
    part_docs: list[dict],
) -> Optional[dict]:
    """
    Return the document from part_docs that best matches the topic keywords.
    Returns None if no document has any keyword overlap.
    """
    keywords = _extract_keywords(topic)
    if not keywords:
        return None

    best_doc = None
    best_score = 0

    for doc in part_docs:
        # Build a combined text from title + extracted_topics
        candidate_parts = [doc.get("file_title", "")]
        for t in doc.get("extracted_topics", []):
            candidate_parts.append(t)
        combined = " ".join(candidate_parts)

        score = _keyword_overlap(keywords, combined)
        if score > best_score:
            best_score = score
            best_doc = doc

    return best_doc if best_score > 0 else None


def _format_citation(doc: dict) -> str:
    """Format a provenance citation string for a document."""
    provenance = doc.get("provenance") or {}
    filename = provenance.get("filename") or doc.get("file_title", "")
    pages = provenance.get("pages_sampled", "")
    if pages:
        return f"filename: {filename}, pages reviewed: {pages}"
    page_count = doc.get("page_count")
    if page_count:
        return f"filename: {filename}, pages reviewed: 1–{page_count}"
    return f"filename: {filename}"


def _is_bsr_rejection_topic(topic: str, bsr_rejection_examples: list[str]) -> Optional[str]:
    """
    Return the most relevant BSR rejection example if the topic maps to one;
    otherwise None. Uses keyword overlap to find the closest match.
    """
    keywords = _extract_keywords(topic)
    if not keywords:
        return None

    best_example = None
    best_score = 0
    min_hits = max(1, int(len(keywords) * 0.3))

    for example in bsr_rejection_examples:
        score = _keyword_overlap(keywords, example)
        if score >= min_hits and score > best_score:
            best_score = score
            best_example = example

    return best_example


# ─────────────────────────────────────────────────────────────────────────────
# Gap builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_gap(
    part: str,
    kb_entry: dict,
    missing_topic: str,
    part_docs: list[dict],
    severity: str,
    bsr_rejection_reference: str = "",
) -> dict:
    closest = _best_matching_document(missing_topic, part_docs)
    closest_doc_dict: Optional[dict] = None
    if closest:
        closest_doc_dict = {
            "file_reference": closest.get("file_reference", ""),
            "file_title": closest.get("file_title", ""),
            "citation": _format_citation(closest),
        }

    action = f"Add or expand document to address: {missing_topic}."
    if bsr_rejection_reference:
        # Truncate to first sentence for readability
        first_sentence = bsr_rejection_reference.split(".")[0].strip()
        action += f" See BSR rejection example: \"{first_sentence}.\""
    action += f" [Source: Build UK — Rejection Catalogue, September 2025, Part {part}]"

    return {
        "approved_document_part": part,
        "part_label": kb_entry["part_label"],
        "priority": kb_entry["priority"],
        "severity": severity,
        "missing_topic": missing_topic,
        "bsr_rejection_reference": bsr_rejection_reference,
        "closest_document": closest_doc_dict,
        "recommended_action": action,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Core engine
# ─────────────────────────────────────────────────────────────────────────────

def run_completeness_check(
    annex4a: dict,
    document_index: Optional[list[dict]] = None,
) -> dict:
    """
    Run the Layer 3 completeness check against the BSR rejection catalogue.

    Parameters
    ----------
    annex4a : dict
        Output of annex4a_generator.generate_annex4a_from_json() —
        { "schedule": [...rows...], "summary": {...} }

    document_index : list[dict], optional
        Classified document registry from Layer 1. Each item must include
        file_reference, file_title, and extracted_topics. When omitted,
        gap detection falls back to file titles only.

    Returns
    -------
    dict  { "gaps": [...], "summary": {...} }
    """
    if document_index is None:
        document_index = []

    schedule: list[dict] = annex4a.get("schedule", [])

    # ── Index document_index by part letter (from the Annex 4A schedule) ────
    # Map file_title → document_index entry for quick lookup
    doc_by_title: dict[str, dict] = {
        d.get("file_title", "").lower(): d for d in document_index
    }
    doc_by_ref: dict[str, dict] = {
        d.get("file_reference", ""): d for d in document_index
    }

    # Group schedule rows by part letter
    rows_by_part: dict[str, list[dict]] = {}
    for row in schedule:
        part = row.get("part_letter", "")
        if part:
            rows_by_part.setdefault(part, []).append(row)

    # Resolve full document_index entries for each part's submitted files
    def _docs_for_part(part: str) -> list[dict]:
        part_rows = [r for r in rows_by_part.get(part, []) if not r.get("flag_missing")]
        docs = []
        for row in part_rows:
            title_key = row.get("file_title", "").lower()
            ref_key = row.get("file_reference", "")
            doc = doc_by_title.get(title_key) or doc_by_ref.get(ref_key)
            if doc:
                docs.append(doc)
            else:
                # Synthesise a minimal entry from the schedule row
                docs.append({
                    "file_reference": row.get("file_reference", ""),
                    "file_title": row.get("file_title", ""),
                    "extracted_topics": [],
                    "provenance": {"filename": row.get("file_title", "")},
                })
        return docs

    # ── Run checks ───────────────────────────────────────────────────────────
    all_gaps: list[dict] = []
    parts_fully_covered: list[str] = []
    parts_not_in_submission: list[str] = []

    for part, kb_entry in BSR_REQUIREMENTS.items():
        is_part_missing = (
            part not in rows_by_part or
            all(r.get("flag_missing", False) for r in rows_by_part.get(part, []))
        )

        required_topics: list[str] = kb_entry["required_topics"]
        bsr_rejection_examples: list[str] = kb_entry["bsr_rejection_examples"]
        has_bsr_feedback: bool = kb_entry["has_bsr_feedback"]

        # All topics to check = required_topics + bsr_rejection_examples
        # (bsr_rejection_examples treated as implicit required topics when
        #  no required_topics list exists for this part)
        topics_to_check: list[str] = required_topics.copy()
        if not required_topics and bsr_rejection_examples:
            topics_to_check = bsr_rejection_examples.copy()

        if is_part_missing:
            parts_not_in_submission.append(part)

            if not topics_to_check:
                # No specific criteria and no document — flag structural gap
                severity = "LOW" if not has_bsr_feedback else "MEDIUM"
                note = (
                    "No Build UK rejection data recorded for this part."
                    if not has_bsr_feedback else
                    "No document submitted."
                )
                all_gaps.append(_build_gap(
                    part=part,
                    kb_entry=kb_entry,
                    missing_topic=f"No document submitted for {kb_entry['part_label']}.",
                    part_docs=[],
                    severity=severity,
                    bsr_rejection_reference=note,
                ))
            else:
                for topic in topics_to_check:
                    bsr_ref = _is_bsr_rejection_topic(topic, bsr_rejection_examples) or ""
                    severity = "HIGH" if bsr_ref else "MEDIUM"
                    if not has_bsr_feedback:
                        severity = "LOW"
                    all_gaps.append(_build_gap(
                        part=part,
                        kb_entry=kb_entry,
                        missing_topic=topic,
                        part_docs=[],
                        severity=severity,
                        bsr_rejection_reference=bsr_ref,
                    ))
        else:
            # Part has submitted documents — check each topic
            part_docs = _docs_for_part(part)

            # Build all text from this part's documents for matching
            topic_texts: list[str] = []
            for doc in part_docs:
                topic_texts.append(doc.get("file_title", ""))
                for t in doc.get("extracted_topics", []):
                    topic_texts.append(t)
                # Include notes from the schedule row
            for row in rows_by_part.get(part, []):
                if not row.get("flag_missing"):
                    notes = row.get("notes", "")
                    if notes:
                        topic_texts.append(notes)

            part_gaps: list[dict] = []

            for topic in topics_to_check:
                if _topic_addressed(topic, topic_texts):
                    continue  # evidenced — not a gap

                bsr_ref = _is_bsr_rejection_topic(topic, bsr_rejection_examples) or ""
                severity = "HIGH" if bsr_ref else "MEDIUM"
                if not has_bsr_feedback:
                    severity = "LOW"

                part_gaps.append(_build_gap(
                    part=part,
                    kb_entry=kb_entry,
                    missing_topic=topic,
                    part_docs=part_docs,
                    severity=severity,
                    bsr_rejection_reference=bsr_ref,
                ))

            if part_gaps:
                all_gaps.extend(part_gaps)
            else:
                if topics_to_check:  # only mark as fully covered if we had criteria to check
                    parts_fully_covered.append(part)

    # ── Sort: priority → severity → part ────────────────────────────────────
    _severity_rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    all_gaps.sort(key=lambda g: (
        g["priority"],
        _severity_rank.get(g["severity"], 9),
        g["approved_document_part"],
    ))

    # ── Summary ──────────────────────────────────────────────────────────────
    parts_with_gaps = sorted({g["approved_document_part"] for g in all_gaps})
    high_severity_count = sum(1 for g in all_gaps if g["severity"] == "HIGH")

    summary = {
        "total_gaps": len(all_gaps),
        "high_severity": high_severity_count,
        "medium_severity": sum(1 for g in all_gaps if g["severity"] == "MEDIUM"),
        "low_severity": sum(1 for g in all_gaps if g["severity"] == "LOW"),
        "parts_with_gaps": parts_with_gaps,
        "parts_fully_covered": sorted(parts_fully_covered),
        "parts_not_in_submission": sorted(parts_not_in_submission),
        "source": "Build UK — Reasons for the Rejection of Applications at Gateway Two, September 2025",
    }

    return {
        "gaps": all_gaps,
        "summary": summary,
    }


# ─────────────────────────────────────────────────────────────────────────────
# JSON entry point — mirrors annex4a_generator interface
# ─────────────────────────────────────────────────────────────────────────────

def run_completeness_check_from_json(json_input: str) -> dict:
    """
    JSON entry point for the BSR Quality Checker.

    Accepts:
      { "annex4a": {...}, "document_index": [...] }
    or just the raw Annex 4A output (document_index omitted).

    Returns { "gaps": [...], "summary": {...} }
    On parse error, returns { "error": "..." }
    """
    try:
        data = json.loads(json_input)
    except json.JSONDecodeError as exc:
        return {"error": f"Invalid JSON: {exc}"}

    if not isinstance(data, dict):
        return {"error": "Input must be a JSON object."}

    if "annex4a" in data:
        annex4a = data["annex4a"]
        document_index = data.get("document_index") or []
    elif "schedule" in data:
        annex4a = data
        document_index = []
    else:
        return {"error": "Input must contain 'schedule' key (Annex 4A output) or 'annex4a' key."}

    return run_completeness_check(annex4a, document_index)


# ─────────────────────────────────────────────────────────────────────────────
# CLI (standalone test / subprocess mode)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    result = run_completeness_check_from_json(raw)
    print(json.dumps(result, indent=2))
