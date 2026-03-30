"""
coordination_check.py  —  BSR Quality Checker  |  Layer 4
==========================================================
Cross-document Coordination Check.

Compares DocumentClaims to detect numerical contradictions and design-intent
conflicts across documents submitted in the same Gateway 2 application pack.

INPUTS
------
  document_claims : list[dict]
      Each claim carries:
        file_reference          str   CLC doc ref, e.g. "2.1.1"
        file_title              str   e.g. "Structural Calculation Pack"
        page_number             str | int
        section_heading         str   e.g. "4.2 Façade Loading"
        raw_text                str   passage to analyse
        approved_document_part  str   e.g. "A"   (may be empty/"ADMIN")

      Optional:
        claim_id                str   generated if absent

  project_name : str   (optional)
  model        : str   (optional; defaults to DEFAULT_MODEL)
  client       : anthropic.Anthropic (optional; created if absent)

OUTPUTS
-------
  {
    "conflicts": [ CoordinationConflict, ... ],
    "summary": {
      "total":         int,
      "high":          int,
      "medium":        int,
      "low":           int,
      "parts_checked": list[str],
      "claims_scanned": int
    }
  }

  CoordinationConflict:
    conflict_id             str   "COORD-001", "COORD-002", …
    approved_document_part  str
    severity                str   "HIGH" | "MEDIUM" | "LOW"
    description             str
    document_a              Citation
    document_b              Citation
    suggested_action        str
    bsr_rejection_reference str

  Citation: { file_reference, file_title, page, section, extract }

ALGORITHM
---------
  Step 1 — Extraction
      For each claim, call haiku to extract any numerical design assertions
      (loads, temperatures, dimensions, fire resistance periods, etc.).
      Returns a list of NumericAssertion objects per claim.

  Step 2 — Grouping
      Bucket assertions by unit type (normalised).  Within each unit bucket,
      further group by context similarity (keyword overlap ≥ 50 %).

  Step 3 — Comparison
      For each group with ≥ 2 assertions from different files, flag pairs
      where |v_a − v_b| / max(|v_a|, |v_b|) > CONFLICT_THRESHOLD (5 %).

  Step 4 — Confirmation
      One LLM call per candidate pair to confirm the conflict is genuine,
      set severity, and draft description + suggested action.
"""

from __future__ import annotations

import json
import re
import os
from itertools import combinations
from typing import Optional

try:
    import anthropic as _anthropic
except ImportError:  # pragma: no cover
    _anthropic = None  # type: ignore

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_MODEL = "claude-haiku-4-5-20251001"
_CONFIRM_MODEL = "claude-haiku-4-5-20251001"

_MAX_TEXT_CHARS = 2_000      # truncation per claim for extraction call
_MAX_EXTRACT_CHARS = 800     # extract snippet in citation
_CONFLICT_THRESHOLD = 0.05   # 5 % relative difference → candidate conflict
_MIN_CONTEXT_OVERLAP = 0.30  # 30 % keyword overlap to treat as same concept

# ─────────────────────────────────────────────────────────────────────────────
# Prompts
# ─────────────────────────────────────────────────────────────────────────────

_EXTRACT_SYSTEM = """\
You are a building-engineering document analyst.
Extract every numerical design assertion from the provided text.
Return ONLY a JSON array (may be empty []) of objects with these exact keys:
  "value"            — the number as a float
  "unit"             — unit string, e.g. "kN/m2", "°C", "mm", "m", "MPa", "minutes"
  "context_label"    — 3–8 word label for what this value represents
  "context_keywords" — list of 3–6 lower-case keywords

Include: structural loads, fire parameters, temperatures, dimensions, material
strengths, fire resistance periods, spacings, percentages, flow rates.
Exclude: page numbers, clause references, dates, counts of items, percentages
used as tolerances (e.g. "within 5%"), safety factors expressed as ratios only.
"""

_EXTRACT_USER = """\
Extract numerical design assertions from this text.

File: {file_reference}  Page: {page}  Section: {section}

---
{text}
---

Return JSON array only.
"""

_CONFIRM_SYSTEM = """\
You are a BSR Gateway 2 coordination checker.
Two document extracts each state a numerical value for what appears to be the
same design parameter, but the values differ. Decide whether this is a genuine
coordination conflict that an HBRE (Higher-Risk Building Regulator's Examiner)
would flag at Gateway 2.

Return ONLY a JSON object with these exact keys:
  "is_conflict"              — true | false
  "severity"                 — "HIGH" | "MEDIUM" | "LOW"
  "description"              — one sentence describing the specific contradiction
  "suggested_action"         — one imperative sentence for the design team
  "bsr_rejection_reference"  — verbatim BSR rejection wording if applicable, else ""

Severity guide:
  HIGH   — safety-critical parameter (structural load, fire temperature, sprinkler
            activation, fire resistance period) OR affects life safety
  MEDIUM — significant parameter affecting performance but not immediately
            life-safety (e.g. acoustic, thermal, waterproofing)
  LOW    — minor discrepancy that may be a drafting error
"""

_CONFIRM_USER = """\
These two document extracts appear to describe the same design parameter
with conflicting values.

Document A: {ref_a}  p.{page_a}  §{section_a}
  Value: {value_a} {unit}
  Context: {label}
  Extract: "{extract_a}"

Document B: {ref_b}  p.{page_b}  §{section_b}
  Value: {value_b} {unit}
  Context: {label}
  Extract: "{extract_b}"

Is this a genuine coordination conflict? Return JSON only.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Internal data types (plain dicts, no dataclass dependency)
# ─────────────────────────────────────────────────────────────────────────────

def _make_citation(claim: dict, extract: str = "") -> dict:
    return {
        "file_reference": str(claim.get("file_reference") or ""),
        "file_title":     str(claim.get("file_title") or ""),
        "page":           str(claim.get("page_number") or ""),
        "section":        str(claim.get("section_heading") or ""),
        "extract":        extract[:_MAX_EXTRACT_CHARS],
    }


# ─────────────────────────────────────────────────────────────────────────────
# LLM helpers
# ─────────────────────────────────────────────────────────────────────────────

def _call(client, model: str, system: str, user: str) -> str:
    msg = client.messages.create(
        model=model,
        max_tokens=512,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text.strip()


def _parse_json(raw: str, fallback):
    """Best-effort JSON parse; returns fallback on any error."""
    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return fallback


# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — Extract numerical assertions from a single claim
# ─────────────────────────────────────────────────────────────────────────────

def _extract_assertions(claim: dict, model: str, client) -> list[dict]:
    """
    Returns a list of NumericAssertion dicts:
      { value, unit, unit_normal, context_label, context_keywords, _claim }
    where _claim is a back-reference to the source claim dict.
    """
    text = str(claim.get("raw_text") or "")[:_MAX_TEXT_CHARS]
    if not text.strip():
        return []

    user_msg = _EXTRACT_USER.format(
        file_reference=claim.get("file_reference", ""),
        page=claim.get("page_number", ""),
        section=claim.get("section_heading", ""),
        text=text,
    )
    raw = _call(client, model, _EXTRACT_SYSTEM, user_msg)
    parsed = _parse_json(raw, [])

    if not isinstance(parsed, list):
        return []

    assertions = []
    for item in parsed:
        try:
            value = float(item["value"])
            unit  = str(item.get("unit") or "").strip()
            label = str(item.get("context_label") or "").strip()
            kws   = [str(k).lower() for k in item.get("context_keywords") or []]
        except (KeyError, TypeError, ValueError):
            continue

        if not unit:
            continue

        assertions.append({
            "value":            value,
            "unit":             unit,
            "unit_normal":      _normalise_unit(unit),
            "context_label":    label,
            "context_keywords": kws,
            "_claim":           claim,
        })

    return assertions


def _normalise_unit(unit: str) -> str:
    """Fold common unit aliases to a canonical form."""
    u = unit.strip().lower()
    aliases = {
        "kn/m²": "kn/m2",  "kn/m^2": "kn/m2",  "kn/m\u00b2": "kn/m2",
        "kn/m2": "kn/m2",
        "°c": "degc",  "deg c": "degc",  "celsius": "degc",  "c": "degc",
        "°f": "degf",  "deg f": "degf",  "fahrenheit": "degf",
        "n/mm²": "n/mm2",  "n/mm^2": "n/mm2",  "n/mm\u00b2": "n/mm2",
        "mpa": "mpa",  "n/mm2": "n/mm2",
        "kpa": "kpa",  "pa": "pa",
        "kn": "kn",  "mn": "mn",
        "mm": "mm",  "m": "m",  "cm": "cm",
        "min": "min",  "mins": "min",  "minutes": "min",
        "hrs": "hr",  "hours": "hr",  "hr": "hr",
        "%": "pct",  "percent": "pct",
        "l/s": "l_s",  "l/min": "l_min",
        "kg/m2": "kg/m2",  "kg/m²": "kg/m2",
        "kn/m": "kn/m",
    }
    return aliases.get(u, u)


# ─────────────────────────────────────────────────────────────────────────────
# Step 2 — Group assertions
# ─────────────────────────────────────────────────────────────────────────────

def _keyword_overlap(kws_a: list[str], kws_b: list[str]) -> float:
    """Jaccard-style overlap between two keyword lists."""
    set_a = set(kws_a)
    set_b = set(kws_b)
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def _group_assertions(all_assertions: list[dict]) -> list[list[dict]]:
    """
    Group assertions into clusters where:
      - unit_normal matches, AND
      - keyword overlap ≥ _MIN_CONTEXT_OVERLAP
    Uses a greedy single-link merge (good enough for typical GW2 packs).
    """
    groups: list[list[dict]] = []

    for assertion in all_assertions:
        placed = False
        for group in groups:
            rep = group[0]
            if rep["unit_normal"] != assertion["unit_normal"]:
                continue
            if _keyword_overlap(rep["context_keywords"], assertion["context_keywords"]) >= _MIN_CONTEXT_OVERLAP:
                group.append(assertion)
                placed = True
                break
        if not placed:
            groups.append([assertion])

    return groups


# ─────────────────────────────────────────────────────────────────────────────
# Step 3 — Flag candidate conflicts
# ─────────────────────────────────────────────────────────────────────────────

def _relative_diff(v_a: float, v_b: float) -> float:
    denom = max(abs(v_a), abs(v_b))
    if denom == 0:
        return 0.0
    return abs(v_a - v_b) / denom


def _candidate_pairs(group: list[dict]) -> list[tuple[dict, dict]]:
    """
    Return pairs from different files whose values differ by > CONFLICT_THRESHOLD.
    De-duplicate by (file_a, file_b) to avoid hundreds of pairs from rich docs.
    """
    seen: set[tuple[str, str]] = set()
    pairs: list[tuple[dict, dict]] = []
    for a, b in combinations(group, 2):
        ref_a = a["_claim"].get("file_reference", "")
        ref_b = b["_claim"].get("file_reference", "")
        if ref_a == ref_b:
            continue  # same file — not a cross-document conflict
        key = tuple(sorted([ref_a, ref_b]))
        if key in seen:
            continue
        if _relative_diff(a["value"], b["value"]) > _CONFLICT_THRESHOLD:
            pairs.append((a, b))
            seen.add(key)
    return pairs


# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — Confirm with LLM
# ─────────────────────────────────────────────────────────────────────────────

def _confirm_conflict(pair: tuple[dict, dict], confirm_model: str, client) -> Optional[dict]:
    """
    Returns a CoordinationConflict dict if the LLM confirms a genuine conflict,
    else None.
    """
    a, b = pair
    claim_a = a["_claim"]
    claim_b = b["_claim"]

    extract_a = str(claim_a.get("raw_text") or "")[:300]
    extract_b = str(claim_b.get("raw_text") or "")[:300]

    user_msg = _CONFIRM_USER.format(
        ref_a    = claim_a.get("file_reference", ""),
        page_a   = claim_a.get("page_number", ""),
        section_a= claim_a.get("section_heading", ""),
        value_a  = a["value"],
        ref_b    = claim_b.get("file_reference", ""),
        page_b   = claim_b.get("page_number", ""),
        section_b= claim_b.get("section_heading", ""),
        value_b  = b["value"],
        unit     = a["unit"],
        label    = a["context_label"],
        extract_a= extract_a,
        extract_b= extract_b,
    )

    raw = _call(client, confirm_model, _CONFIRM_SYSTEM, user_msg)
    parsed = _parse_json(raw, {})
    if not isinstance(parsed, dict):
        return None
    if not parsed.get("is_conflict", False):
        return None

    part_a = str(claim_a.get("approved_document_part") or "")
    part_b = str(claim_b.get("approved_document_part") or "")
    part   = part_a if part_a else part_b

    return {
        "conflict_id":             "",   # filled by caller
        "approved_document_part":  part,
        "severity":                str(parsed.get("severity", "MEDIUM")).upper(),
        "description":             str(parsed.get("description", "")),
        "document_a":              _make_citation(claim_a, extract_a),
        "document_b":              _make_citation(claim_b, extract_b),
        "suggested_action":        str(parsed.get("suggested_action", "")),
        "bsr_rejection_reference": str(parsed.get("bsr_rejection_reference") or ""),
    }


# ─────────────────────────────────────────────────────────────────────────────
# BSR rejection reference lookup
# ─────────────────────────────────────────────────────────────────────────────

_BSR_COORDINATION_REFS: dict[str, str] = {
    "A": (
        "Obvious lack of co-ordination between the structural design and other "
        "elements of the proposed works — Build UK rejection catalogue, Part A."
    ),
    "B": (
        "Obvious lack of co-ordination between the fire safety design and other "
        "elements of the proposed works — Build UK rejection catalogue, Part B."
    ),
}

def _bsr_ref_for_part(part: str) -> str:
    return _BSR_COORDINATION_REFS.get(part.upper(), "")


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def run_coordination_check(
    document_claims: list[dict],
    project_name: str = "",
    model: str = DEFAULT_MODEL,
    client=None,
) -> dict:
    """
    Run the four-step coordination check against a list of DocumentClaims.

    Parameters
    ----------
    document_claims : list[dict]
        DocumentClaim objects (same schema as ICJ checker).
    project_name : str
        Optional project name for the summary.
    model : str
        Model for extraction calls (defaults to haiku).
    client : anthropic.Anthropic
        Created automatically if not supplied (uses ANTHROPIC_API_KEY).

    Returns
    -------
    dict — { "conflicts": [...], "summary": {...} }
    """
    if client is None:
        if _anthropic is None:
            raise ImportError("anthropic package not installed")
        client = _anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    # ── Step 1: extract numerical assertions from each claim ─────────────────
    all_assertions: list[dict] = []
    parts_checked: set[str] = set()

    for claim in document_claims:
        part = str(claim.get("approved_document_part") or "").upper()
        if part and part != "ADMIN":
            parts_checked.add(part)

        assertions = _extract_assertions(claim, model, client)
        all_assertions.extend(assertions)

    # ── Step 2: group by unit + context ──────────────────────────────────────
    groups = _group_assertions(all_assertions)

    # ── Step 3: find candidate conflict pairs ─────────────────────────────────
    candidate_pairs: list[tuple[dict, dict]] = []
    for group in groups:
        candidate_pairs.extend(_candidate_pairs(group))

    # ── Step 4: confirm each candidate with LLM ───────────────────────────────
    conflicts: list[dict] = []
    counter = 1
    for pair in candidate_pairs:
        conflict = _confirm_conflict(pair, _CONFIRM_MODEL, client)
        if conflict is None:
            continue

        # Inject BSR reference if not already set by LLM
        if not conflict["bsr_rejection_reference"]:
            conflict["bsr_rejection_reference"] = _bsr_ref_for_part(
                conflict["approved_document_part"]
            )

        conflict["conflict_id"] = f"COORD-{counter:03d}"
        counter += 1
        conflicts.append(conflict)

    # Sort: HIGH first, then by part, then by conflict_id
    _sev = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    conflicts.sort(
        key=lambda c: (
            _sev.get(c["severity"], 9),
            c["approved_document_part"],
            c["conflict_id"],
        )
    )

    # ── Summary ───────────────────────────────────────────────────────────────
    summary = {
        "total":          len(conflicts),
        "high":           sum(1 for c in conflicts if c["severity"] == "HIGH"),
        "medium":         sum(1 for c in conflicts if c["severity"] == "MEDIUM"),
        "low":            sum(1 for c in conflicts if c["severity"] == "LOW"),
        "parts_checked":  sorted(parts_checked),
        "claims_scanned": len(document_claims),
    }

    return {"conflicts": conflicts, "summary": summary}


# ─────────────────────────────────────────────────────────────────────────────
# JSON entry point
# ─────────────────────────────────────────────────────────────────────────────

def run_coordination_check_from_json(
    json_input: str,
    model: str = DEFAULT_MODEL,
    client=None,
) -> str:
    """
    JSON entry point. Parses json_input and calls run_coordination_check().

    Expected input schema:
      {
        "document_claims": [ DocumentClaim, ... ],
        "project_name":    str   (optional)
      }

    Returns JSON string.
    """
    try:
        payload = json.loads(json_input)
    except json.JSONDecodeError as exc:
        return json.dumps({"error": f"Invalid JSON: {exc}"})

    if not isinstance(payload, dict):
        return json.dumps({"error": "Input must be a JSON object."})

    claims = payload.get("document_claims")
    if not isinstance(claims, list):
        return json.dumps({"error": "'document_claims' must be a list."})

    project_name = str(payload.get("project_name") or "")

    result = run_coordination_check(
        document_claims=claims,
        project_name=project_name,
        model=model,
        client=client,
    )
    return json.dumps(result, indent=2)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    print(run_coordination_check_from_json(raw))


# ─────────────────────────────────────────────────────────────────────────────
# Smoke test (no API calls)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__test__":  # pragma: no cover — run manually
    # Unit normalisation
    assert _normalise_unit("kN/m²") == "kn/m2"
    assert _normalise_unit("°C") == "degc"
    assert _normalise_unit("MPa") == "mpa"
    assert _normalise_unit("minutes") == "min"

    # Keyword overlap
    assert _keyword_overlap(["cladding", "load", "facade"], ["cladding", "facade", "weight"]) > 0.4
    assert _keyword_overlap(["temperature", "sprinkler"], ["cladding", "load"]) < 0.1

    # Relative difference
    assert abs(_relative_diff(2.5, 1.8) - 0.28) < 0.01
    assert abs(_relative_diff(68.0, 93.0) - 0.269) < 0.01
    assert _relative_diff(0.0, 0.0) == 0.0

    # Grouping — same unit + overlapping keywords → same group
    assertions = [
        {
            "value": 2.5, "unit": "kN/m2", "unit_normal": "kn/m2",
            "context_label": "cladding facade load",
            "context_keywords": ["cladding", "load", "facade", "dead"],
            "_claim": {"file_reference": "2.1.1", "page_number": 7,
                       "section_heading": "4.2", "raw_text": "2.5 kN/m²"},
        },
        {
            "value": 1.8, "unit": "kN/m2", "unit_normal": "kn/m2",
            "context_label": "facade system self weight",
            "context_keywords": ["facade", "self", "weight", "cladding"],
            "_claim": {"file_reference": "2.3.3", "page_number": 4,
                       "section_heading": "3.1", "raw_text": "1.8 kN/m²"},
        },
    ]
    groups = _group_assertions(assertions)
    assert len(groups) == 1, f"Expected 1 group, got {len(groups)}"

    pairs = _candidate_pairs(groups[0])
    assert len(pairs) == 1
    assert pairs[0][0]["value"] in (2.5, 1.8)

    # Different unit → different group
    assertions2 = [
        {
            "value": 68.0, "unit": "°C", "unit_normal": "degc",
            "context_label": "sprinkler activation temperature",
            "context_keywords": ["sprinkler", "activation", "temperature"],
            "_claim": {"file_reference": "2.2.1", "page_number": 12,
                       "section_heading": "6.3", "raw_text": "68°C"},
        },
        {
            "value": 2.5, "unit": "kN/m2", "unit_normal": "kn/m2",
            "context_label": "cladding load",
            "context_keywords": ["cladding", "load", "dead"],
            "_claim": {"file_reference": "2.1.1", "page_number": 7,
                       "section_heading": "4.2", "raw_text": "2.5 kN/m²"},
        },
    ]
    groups2 = _group_assertions(assertions2)
    assert len(groups2) == 2, f"Expected 2 groups, got {len(groups2)}"

    print("All smoke tests passed.")
