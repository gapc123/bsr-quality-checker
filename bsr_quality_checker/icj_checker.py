"""
icj_checker.py  —  BSR Quality Checker  |  Layer 5
====================================================
ICJ (Identify / Clarify / Justify) Analysis Engine.

Checks each submitted design claim against the three-part standard the BSR
uses to assess whether an application adequately demonstrates compliance:

  Identify  — Does the text name the Building Regulations part or functional
              requirement it addresses, or only imply compliance?

  Clarify   — Does the text state a specific code, standard, or named
              approach, and give a reason why it was chosen?

  Justify   — Does the text contain a narrative linking the design decision
              to a functional requirement, with at least one reference to a
              labelled drawing, plan, or calculation?

Source: CLC Guidance Note 04, §1.3 (p.12) — ICJ framework.

INPUTS
------
  claims : list[dict]
      Each claim carries:
        file_reference          str   e.g. "2.1.2"
        page_number             str   e.g. "7" or "7–8"
        section_heading         str   e.g. "4.2 Wind Loading"
        raw_text                str   the passage to assess
        approved_document_part  str   e.g. "A"

      Optional (ignored if absent):
        claim_id                str   caller-assigned identifier; generated
                                      if omitted

OUTPUTS
-------
  dict  {
    "assessments": [IcjAssessment, ...],
    "summary": {
      "total_claims": int,
      "gaps": int,
      "identify_failures": int,
      "clarify_failures": int,
      "justify_failures": int
    }
  }

  IcjAssessment:
    claim_id               str
    file_reference         str
    page_number            str
    section_heading        str
    approved_document_part str
    identify               "PASS" | "WEAK" | "FAIL"
    clarify                "PASS" | "WEAK" | "FAIL"
    justify                "PASS" | "WEAK" | "FAIL"
    identify_note          str
    clarify_note           str    — passed to Layer 6 as RFI draft basis
    justify_note           str    — passed to Layer 6 as RFI draft basis
    overall                "PASS" | "GAP"

Note on identify_note / clarify_note / justify_note:
    PASS notes describe what evidence was found.
    WEAK / FAIL notes describe what is missing — these become the actionable
    text for Layer 6 RFI response drafts.
"""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Optional

import anthropic


# ─────────────────────────────────────────────────────────────────────────────
# LLM configuration
# ─────────────────────────────────────────────────────────────────────────────

# haiku-4-5 for speed and cost efficiency — 3 calls per claim
DEFAULT_MODEL = "claude-haiku-4-5-20251001"

# Hard character limit on raw_text sent to the LLM per claim
_MAX_TEXT_CHARS = 3_000


# ─────────────────────────────────────────────────────────────────────────────
# Prompt templates (verbatim from the Layer 5 specification)
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM = (
    "You are a Building Safety Regulator (BSR) compliance analyst assessing "
    "design claims in a Gateway 2 application for a Higher-Risk Building. "
    "Your assessments are used directly in a professional compliance report. "
    "Respond ONLY with a valid JSON object containing exactly two keys: "
    "'verdict' (one of PASS, WEAK, or FAIL) and 'reason' (one sentence, "
    "max 40 words). Do not include any other text."
)

_IDENTIFY_PROMPT = (
    "Does the following text explicitly name the Building Regulations part or "
    "functional requirement it is addressing, or does it only imply compliance? "
    "Text: {raw_text}. "
    "Return: verdict (PASS / WEAK / FAIL) and a one-sentence reason. "
    "PASS = explicitly names the relevant part or requirement. "
    "WEAK = implies compliance but does not name the specific part or requirement. "
    "FAIL = no reference to any Building Regulations requirement."
)

_CLARIFY_PROMPT = (
    "Does the following text state a specific code, standard, or named approach "
    "(e.g. BS EN, Eurocode, CIBSE Guide, BRE guidance), and give a reason why "
    "it was chosen? "
    "Text: {raw_text}. "
    "Return: verdict (PASS / WEAK / FAIL) and a one-sentence reason. "
    "PASS = names a specific code or standard and explains why it applies. "
    "WEAK = references a standard by name but gives no reason for selection, "
    "or gives a reason but names no standard. "
    "FAIL = no specific code, standard, or justification for approach."
)

_JUSTIFY_PROMPT = (
    "Does the following text contain a narrative linking the design decision to "
    "a functional requirement, with at least one reference to a labelled drawing, "
    "plan, or calculation? "
    "Text: {raw_text}. "
    "Return: verdict (PASS / WEAK / FAIL) and a one-sentence reason. "
    "PASS = narrative present AND at least one reference to a labelled drawing, "
    "plan, or calculation. "
    "WEAK = narrative present but no reference to drawings/calculations, OR "
    "references present but no linking narrative. "
    "FAIL = neither a compliance narrative nor references to supporting documents."
)


# ─────────────────────────────────────────────────────────────────────────────
# LLM response parser
# ─────────────────────────────────────────────────────────────────────────────

_VALID_VERDICTS = frozenset({"PASS", "WEAK", "FAIL"})


def _parse_verdict_response(raw: str) -> tuple[str, str]:
    """
    Parse the LLM response into (verdict, reason).
    Accepts clean JSON or JSON embedded in prose.
    Falls back to regex extraction on malformed output.
    Returns ("FAIL", "<parse error note>") as a safe default.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    # Try direct JSON parse
    try:
        obj = json.loads(cleaned)
        verdict = str(obj.get("verdict", "")).strip().upper()
        reason = str(obj.get("reason", "")).strip()
        if verdict in _VALID_VERDICTS:
            return verdict, reason
    except (json.JSONDecodeError, AttributeError):
        pass

    # Regex fallback: look for verdict keyword
    verdict_match = re.search(r"\b(PASS|WEAK|FAIL)\b", raw, re.IGNORECASE)
    if verdict_match:
        verdict = verdict_match.group(1).upper()
        # Take the remainder of the string after the verdict as the reason
        after = raw[verdict_match.end():].strip().lstrip(":–-—").strip()
        reason = after[:200] if after else "No reason provided."
        return verdict, reason

    return "FAIL", f"Could not parse LLM response: {raw[:120]}"


# ─────────────────────────────────────────────────────────────────────────────
# Single-dimension LLM call
# ─────────────────────────────────────────────────────────────────────────────

def _call_llm(
    client: anthropic.Anthropic,
    prompt_template: str,
    raw_text: str,
    model: str,
) -> tuple[str, str]:
    """
    Run one ICJ dimension call. Returns (verdict, reason).
    On API error, returns ("FAIL", "<error message>") so the run continues.
    """
    truncated = raw_text[:_MAX_TEXT_CHARS]
    prompt = prompt_template.format(raw_text=truncated)

    try:
        message = client.messages.create(
            model=model,
            max_tokens=128,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text if message.content else ""
        return _parse_verdict_response(response_text)
    except anthropic.APIError as exc:
        return "FAIL", f"LLM API error: {exc}"


# ─────────────────────────────────────────────────────────────────────────────
# Claim ID generator
# ─────────────────────────────────────────────────────────────────────────────

def _make_claim_id(claim: dict, index: int) -> str:
    ref = claim.get("file_reference", "")
    page = str(claim.get("page_number", ""))
    section = re.sub(r"\s+", "_", claim.get("section_heading", ""))[:20]
    base = f"{ref}_p{page}_{section}" if section else f"{ref}_p{page}"
    return base if base.strip("_p") else f"claim_{index:04d}"


# ─────────────────────────────────────────────────────────────────────────────
# Core engine
# ─────────────────────────────────────────────────────────────────────────────

def run_icj_check(
    claims: list[dict],
    model: str = DEFAULT_MODEL,
    client: Optional[anthropic.Anthropic] = None,
) -> dict:
    """
    Run the ICJ check across all claims.

    Parameters
    ----------
    claims : list[dict]
        DocumentClaim dicts — see module docstring for required fields.

    model : str
        Anthropic model ID. Defaults to claude-haiku-4-5-20251001.

    client : anthropic.Anthropic, optional
        Pre-constructed Anthropic client. If omitted, one is created from
        the ANTHROPIC_API_KEY environment variable.

    Returns
    -------
    dict  { "assessments": [...], "summary": {...} }
    """
    if client is None:
        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

    assessments: list[dict] = []

    for i, claim in enumerate(claims):
        claim_id = claim.get("claim_id") or _make_claim_id(claim, i)
        raw_text = claim.get("raw_text", "")

        if not raw_text.strip():
            # Nothing to assess — mark all dimensions as FAIL
            assessments.append({
                "claim_id": claim_id,
                "file_reference": claim.get("file_reference", ""),
                "page_number": str(claim.get("page_number", "")),
                "section_heading": claim.get("section_heading", ""),
                "approved_document_part": claim.get("approved_document_part", ""),
                "identify": "FAIL",
                "clarify": "FAIL",
                "justify": "FAIL",
                "identify_note": "No text provided for assessment.",
                "clarify_note": "No text provided for assessment.",
                "justify_note": "No text provided for assessment.",
                "overall": "GAP",
            })
            continue

        # ── Three sequential LLM calls ──────────────────────────────────────
        id_verdict, id_note = _call_llm(client, _IDENTIFY_PROMPT, raw_text, model)
        cl_verdict, cl_note = _call_llm(client, _CLARIFY_PROMPT, raw_text, model)
        ju_verdict, ju_note = _call_llm(client, _JUSTIFY_PROMPT, raw_text, model)

        overall = (
            "PASS"
            if id_verdict == "PASS" and cl_verdict == "PASS" and ju_verdict == "PASS"
            else "GAP"
        )

        assessments.append({
            "claim_id": claim_id,
            "file_reference": claim.get("file_reference", ""),
            "page_number": str(claim.get("page_number", "")),
            "section_heading": claim.get("section_heading", ""),
            "approved_document_part": claim.get("approved_document_part", ""),
            "identify": id_verdict,
            "clarify": cl_verdict,
            "justify": ju_verdict,
            "identify_note": id_note,
            "clarify_note": cl_note,
            "justify_note": ju_note,
            "overall": overall,
        })

    # ── Summary ──────────────────────────────────────────────────────────────
    gaps = sum(1 for a in assessments if a["overall"] == "GAP")
    identify_failures = sum(1 for a in assessments if a["identify"] in ("WEAK", "FAIL"))
    clarify_failures  = sum(1 for a in assessments if a["clarify"]  in ("WEAK", "FAIL"))
    justify_failures  = sum(1 for a in assessments if a["justify"]  in ("WEAK", "FAIL"))

    summary = {
        "total_claims":       len(assessments),
        "gaps":               gaps,
        "identify_failures":  identify_failures,
        "clarify_failures":   clarify_failures,
        "justify_failures":   justify_failures,
    }

    return {
        "assessments": assessments,
        "summary": summary,
    }


# ─────────────────────────────────────────────────────────────────────────────
# JSON entry point — mirrors annex4a_generator / completeness_check interface
# ─────────────────────────────────────────────────────────────────────────────

def run_icj_check_from_json(
    json_input: str,
    model: str = DEFAULT_MODEL,
    client: Optional[anthropic.Anthropic] = None,
) -> dict:
    """
    JSON entry point for the BSR Quality Checker.

    Accepts a JSON string:
      [ {claim}, {claim}, ... ]
    or a wrapped object:
      { "claims": [ {claim}, ... ], "model": "..." }

    Returns { "assessments": [...], "summary": {...} }
    On parse error, returns { "error": "..." }
    """
    try:
        data = json.loads(json_input)
    except json.JSONDecodeError as exc:
        return {"error": f"Invalid JSON: {exc}"}

    if isinstance(data, list):
        claims = data
    elif isinstance(data, dict):
        claims = data.get("claims", [])
        model = data.get("model", model)
    else:
        return {"error": "Input must be a JSON array of claims or an object with a 'claims' key."}

    if not isinstance(claims, list):
        return {"error": "'claims' must be a JSON array."}

    return run_icj_check(claims, model=model, client=client)


# ─────────────────────────────────────────────────────────────────────────────
# CLI (standalone test / subprocess mode)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    result = run_icj_check_from_json(raw)
    print(json.dumps(result, indent=2))
