# Implementation Plan — Follow-up Email Feature

---

## Overview

The goal is to automatically send a follow-up email **as a thread reply** to the
initial cold email, 3 days after it was sent, for every recipient who hasn't
already received one.

Email threading works via two standard headers: `In-Reply-To` and `References`.
When both are set to the original email's `Message-ID`, Gmail (on both your end
and the recipient's) groups the follow-up into the same conversation thread as
the original. No new thread is created — it just appears as a reply.

This requires 4 changes to the codebase, in order:

---

## Step 1 — Migration: `src/migrate-followup.ts` (new file, run once)

**What it does:** Adds 4 new columns to the existing `sends` table in SQLite.
The current table only tracks who was emailed and when. To support follow-ups,
it also needs to store the original email's ID and subject (for threading), and
the follow-up's sent timestamp and message ID (for deduplication and future
third-email support).

**New columns:**

| Column | Type | Purpose |
|---|---|---|
| `message_id` | TEXT | The `Message-ID` of the original email, returned by nodemailer after sending. Used as the threading anchor for the follow-up. |
| `subject` | TEXT | The subject line of the original email. The follow-up prefixes it with `Re:` to stay in the same thread. |
| `followup_sent_at` | TEXT | Timestamp of when the follow-up was sent. Acts as the deduplication guard — if this is set, the follow-up is never sent again. |
| `followup_message_id` | TEXT | The `Message-ID` of the follow-up email itself. Stored now so a potential third email can thread into the same conversation in the future. |

**How to run:** Execute this script once before using any of the other new code:

```bash
npx ts-node src/migrate-followup.ts
```

It is safe to run multiple times — it skips columns that already exist.

---

## Step 2 — Update `db.ts`

**What it does:** Three additions to the database layer to support the new columns.

---

### 2a. Update the `Send` interface

The `Send` TypeScript interface needs to reflect the 4 new columns so the rest
of the codebase has proper types when reading rows from the `sends` table.

```typescript
export interface Send {
  id:                   number;
  company_id:           number;
  email:                string;
  name:                 string;
  sent_at:              string;
  message_id:           string | null;   // ← new
  subject:              string | null;   // ← new
  followup_sent_at:     string | null;   // ← new
  followup_message_id:  string | null;   // ← new
}
```

---

### 2b. Update `recordSend()`

The existing `recordSend()` function writes a row when an initial email is sent.
It currently only stores `company_id`, `email`, and `name`. It needs two more
parameters so it can also store the `message_id` and `subject` that
`send-email.ts` will capture from nodemailer going forward.

```typescript
// Before
export function recordSend(companyId: number, email: string, name: string): void

// After
export function recordSend(
  companyId: number,
  email:     string,
  name:      string,
  messageId: string,   // ← nodemailer's info.messageId
  subject:   string    // ← the subject line used when sending
): void
```

The INSERT query inside it gains two more fields:

```sql
INSERT OR IGNORE INTO sends (company_id, email, name, message_id, subject)
VALUES (?, ?, ?, ?, ?)
```

> **Note on existing rows:** Any sends that were recorded before this migration
> will have `message_id = NULL`. The follow-up query (Step 2c) filters by
> `message_id IS NOT NULL`, so those old rows are safely ignored — they'll never
> receive a follow-up. Only new sends going forward will be eligible.

---

### 2c. Add `getSendsReadyForFollowup()`

A new query function that returns every send row that:
- Has a `message_id` (i.e. was sent after the migration)
- Has NOT had a follow-up sent yet (`followup_sent_at IS NULL`)
- Was sent at least 3 days ago

```typescript
export interface SendWithCompany extends Send {
  company_name: string;
}

export function getSendsReadyForFollowup(): SendWithCompany[]
```

It joins with the `companies` table to pull in `company_name`, which is needed
to replace the `COMPANY` placeholder in the follow-up template.

The SQL uses SQLite's built-in datetime arithmetic:

```sql
WHERE message_id IS NOT NULL
  AND followup_sent_at IS NULL
  AND sent_at <= datetime('now', '-3 days')
```

---

### 2d. Add `recordFollowup()`

A new function called after a follow-up email is successfully sent. It updates
the corresponding `sends` row with the follow-up's timestamp and message ID.

```typescript
export function recordFollowup(sendId: number, followupMessageId: string): void
```

```sql
UPDATE sends
SET followup_sent_at    = datetime('now'),
    followup_message_id = ?
WHERE id = ?
```

Once this runs, `followup_sent_at` is set and `getSendsReadyForFollowup()` will
never return that row again — the person will not receive a second follow-up.

---

## Step 3 — Update `send-email.ts`

**What it does:** Captures the `Message-ID` and subject from nodemailer after
each send, and passes them to the updated `recordSend()`. This is the only
change to the existing file — everything else stays the same.

Nodemailer's `sendMail()` returns an `info` object. One field on it is
`info.messageId`, which is the `Message-ID` header of the email that was just
sent (e.g. `<abc123@gmail.com>`). This is exactly what's needed to thread the
follow-up.

```typescript
// Before
const info = await transporter.sendMail({ ... });
recordSend(company.id, recipientEmail, person.name);

// After
const subject = `Engineering 99.9% reliability for ${company.name} Cloud infrastructure`;
const info = await transporter.sendMail({ subject, ... });
recordSend(company.id, recipientEmail, person.name, info.messageId, subject);
```

That's the entire change. The subject variable is extracted so it can be passed
to both `sendMail` and `recordSend` without repeating it.

---

## Step 4 — New file: `src/followup.ts`

**What it does:** The main follow-up sending script. It queries for eligible
sends, builds the personalised follow-up body, sends it as a thread reply, and
records the result. It is run manually (or on a cron/schedule) — it does not
run automatically alongside `send-email.ts`.

---

### The follow-up template

The template below is defined as a constant inside `followup.ts`. The
placeholders `NAME` and `COMPANY` are replaced at send time. `X` and `Y` are
hardcoded as `Cloud` and `Kubernetes` for now (Option B), to be made dynamic
later once Browser Use research is stored per company.

```
Hi NAME...I'm Prince, reaching out regarding my previous email about joining COMPANY's Cloud Infrastructure team.

I shared various areas where I could improve the existing Cloud and Kubernetes infrastructure system in the previous email 👆🏾 (you can check it out in case it got buried)

**Here're a few of my experiences in previous projects**

- **Engineering a highly-available DB on GKE **which sustained 7.5+ million blockchain transactions an hour** for days in a row

- Engineering microservices and DB on GKE **which sustained 160k+ requests/hour (equiv. to 3.8 million requests/day) with 99.99% availability** and success rate

- **Reduced monthly Cloud infrastructure Costs from $11,500/month to $7,500/month** by right-sizing resources and switching billing models

Happy to share more detail, or jump on a quick call 𝘄𝗵𝗲𝗿𝗲 𝗜 𝗰𝗮𝗻 𝘀𝗵𝗮𝗿𝗲 𝗮 𝗱𝗲𝘁𝗮𝗶𝗹𝗲𝗱 𝗮𝗿𝗰𝗵𝗶𝘁𝗲𝗰𝘁𝘂𝗿𝗮𝗹 𝗱𝗶𝗮𝗴𝗿𝗮𝗺 𝗼𝗳 𝘁𝗵𝗲 𝗽𝗿𝗼𝗽𝗼𝘀𝗲𝗱 𝗶𝗻𝗳𝗿𝗮𝘀𝘁𝗿𝘂𝗰𝘁𝘂𝗿𝗲 𝗶𝗺𝗽𝗿𝗼𝘃𝗲𝗺𝗲𝗻𝘁𝘀 for the Cloud infrastructure

You can learn more about my experiences and how they could benefit COMPANY from my LinkedIn below 👇🏾
https://www.linkedin.com/in/prince-onukwili-a82143233/
```

`applyBold()` is applied to the final body before sending, converting all
`**...**` markers to Unicode bold — same as the main pipeline.

---

### Personalisation

Two replacements are applied to the template for each recipient:

```typescript
// Same word-boundary regex pattern as the existing pipeline
body = body.replace(/\bNAME\b/g,    firstName);    // e.g. "Eze"
body = body.replace(/\bCOMPANY\b/g, companyName);  // e.g. "Coder"
```

`firstName` is extracted from the stored `name` field in the `sends` row
(same `firstNameOf()` helper as `send-email.ts`). `companyName` comes from
the joined `company_name` field returned by `getSendsReadyForFollowup()`.

---

### Threading headers

The nodemailer `sendMail()` call sets two extra fields that tell email clients
to group this message into the same thread as the original:

```typescript
await transporter.sendMail({
  from:      GMAIL_USER,
  to:        send.email,
  subject:   `Re: ${send.subject}`,   // same subject, "Re:" prefix keeps thread intact
  inReplyTo: send.message_id,          // points to the original email
  references: send.message_id,         // also required for proper threading
  text:      body,
  attachments: ATTACHMENT_PATH ? [{ path: ATTACHMENT_PATH }] : [],
});
```

`inReplyTo` and `references` both point to the stored `message_id` of the
original email. Gmail uses these to stitch the two emails into one thread on
both sides of the conversation.

---

### Send limit and delay

A `FOLLOWUP_LIMIT` env var (same pattern as `SEND_LIMIT`) caps how many
follow-ups are sent per run, preventing accidental bulk sends. A 3-second delay
between each send keeps the script within Gmail's SMTP rate limits.

---

### Script flow (end to end)

```
1. Load env vars (GMAIL_USER, GMAIL_APP_PASSWORD, ATTACHMENT_PATH, FOLLOWUP_LIMIT)
2. Query getSendsReadyForFollowup() — all sends >= 3 days old, no followup_sent_at, message_id present
3. Slice to FOLLOWUP_LIMIT if set
4. For each row:
   a. Extract firstName from send.name
   b. Replace NAME and COMPANY placeholders in template
   c. Apply applyBold() to convert **...** to Unicode bold
   d. Send via nodemailer with inReplyTo + references + "Re:" subject
   e. Call recordFollowup(send.id, info.messageId) to mark as done
   f. Wait 3 seconds before next send
5. Log summary (X sent, Y skipped/errors)
```

---

## Running order

```bash
# Step 1 — run once to update the DB schema
npx ts-node src/migrate-followup.ts

# Step 2/3 changes are edits to existing files — no separate run needed

# Step 4 — run this on a schedule or manually, any time after initial sends
npx ts-node src/followup.ts
```

A simple way to schedule it: add a cron job (or a GitHub Actions scheduled
workflow, mirroring the existing CI/CD setup) that runs `followup.ts` daily.
It is fully idempotent — running it multiple times per day is safe because
`followup_sent_at IS NULL` ensures each recipient only ever gets one follow-up.

---

## Future upgrade path (Option A — dynamic X and Y)

When Browser Use research is stored per company in the DB (e.g. a
`major_services` column on the `companies` table), the static `Cloud and
Kubernetes` string can be replaced with a small Anthropic API call that reads
the stored research and extracts the two most relevant infrastructure systems.
The rest of `followup.ts` stays exactly the same — only the template
substitution logic changes.