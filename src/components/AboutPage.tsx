import React, { useState } from 'react';

// ============================================================================
// AboutPage — the "About" section, lifted out of App.tsx so it can be edited
// on its own. Includes: hero + credentials, an "About Me" section, and
// "What's inside" cards that EXPAND IN PLACE (one open at a time).
//
// Easy edit points (all near the top / clearly marked):
//   CREDENTIALS — the pills under your name
//   FEATURES    — each section's tagline (short) + details (on expand)
//   The "About Me" paragraphs live in the JSX below, under the heading.
// Styling classes and the fadeInDown animation come from App.tsx.
// ============================================================================

interface AboutPageProps {
  onNavigate?: (path?: string) => void; // optional + unused; App.tsx stays untouched
}

const IconCap = () => (<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /><path d="M22 10v6" /></svg>);
const IconBook = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>);
const IconTarget = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
const IconStar = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const IconFolder = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>);
const IconChart = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>);
const IconChevron = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>);

const CREDENTIALS = ['PhD in English Linguistics', 'TESOL Certified', 'NY State Certified Instructor (BPSS)'];

const FEATURES = [
  {
    title: 'English Corner', icon: <IconBook />, bg: '#EEF2FF', color: '#4F46E5',
    tagline: 'Structured interactive lessons from beginner to advanced.',
    details: 'Your main learning path. Pick your level (Beginner, Intermediate, or Advanced), choose a sub-level, then work through the units. Each unit has interactive lessons to complete in order, and once you finish them all, a unit assessment unlocks to test what you\'ve learned.',
  },
  {
    title: 'Practice Hub', icon: <IconTarget />, bg: '#EFF6FF', color: '#3B82F6',
    tagline: 'Quick exercises to sharpen grammar and vocabulary.',
    details: 'Quick, standalone exercises for fast practice. Use it any time you want to drill grammar or vocabulary without going through a full lesson.',
  },
  {
    title: 'Book Reviews', icon: <IconStar />, bg: '#F3E8FF', color: '#A855F7',
    tagline: 'Literary analysis that builds reading and ideas.',
    details: 'Literary analysis and reviews of books. Read them to build your reading skills and explore ideas, and tap any word you don\'t know to save it to your vocabulary.',
  },
  {
    title: 'Resources', icon: <IconFolder />, bg: '#ECFDF5', color: '#10B981',
    tagline: 'Downloadable worksheets and audio, sorted by skill.',
    details: 'Downloadable worksheets and audio, organized by category (Grammar, Reading, Writing, Listening, Vocabulary). Pick a category, open a unit, and download the PDF or play the audio.',
  },
  {
    title: 'My Progress', icon: <IconChart />, bg: '#FEF3C7', color: '#F59E0B',
    tagline: 'Track saved words, lessons, and official grades.',
    details: 'Your personal dashboard. See your saved vocabulary, track which lessons you\'ve completed, and — when signed in — view your official grades and teacher feedback.',
  },
];

export const AboutPage = (_props: AboutPageProps) => {
  const [openTitle, setOpenTitle] = useState<string | null>(null);

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '820px', margin: '0 auto' }}>
      <div className="soft-card adapt-padding" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '56px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>

        {/* --- Hero --- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '2px solid #F1F5F9', paddingBottom: '36px', marginBottom: '36px' }}>
          <div style={{ width: '92px', height: '92px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <IconCap />
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '2.6rem', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>Meet Dr. Chouit Abderraouf</h2>
          <p style={{ color: '#64748B', fontSize: '1.1rem', margin: '0 0 20px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Creator & Founder of Lit & Learn</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {CREDENTIALS.map(c => (
              <span key={c} style={{ background: '#EEF2FF', color: '#4F46E5', padding: '8px 18px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '0.3px' }}>{c}</span>
            ))}
          </div>
        </div>

        {/* --- About Me: edit these paragraphs freely. --- */}
        <div style={{ marginBottom: '44px' }}>
          <h3 style={{ fontSize: '1.8rem', color: '#0F172A', margin: '0 0 18px 0', letterSpacing: '-0.5px' }}>About Me</h3>
          <p style={{ color: '#475569', fontSize: '1.2rem', lineHeight: '1.9', margin: '0 0 20px 0' }}>
            I'm Dr. Chouit Abderraouf — an English educator, a researcher in applied linguistics and translation studies, and the teacher behind Lit & Learn. I created this platform as a free and open space for anyone who wishes to learn and practise English — my own students and curious learners everywhere alike.
          </p>
          <p style={{ color: '#475569', fontSize: '1.2rem', lineHeight: '1.9', margin: '0 0 20px 0' }}>
            Literature has always been at the heart of how I learn and teach. Reading, more than anything, is what shaped my own command of English, and it remains the surest path I know to genuine fluency. Through stories, essays, and ideas drawn from across the world, language becomes something alive — words seen in real context, voices worth understanding, and topics worth discussing.
          </p>
          <p style={{ color: '#475569', fontSize: '1.2rem', lineHeight: '1.9', margin: '0 0 20px 0' }}>
            I also believe that language is acquired through use, and that practice refines mastery only when it is deliberate and well-guided. So in my approach the learner takes the lead — reading widely and engaging with thought-provoking ideas — while I guide the way and illuminate the finer, trickier points of the language.
          </p>
          <p style={{ color: '#475569', fontSize: '1.2rem', lineHeight: '1.9', margin: 0 }}>
            Lit & Learn brings that spirit into a single place: rigorous yet warm, rooted in literature, and always evolving. Wherever you begin, my aim is to help you read deeply, practise meaningfully, and arrive at a confident, lasting command of English.
          </p>
        </div>

        {/* --- What's inside (tap a card to expand its details) --- */}
        <div style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px' }}>What's inside — tap to learn how each part works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FEATURES.map(f => {
            const isOpen = openTitle === f.title;
            return (
              <div key={f.title} style={{ border: `1px solid ${isOpen ? '#C7D2FE' : '#E2E8F0'}`, borderRadius: '18px', background: '#ffffff', overflow: 'hidden', boxShadow: isOpen ? '0 12px 30px rgba(15,23,42,0.05)' : 'none', transition: 'all 0.25s' }}>
                <button
                  onClick={() => setOpenTitle(isOpen ? null : f.title)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '18px', padding: '20px 22px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '1.25rem', fontWeight: '600', color: '#0F172A' }}>{f.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.98rem', color: '#64748B', lineHeight: '1.4' }}>{f.tagline}</p>
                  </div>
                  <span style={{ color: isOpen ? f.color : '#94A3B8', display: 'flex', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}><IconChevron /></span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 24px 22px', animation: 'fadeInDown 0.25s ease-out' }}>
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '18px', color: '#475569', fontSize: '1.08rem', lineHeight: '1.75' }}>
                      {f.details}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};