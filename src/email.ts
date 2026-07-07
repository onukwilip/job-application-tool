import Anthropic from '@anthropic-ai/sdk';
import { EMAIL_GENERATION_PROMPT } from './prompts.js';
import { applyBold } from './utils.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateColdEmail(
  companyResearch: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: EMAIL_GENERATION_PROMPT(companyResearch),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  // Convert **bold markers** to Unicode bold characters before saving
  return applyBold(content.text);
}