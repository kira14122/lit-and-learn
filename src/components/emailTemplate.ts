// Shared result-email template — ONE source of truth.
// The grading-portal preview and the send-email path both call buildResultEmail(),
// so the student receives exactly what the teacher previewed (no more drift).
// Returns { html, text }:
//   • html — a complete, email-client-safe document (table layout, inline styles,
//            web-safe fonts) that ALREADY INCLUDES the signature.
//   • text — the plain-text multipart alternative (better inbox placement).
//
// The narrative (Term in Review / Progress So Far) is passed in as the text that
// gradingHelpers already produces, so wording lives in ONE place; this file only
// styles it. **bold** markers in that text are rendered as <strong>.
//
// ── Design ───────────────────────────────────────────────────────────────────
// Colour and type resolve through portalTokens, the same file the portal cards
// use, so the email and the portal can't drift apart. Values are interpolated
// into inline styles because email clients don't reliably support anything else.
//
// Georgia stands in for Fraunces: webfonts don't load in Outlook, Gmail's web
// client, or most desktop clients, so the brand's serif voice is carried by the
// most widely installed serif instead of failing back to sans.
//
// The accent is spent once, on the skill bars and the links. The two 3px indigo
// rules that previously sat on the feedback block and the signature are now
// neutral hairlines — the same treatment saved feedback gets in the portal's
// PreviousRecordsCard, so a note reads the same way wherever it appears.

import { C } from './portalTokens';

export interface ResultEmailData {
  studentName: string;
  assessmentName: string;
  weightPct: number;                 // this assessment's % of the final grade
  isAbsent: boolean;
  isFinal: boolean;
  rawScore: number;                  // totalPoints
  maxPoints: number;
  earnedWeight: number;              // weighted contribution (kept for the record; not shown to students)
  scores: { listening: number; grammar: number; reading: number; writing: number; speaking: number };
  narrative: string;                 // buildTermReviewEmailText / buildProgressEmailText output; '' to omit
  feedback: string;
}

const esc = (s: any): string => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Escape first, then turn **bold** into <strong>.
const boldMd = (s: string): string =>
  esc(s).replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.ink}; font-weight:600;">$1</strong>`);

const round = (n: number) => Math.round(n);
const pct = (score: number, max: number) => (max > 0 ? round((score / max) * 100) : 0);

// Modern clients honour the system stack; Outlook falls back to Arial cleanly.
const SANS  = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const SERIF = `Georgia, 'Times New Roman', Times, serif`;

// The email's own type scale, matching the portal's: 11 / 13 / 15 / 18 / 28.
const EYEBROW = `font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em;`;
const META    = `font-size:13px; line-height:1.6; color:${C.ink2};`;
const BODY    = `font-size:15px; line-height:1.7; color:${C.ink2};`;
const HEADING = `font-family:${SERIF}; font-size:18px; color:${C.ink};`;

const SKILL_ROWS = [
  { key: 'listening', label: 'Listening' },
  { key: 'grammar',   label: 'Grammar & Vocab' },
  { key: 'reading',   label: 'Reading' },
  { key: 'writing',   label: 'Writing' },
  { key: 'speaking',  label: 'Speaking' },
] as const;

export function buildResultEmail(data: ResultEmailData): { html: string; text: string } {
  const {
    studentName, assessmentName, weightPct, isAbsent,
    rawScore, maxPoints, earnedWeight, scores, narrative, feedback,
  } = data;
  const perMax = maxPoints / 5;
  const earnedStr = (Math.round((earnedWeight || 0) * 10) / 10).toFixed(1);
  const intro = `I've finished grading your ${assessmentName} — here are your results.`;

  // ── PREHEADER ───────────────────────────────────────────────────────────
  // The grey line the inbox shows next to the subject. Without one, clients
  // scrape the greeting, so every result email previews as "Hello <name>, I've
  // finished grading…". This puts the actual score there instead.
  const preheader = isAbsent
    ? `${assessmentName} — recorded as absent.`
    : `${assessmentName} — ${rawScore} out of ${maxPoints}.`;
  const preheaderHtml =
    `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#ffffff;">${esc(preheader)}</div>`;

  // ── HERO ────────────────────────────────────────────────────────────────
  // Absence is an exception to flag, not a failure to condemn — it carries the
  // same amber the portal uses for an absent record, rather than red.
  const heroHtml = isAbsent
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
         <td style="background:${C.warnTint}; border:1px solid ${C.warnLine}; border-radius:12px; padding:20px 22px;">
           <p style="margin:0 0 8px; ${EYEBROW} color:${C.warn};">${esc(assessmentName)}</p>
           <p style="margin:0; font-family:${SERIF}; font-size:28px; color:${C.ink};">Absent</p>
           <p style="margin:10px 0 0; ${META}">Recorded as 0 for this assessment, which is ${esc(weightPct)}% of your term grade.</p>
         </td></tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
         <td style="background:${C.sunken}; border:1px solid ${C.line}; border-radius:12px; padding:22px;">
           <p style="margin:0 0 8px; ${EYEBROW} color:${C.ink3};">${esc(assessmentName)}</p>
           <p style="margin:0; font-family:${SERIF}; font-size:28px; color:${C.ink}; letter-spacing:-0.015em;">${esc(rawScore)}<span style="font-size:18px; color:${C.ink3};"> / ${esc(maxPoints)}</span>&nbsp; &middot; &nbsp;${earnedStr}%<span style="font-size:18px; color:${C.ink3};"> / ${esc(weightPct)}%</span></p>
           <p style="margin:10px 0 0; ${META}">Your score, and how much it counts toward your final grade.</p>
         </td></tr></table>`;

  // ── SKILL BARS ──────────────────────────────────────────────────────────
  const skillsHtml = isAbsent ? '' : `
    <p style="margin:30px 0 14px; ${EYEBROW} color:${C.ink3};">Skill breakdown</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${SKILL_ROWS.map((row, i) => {
        const val = (scores as any)[row.key] || 0;
        const p = pct(val, perMax);
        const pad = i === SKILL_ROWS.length - 1 ? '0' : '12';
        return `<tr><td style="padding:0 0 ${pad}px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td width="120" style="font-size:15px; color:${C.ink2};">${esc(row.label)}</td>
            <td><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius:999px; overflow:hidden;"><tr>
              <td width="${p}%" bgcolor="${C.accent}" style="height:6px; line-height:6px; font-size:0;">&nbsp;</td>
              <td bgcolor="${C.line}" style="height:6px; line-height:6px; font-size:0;">&nbsp;</td>
            </tr></table></td>
            <td width="64" align="right" style="font-size:13px; font-weight:600; color:${C.ink}; white-space:nowrap;">${esc(val)}/${esc(perMax)}</td>
          </tr></table>
        </td></tr>`;
      }).join('')}
    </table>`;

  // ── NARRATIVE (Term in Review / Progress So Far) ────────────────────────
  let narrativeHtml = '';
  const narrTrim = (narrative || '').trim();
  if (narrTrim) {
    const lines = narrTrim.split('\n').map(l => l.trim()).filter(Boolean);
    const headingRaw = lines[0] ? lines[0].replace(/\*\*/g, '') : '';
    const bodyLines = lines.slice(1);
    narrativeHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:30px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="background:${C.sunken}; border:1px solid ${C.line}; border-radius:12px; padding:22px 24px;">
            ${headingRaw ? `<p style="margin:0 0 12px; ${HEADING}">${esc(headingRaw)}</p>` : ''}
            ${bodyLines.map((l, i) => `<p style="margin:0 0 ${i === bodyLines.length - 1 ? '0' : '12'}px; ${BODY}">${boldMd(l)}</p>`).join('')}
          </td>
        </tr></table>
      </td></tr></table>`;
  }

  // ── INSTRUCTOR FEEDBACK ─────────────────────────────────────────────────
  // Hairline rule above, serif heading, serif body — the teacher's own voice,
  // set apart from the machine-generated blocks above it.
  const feedbackTrim = (feedback || '').trim();
  const feedbackHtml = feedbackTrim ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="padding:30px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="border-top:1px solid ${C.line}; font-size:0; line-height:0; padding-bottom:22px;">&nbsp;</td></tr>
          <tr><td>
            <p style="margin:0 0 12px; ${HEADING}">A note from your instructor</p>
            <p style="margin:0; font-family:${SERIF}; font-size:15px; line-height:1.75; color:${C.ink2};">${boldMd(feedbackTrim).replace(/\n/g, '<br>')}</p>
          </td></tr>
        </table>
      </td></tr></table>` : '';

  // ── SIGNATURE ───────────────────────────────────────────────────────────
  const signatureHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin-top:30px;">
      <tr><td style="border-top:1px solid ${C.line}; font-size:0; line-height:0; padding-bottom:20px;">&nbsp;</td></tr>
      <tr><td>
        <p style="margin:0 0 6px; ${EYEBROW} color:${C.ink3};">Best regards</p>
        <p style="margin:0 0 8px; font-family:${SERIF}; font-size:18px; color:${C.ink}; letter-spacing:-0.01em;">Dr. Chouit Abderraouf</p>
        <p style="margin:2px 0; font-size:13px;"><a href="mailto:dr.chouit@litnlearn.com" style="color:${C.accent}; text-decoration:none;">dr.chouit@litnlearn.com</a></p>
        <p style="margin:2px 0; font-size:13px;"><a href="https://litnlearn.com" style="color:${C.accent}; text-decoration:none;">litnlearn.com</a></p>
      </td></tr>
    </table>`;

  const html = `<div style="background:${C.canvas}; padding:32px 12px; font-family:${SANS};">
${preheaderHtml}
<table role="presentation" cellpadding="0" cellspacing="0" align="center" width="600" style="max-width:600px; width:100%; margin:0 auto; background:${C.paper}; border:1px solid ${C.line}; border-radius:12px;">
  <tr><td style="padding:36px 36px 40px;">
    <p style="margin:0 0 6px; font-family:${SERIF}; font-size:28px; color:${C.ink}; letter-spacing:-0.015em; line-height:1.2;">Hello ${esc(studentName)},</p>
    <p style="margin:0 0 26px; ${BODY}">${esc(intro)}</p>
    ${heroHtml}
    ${skillsHtml}
    ${narrativeHtml}
    ${feedbackHtml}
    ${signatureHtml}
  </td></tr>
</table>
</div>`;

  // ── PLAIN-TEXT ALTERNATIVE ──────────────────────────────────────────────
  const stripMd = (s: string) => s.replace(/\*\*/g, '');
  const t: string[] = [];
  t.push(`Hello ${studentName},`, '', intro, '');
  if (isAbsent) {
    t.push(`${assessmentName}: Absent (recorded as 0, ${weightPct}% of your term grade).`, '');
  } else {
    t.push(`${assessmentName}: ${rawScore}/${maxPoints}  ·  counts as ${earnedStr}% of ${weightPct}% toward your final grade.`, '', 'Skill breakdown:');
    SKILL_ROWS.forEach(row => {
      const val = (scores as any)[row.key] || 0;
      t.push(`  ${row.label}: ${val}/${perMax}`);
    });
    t.push('');
  }
  if (narrTrim) t.push(stripMd(narrTrim), '');
  if (feedbackTrim) t.push('A note from your instructor:', stripMd(feedbackTrim), '');
  t.push('Best regards,', 'Dr. Chouit Abderraouf', 'dr.chouit@litnlearn.com', 'litnlearn.com');
  const text = t.join('\n');

  return { html, text };
}