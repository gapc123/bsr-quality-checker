/**
 * Specialist Review Service
 *
 * Replaces the Python/CrewAI microservice with direct Anthropic SDK calls.
 * Runs four domain reviews in parallel, then synthesises them in a fifth call.
 *
 * Domains:
 *   fire_safety   — FIRE_SAFETY + VENTILATION checks
 *   documentation — PACK_COMPLETENESS + GOLDEN_THREAD + TRACEABILITY
 *   regulatory    — HRB_DUTIES + LONDON_SPECIFIC
 *   quality       — CONSISTENCY checks
 *   synthesis     — Executive summary from all four domain reviews
 */

import Anthropic from '@anthropic-ai/sdk';

export interface DomainReviews {
  fire_safety: string;
  documentation: string;
  regulatory: string;
  quality: string;
  synthesis: string;
}

interface AssessmentResult {
  matrix_id?: string;
  matrix_title?: string;
  category?: string;
  status?: string;
  reasoning?: string;
}

interface PackContext {
  isHRB?: boolean;
  isLondon?: boolean;
  buildingType?: string;
}

// ────────────────────────────────────────────────────────────────────────────

function buildingDesc(context: PackContext): string {
  return [
    context.isHRB ? 'Higher-Risk Building (HRB)' : 'Standard building',
    context.isLondon ? 'London' : 'outside London',
    context.buildingType || 'residential',
  ].join(', ');
}

function bucket(results: AssessmentResult[], categories: string[]): AssessmentResult[] {
  return results.filter(r => r.category && categories.includes(r.category));
}

function summarise(domainResults: AssessmentResult[]): string {
  if (domainResults.length === 0) return 'No checks in this domain.';
  return domainResults.map(r => {
    const status = (r.status || 'not_assessed').toUpperCase();
    const title  = r.matrix_title || r.matrix_id || '?';
    const reason = (r.reasoning || '').slice(0, 200);
    return `- [${status}] ${title}: ${reason}`;
  }).join('\n');
}

async function callSpecialist(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 700
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Unexpected response content type from specialist model');
  return block.text.trim();
}

// ────────────────────────────────────────────────────────────────────────────

export async function runSpecialistReview(
  context: PackContext,
  results: AssessmentResult[]
): Promise<DomainReviews> {
  const client = new Anthropic();
  const desc = buildingDesc(context);

  const fireResults  = bucket(results, ['FIRE_SAFETY', 'VENTILATION']);
  const docsResults  = bucket(results, ['PACK_COMPLETENESS', 'GOLDEN_THREAD', 'TRACEABILITY']);
  const regResults   = bucket(results, ['HRB_DUTIES', 'LONDON_SPECIFIC']);
  const qualResults  = bucket(results, ['CONSISTENCY']);

  // ── Four domain reviews run in parallel ─────────────────────────────────
  const [fireDraft, docsDraft, regDraft, qualDraft] = await Promise.all([

    callSpecialist(
      client,
      'You are a Chartered Fire Engineer with 20 years of experience in UK high-rise ' +
      'residential buildings. You specialise in BSR Gateway 2 applications and are expert ' +
      'in Approved Document B, BS 9991, and the Building Safety Act 2022. ' +
      'Write direct, technical assessments with clear remediation priorities.',
      `Building: ${desc}\n\n` +
      `Review these fire safety and ventilation compliance findings:\n${summarise(fireResults)}\n\n` +
      `Write a professional fire engineer's assessment (200-300 words) covering:\n` +
      `1. Overall fire safety compliance status\n` +
      `2. The most critical fire safety issues and why they would cause rejection\n` +
      `3. Specific remediation steps in order of priority\n` +
      `4. Any patterns or systemic issues in the fire safety documentation\n\n` +
      `Be technical and specific. Reference Approved Document B, BS 9991, or other standards where relevant.`
    ),

    callSpecialist(
      client,
      'You are a Principal Designer with deep expertise in BSR documentation requirements ' +
      'under the Building Safety Act 2022. You have prepared and reviewed dozens of Gateway 2 ' +
      'application packs. You know exactly which documents are mandatory, what they must ' +
      'contain, and how missing information causes rejection.',
      `Building: ${desc}\n\n` +
      `Review these documentation, golden thread, and traceability findings:\n${summarise(docsResults)}\n\n` +
      `Write a documentation specialist's assessment (200-300 words) covering:\n` +
      `1. Which mandatory documents are missing or incomplete\n` +
      `2. Golden thread and traceability gaps that must be resolved\n` +
      `3. The sequence in which documents should be obtained or completed\n` +
      `4. Impact of missing documentation on the BSR application timeline`
    ),

    callSpecialist(
      client,
      'You are a Building Regulations consultant who has worked directly with the Building ' +
      'Safety Regulator. You understand HRB dutyholders\' legal responsibilities, Regulation 38, ' +
      'golden thread obligations, and the London Plan D12 requirements. ' +
      'Write in plain English for housing association directors and legal teams.',
      `Building: ${desc}\n\n` +
      `Review these HRB duties and London-specific compliance findings:\n${summarise(regResults)}\n\n` +
      `Write a regulatory compliance assessment (150-200 words) covering:\n` +
      `1. Dutyholder obligation gaps (Accountable Person, Principal Designer, Principal Contractor)\n` +
      `2. Any London Plan / GLA-specific requirements that are unmet\n` +
      `3. Statutory risk — which gaps could constitute a legal breach\n` +
      `4. What the dutyholders need to do before submission`
    ),

    callSpecialist(
      client,
      'You are a technical auditor specialising in construction documentation quality. ' +
      'You spot inconsistencies that cause BSR rejection — mismatched floor counts, ' +
      'conflicting height figures, version discrepancies between drawings and reports. ' +
      'Write concise, specific findings that tell the team exactly what to fix.',
      `Building: ${desc}\n\n` +
      `Review these consistency findings:\n${summarise(qualResults)}\n\n` +
      `Write a concise quality review (100-150 words) covering:\n` +
      `1. Specific contradictions found across documents\n` +
      `2. Which documents need to be reconciled and how\n` +
      `3. Whether any inconsistencies suggest a deeper coordination problem`
    ),
  ]);

  // ── Synthesis call uses all four domain reviews as context ───────────────
  const totalFailed = results.filter(r => r.status === 'does_not_meet' || r.status === 'partial').length;
  const totalMeets  = results.filter(r => r.status === 'meets').length;

  const synthesis = await callSpecialist(
    client,
    'You are a senior BSR consultant who coordinates Gateway 2 applications for major ' +
    'housing associations. You translate technical findings into clear executive summaries ' +
    'that help boards make decisions. You prioritise ruthlessly and distinguish between ' +
    'submission-blocking issues and nice-to-haves.',
    `You have received specialist reviews from four domain experts.\n\n` +
    `Building: ${desc}\n` +
    `Total checks: ${results.length} | Failed/partial: ${totalFailed} | Passing: ${totalMeets}\n\n` +
    `--- FIRE SAFETY REVIEW ---\n${fireDraft}\n\n` +
    `--- DOCUMENTATION REVIEW ---\n${docsDraft}\n\n` +
    `--- REGULATORY REVIEW ---\n${regDraft}\n\n` +
    `--- QUALITY REVIEW ---\n${qualDraft}\n\n` +
    `Write an executive summary (250-350 words) for the housing association's board covering:\n` +
    `1. **Verdict**: Is this application ready to submit? (Ready / Needs Work / Not Ready)\n` +
    `2. **Top 3 blockers** that must be resolved before submission\n` +
    `3. **Quick wins** — issues that can be resolved in under a week\n` +
    `4. **Estimated timeline** to get the application submission-ready\n` +
    `5. **Recommended immediate next steps** — who needs to be called today\n\n` +
    `Write in plain English. Be direct and actionable.`,
    1000
  );

  return {
    fire_safety:   fireDraft,
    documentation: docsDraft,
    regulatory:    regDraft,
    quality:       qualDraft,
    synthesis,
  };
}
