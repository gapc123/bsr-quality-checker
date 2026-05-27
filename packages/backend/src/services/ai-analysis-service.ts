import { callClaude } from './claude.js';
import type { AssessmentContext } from './chat-service.js';

export interface AIAnalysis {
  summary: string;
  top_priorities: Array<{ matrix_id: string; title: string; why: string; action: string }>;
  bsr_focus: Array<{ area: string; reason: string }>;
  next_steps: Array<{ step: string; owner: string; effort: 'Quick fix' | 'Days' | 'Weeks' }>;
  generated_at: string;
}

export async function generateAIAnalysis(context: AssessmentContext): Promise<AIAnalysis> {
  const { results } = context;
  const doesNotMeet = results.filter(r => r.status === 'does_not_meet');
  const partial = results.filter(r => r.status === 'partial');
  const blockers = results.filter(r => r.triage?.blocks_submission);
  const quickWins = results.filter(r => r.triage?.quick_win && r.status !== 'meets');

  const issuesSummary = [...doesNotMeet, ...partial].map(r => ({
    id: r.matrix_id, title: r.matrix_title, category: r.category,
    status: r.status, severity: r.severity, reasoning: r.reasoning,
    urgency: r.triage?.urgency ?? null,
    blocks_submission: r.triage?.blocks_submission ?? false,
    quick_win: r.triage?.quick_win ?? false,
    gaps: r.gaps_identified ?? [], actions: r.actions_required ?? [],
  }));

  const systemPrompt = `You are an expert building safety consultant analysing a BSR Gateway 2 submission pack assessment.

Your job is to produce a clear, actionable analysis for the submission team. Write as if briefing a senior consultant who needs to understand the situation in 60 seconds and know exactly what to do next.

IMPORTANT:
- Be specific — reference actual issue IDs, categories, and findings
- Use plain English — avoid unnecessary jargon
- Be direct — don't hedge or pad
- Focus on what matters most for getting this submission through review
- Do NOT make compliance judgements — this is a document quality assessment

Return ONLY valid JSON matching this exact schema:
{
  "summary": "2-3 sentences covering overall state, key numbers (score, blockers, high-severity count)",
  "top_priorities": [
    { "matrix_id": "string", "title": "string", "why": "1-2 sentences", "action": "specific next action" }
  ],
  "bsr_focus": [
    { "area": "string", "reason": "1 sentence" }
  ],
  "next_steps": [
    { "step": "string", "owner": "role", "effort": "Quick fix" | "Days" | "Weeks" }
  ]
}
top_priorities: exactly 3 items. bsr_focus: 2-3 items. next_steps: 3-5 items ordered by urgency.`;

  const userPrompt = `Analyse this BSR Gateway 2 pack and return JSON.

PROJECT: ${context.project_name ?? 'Unknown'} | ${context.building_type ?? 'Unknown'} | ${context.height_meters ? `${context.height_meters}m` : '?'} | ${context.storeys ?? '?'} storeys
Score: ${context.readiness_score ?? 'N/A'}/100 | Meets: ${context.criteria_summary?.meets ?? 0} | Partial: ${context.criteria_summary?.partial ?? 0} | Does not meet: ${context.criteria_summary?.does_not_meet ?? 0}
Blockers: ${blockers.length} | Quick wins: ${quickWins.length}
Severity — High: ${context.flagged_by_severity?.high ?? 0}, Medium: ${context.flagged_by_severity?.medium ?? 0}, Low: ${context.flagged_by_severity?.low ?? 0}

ISSUES (${issuesSummary.length})
${JSON.stringify(issuesSummary, null, 2)}`;

  const rawResponse = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 1500);

  const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawResponse.trim();

  let parsed: Omit<AIAnalysis, 'generated_at'>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const directMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!directMatch) throw new Error('Could not parse AI analysis response');
    parsed = JSON.parse(directMatch[0]);
  }

  return { ...parsed, generated_at: new Date().toISOString() };
}
