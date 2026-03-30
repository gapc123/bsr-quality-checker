"""
rfi_response_generator.py  —  BSR Quality Checker  |  Layer 6
==============================================================
RFI Response Generator.

Takes a BSR Request for Information, the application document corpus, ICJ
assessments, and the Annex 4A schedule; produces an ICJ-structured draft
response citing specific pages and sections from the application pack.

Based on:
  - CLC Guidance Note 04, §1.3 (p.12) — ICJ response standard
  - Attlee Gateway 2 Product Plan — Deep Citation principle (p.4)

TWO LLM CALLS PER RFI
  Call 1 — RFI classification: which AD parts does the RFI address?
  Call 2 — Draft generation: ICJ-structured response using retrieved claims

RETRIEVAL (pure Python — no LLM)
  Three-tier keyword retrieval against document_claims:
    Tier 1  element_reference  section heading / claim text matches RFI keywords
    Tier 2  part match         same approved_document_part as the RFI
    Tier 3  related parts      structurally related AD parts (e.g. A↔K, B↔C)

  Each retrieved claim is classified as:
    supporting     — corroborates the design intent (ICJ overall == PASS, or
                     no ICJ assessment available)
    contradicting  — conflicts with the design intent (ICJ overall == GAP)

INPUTS
------
  rfi_text          str       BSR RFI verbatim text
  document_claims   list[dict]
      file_reference, page_number, section_heading, raw_text,
      approved_document_part
  icj_assessments   list[dict]
      Output rows from icj_checker.run_icj_check() — each carries claim_id,
      overall, identify_note, clarify_note, justify_note
  annex4a           dict
      Output from annex4a_generator.generate_annex4a_from_json()

OUTPUTS
-------
  dict  {
    "identified_parts":      [{"part": str, "rationale": str}],
    "supporting_claims":     [DocumentClaim],
    "contradicting_claims":  [DocumentClaim],
    "draft_response": {
      "identify": str,
      "clarify":  str,
      "justify":  str,
      "flags":    [str]
    },
    "annex4a_updates": [{
      "file_reference": str,
      "file_title":     str,
      "status":         "REVISED" | "NEW",
      "rfi_reference":  str
    }]
  }
"""

from __future__ import annotations

import json
import re
import sys
from typing import Optional

import anthropic


# ─────────────────────────────────────────────────────────────────────────────
# LLM configuration
# ─────────────────────────────────────────────────────────────────────────────

# Classification: haiku — fast, structured JSON
_CLASSIFY_MODEL = "claude-haiku-4-5-20251001"
# Draft generation: sonnet — richer prose, cited narrative
_DRAFT_MODEL = "claude-sonnet-4-6"

_MAX_TEXT_CHARS = 2_000   # per claim truncation before LLM
_MAX_CLAIMS_PER_TIER = 5  # cap per tier to stay within prompt budget


# ─────────────────────────────────────────────────────────────────────────────
# Related parts map — used for Tier 3 retrieval
# Structural adjacencies derived from Building Regulations Schedule 1
# ─────────────────────────────────────────────────────────────────────────────

_RELATED_PARTS: dict[str, list[str]] = {
    "A":  ["B", "C", "K"],          # structure ↔ fire, waterproofing, falling
    "B":  ["A", "C", "F1", "F2"],   # fire ↔ structure, moisture, ventilation
    "C":  ["A", "B", "H"],          # site/moisture ↔ structure, fire, drainage
    "D":  ["C"],                     # toxic ↔ site prep
    "E":  ["A"],                     # sound ↔ structure
    "F1": ["B", "G"],                # ventilation ↔ fire, sanitation
    "F2": ["B", "G"],
    "G":  ["F1", "F2", "H"],        # sanitation ↔ ventilation, drainage
    "H":  ["C", "G", "J"],          # drainage ↔ site, sanitation, combustion
    "J":  ["H", "B"],               # combustion ↔ drainage, fire
    "K":  ["A", "M"],               # falling ↔ structure, access
    "L":  ["F1", "F2", "O"],        # energy ↔ ventilation, overheating
    "M":  ["K", "T"],               # access ↔ falling, toilets
    "N":  ["E"],                     # noise ↔ sound
    "O":  ["L", "F1", "F2"],        # overheating ↔ energy, ventilation
    "P":  ["S"],                     # electrical ↔ EV charging
    "Q":  ["M", "K"],               # security ↔ access, falling
    "R":  ["S"],                     # comms ↔ EV charging
    "S":  ["R", "P"],               # EV ↔ comms, electrical
    "T":  ["M", "G"],               # toilets ↔ access, sanitation
}


# ─────────────────────────────────────────────────────────────────────────────
# Keyword helpers
# ─────────────────────────────────────────────────────────────────────────────

_STOPWORDS = frozenset({
    "a", "an", "the", "and", "or", "of", "to", "in", "for", "on", "with",
    "is", "are", "be", "has", "have", "by", "from", "at", "how", "not",
    "no", "its", "this", "that", "as", "etc", "eg", "ie", "vs", "any",
    "all", "both", "each", "such", "than", "into", "upon", "also", "were",
    "which", "where", "would", "could", "should", "their", "been", "will",
    "what", "when", "please", "provide", "confirm", "clarify", "demonstrate",
})


def _keywords(text: str, min_len: int = 4) -> list[str]:
    tokens = re.findall(r"[a-zA-Z]{%d,}" % min_len, text.lower())
    return [t for t in tokens if t not in _STOPWORDS]


def _overlap_score(query_kws: list[str], candidate: str) -> int:
    c = candidate.lower()
    return sum(1 for kw in query_kws if kw in c)


# ─────────────────────────────────────────────────────────────────────────────
# RFI reference label — short identifier derived from RFI text
# ─────────────────────────────────────────────────────────────────────────────

def _rfi_label(rfi_text: str) -> str:
    """First 60 printable characters, stripped to word boundary."""
    clean = re.sub(r"\s+", " ", rfi_text.strip())
    label = clean[:60]
    if len(clean) > 60:
        label = label.rsplit(" ", 1)[0] + "…"
    return label


# ─────────────────────────────────────────────────────────────────────────────
# Call 1 — RFI classification
# ─────────────────────────────────────────────────────────────────────────────

_CLASSIFY_SYSTEM = (
    "You are a BSR compliance analyst. Given a Request for Information (RFI) "
    "from the Building Safety Regulator, identify which Approved Document parts "
    "of Building Regulations Schedule 1 it relates to. "
    "Respond ONLY with valid JSON: "
    "{\"parts\": [{\"part\": \"<letter>\", \"rationale\": \"<one sentence>\"}]}. "
    "Use the single letter code for each part (A, B, C, D, E, F1, F2, G, H, J, "
    "K, L, M, N, O, P, Q, R, S, T). Include only parts directly referenced or "
    "clearly implied. Do not include parts that are not relevant."
)

_CLASSIFY_PROMPT = (
    "Identify the Approved Document parts addressed by this BSR RFI:\n\n{rfi_text}"
)


def _classify_rfi(
    rfi_text: str,
    client: anthropic.Anthropic,
) -> list[dict]:
    """
    Call 1: classify the RFI against the AD taxonomy.
    Returns list of {"part": str, "rationale": str}.
    Falls back to empty list on error.
    """
    try:
        msg = client.messages.create(
            model=_CLASSIFY_MODEL,
            max_tokens=256,
            system=_CLASSIFY_SYSTEM,
            messages=[{
                "role": "user",
                "content": _CLASSIFY_PROMPT.format(rfi_text=rfi_text[:2000]),
            }],
        )
        raw = msg.content[0].text if msg.content else ""
        clean = re.sub(r"```(?:json)?|```", "", raw).strip()
        data = json.loads(clean)
        parts = data.get("parts", [])
        if isinstance(parts, list):
            return [p for p in parts if isinstance(p, dict) and "part" in p]
    except (anthropic.APIError, json.JSONDecodeError, AttributeError, KeyError):
        pass
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Three-tier retrieval
# ─────────────────────────────────────────────────────────────────────────────

def _retrieve_claims(
    rfi_text: str,
    identified_parts: list[dict],
    document_claims: list[dict],
    icj_index: dict[str, dict],
) -> tuple[list[dict], list[dict]]:
    """
    Retrieve and split claims into (supporting, contradicting).

    Tier 1 — element_reference: section_heading + raw_text keyword overlap
              with RFI keywords (highest relevance)
    Tier 2 — same approved_document_part as any identified_parts
    Tier 3 — related_parts of each identified part

    supporting    = ICJ overall PASS (or no ICJ record) for this claim
    contradicting = ICJ overall GAP for this claim
    """
    rfi_kws = _keywords(rfi_text)
    part_letters = {p["part"] for p in identified_parts}

    related: set[str] = set()
    for pl in part_letters:
        related.update(_RELATED_PARTS.get(pl, []))
    related -= part_letters  # Tier 3 = related minus Tier 2

    seen_refs: set[str] = set()
    tier1: list[tuple[int, dict]] = []
    tier2: list[dict] = []
    tier3: list[dict] = []

    for claim in document_claims:
        part = claim.get("approved_document_part", "")
        # Build a composite text for scoring
        composite = " ".join([
            claim.get("section_heading", ""),
            claim.get("raw_text", "")[:500],
        ])
        score = _overlap_score(rfi_kws, composite)

        ref_key = (
            claim.get("file_reference", "")
            + "|" + str(claim.get("page_number", ""))
            + "|" + claim.get("section_heading", "")
        )

        if ref_key in seen_refs:
            continue

        # Tier 1: strong keyword match regardless of part
        if score >= max(2, int(len(rfi_kws) * 0.2)):
            tier1.append((score, claim))
            seen_refs.add(ref_key)
        elif part in part_letters:
            tier2.append(claim)
            seen_refs.add(ref_key)
        elif part in related:
            tier3.append(claim)
            seen_refs.add(ref_key)

    # Sort Tier 1 by score descending, then cap each tier
    tier1_claims = [c for _, c in sorted(tier1, key=lambda x: -x[0])][:_MAX_CLAIMS_PER_TIER]
    tier2_claims = tier2[:_MAX_CLAIMS_PER_TIER]
    tier3_claims = tier3[:_MAX_CLAIMS_PER_TIER]

    all_retrieved = tier1_claims + [
        c for c in tier2_claims if c not in tier1_claims
    ] + [
        c for c in tier3_claims if c not in tier1_claims and c not in tier2_claims
    ]

    # Split: supporting vs contradicting
    supporting: list[dict] = []
    contradicting: list[dict] = []

    for claim in all_retrieved:
        claim_id = _derive_claim_id(claim)
        icj = icj_index.get(claim_id)
        if icj and icj.get("overall") == "GAP":
            contradicting.append(claim)
        else:
            supporting.append(claim)

    return supporting, contradicting


def _derive_claim_id(claim: dict) -> str:
    """Reproduce the claim_id logic from icj_checker._make_claim_id."""
    ref = claim.get("file_reference", "")
    page = str(claim.get("page_number", ""))
    section = re.sub(r"\s+", "_", claim.get("section_heading", ""))[:20]
    base = f"{ref}_p{page}_{section}" if section else f"{ref}_p{page}"
    return base if base.strip("_p") else ""


# ─────────────────────────────────────────────────────────────────────────────
# Call 2 — ICJ-structured draft generation
# ─────────────────────────────────────────────────────────────────────────────

_DRAFT_SYSTEM = (
    "You are a principal designer preparing a formal BSR Gateway 2 RFI response. "
    "Your response must follow the ICJ framework: Identify, Clarify, Justify. "
    "Every factual claim must cite its source document by file_reference, "
    "page_number, and section_heading. Do not invent information not present "
    "in the supplied claims. "
    "Respond ONLY with valid JSON matching this schema exactly: "
    "{"
    "\"identify\": \"<paragraph>\", "
    "\"clarify\": \"<paragraph>\", "
    "\"justify\": \"<paragraph>\", "
    "\"flags\": [\"<issue string>\", ...]"
    "}. "
    "flags must list every contradicting claim as an issue the applicant must "
    "resolve before submission, each citing file_reference and page_number."
)

_DRAFT_PROMPT = (
    "Draft an ICJ-structured response to the following BSR RFI.\n\n"
    "Identify: name the design element and Approved Document requirement it "
    "addresses.\n"
    "Clarify: state the specific standard or code used and the reason it was "
    "chosen.\n"
    "Justify: write a narrative linking the design decision to the functional "
    "requirement, referencing labelled drawings, plans, or calculations.\n"
    "Use only the supporting claims below. "
    "Flag each contradicting claim as an issue the applicant must resolve.\n\n"
    "RFI:\n{rfi_text}\n\n"
    "Supporting claims:\n{supporting}\n\n"
    "Contradicting claims:\n{contradicting}"
)


def _format_claims_for_prompt(claims: list[dict]) -> str:
    """Serialise retrieved claims into a compact prompt-safe string."""
    if not claims:
        return "(none)"
    lines = []
    for c in claims:
        ref = c.get("file_reference", "?")
        page = c.get("page_number", "?")
        heading = c.get("section_heading", "")
        text = c.get("raw_text", "")[:_MAX_TEXT_CHARS]
        citation = f"[{ref}, p.{page}, §{heading}]" if heading else f"[{ref}, p.{page}]"
        lines.append(f"{citation} {text}")
    return "\n\n".join(lines)


def _generate_draft(
    rfi_text: str,
    supporting: list[dict],
    contradicting: list[dict],
    client: anthropic.Anthropic,
) -> dict:
    """
    Call 2: generate the ICJ-structured draft response.
    Returns {"identify": str, "clarify": str, "justify": str, "flags": [str]}.
    Falls back to error-flagged stub on API failure.
    """
    prompt = _DRAFT_PROMPT.format(
        rfi_text=rfi_text[:1500],
        supporting=_format_claims_for_prompt(supporting),
        contradicting=_format_claims_for_prompt(contradicting),
    )

    try:
        msg = client.messages.create(
            model=_DRAFT_MODEL,
            max_tokens=1024,
            system=_DRAFT_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text if msg.content else ""
        clean = re.sub(r"```(?:json)?|```", "", raw).strip()
        data = json.loads(clean)
        return {
            "identify": str(data.get("identify", "")),
            "clarify":  str(data.get("clarify", "")),
            "justify":  str(data.get("justify", "")),
            "flags":    [str(f) for f in data.get("flags", [])],
        }
    except (anthropic.APIError, json.JSONDecodeError, AttributeError, KeyError) as exc:
        return {
            "identify": "",
            "clarify":  "",
            "justify":  "",
            "flags":    [f"Draft generation error: {exc}"],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Annex 4A update proposals
# ─────────────────────────────────────────────────────────────────────────────

def _propose_annex4a_updates(
    supporting: list[dict],
    contradicting: list[dict],
    annex4a: dict,
    rfi_label: str,
) -> list[dict]:
    """
    Compare retrieved claims against the Annex 4A schedule to propose:
      REVISED — file exists in the schedule but has a contradicting ICJ gap
                 (the applicant must revise it to address the RFI)
      NEW      — file referenced in the claims but absent from the schedule
                 (a new document may be needed)
    """
    schedule: list[dict] = annex4a.get("schedule", [])
    schedule_refs: set[str] = {
        r.get("file_reference", "") for r in schedule if not r.get("flag_missing")
    }
    schedule_by_ref: dict[str, dict] = {
        r.get("file_reference", ""): r
        for r in schedule
        if not r.get("flag_missing")
    }

    updates: list[dict] = []
    seen: set[str] = set()

    # REVISED — contradicting claims are in the schedule but need updating
    for claim in contradicting:
        ref = claim.get("file_reference", "")
        if ref in seen:
            continue
        seen.add(ref)
        row = schedule_by_ref.get(ref)
        updates.append({
            "file_reference": ref,
            "file_title": row["file_title"] if row else claim.get("section_heading", ""),
            "status": "REVISED",
            "rfi_reference": rfi_label,
        })

    # NEW — supporting claims whose file_reference is not in the schedule
    for claim in supporting:
        ref = claim.get("file_reference", "")
        if ref in seen or ref in schedule_refs:
            continue
        seen.add(ref)
        updates.append({
            "file_reference": ref,
            "file_title": claim.get("section_heading", ""),
            "status": "NEW",
            "rfi_reference": rfi_label,
        })

    return updates


# ─────────────────────────────────────────────────────────────────────────────
# Core engine
# ─────────────────────────────────────────────────────────────────────────────

def generate_rfi_response(
    rfi_text: str,
    document_claims: list[dict],
    icj_assessments: list[dict],
    annex4a: dict,
    client: Optional[anthropic.Anthropic] = None,
) -> dict:
    """
    Generate an ICJ-structured RFI response.

    Parameters
    ----------
    rfi_text : str
        Verbatim BSR Request for Information text.

    document_claims : list[dict]
        DocumentClaim dicts from the claim extraction pipeline.

    icj_assessments : list[dict]
        Output from icj_checker.run_icj_check() — used to classify claims as
        supporting or contradicting.

    annex4a : dict
        Output from annex4a_generator.generate_annex4a_from_json().

    client : anthropic.Anthropic, optional
        Pre-constructed client. Created from ANTHROPIC_API_KEY if omitted.

    Returns
    -------
    dict  (see module docstring for full schema)
    """
    if client is None:
        client = anthropic.Anthropic()

    # Index ICJ assessments by claim_id for O(1) lookup
    icj_index: dict[str, dict] = {
        a["claim_id"]: a for a in icj_assessments if "claim_id" in a
    }

    rfi_label = _rfi_label(rfi_text)

    # ── Call 1: classify RFI ────────────────────────────────────────────────
    identified_parts = _classify_rfi(rfi_text, client)

    # ── Retrieval ───────────────────────────────────────────────────────────
    supporting, contradicting = _retrieve_claims(
        rfi_text=rfi_text,
        identified_parts=identified_parts,
        document_claims=document_claims,
        icj_index=icj_index,
    )

    # ── Call 2: draft generation ────────────────────────────────────────────
    draft_response = _generate_draft(rfi_text, supporting, contradicting, client)

    # ── Annex 4A update proposals ───────────────────────────────────────────
    annex4a_updates = _propose_annex4a_updates(
        supporting, contradicting, annex4a, rfi_label
    )

    return {
        "identified_parts":     identified_parts,
        "supporting_claims":    supporting,
        "contradicting_claims": contradicting,
        "draft_response":       draft_response,
        "annex4a_updates":      annex4a_updates,
    }


# ─────────────────────────────────────────────────────────────────────────────
# JSON entry point
# ─────────────────────────────────────────────────────────────────────────────

def generate_rfi_response_from_json(
    json_input: str,
    client: Optional[anthropic.Anthropic] = None,
) -> dict:
    """
    JSON entry point. Accepts:
      {
        "rfi_text":         str,
        "document_claims":  [...],
        "icj_assessments":  [...],
        "annex4a":          {...}
      }

    Returns the full response dict, or {"error": "..."} on bad input.
    """
    try:
        data = json.loads(json_input)
    except json.JSONDecodeError as exc:
        return {"error": f"Invalid JSON: {exc}"}

    if not isinstance(data, dict):
        return {"error": "Input must be a JSON object."}

    rfi_text = data.get("rfi_text", "")
    if not rfi_text:
        return {"error": "'rfi_text' is required."}

    return generate_rfi_response(
        rfi_text=rfi_text,
        document_claims=data.get("document_claims") or [],
        icj_assessments=data.get("icj_assessments") or [],
        annex4a=data.get("annex4a") or {},
        client=client,
    )


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    result = generate_rfi_response_from_json(raw)
    print(json.dumps(result, indent=2))
