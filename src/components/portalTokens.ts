import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens for the grading portal.
//
// Every visual value in the portal resolves here. Nothing downstream should
// contain a raw hex, a raw px size, or a one-off radius — if a value is needed
// and it isn't in this file, the right move is to add it here (or, more often,
// to use the nearest existing step).
//
// The scales are deliberately short. Five type sizes, three radii, two
// shadows, one accent. Shortness is the point: values that sit closer
// together than the eye can resolve read as drift, not as hierarchy.
// ─────────────────────────────────────────────────────────────────────────────

const css = (s: React.CSSProperties): React.CSSProperties => s;

// ── Colour ───────────────────────────────────────────────────────────────────
// The portal is near-monochrome. `accent` has exactly two jobs: the primary
// action in a view, and the item the teacher is currently on. The semantic
// three (good / warn / bad) mark *exceptions* — a state that needs attention
// or an action that can't be undone. A normal, healthy, expected state gets
// no colour at all. If everything is flagged, nothing is.
export const C = {
  ink:        '#1B1F3B',
  ink2:       '#5A6180',
  ink3:       '#6C7391',

  line:       '#E4E7F2',
  lineSoft:   '#EEF0F8',

  paper:      '#FFFFFF',
  canvas:     '#F1F3FA',
  sunken:     '#F7F8FD',

  accent:     '#4F46E5',
  accentHover:'#4038C7',
  accentTint: '#EEEDFE',
  accentSoft: '#C9C6F7',

  good:       '#0E9F6E',
  goodTint:   '#E6F7F0',
  warn:       '#B7791F',
  warnTint:   '#FDF6E7',
  warnLine:   '#FDE68A',
  bad:        '#E02424',
  badTint:    '#FDECEC',
} as const;

// ── Radius ───────────────────────────────────────────────────────────────────
export const R = {
  control: '12px',
  card:    '20px',
  pill:    '999px',
} as const;

// ── Spacing (4px base) ───────────────────────────────────────────────────────
export const S = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
} as const;

// ── Elevation ────────────────────────────────────────────────────────────────
export const SH = {
  rest:   '0 2px 8px rgba(27,31,59,0.05)',
  raised: '0 8px 24px -10px rgba(27,31,59,0.18)',
} as const;

export const FONT = {
  // Fredoka is the interface voice: headings, buttons, figures. It is what the
  // product's navigation already speaks, so the portal sounds like the rest of
  // Lit & Learn instead of like a different application.
  display: "'Fredoka', system-ui, -apple-system, sans-serif",
  // Fraunces stays where a document voice belongs: the printed progress report.
  paper:   "'Fraunces', Georgia, 'Times New Roman', serif",
} as const;

// ── Font loading ─────────────────────────────────────────────────────────────
// Injected from here rather than from index.html so the portal carries its own
// typography and nothing outside this folder has to be edited. Runs once, on
// first import of any portal component; the id guard makes repeat imports and
// hot reloads no-ops.
//
// Note the fallbacks are real, not decorative. Requests to fonts.googleapis.com
// are blocked by some ad blockers and content filters — the same problem that
// pushed the Lit & Learn wordmark to outlined SVG paths. If the request fails,
// Fraunces falls back to Georgia and Fredoka to the system sans, and every
// surface stays legible. Nothing in the portal depends on a webfont arriving.
const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400' +
  '&family=Fredoka:wght@500;600' +
  '&display=swap';

export function ensurePortalFonts(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('portal-fonts')) return;

  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://fonts.gstatic.com';
  preconnect.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect);

  const link = document.createElement('link');
  link.id = 'portal-fonts';
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

ensurePortalFonts();

// ── Type scale ───────────────────────────────────────────────────────────────
// Five steps. Weight 400 is body, 500 is UI and labels, 600 is reserved for
// numerals so figures read as data rather than as emphasis.
export const T = {
  micro: css({
    fontSize: '12px', fontWeight: 500, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: C.ink3, lineHeight: 1.4,
  }),
  meta: css({ fontSize: '14px', fontWeight: 400, color: C.ink2, lineHeight: 1.5 }),
  body: css({ fontSize: '15px', fontWeight: 400, color: C.ink,  lineHeight: 1.6 }),
  title: css({ fontFamily: FONT.display, fontSize: '20px', fontWeight: 500, color: C.ink, lineHeight: 1.3 }),
  display: css({
    fontFamily: FONT.display, fontSize: '30px', fontWeight: 500,
    letterSpacing: '-0.01em', lineHeight: 1.15, color: C.ink,
  }),
  // The one figure per view that answers "where does this student stand".
  // Deliberately the only thing on screen at this size.
  displayLg: css({
    fontFamily: FONT.display, fontSize: '34px', fontWeight: 500,
    letterSpacing: '-0.01em', lineHeight: 1, color: C.ink,
  }),
} as const;

// Tabular figures. Spread onto anything that renders a number so digits sit in
// fixed-width columns and 78 lines up under 41 — the difference between a
// gradebook that reads as an instrument and one that reads as a form.
export const NUM = css({ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' });


// Bare scale values, for inline styles that set one property at a time.
// T.* above gives whole type roles; FS gives just the size.
export const FS = {
  micro:     '12px',
  meta:      '14px',
  body:      '15px',
  title:     '20px',
  display:   '30px',
  displayLg: '34px',
} as const;

// Weights. 400 is body, 500 is UI and labels, 600 is reserved for numerals.
export const W = { body: 400, ui: 500, num: 600 } as const;

// ── Composed surfaces ────────────────────────────────────────────────────────
export const card = css({
  background: C.paper,
  border: `1px solid ${C.line}`,
  borderRadius: R.card,
  boxShadow: SH.rest,
  flexShrink: 0,
});

export const cardHead = css({
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
  gap: S.md, flexWrap: 'wrap',
  padding: `${S.lg} ${S.xl}`,
  borderBottom: `1px solid ${C.lineSoft}`,
});

export const cardBody = css({ padding: S.xl });

// A locked or disabled control still has to be readable — greying it out to
// the point of illegibility hides information the teacher needs.
export const locked = css({
  background: C.lineSoft,
  color: C.ink2,
  border: `1px solid ${C.line}`,
});

export const pill = css({
  fontSize: '11px', fontWeight: 500, letterSpacing: '0.02em',
  background: C.lineSoft, color: C.ink2,
  padding: '3px 9px', borderRadius: R.pill, whiteSpace: 'nowrap',
});

export const tintPill = (fg: string, bg: string): React.CSSProperties => ({
  ...pill, color: fg, background: bg,
});

// A dense list row. Bordered rows rather than nested cards — stacking rounded
// rectangles inside rounded rectangles is what makes an admin screen feel busy.
export const row = css({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: S.md, padding: '11px 0',
  borderTop: `1px solid ${C.lineSoft}`,
  fontSize: '14px',
});

// ── Buttons ──────────────────────────────────────────────────────────────────
export type BtnVariant = 'default' | 'quiet' | 'primary' | 'danger';

export const btn = (variant: BtnVariant = 'default', extra?: React.CSSProperties): React.CSSProperties => {
  const base: React.CSSProperties = {
    font: 'inherit', fontFamily: FONT.display, fontSize: '14px', fontWeight: 400, lineHeight: 1.2,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: '8px 16px', borderRadius: R.pill, cursor: 'pointer',
    background: C.paper, color: C.ink2, border: `1.5px solid ${C.line}`,
    whiteSpace: 'nowrap',
  };
  if (variant === 'quiet')   return { ...base, border: '1px solid transparent', background: 'transparent', ...extra };
  if (variant === 'primary') return { ...base, background: C.accent, borderColor: C.accent, color: C.paper, fontWeight: 500, ...extra };
  if (variant === 'danger')  return { ...base, background: C.badTint, borderColor: C.badTint, color: C.bad, ...extra };
  return { ...base, ...extra };
};

// Collapsible section headers share one shape across the portal so the
// teacher learns a single affordance instead of three similar ones.
export const disclosure = css({
  width: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S.md,
  background: C.paper, border: `1px solid ${C.line}`, borderRadius: R.card,
  padding: `${S.md} ${S.lg}`, cursor: 'pointer', textAlign: 'left',
  boxShadow: SH.rest,
});