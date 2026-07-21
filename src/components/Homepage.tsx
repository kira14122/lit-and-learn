import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';
import { RecentReviews } from './RecentReviews';
import { RecentlyAdded } from './RecentlyAdded';

/*
  Homepage — the new English Corner landing.

  Replaces the old Level -> Path -> Unit matrix with a course shelf. The shelf
  is data-driven: each course's status is derived from Sanity, so a "coming soon"
  card flips to "live" (with real counts) the moment you publish its first module.
  No code change needed to launch a course's card — just publish content.

  Wired into App.tsx like this (see the swap instructions):
    <Route path="/" element={
      <Homepage
        reviews={reviews}
        onNavigate={handleNavigation}
        onSelectBook={setSelectedBook}
      />
    } />

  NOTE: this intentionally does NOT render the old level matrix. That code stays
  in App.tsx (just unreachable) until any remaining interactiveLesson content is
  migrated onto CourseLab. Don't delete it yet.
*/

// Keep this date in sync with App.tsx's WRITING_LAB_IS_NEW.
const WRITING_LAB_IS_NEW = new Date() < new Date('2026-09-15');

// --- Course shelf config ------------------------------------------------------
// Each course is one entry. Courses with a `moduleType` are data-aware: the shelf
// counts their modules/lessons and derives status (live if any modules exist,
// otherwise "coming soon"). Courses with `planned: true` and no moduleType are
// static roadmap placeholders (no schema in Sanity yet).
type CourseConfig = {
  key: string;
  title: string;
  description: string;
  route: string | null;      // where "Open ->" goes; null while not launched
  moduleType?: string;       // Sanity module doc type, e.g. 'readingModule'
  bankType?: string;         // Sanity lesson doc type, e.g. 'readingBank'
  planned?: boolean;         // true = static placeholder, no schema yet
  featured?: boolean;        // renders the big hero card at the top
  accent: { bg: string; color: string };
  gradient?: string;         // premium icon-tile gradient
  icon: React.ReactNode;
  // Featured-only fields:
  kicker?: string;           // small caps line above the wordmark
  wordmark?: string;         // the big serif word, e.g. 'Write'
  heroSubtitle?: string;
  heroTagline?: string;      // the rust italic line
  levelRange?: string;       // shown on the hero; rarely changes, so it's static
  fallbackModules?: number;  // shown on the hero until live counts load
  fallbackLessons?: number;
};

const IconPencil = ({ color = 'currentColor' }: { color?: string }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>);
const IconBook = ({ color = 'currentColor' }: { color?: string }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconGrammar = ({ color = 'currentColor' }: { color?: string }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5h16v2"/><path d="M9 20h6"/><path d="M12 5v15"/></svg>);

const COURSES: CourseConfig[] = [
  {
    key: 'writing',
    title: 'Writing Lab',
    description: 'Build writing from the sentence up to full academic essays.',
    route: '/writing',
    moduleType: 'writingModule',
    bankType: 'writingBank',
    featured: true,
    accent: { bg: '#EEF2FF', color: '#4F46E5' },
    gradient: 'linear-gradient(140deg, #6366F1, #4338CA)',
    icon: <IconPencil />,
    kicker: 'THE MASTER WRITING COURSE',
    wordmark: 'Write',
    heroSubtitle: 'From your first sentence to full academic essays — one lesson at a time.',
    heroTagline: 'Free, for everyone. Always.',
    levelRange: 'A1–C1',
    fallbackModules: 9,
    fallbackLessons: 67,
  },
  {
    key: 'reading',
    title: 'Reading Lab',
    description: 'Close reading, inference, and comprehension across genres.',
    route: null, // add '/reading' + a ReadingLab wrapper when it goes live
    moduleType: 'readingModule',
    bankType: 'readingBank',
    accent: { bg: '#ECFDF5', color: '#059669' },
    gradient: 'linear-gradient(140deg, #34D399, #059669)',
    icon: <IconBook />,
  },
  {
    key: 'grammar',
    title: 'Grammar Lab',
    description: 'Master the rules through clear, structured, level-based lessons.',
    route: null,
    planned: true, // no readingModule-style schema yet -> static placeholder
    accent: { bg: '#F5F3FF', color: '#7C3AED' },
    gradient: 'linear-gradient(140deg, #A78BFA, #7C3AED)',
    icon: <IconGrammar />,
  },
];

type Counts = Record<string, { modules: number; lessons: number }>;
type Status = 'live' | 'coming-soon' | 'planned';

export const Homepage = ({
  reviews,
  onNavigate,
  onSelectBook,
}: {
  reviews: any[];
  onNavigate: (path?: string) => void;
  onSelectBook: (book: any) => void;
}) => {
  const [counts, setCounts] = useState<Counts>({});

  // Derive live module/lesson counts for every data-aware course. One cheap
  // count() query per type; runs once on mount.
  useEffect(() => {
    let alive = true;
    const dataCourses = COURSES.filter(c => c.moduleType && c.bankType);
    Promise.all(
      dataCourses.map(async (c) => {
        const [modules, lessons] = await Promise.all([
          client.fetch(`count(*[_type == $t])`, { t: c.moduleType }),
          client.fetch(`count(*[_type == $t])`, { t: c.bankType }),
        ]);
        return [c.key, { modules: modules || 0, lessons: lessons || 0 }] as const;
      })
    )
      .then((entries) => { if (alive) setCounts(Object.fromEntries(entries)); })
      .catch(console.error);
    return () => { alive = false; };
  }, []);

  const statusOf = (c: CourseConfig): Status => {
    if (c.planned) return 'planned';
    if ((counts[c.key]?.modules || 0) > 0) return 'live';
    return 'coming-soon';
  };

  const featured = COURSES.find(c => c.featured);
  const featuredCounts = featured ? counts[featured.key] : undefined;

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
      <style>{`
        @media (max-width: 820px) {
          .wl-hero-body { flex-direction: column !important; align-items: stretch !important; gap: 24px !important; }
          .wl-hero-side { padding-left: 0 !important; border-left: none !important; border-top: 1px solid #E2E8F0; padding-top: 22px !important; }
          .wl-hero-side .wl-cta { width: 100%; }
        }
        @media (max-width: 640px) {
          .hp-welcome-card { padding: 28px 22px !important; }
          .hp-welcome-title { font-size: 32px !important; }
        }
      `}</style>

      {/* ================= WELCOME / IDENTITY ================= */}
      <div style={{ maxWidth: '1120px', margin: '0 auto 30px', fontFamily: '"Fredoka", sans-serif' }}>
        <div className="hp-welcome-card" style={{ position: 'relative', background: '#ffffff', border: '1px solid #ECEEF3', borderRadius: '26px', boxShadow: '0 20px 45px -26px rgba(15,23,42,0.2)', padding: '42px 44px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(99,102,241,0.10), rgba(99,102,241,0) 70%)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', right: '120px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(180,83,9,0.07), rgba(180,83,9,0) 70%)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1.8px', textTransform: 'uppercase', color: '#6366F1', background: '#EEF2FF', padding: '7px 14px', borderRadius: '9999px', marginBottom: '22px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#6366F1"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" /></svg>
              Welcome to Lit &amp; Learn
            </div>

            <h1 className="wl-serif hp-welcome-title" style={{ fontWeight: 600, fontSize: '46px', lineHeight: 1.08, color: '#0F172A', letterSpacing: '-1px', maxWidth: '16ch', margin: 0 }}>
              Learn English, <span style={{ fontStyle: 'italic', color: '#4F46E5' }}>one good book</span> at a time.
            </h1>

            <p style={{ fontSize: '1.08rem', color: '#475569', lineHeight: 1.65, margin: '20px 0 0', maxWidth: '54ch' }}>
              A free, open platform built by one teacher — lessons, practice, and reviews of books worth reading.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '26px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', fontWeight: 500, color: '#334155', background: '#ffffff', border: '1px solid #E7EAF0', padding: '8px 15px', borderRadius: '12px', boxShadow: '0 4px 10px -6px rgba(15,23,42,0.15)' }}>
                <span style={{ display: 'inline-flex', width: '20px', height: '20px', borderRadius: '7px', background: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>Always free
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', fontWeight: 500, color: '#334155', background: '#ffffff', border: '1px solid #E7EAF0', padding: '8px 15px', borderRadius: '12px', boxShadow: '0 4px 10px -6px rgba(15,23,42,0.15)' }}>
                <span style={{ display: 'inline-flex', width: '20px', height: '20px', borderRadius: '7px', background: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span>Built by one teacher
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', fontWeight: 500, color: '#334155', background: '#ffffff', border: '1px solid #E7EAF0', padding: '8px 15px', borderRadius: '12px', boxShadow: '0 4px 10px -6px rgba(15,23,42,0.15)' }}>
                <span style={{ display: 'inline-flex', width: '20px', height: '20px', borderRadius: '7px', background: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg></span>A1 to C1
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FEATURED COURSE (hero) ================= */}
      {featured && (
        <div className="soft-card" style={{ maxWidth: '1120px', margin: '0 auto 32px auto', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '32px', boxShadow: '0 20px 45px -18px rgba(15,23,42,0.12)', padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid #0F172A', paddingBottom: '14px', marginBottom: '24px' }}>
            <span className="wl-kicker" style={{ fontSize: '0.72rem', letterSpacing: '2.5px', color: '#0F172A', fontWeight: '600' }}>{featured.kicker}</span>
            {WRITING_LAB_IS_NEW && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.72rem', letterSpacing: '2px', color: '#B45309', fontWeight: '600' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B' }} />NEW
              </span>
            )}
          </div>

          <div className="wl-hero-body" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <h3 className="wl-serif wl-write" style={{ fontStyle: 'italic', fontWeight: '600', lineHeight: '0.95', color: '#0F172A', letterSpacing: '-2px', margin: 0 }}>{featured.wordmark}<span style={{ color: '#4F46E5' }}>.</span></h3>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: '12px', transform: 'rotate(6deg)' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: '1.65', maxWidth: '460px', margin: '18px 0 0' }}>{featured.heroSubtitle}</p>
              <p className="wl-serif" style={{ fontStyle: 'italic', fontSize: '1.15rem', color: '#B45309', margin: '10px 0 0' }}>{featured.heroTagline}</p>
            </div>

            <div className="wl-hero-side" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '22px', paddingLeft: '40px', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '28px' }}>
                <div><div style={{ fontSize: '1.35rem', fontWeight: '600', color: '#0F172A' }}>{featuredCounts?.modules ?? featured.fallbackModules}</div><div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#94A3B8', fontWeight: '600' }}>MODULES</div></div>
                <div><div style={{ fontSize: '1.35rem', fontWeight: '600', color: '#0F172A' }}>{featuredCounts?.lessons ?? featured.fallbackLessons}</div><div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#94A3B8', fontWeight: '600' }}>LESSONS</div></div>
                <div><div style={{ fontSize: '1.35rem', fontWeight: '600', color: '#0F172A' }}>{featured.levelRange}</div><div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#94A3B8', fontWeight: '600' }}>ALL LEVELS</div></div>
              </div>
              <button onClick={() => onNavigate(featured.route || undefined)} className="wl-cta" style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '15px 30px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 24px -8px rgba(79,70,229,0.45)', transition: 'all 0.2s', fontFamily: '"Fredoka", sans-serif', whiteSpace: 'nowrap' }}>Start the course →</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COURSE SHELF ================= */}
      <div style={{ maxWidth: '1120px', margin: '0 auto 36px' }}>
        <div style={{ fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: '700', margin: '0 0 18px' }}>All courses</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {COURSES.map((c) => {
            const status = statusOf(c);
            const cCounts = counts[c.key];
            const clickable = status === 'live' && !!c.route;

            // Every card is the same premium shell — white, soft border, soft
            // shadow. Status is a quiet badge, never a downgrade of the card.
            const StatusBadge = () => {
              if (status === 'live') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', background: '#ECFDF5', color: '#047857' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />Live</span>;
              return <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', background: c.accent.bg, color: c.accent.color }}>Coming soon</span>;
            };

            // Footer right-hand cue by status.
            const footerRight =
              status === 'live'
                ? <span style={{ fontSize: '0.9rem', color: c.accent.color, fontWeight: 600 }}>Open →</span>
                : status === 'coming-soon'
                ? <span style={{ fontSize: '0.86rem', color: c.accent.color, fontWeight: 600 }}>In development</span>
                : <span style={{ fontSize: '0.86rem', color: c.accent.color, fontWeight: 600 }}>Planned</span>;

            const footerLeft =
              status === 'live'
                ? (cCounts ? `${cCounts.modules} module${cCounts.modules !== 1 ? 's' : ''} · ${cCounts.lessons} lesson${cCounts.lessons !== 1 ? 's' : ''}` : '\u00A0')
                : status === 'coming-soon'
                ? 'Curriculum in progress'
                : 'On the roadmap';

            return (
              <button
                key={c.key}
                onClick={clickable ? () => onNavigate(c.route!) : undefined}
                className={clickable ? 'soft-card' : undefined}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ECEEF3',
                  borderRadius: '22px',
                  padding: '24px',
                  textAlign: 'left',
                  fontFamily: '"Fredoka", sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '188px',
                  cursor: clickable ? 'pointer' : 'default',
                  boxShadow: '0 18px 40px -24px rgba(15,23,42,0.22)',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: c.gradient || c.accent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px -8px ${c.accent.color}99` }}>
                    {React.isValidElement(c.icon)
                      ? React.cloneElement(c.icon as React.ReactElement<{ color?: string }>, { color: '#ffffff' })
                      : c.icon}
                  </div>
                  <StatusBadge />
                </div>

                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.15 }}>{c.title}</div>
                <p style={{ fontSize: '0.92rem', color: '#475569', margin: '6px 0 18px', lineHeight: 1.5, flex: 1 }}>{c.description}</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 500, color: '#475569', background: '#F5F6F8', border: '1px solid #EDEFF3', padding: '5px 11px', borderRadius: '9999px' }}>
                    {status === 'live' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                    )}
                    {status === 'live' && cCounts ? (
                      <span><b style={{ color: '#0F172A', fontWeight: 700 }}>{cCounts.modules}</b> modules · <b style={{ color: '#0F172A', fontWeight: 700 }}>{cCounts.lessons}</b> lessons</span>
                    ) : footerLeft}
                  </span>
                  {footerRight}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= RECENTLY ADDED (activity feed) ================= */}
      <RecentlyAdded onNavigate={onNavigate} />

      {/* ================= RECENTLY REVIEWED ================= */}
      <RecentReviews
        reviews={reviews}
        onSelectBook={onSelectBook}
        onViewAll={() => onNavigate('/reviews')}
      />
    </div>
  );
};