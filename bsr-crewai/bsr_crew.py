"""
BSR Specialist Review Crew
Runs after the existing matrix assessment to produce domain-specific expert narratives.

Agents:
  1. Fire Safety Agent     → FIRE_SAFETY + VENTILATION checks
  2. Documentation Agent   → PACK_COMPLETENESS + GOLDEN_THREAD + TRACEABILITY
  3. Regulatory Agent      → HRB_DUTIES + LONDON_SPECIFIC
  4. Quality Agent         → CONSISTENCY checks
  5. Lead Reviewer         → Synthesises all domain findings into a final summary

Input:  { context, results: list[AssessmentResult] }
Output: { domain_reviews: { fire_safety, documentation, regulatory, quality, synthesis } }
"""

import os
import json
from typing import Any
from crewai import Agent, Task, Crew, Process
from crewai.llm import LLM


def build_bsr_crew(context: dict, results: list[dict]) -> dict:
    """
    Run the BSR specialist crew on a set of assessment results.
    Returns domain-specific narratives keyed by domain.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    model = LLM(model="claude-sonnet-4-20250514", api_key=anthropic_key)

    # ── Bucket results by domain ──────────────────────────────────────────────
    def bucket(categories: list[str]) -> list[dict]:
        return [r for r in results if r.get("category") in categories]

    fire_results        = bucket(["FIRE_SAFETY", "VENTILATION"])
    docs_results        = bucket(["PACK_COMPLETENESS", "GOLDEN_THREAD", "TRACEABILITY"])
    regulatory_results  = bucket(["HRB_DUTIES", "LONDON_SPECIFIC"])
    quality_results     = bucket(["CONSISTENCY"])

    building_desc = (
        f"{'Higher-Risk Building (HRB)' if context.get('isHRB') else 'Standard building'}, "
        f"{'London' if context.get('isLondon') else 'outside London'}, "
        f"{context.get('buildingType', 'residential')}"
    )

    def summarise(domain_results: list[dict]) -> str:
        if not domain_results:
            return "No checks in this domain."
        lines = []
        for r in domain_results:
            status = r.get("status", "not_assessed")
            title  = r.get("matrix_title", r.get("matrix_id", "?"))
            reason = r.get("reasoning", "")[:200]
            lines.append(f"- [{status.upper()}] {title}: {reason}")
        return "\n".join(lines)

    # ── Agents ────────────────────────────────────────────────────────────────
    fire_agent = Agent(
        role="Fire Safety Engineer",
        goal=(
            "Review fire safety and ventilation compliance findings for a BSR gateway "
            "application and produce a concise professional assessment."
        ),
        backstory=(
            "You are a Chartered Fire Engineer with 20 years of experience in UK high-rise "
            "residential buildings. You specialise in BSR Gateway 2 applications and are "
            "expert in Approved Document B, BS 9991, and the Building Safety Act 2022. "
            "You write direct, technical assessments with clear remediation priorities."
        ),
        llm=model,
        verbose=False,
    )

    docs_agent = Agent(
        role="Documentation & Golden Thread Specialist",
        goal=(
            "Review pack completeness, golden thread, and traceability findings and identify "
            "the specific documents missing or incomplete."
        ),
        backstory=(
            "You are a Principal Designer with deep expertise in BSR documentation requirements "
            "under the Building Safety Act 2022. You have prepared and reviewed dozens of "
            "Gateway 2 application packs. You know exactly which documents are mandatory, "
            "what they must contain, and how missing information causes rejection."
        ),
        llm=model,
        verbose=False,
    )

    regulatory_agent = Agent(
        role="HRB Regulatory Compliance Specialist",
        goal=(
            "Review Higher-Risk Building duties and London-specific compliance findings, "
            "focusing on statutory obligations and regulator expectations."
        ),
        backstory=(
            "You are a Building Regulations consultant who has worked directly with the "
            "Building Safety Regulator. You understand HRB dutyholders' legal responsibilities, "
            "Regulation 38, golden thread obligations, and the London Plan D12 requirements. "
            "You write in plain English for housing association directors and legal teams."
        ),
        llm=model,
        verbose=False,
    )

    quality_agent = Agent(
        role="Technical Consistency Reviewer",
        goal=(
            "Review consistency findings across the application pack and identify "
            "contradictions, version mismatches, or cross-document conflicts."
        ),
        backstory=(
            "You are a technical auditor specialising in construction documentation quality. "
            "You spot inconsistencies that cause BSR rejection — mismatched floor counts, "
            "conflicting height figures, version discrepancies between drawings and reports. "
            "You write concise, specific findings that tell the team exactly what to fix."
        ),
        llm=model,
        verbose=False,
    )

    lead_reviewer = Agent(
        role="Lead BSR Assessment Reviewer",
        goal=(
            "Synthesise all specialist findings into a single executive summary with a "
            "clear overall verdict and prioritised action list."
        ),
        backstory=(
            "You are a senior consultant who coordinates BSR Gateway 2 applications for "
            "major housing associations. You have successfully submitted applications for "
            "Peabody, L&Q, and Clarion. You translate technical findings into clear "
            "executive summaries that help boards make decisions. You prioritise ruthlessly "
            "and distinguish between submission-blocking issues and nice-to-haves."
        ),
        llm=model,
        verbose=False,
    )

    # ── Tasks ─────────────────────────────────────────────────────────────────
    fire_task = Task(
        description=f"""
Building: {building_desc}

Review these fire safety and ventilation compliance findings:
{summarise(fire_results)}

Write a professional fire engineer's assessment (200-300 words) covering:
1. Overall fire safety compliance status
2. The most critical fire safety issues and why they would cause rejection
3. Specific remediation steps in order of priority
4. Any patterns or systemic issues in the fire safety documentation

Be technical and specific. Reference Approved Document B, BS 9991, or other standards where relevant.
""",
        expected_output=(
            "A 200-300 word professional fire safety domain assessment with prioritised "
            "findings and specific remediation steps."
        ),
        agent=fire_agent,
    )

    docs_task = Task(
        description=f"""
Building: {building_desc}

Review these documentation, golden thread, and traceability findings:
{summarise(docs_results)}

Write a documentation specialist's assessment (200-300 words) covering:
1. Which mandatory documents are missing or incomplete
2. Golden thread and traceability gaps that must be resolved
3. The sequence in which documents should be obtained or completed
4. Impact of missing documentation on the BSR application timeline

""",
        expected_output=(
            "A 200-300 word documentation domain assessment listing missing/incomplete "
            "documents and a prioritised completion sequence."
        ),
        agent=docs_agent,
    )

    regulatory_task = Task(
        description=f"""
Building: {building_desc}

Review these HRB duties and London-specific compliance findings:
{summarise(regulatory_results)}

Write a regulatory compliance assessment (150-200 words) covering:
1. Dutyholder obligation gaps (Accountable Person, Principal Designer, Principal Contractor)
2. Any London Plan / GLA-specific requirements that are unmet
3. Statutory risk — which gaps could constitute a legal breach
4. What the dutyholders need to do before submission

""",
        expected_output=(
            "A 150-200 word regulatory compliance assessment covering dutyholder obligations "
            "and London-specific requirements."
        ),
        agent=regulatory_agent,
    )

    quality_task = Task(
        description=f"""
Building: {building_desc}

Review these consistency findings:
{summarise(quality_results)}

Write a concise quality review (100-150 words) covering:
1. Specific contradictions found across documents
2. Which documents need to be reconciled and how
3. Whether any inconsistencies suggest a deeper coordination problem

""",
        expected_output=(
            "A 100-150 word quality review identifying specific inconsistencies "
            "and what needs to be reconciled."
        ),
        agent=quality_agent,
    )

    synthesis_task = Task(
        description=f"""
You have received specialist reviews from a Fire Safety Engineer, Documentation Specialist,
Regulatory Compliance Specialist, and Quality Reviewer.

Building: {building_desc}
Total checks: {len(results)}
Failed/partial: {sum(1 for r in results if r.get('status') in ('does_not_meet', 'partial'))}
Passing: {sum(1 for r in results if r.get('status') == 'meets')}

Using the domain expert reports provided, write an executive summary (250-350 words) for
the housing association's board and project team that includes:

1. **Verdict**: Is this application ready to submit? (Ready / Needs Work / Not Ready)
2. **Top 3 blockers** that must be resolved before submission
3. **Quick wins** — issues that can be resolved in under a week
4. **Estimated timeline** to get the application submission-ready
5. **Recommended immediate next steps** — who needs to be called today

Write in plain English. Be direct and actionable. Avoid jargon where possible.
""",
        expected_output=(
            "A 250-350 word executive summary with verdict, top blockers, quick wins, "
            "timeline estimate, and immediate next steps."
        ),
        agent=lead_reviewer,
        context=[fire_task, docs_task, regulatory_task, quality_task],
    )

    # ── Crew ──────────────────────────────────────────────────────────────────
    crew = Crew(
        agents=[fire_agent, docs_agent, regulatory_agent, quality_agent, lead_reviewer],
        tasks=[fire_task, docs_task, regulatory_task, quality_task, synthesis_task],
        process=Process.sequential,
        verbose=False,
    )

    crew_result = crew.kickoff()

    # Extract outputs from each task
    return {
        "fire_safety":   fire_task.output.raw    if fire_task.output    else "",
        "documentation": docs_task.output.raw    if docs_task.output    else "",
        "regulatory":    regulatory_task.output.raw if regulatory_task.output else "",
        "quality":       quality_task.output.raw if quality_task.output else "",
        "synthesis":     synthesis_task.output.raw if synthesis_task.output else str(crew_result),
    }
