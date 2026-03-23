import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

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

/**
 * Extract and validate JSON with Zod schema
 * Provides strong type safety and prevents malformed LLM outputs
 */
export async function extractValidatedJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  maxTokens: number = 4096,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callClaude(
        systemPrompt,
        [{ role: 'user', content: userPrompt }],
        maxTokens
      );

      // Extract JSON from response
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to find JSON object/array directly
        const directMatch = response.match(/[\[{][\s\S]*[\]}]/);
        if (directMatch) {
          parsed = JSON.parse(directMatch[0]);
        } else {
          throw new Error(`Failed to parse JSON: ${parseError}`);
        }
      }

      // Validate with Zod schema
      const result = schema.safeParse(parsed);

      if (result.success) {
        return result.data;
      }

      // Validation failed - log errors
      const errors = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      console.warn(
        `LLM output validation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
        errors
      );

      lastError = new Error(`Validation failed: ${errors}`);

      // On retry, add repair instructions to the prompt
      if (attempt < maxRetries) {
        userPrompt += `\n\nPREVIOUS RESPONSE HAD ERRORS: ${errors}\nPlease fix these issues and return valid JSON.`;
      }
    } catch (error) {
      console.error(`Extract JSON attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Failed to extract valid JSON after retries');
}

export default anthropic;
