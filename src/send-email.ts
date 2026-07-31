import 'dotenv/config';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import {
  getCompaniesReadyToSend,
  recordSend,
  getSummary,
  type Company,
  type DecisionMaker,
} from './db.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const GMAIL_USER      = process.env.GMAIL_USER!;
const GMAIL_APP_PASS  = process.env.GMAIL_APP_PASSWORD!;
const ATTACHMENT_PATH = process.env.ATTACHMENT_PATH
  ? path.resolve(process.cwd(), process.env.ATTACHMENT_PATH)
  : null;
const SEND_LIMIT      = process.env.SEND_LIMIT
  ? parseInt(process.env.SEND_LIMIT, 10)
  : undefined;

// When true, logs what would be sent without calling sendMail or recording a send.
const DRY_RUN = process.env.DRY_RUN === 'true';

// 3 seconds between emails — stays well within Gmail's 500/day SMTP limit
const SEND_DELAY_MS = 3000;

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  // port:   587,
  // secure: false,
  port:   465,
  secure: true,
  localAddress: '0.0.0.0',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/**
 * Replaces NAME in the email body with the recipient's first name.
 * Matches ONLY the exact string NAME — capital N, with square brackets.
 * Does NOT match name, Name, or the word "name" appearing elsewhere.
 */
function personalize(coldEmail: string, firstName: string): string {
  return coldEmail.replace(/\bNAME\b/g, firstName);
}

// ─── Send one email ───────────────────────────────────────────────────────────

async function sendToRecipient(
  company: Company,
  person: DecisionMaker
): Promise<boolean> {
  const recipientEmail = person.emails[0];
  if (!recipientEmail) return false;

  const firstName      = firstNameOf(person.name);
  const personalizedBody = personalize(company.cold_email ?? '', firstName);
  const subject        = `Engineering 99.9% reliability for ${company.name} Cloud infrastructure`;

  const attachmentExists = ATTACHMENT_PATH ? fs.existsSync(ATTACHMENT_PATH) : false;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would send to ${person.name} <${recipientEmail}>`);
    console.log(`  [DRY RUN]   Subject: ${subject}`);
    console.log(`  [DRY RUN]   Attachment: ${ATTACHMENT_PATH ? (attachmentExists ? ATTACHMENT_PATH : `${ATTACHMENT_PATH} (missing, would send without it)`) : 'none'}`);
    console.log(`  [DRY RUN]   Body preview: ${personalizedBody.slice(0, 200)}${personalizedBody.length > 200 ? '...' : ''}`);
    return true;
  }

  const mailOptions: Parameters<typeof transporter.sendMail>[0] = {
    from:    `Prince Onukwili <${GMAIL_USER}>`,
    to:      `${person.name} <${recipientEmail}>`,
    subject,
    text:    personalizedBody,
  };

  // Attach file if configured and it exists
  if (ATTACHMENT_PATH) {
    if (!attachmentExists) {
      console.warn(`  ⚠ Attachment not found at ${ATTACHMENT_PATH} — sending without attachment`);
    } else {
      mailOptions.attachments = [
        {
          path:     ATTACHMENT_PATH,
          filename: path.basename(ATTACHMENT_PATH),
        },
      ];
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    recordSend(company.id, recipientEmail, person.name, info.messageId, subject);
    console.log(`  ✓ Sent to ${person.name} <${recipientEmail}>`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Failed → ${person.name} <${recipientEmail}>: ${msg}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting email send run...');
  if (DRY_RUN) console.log('*** DRY RUN — no emails will actually be sent ***');
  console.log(`From:       ${GMAIL_USER || '(not set)'}`);
  console.log(`Attachment: ${ATTACHMENT_PATH ?? 'none'}`);
  console.log(`Send limit: ${SEND_LIMIT ?? 'unlimited'}\n`);

  if (!DRY_RUN) {
    // Verify SMTP credentials before doing anything
    try {
      await transporter.verify();
      console.log('Gmail SMTP connection verified ✓\n');
    } catch (err) {
      console.error('Gmail SMTP failed — check GMAIL_USER and GMAIL_APP_PASSWORD in .env');
      console.error(err);
      process.exit(1);
    }
  }

  const allCompanies = getCompaniesReadyToSend();
  const companies    = SEND_LIMIT
    ? allCompanies.slice(0, SEND_LIMIT)
    : allCompanies;

  console.log(`Companies ready to send: ${allCompanies.length} | This run: ${companies.length}`);

  let totalSent = 0;

  for (const company of companies) {
    if (!company.cold_email || !company.outreach) continue;

    let people: DecisionMaker[] = [];
    try {
      people = JSON.parse(company.outreach) as DecisionMaker[];
    } catch {
      console.warn(`Skipping ${company.name} — could not parse outreach JSON`);
      continue;
    }

    const recipients = people.filter(p => p.emails.length > 0 && p.emails[0]);
    if (recipients.length === 0) {
      console.log(`Skipping ${company.name} — no email addresses in outreach`);
      continue;
    }

    console.log(`\n[SEND] ${company.name} — ${recipients.length} recipient(s)`);

    for (const person of recipients) {
      const sent = await sendToRecipient(company, person);
      if (sent) totalSent++;
      await sleep(SEND_DELAY_MS);
    }
  }

  console.log(`\n=== Done. ${DRY_RUN ? 'Would have sent' : 'Sent'} ${totalSent} email(s) this run. ===`);
  console.table(getSummary());
}

main().catch(console.error);