import 'dotenv/config';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import {
  getSendsReadyForFollowup,
  recordFollowup,
} from './db.js';
import { applyBold } from './utils.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const GMAIL_USER        = process.env.GMAIL_USER!;
const GMAIL_APP_PASS    = process.env.GMAIL_APP_PASSWORD!;
const ATTACHMENT_PATH   = process.env.ATTACHMENT_PATH
  ? path.resolve(process.cwd(), process.env.ATTACHMENT_PATH)
  : null;
const FOLLOWUP_LIMIT    = process.env.FOLLOWUP_LIMIT
  ? parseInt(process.env.FOLLOWUP_LIMIT, 10)
  : undefined;

// When true, logs what would be sent without calling sendMail or recording
const DRY_RUN = process.env.DRY_RUN === 'true';

// 3 seconds between emails — stays well within Gmail's 500/day SMTP limit
const SEND_DELAY_MS = 3000;

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   465,
  secure: true,
  localAddress: '0.0.0.0',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
});

// ─── Template ─────────────────────────────────────────────────────────────────

const FOLLOWUP_TEMPLATE = `Hi NAME...I'm Prince, reaching out regarding my previous email about joining COMPANY's Cloud Infrastructure team.

I shared various areas where I could improve the existing Cloud and Kubernetes infrastructure system in the previous email 👆🏾 (you can check it out in case it got buried)

**Here're a few of my experiences in previous projects**

- Engineering a highly-available DB on GKE **which sustained 7.5+ million blockchain transactions an hour** for days in a row

- Engineering microservices and DB on GKE **which sustained 160k+ requests/hour (equiv. to 3.8 million requests/day) with 99.99% availability** and success rate

- **Reduced monthly Cloud infrastructure Costs from $11,500/month to $7,500/month** by right-sizing resources and switching billing models

Happy to share more detail, or jump on a quick call **where I can share a detailed architectural diagram of the proposed infrastructure improvements** for the Cloud infrastructure

You can learn more about my experiences and how they could benefit COMPANY from my LinkedIn below 👇🏾
https://www.linkedin.com/in/prince-onukwili-a82143233/`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function personalize(template: string, firstName: string, companyName: string): string {
  return template
    .replace(/\bNAME\b/g, firstName)
    .replace(/\bCOMPANY\b/g, companyName);
}

// ─── Send one follow-up ────────────────────────────────────────────────────────

async function sendFollowup(send: Awaited<ReturnType<typeof getSendsReadyForFollowup>>[number]): Promise<boolean> {
  const firstName = firstNameOf(send.name);
  let body = personalize(FOLLOWUP_TEMPLATE, firstName, send.company_name);
  body = applyBold(body);

  const attachmentExists = ATTACHMENT_PATH ? fs.existsSync(ATTACHMENT_PATH) : false;

  if (DRY_RUN) {
    console.log(`\n  ╔════════════════════════════════════════════════════════════════════╗`);
    console.log(`  ║ [DRY RUN] Follow-up Email`);
    console.log(`  ╚════════════════════════════════════════════════════════════════════╝`);
    console.log(`  To:      ${send.name} <${send.email}>`);
    console.log(`  From:    Prince Onukwili <${GMAIL_USER}>`);
    console.log(`  Subject: Re: ${send.subject}`);
    console.log(`  Company: ${send.company_name}`);
    console.log(`  Threading: in-reply-to=${send.message_id}`);
    console.log(`  Attachment: ${ATTACHMENT_PATH ? (attachmentExists ? ATTACHMENT_PATH : `${ATTACHMENT_PATH} (missing, would send without it)`) : 'none'}`);
    console.log(`\n  ─── FULL EMAIL BODY ───\n`);
    console.log(body);
    console.log(`\n  ─── END OF BODY ───\n`);
    return true;
  }

  const mailOptions: Parameters<typeof transporter.sendMail>[0] = {
    from:       `Prince Onukwili <${GMAIL_USER}>`,
    to:         `${send.name} <${send.email}>`,
    subject:    `Re: ${send.subject}`,
    text:       body,
    inReplyTo:  send.message_id!,
    references: send.message_id!,
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
    recordFollowup(send.id, info.messageId);
    console.log(`  ✓ Follow-up sent to ${send.name} <${send.email}>`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Failed → ${send.name} <${send.email}>: ${msg}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting follow-up send run...');
  if (DRY_RUN) console.log('*** DRY RUN — no emails will actually be sent ***');
  console.log(`From:          ${GMAIL_USER || '(not set)'}`);
  console.log(`Attachment:    ${ATTACHMENT_PATH ?? 'none'}`);
  console.log(`Follow-up cap: ${FOLLOWUP_LIMIT ?? 'unlimited'}\n`);

  if (!DRY_RUN) {
    try {
      await transporter.verify();
      console.log('Gmail SMTP connection verified ✓\n');
    } catch (err) {
      console.error('Gmail SMTP failed — check GMAIL_USER and GMAIL_APP_PASSWORD in .env');
      console.error(err);
      process.exit(1);
    }
  }

  const allEligible = getSendsReadyForFollowup();
  const toSend = FOLLOWUP_LIMIT ? allEligible.slice(0, FOLLOWUP_LIMIT) : allEligible;

  console.log(`Sends eligible for follow-up: ${allEligible.length} | This run: ${toSend.length}`);

  if (toSend.length === 0) {
    console.log('No follow-ups to send.');
    return;
  }

  let totalSent = 0;

  for (const send of toSend) {
    const sent = await sendFollowup(send);
    if (sent) totalSent++;
    await sleep(SEND_DELAY_MS);
  }

  console.log(`\n=== Done. ${DRY_RUN ? 'Would have sent' : 'Sent'} ${totalSent} follow-up(s) this run. ===`);
}

main().catch(console.error);
