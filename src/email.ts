import Anthropic from '@anthropic-ai/sdk';
import { EMAIL_GENERATION_PROMPT } from './prompts.js';
import { applyBold } from './utils.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface GeneratedContent {
  email:       string;
  linkedIn:    string;
  linkedInDm:  string;   // ← new: post-connection DM
}

export async function generateColdEmail(
  companyResearch: string
): Promise<GeneratedContent> {
  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 3000,    // increased from 2500 to accommodate the third section
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

  const emailMatch      = raw.match(/<EMAIL>([\s\S]*?)<\/EMAIL>/i);
  const linkedInMatch   = raw.match(/<LINKEDIN>([\s\S]*?)<\/LINKEDIN>/i);
  const linkedInDmMatch = raw.match(/<LINKEDIN_DM>([\s\S]*?)<\/LINKEDIN_DM>/i);   // ← new

  if (!emailMatch) {
    console.warn('[generateColdEmail] <EMAIL> tag not found — falling back to full response');
    return {
      email:      applyBold(raw),
      linkedIn:   '',
      linkedInDm: '',   // ← new
    };
  }

  return {
    email:      applyBold(emailMatch[1].trim()),
    linkedIn:   linkedInMatch?.[1]?.trim()   ?? '',
    linkedInDm: applyBold(linkedInDmMatch?.[1]?.trim() ?? ''),   // ← new: bold applied
  };
}