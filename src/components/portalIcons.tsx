import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// One icon set for the whole portal.
//
// This replaces the 12 colour emoji and the 13 text glyphs (✕ ✓ ‹ › ⤢ ▾ ▸ ↻ ↓ ✉)
// that were standing in for icons, plus the duplicate definitions that had been
// copied into individual card files.
//
// Stroke weight is 1.75 throughout. The previous set ran at 2.5, which reads
// heavy next to 400-weight body text — the icons were shouting over the words.
// Every icon inherits `currentColor`, so colour is set by the parent and never
// hardcoded here.
// ─────────────────────────────────────────────────────────────────────────────

type IconProps = { size?: number; strokeWidth?: number };

const svg = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  style: { flexShrink: 0, display: 'block' },
});

export const IconTrash: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6"/></svg>
);

export const IconEdit: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
);

export const IconSend: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M20 6L9 17l-5-5"/></svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M18 6L6 18M6 6l12 12"/></svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M6 9l6 6 6-6"/></svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M9 18l6-6-6-6"/></svg>
);

export const IconChevronLeft: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M15 18l-6-6 6-6"/></svg>
);

export const IconTrendUp: React.FC<IconProps> = ({ size = 14, strokeWidth = 2 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M4 17l7-7 4 4 5-5M15 9h5v5"/></svg>
);

export const IconTrendDown: React.FC<IconProps> = ({ size = 14, strokeWidth = 2 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M4 7l7 7 4-4 5 5M15 15h5v-5"/></svg>
);

export const IconTrendFlat: React.FC<IconProps> = ({ size = 14, strokeWidth = 2 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M5 12h14"/></svg>
);

export const IconLock: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
);

export const IconFile: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
);

export const IconSave: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
);

export const IconSparkle: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>
);

export const IconRefresh: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M21 12a9 9 0 11-2.6-6.4M21 3v6h-6"/></svg>
);

export const IconExpand: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
);

export const IconArchive: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8M10 12h4"/></svg>
);

export const IconRestore: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M9 14l-5-5 5-5"/><path d="M4 9h11a5 5 0 010 10h-5"/></svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
);

export const IconFolderOpen: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1"/><path d="M3 9h18l-2 9a2 2 0 01-2 1.6H5A2 2 0 013 18z"/></svg>
);

export const IconUsers: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.75 }) => (
  <svg {...svg(size, strokeWidth)}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/></svg>
);