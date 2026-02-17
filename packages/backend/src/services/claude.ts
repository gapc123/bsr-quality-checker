import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  maxTokens: number = 4096
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

export async function extractJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<T> {
  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    maxTokens
  );

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    // Try to find JSON object/array directly
    const directMatch = response.match(/[\[{][\s\S]*[\]}]/);
    if (directMatch) {
      return JSON.parse(directMatch[0]) as T;
    }
    throw new Error(`Failed to parse JSON from Claude response: ${error}`);
  }
}

export default anthropic;
