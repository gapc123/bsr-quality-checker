/**
 * Chat Service
 *
 * Stateless chat endpoint — the frontend maintains conversation history
 * and sends it with every request. Claude receives the full assessment
 * context as a system prompt so it can answer questions about any result.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssessmentContext {
  pack_id: string;
  version_id: string;
  project_name?: string | null;
  building_type?: string | null;
  height_meters?: number | null;
  storeys?: number | null;
  readiness_score?: number;
  criteria_summary?: {
    total_applicable: number;
    meets: number;
    partial: number;
    does_not_meet: number;
  };
  flagged_by_severity?: {
    high: number;
    medium: number;
    low: number;
  };
  results: Array<{
    matrix_id: string;
    matrix_title: string;
    category: string;
    status: string;
    severity: string;
    reasoning: string;
    gaps_identified?: string[];
    actions_required?: Array<{
      action: string;
      owner: string;
      effort: string;
      expected_benefit: string;
    }>;
    pack_evidence?: {
      found: boolean;
      document: string | null;
      page: number | null;
      quote: string | null;
    };
    triage?: {
      urgency: string;
      blocks_submission: boolean;
      quick_win: boolean;
      urgency_reasoning?: string;
    };
  }>;
}

function buildSystemPrompt(context: AssessmentContext): string {
  const { results } = context;

  const blockers = results.filter(r => r.triage?.blocks_submission);
  const highSeverity = results.filter(r => r.severity === 'high' && r.status !== 'meets');
  const quickWins = results.filter(r => r.triage?.quick_win && r.status !== 'meets');

  const resultsSummary = results.map(r => {
    const gaps = r.gaps_identified?.length ? `\n  Gaps: ${r.gaps_identified.join('; ')}` : '';
    const actions = r.actions_required?.length
      ? `\n  Actions: ${r.actions_required.map(a => `${a.action} (${a.owner}, ${a.effort})`).join('; ')}`
      : '';
    const evidence = r.pack_evidence?.found
      ? `\n  Evidence: "${r.pack_evidence.quote}" — ${r.pack_evidence.document}${r.pack_evidence.page ? `, p.${r.pack_evidence.page}` : ''}`
      : '';
    return `[${r.matrix_id}] ${r.matrix_title} (${r.category})
  Status: ${r.status.toUpperCase()} | Severity: ${r.severity} | Urgency: ${r.triage?.urgency ?? 'n/a'}
  Reasoning: ${r.reasoning}${gaps}${actions}${evidence}`;
  }).join('\n\n');

  return `You are Attlee, an AI assistant helping a building safety consultant understand their BSR Gateway 2 submission pack assessment results.

## YOUR ROLE
You explain findings clearly, in plain English. You help the user understand:
- What each issue means in practice
- Why it matters for their submission
- What they need to do to fix it
- How urgently it needs addressing

You are NOT a compliance tool and do NOT make compliance judgements. You help users understand and act on document quality findings.

## TONE
- Clear, direct, and professional — but not overly formal
- Avoid jargon where possible; explain terms when you use them
- Be specific: reference actual findings, document names, page numbers, quotes where available
- Keep answers concise unless the user asks for more detail

## PACK CONTEXT
Project: ${context.project_name ?? 'Unknown'}
Building type: ${context.building_type ?? 'Unknown'} | Height: ${context.height_meters ? `${context.height_meters}m` : 'Unknown'} | Storeys: ${context.storeys ?? 'Unknown'}
Readiness score: ${context.readiness_score ?? 'N/A'}
Results: ${context.criteria_summary?.total_applicable ?? results.length} criteria assessed — ${context.criteria_summary?.meets ?? 0} meet, ${context.criteria_summary?.partial ?? 0} partial, ${context.criteria_summary?.does_not_meet ?? 0} do not meet
Severity: ${context.flagged_by_severity?.high ?? highSeverity.length} high, ${context.flagged_by_severity?.medium ?? 0} medium, ${context.flagged_by_severity?.low ?? 0} low

Submission blockers (${blockers.length}): ${blockers.map(r => r.matrix_id).join(', ') || 'none'}
Quick wins available (${quickWins.length}): ${quickWins.map(r => r.matrix_id).join(', ') || 'none'}

## FULL ASSESSMENT RESULTS
${resultsSummary}

## IMPORTANT
- Always ground your answers in the actual assessment data above
- If asked about something not covered in the assessment, say so clearly
- Do not fabricate evidence, page numbers, or quotes — only reference what is shown above
- If the user asks what to prioritise, guide them toward blockers and high-severity items first`;
}

export async function chat(
  context: AssessmentContext,
  messages: ChatMessage[]
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');
  return textBlock.text;
}

export async function chatStream(
  context: AssessmentContext,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const systemPrompt = buildSystemPrompt(context);

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
  onDone();
}
