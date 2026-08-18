import Anthropic from '@anthropic-ai/sdk';
import { EMAIL_GENERATION_PROMPT } from './prompts.js';
import { applyBold } from './utils.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface GeneratedContent {
  email:    string;
  linkedIn: string;
}

export async function generateColdEmail(
  companyResearch: string
): Promise<GeneratedContent> {
  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    messages: [
      {
        role:    'user',
        content: EMAIL_GENERATION_PROMPT(companyResearch),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const raw = content.text;

  // Extract <EMAIL>...</EMAIL> block
  const emailMatch    = raw.match(/<EMAIL>([\s\S]*?)<\/EMAIL>/i);
  // Extract <LINKEDIN>...</LINKEDIN> block
  const linkedInMatch = raw.match(/<LINKEDIN>([\s\S]*?)<\/LINKEDIN>/i);

  if (!emailMatch) {
    // Haiku didn't use the tags at all — treat whole response as email (safe fallback)
    console.warn('[generateColdEmail] <EMAIL> tag not found — falling back to full response');
    return {
      email:    applyBold(raw),
      linkedIn: '',
    };
  }

  return {
    email:    applyBold(emailMatch[1].trim()),
    linkedIn: linkedInMatch?.[1]?.trim() ?? '',
  };
}