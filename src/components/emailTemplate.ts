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
const boldMd = (s: string): string => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>');

const round = (n: number) => Math.round(n);
const pct = (score: number, max: number) => (max > 0 ? round((score / max) * 100) : 0);

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

  // ── HERO ────────────────────────────────────────────────────────────────
  const heroHtml = isAbsent
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
         <td style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:18px 22px;">
           <p style="margin:0 0 4px; font-size:11px; font-weight:700; color:#dc2626; text-transform:uppercase; letter-spacing:0.12em;">${esc(assessmentName)}</p>
           <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:22px; color:#0f172a;">Absent</p>
           <p style="margin:8px 0 0; font-size:13px; color:#64748b;">Recorded as 0 for this assessment (${esc(weightPct)}% of your term grade).</p>
         </td></tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
         <td style="background:#f5f3ff; border:1px solid #e5e0fb; border-radius:12px; padding:20px 22px;">
           <p style="margin:0 0 8px; font-size:11px; font-weight:700; color:#8b83e0; text-transform:uppercase; letter-spacing:0.12em;">${esc(assessmentName)}</p>
           <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:26px; color:#0f172a;">${esc(rawScore)}<span style="font-size:17px; color:#94a3b8;"> / ${esc(maxPoints)}</span> &nbsp;·&nbsp; ${earnedStr}%<span style="font-size:17px; color:#94a3b8;"> / ${esc(weightPct)}%</span></p>
           <p style="margin:10px 0 0; font-size:13px; color:#64748b;">Your score, and how much it counts toward your final grade.</p>
         </td></tr></table>`;

  // ── SKILL BARS ──────────────────────────────────────────────────────────
  const skillsHtml = isAbsent ? '' : `
    <p style="margin:30px 0 14px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.12em;">Skill breakdown</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${SKILL_ROWS.map((row, i) => {
        const val = (scores as any)[row.key] || 0;
        const p = pct(val, perMax);
        const pad = i === SKILL_ROWS.length - 1 ? '0' : '12';
        return `<tr><td style="padding:0 0 ${pad}px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td width="120" style="font-size:14px; color:#334155;">${esc(row.label)}</td>
            <td><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius:5px; overflow:hidden;"><tr>
              <td width="${p}%" bgcolor="#4F46E5" style="height:8px; line-height:8px; font-size:0;">&nbsp;</td>
              <td bgcolor="#e9ecf2" style="height:8px; line-height:8px; font-size:0;">&nbsp;</td>
            </tr></table></td>
            <td width="64" align="right" style="font-size:13px; font-weight:700; color:#0f172a; white-space:nowrap;">${esc(val)}/${esc(perMax)}</td>
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
          <td style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:22px 24px;">
            ${headingRaw ? `<p style="margin:0 0 12px; font-family:Georgia,'Times New Roman',serif; font-size:18px; color:#0f172a;">${esc(headingRaw)}</p>` : ''}
            ${bodyLines.map((l, i) => `<p style="margin:0 0 ${i === bodyLines.length - 1 ? '0' : '12'}px; font-size:15px; line-height:1.7; color:#334155;">${boldMd(l)}</p>`).join('')}
          </td>
        </tr></table>
      </td></tr></table>`;
  }

  // ── INSTRUCTOR FEEDBACK ─────────────────────────────────────────────────
  const feedbackTrim = (feedback || '').trim();
  const feedbackHtml = feedbackTrim ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:16px 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td width="3" style="background:#4F46E5; border-radius:2px; font-size:0; line-height:0;">&nbsp;</td>
        <td style="padding:2px 0 2px 18px;">
          <p style="margin:0 0 12px; font-family:Georgia,'Times New Roman',serif; font-size:18px; color:#0f172a;">A note from your instructor</p>
          <p style="margin:0; font-size:15px; line-height:1.7; color:#334155;">${boldMd(feedbackTrim).replace(/\n/g, '<br>')}</p>
        </td>
      </tr></table>
    </td></tr></table>` : '';

  // ── SIGNATURE ───────────────────────────────────────────────────────────
  const signatureHtml = `
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:30px; width:100%;">
      <tr><td colspan="2" style="padding-bottom:18px; border-top:1px solid #e2e8f0; font-size:0; line-height:0;">&nbsp;</td></tr>
      <tr>
        <td style="width:3px; background-color:#4F46E5; border-radius:2px; vertical-align:top;">&nbsp;</td>
        <td style="padding-left:14px; vertical-align:top;">
          <p style="margin:0 0 1px; font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:0.1em;">Best regards</p>
          <p style="margin:6px 0 10px; font-weight:700; font-size:16px; color:#0f172a; letter-spacing:-0.01em;">Dr. Chouit Abderraouf</p>
          <p style="margin:3px 0; font-size:13px;"><a href="mailto:dr.chouit@litnlearn.com" style="color:#4F46E5; text-decoration:none;">dr.chouit@litnlearn.com</a></p>
          <p style="margin:3px 0; font-size:13px;"><a href="https://litnlearn.com" style="color:#4F46E5; text-decoration:none;">litnlearn.com</a></p>
        </td>
      </tr>
    </table>`;

  const html = `<div style="background:#eef1f6; padding:28px 12px; font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" align="center" width="600" style="max-width:600px; width:100%; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px;">
  <tr><td style="padding:36px 36px 40px;">
    <p style="margin:0 0 4px; font-family:Georgia,'Times New Roman',serif; font-size:22px; color:#0f172a; letter-spacing:-0.01em;">Hello ${esc(studentName)},</p>
    <p style="margin:0 0 26px; font-size:15px; line-height:1.7; color:#475569;">${esc(intro)}</p>
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