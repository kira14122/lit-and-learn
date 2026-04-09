import React, { useState } from 'react';

const IconFiction = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IconNonFiction = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconBeginner = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="10" rx="1" strokeOpacity="0.2"/>
    <rect x="16" y="6" width="4" height="14" rx="1" strokeOpacity="0.2"/>
  </svg>
);
const IconIntermediate = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="10" rx="1" fill="currentColor"/>
    <rect x="16" y="6" width="4" height="14" rx="1" strokeOpacity="0.2"/>
  </svg>
);
const IconAdvanced = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="10" rx="1" fill="currentColor"/>
    <rect x="16" y="6" width="4" height="14" rx="1" fill="currentColor"/>
  </svg>
);

const fictionCategories = ["British Literature", "American Literature", "Russian Literature", "Arabic Literature", "Other Literature"];
const nonFictionCategories = ["Informative & Educational", "Self Improvement", "Language Learning & Teaching"];

const CEFR_COLORS = {
  A1: { bg: '#DCFCE7', color: '#166534' }, A2: { bg: '#D1FAE5', color: '#065F46' },
  B1: { bg: '#DBEAFE', color: '#1E40AF' }, B2: { bg: '#EDE9FE', color: '#5B21B6' },
  C1: { bg: '#FEF3C7', color: '#92400E' }, C2: { bg: '#FFE4E6', color: '#9F1239' },
};

const BOOKS = [
  { id: 1, type: "Fiction", subCategory: "American Literature", title: "The Great Gatsby", author: "F. Scott Fitzgerald", blurb: "A dazzling exploration of the American Dream and the gilded excess of the 1920s.", cefr: "B2", coverColor: "#4338CA", coverAccent: "#818CF8", dateAdded: 2025, popularity: 95 },
  { id: 2, type: "Fiction", subCategory: "British Literature", title: "Pride and Prejudice", author: "Jane Austen", blurb: "A classic tale of love, social standing, and the wit that binds them together.", cefr: "B2", coverColor: "#0F6E56", coverAccent: "#5DCAA5", dateAdded: 2024, popularity: 98 },
  { id: 3, type: "Fiction", subCategory: "Russian Literature", title: "Crime and Punishment", author: "Fyodor Dostoevsky", blurb: "A psychological deep-dive into guilt, morality, and the path to redemption.", cefr: "C1", coverColor: "#7C2D12", coverAccent: "#F97316", dateAdded: 2024, popularity: 88 },
  { id: 4, type: "Fiction", subCategory: "Arabic Literature", title: "Cities of Salt", author: "Abdelrahman Munif", blurb: "An epic saga of the Arab world's upheaval with the discovery of oil.", cefr: "C1", coverColor: "#854F0B", coverAccent: "#FCD34D", dateAdded: 2025, popularity: 76 },
  { id: 5, type: "Fiction", subCategory: "Other Literature", title: "The Alchemist", author: "Paulo Coelho", blurb: "A timeless fable about following your dreams across borders and cultures.", cefr: "B1", coverColor: "#1E3A5F", coverAccent: "#60A5FA", dateAdded: 2024, popularity: 99 },
  { id: 6, type: "Non-Fiction", subCategory: "Self Improvement", title: "Atomic Habits", author: "James Clear", blurb: "A practical, science-backed guide to building good habits and breaking bad ones.", cefr: "B2", coverColor: "#1F2937", coverAccent: "#F59E0B", dateAdded: 2025, popularity: 97 },
  { id: 7, type: "Non-Fiction", subCategory: "Informative & Educational", title: "Sapiens", author: "Yuval Noah Harari", blurb: "A sweeping history of humankind that challenges everything you thought you knew.", cefr: "C1", coverColor: "#1E3A5F", coverAccent: "#93C5FD", dateAdded: 2024, popularity: 96 },
  { id: 8, type: "Non-Fiction", subCategory: "Language Learning & Teaching", title: "Teaching by Principles", author: "H. Douglas Brown", blurb: "An essential guide for language teachers grounded in sound, principled pedagogy.", cefr: "C1", coverColor: "#134E4A", coverAccent: "#5EEAD4", dateAdded: 2025, popularity: 82 },
];

const RESOURCES = [
  { id: 1, title: "Irregular Verbs List", description: "A complete cheat sheet for the 100 most common irregular verbs.", type: "PDF", icon: "📝" },
  { id: 2, title: "Essay Outline", description: "A blank template to help structure your academic essays.", type: "Word Doc", icon: "📄" },
];

const LEVELS = [
  { name: "Beginner", icon: <IconBeginner />, subLevels: ["Level 1", "Level 2", "Level 3"] },
  { name: "Intermediate", icon: <IconIntermediate />, subLevels: ["Level 4", "Level 5", "Level 6"] },
  { name: "Advanced", icon: <IconAdvanced />, subLevels: ["Level 7", "Level 8", "Business English"] },
];

const INTERMEDIATE_GRAMMAR = {
  1: ["Simple present and present continuous","Dynamic and stative verbs","Question forms: direct questions","Question forms: indirect questions"],
  2: ["Present perfect","Already, just, and yet","Present perfect and simple past"],
  3: ["Simple past and past continuous","Past perfect"],
  4: ["Future forms (predictions, present continuous, will, going to, simple present)"],
  5: ["Modal verbs (obligation, prohibition and permission, advice and recommendations, must and have to)","First conditional","When, as soon as, unless, until, before"],
  6: ["Purpose: to, for, and so that","Certainty and possibility","In the present and in the past"],
  7: ["Used to, would, and simple past","Comparative adverbs","Comparative patterns"],
  8: ["Verb patterns: -ing form and infinitive","Present perfect and present perfect continuous","How long?"],
  9: ["Passives","Articles","Quantifiers"],
  10: ["Second conditional","Defining relative clauses"],
  11: ["Reported speech","Reporting verbs","Thoughts"],
  12: ["Third conditional","Should have and could have"],
};

const generateUnits = (level) => Array.from({ length: 12 }, (_, i) => {
  const u = i + 1;
  let grammar = "Coming soon...";
  if (level === "Intermediate" && INTERMEDIATE_GRAMMAR[u]) grammar = INTERMEDIATE_GRAMMAR[u].join(" · ");
  let content = { grammar, vocab: "Coming soon...", listening: "Coming soon...", reading: "Coming soon...", writing: "Coming soon..." };
  if (i === 0) {
    if (level === "Beginner") content = { grammar: "The Verb 'To Be' (am, is, are)", vocab: "Common greetings and numbers 1–20", listening: "Audio: Meeting Someone New", reading: "Dialogue: At the Coffee Shop", writing: "Write a 3-sentence introduction." };
    else if (level === "Advanced") content = { grammar: "Mixed Conditionals (3rd and 2nd)", vocab: "Idiomatic Expressions & Phrasal Verbs", listening: "Audio: Academic Lecture on Economics", reading: "Essay: The Ethics of Artificial Intelligence", writing: "Write a persuasive argumentative essay." };
  }
  return { id: u, title: `Unit ${u}`, level, content };
});

const SKILL_COLORS = {
  grammar: { bg: '#EEF2FF', color: '#4F46E5' }, vocab: { bg: '#FDF4FF', color: '#9333EA' },
  listening: { bg: '#F0FDF4', color: '#16A34A' }, reading: { bg: '#FFF7ED', color: '#EA580C' }, writing: { bg: '#EFF6FF', color: '#2563EB' },
};

const BookCover = ({ book }) => {
  const words = book.title.split(' ').slice(0, 2).map(w => w[0]).join('');
  return (
    <div style={{ width: '100%', height: 160, borderRadius: '10px 10px 4px 4px', background: book.coverColor, position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px', background: book.coverAccent, opacity: 0.25 }}/>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 60, height: 60, borderRadius: '0 60px 0 0', background: book.coverAccent, opacity: 0.18 }}/>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: book.coverAccent, opacity: 0.5 }}/>
      <span style={{ fontSize: 36, fontWeight: 800, color: book.coverAccent, letterSpacing: '-0.03em', opacity: 0.9, fontFamily: 'Georgia, serif', zIndex: 1 }}>{words}</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', zIndex: 1 }}>{book.type}</span>
    </div>
  );
};

const styles = {
  page: { fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8FAFC', backgroundImage: 'linear-gradient(135deg, #F8FAFC 0%, #E0E7FF 100%)', minHeight: '100vh', color: '#0F172A', padding: '40px 20px 0' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '50px' },
  navContainer: { display: 'flex', justifyContent: 'center', marginBottom: '50px' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', gap: '8px', flexWrap: 'wrap' },
  navButton: (a) => ({ background: a ? '#4F46E5' : 'transparent', color: a ? '#fff' : '#64748B', border: 'none', fontSize: '15px', fontWeight: '600', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: a ? '0 4px 14px rgba(79,70,229,0.39)' : 'none' }),
  subMenu: { display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  subCategoryMenu: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  subButton: (a) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: '2px solid', borderColor: a ? '#4F46E5' : '#E2E8F0', backgroundColor: a ? '#EEF2FF' : '#fff', color: a ? '#4F46E5' : '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }),
  smallBadgeButton: (a) => ({ padding: '8px 16px', borderRadius: '24px', border: 'none', backgroundColor: a ? '#1E293B' : '#fff', color: a ? '#fff' : '#475569', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: a ? '0 4px 6px -1px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', borderTop: '4px solid #818CF8', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  levelCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer', borderTop: '4px solid #A78BFA', fontSize: '1.2rem', fontWeight: '600', color: '#0F172A', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  iconWrapper: { color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', transform: 'scale(1.2)' },
  backButton: { background: 'transparent', border: 'none', color: '#4F46E5', padding: '0', cursor: 'pointer', marginBottom: '24px', fontWeight: '600', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  miniPdfButton: { backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginLeft: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
  skillRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #E2E8F0' },
  sectionTitle: { textAlign: 'center', marginBottom: '30px', color: '#0F172A', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' },
};

const BookReviews = () => {
  const [bookCategory, setBookCategory] = useState('Fiction');
  const [fictionSub, setFictionSub] = useState('American Literature');
  const [nonFictionSub, setNonFictionSub] = useState('Self Improvement');
  const [sortBy, setSortBy] = useState('Newest Added');

  const activeSub = bookCategory === 'Fiction' ? fictionSub : nonFictionSub;
  const setSub = bookCategory === 'Fiction' ? setFictionSub : setNonFictionSub;

  let displayed = BOOKS.filter(b => b.type === bookCategory && b.subCategory === activeSub);
  if (sortBy === 'Alphabetical') displayed = [...displayed].sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === 'Most Popular') displayed = [...displayed].sort((a, b) => b.popularity - a.popularity);
  else displayed = [...displayed].sort((a, b) => b.dateAdded - a.dateAdded);

  return (
    <div>
      <div style={styles.subMenu}>
        <button style={styles.subButton(bookCategory === 'Fiction')} onClick={() => setBookCategory('Fiction')}><IconFiction /> Fiction</button>
        <button style={styles.subButton(bookCategory === 'Non-Fiction')} onClick={() => setBookCategory('Non-Fiction')}><IconNonFiction /> Non-Fiction</button>
      </div>
      <div style={styles.subCategoryMenu}>
        {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => (
          <button key={cat} style={styles.smallBadgeButton(activeSub === cat)} onClick={() => setSub(cat)}>{cat}</button>
        ))}
      </div>

      {/* Sort row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '500' }}>Sort by</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: '0.85rem', padding: '7px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', backgroundColor: '#fff', color: '#1E293B', fontWeight: '500', cursor: 'pointer', outline: 'none' }}>
          {['Newest Added', 'Most Popular', 'Alphabetical'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      <div style={styles.grid}>
        {displayed.length > 0 ? displayed.map(book => (
          <div key={book.id} style={styles.card}>
            <BookCover book={book} />
            <div style={{ padding: '16px 18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', lineHeight: 1.3, flex: 1 }}>{book.title}</h3>
                <span style={{ marginLeft: 10, flexShrink: 0, fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: CEFR_COLORS[book.cefr]?.bg, color: CEFR_COLORS[book.cefr]?.color }}>{book.cefr}</span>
              </div>
              <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '0.8rem' }}>by {book.author}</p>
              <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>{book.blurb}</p>
            </div>
          </div>
        )) : (
          <p style={{ color: '#9ca3af', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No reviews posted yet.</p>
        )}
      </div>
    </div>
  );
};

const EnglishCorner = () => {
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeSubLevel, setActiveSubLevel] = useState(null);
  const [activeUnit, setActiveUnit] = useState(null);

  if (!activeLevel) return (
    <>
      <h2 style={styles.sectionTitle}>Select Your Level</h2>
      <div style={styles.grid}>
        {LEVELS.map(l => (
          <div key={l.name} style={styles.levelCard} onClick={() => setActiveLevel(l.name)}>
            <div style={styles.iconWrapper}>{l.icon}</div>{l.name}
          </div>
        ))}
      </div>
    </>
  );

  if (!activeSubLevel) {
    const lvl = LEVELS.find(l => l.name === activeLevel);
    return (
      <>
        <button style={styles.backButton} onClick={() => setActiveLevel(null)}>← Back to Levels</button>
        <h2 style={{ marginBottom: '24px', color: '#111827', fontSize: '1.25rem', fontWeight: '600' }}>{activeLevel} — Select a Level</h2>
        <div style={styles.grid}>
          {lvl.subLevels.map(sub => (
            <div key={sub} style={{ ...styles.levelCard, padding: '28px 20px' }} onClick={() => setActiveSubLevel(sub)}>
              <div style={styles.iconWrapper}>{lvl.icon}</div>{sub}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!activeUnit) return (
    <>
      <button style={styles.backButton} onClick={() => setActiveSubLevel(null)}>← Back to {activeLevel}</button>
      <h2 style={{ marginBottom: '24px', color: '#111827', fontSize: '1.25rem', fontWeight: '600' }}>{activeSubLevel} — Select a Unit</h2>
      <div style={styles.grid}>
        {generateUnits(activeLevel).map(unit => (
          <div key={unit.id} style={{ ...styles.card, cursor: 'pointer', padding: '20px' }} onClick={() => setActiveUnit(unit.id)}>
            <h3 style={{ margin: 0, color: '#111827', fontSize: '1rem', fontWeight: '500' }}>{unit.title}</h3>
          </div>
        ))}
      </div>
    </>
  );

  const unit = generateUnits(activeLevel).find(u => u.id === activeUnit);
  return (
    <>
      <button style={styles.backButton} onClick={() => setActiveUnit(null)}>← Back to Units</button>
      <div style={{ ...styles.card, padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', fontWeight: '600' }}>{unit.title}</h2>
          <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '500' }}>{activeSubLevel}</span>
          <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '500' }}>{activeLevel}</span>
        </div>
        {Object.entries(unit.content).map(([skill, topic]) => {
          const c = SKILL_COLORS[skill] || { bg: '#f9fafb', color: '#374151' };
          return (
            <div key={skill} style={styles.skillRow}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', marginTop: '2px' }}>{skill}</span>
                <span style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>{topic}</span>
              </div>
              <button style={styles.miniPdfButton}>Download</button>
            </div>
          );
        })}
      </div>
    </>
  );
};

const LEGAL = {
  'Privacy Policy': `Your privacy matters to us. Lit & Learn collects only the information you voluntarily provide (such as your email for newsletter signup) and does not share, sell, or distribute your personal data to third parties. We use your email solely to send updates about new book reviews and lessons. You may unsubscribe at any time by clicking the link in any email we send. We do not use tracking cookies beyond basic, anonymous site analytics.`,
  'Terms of Use': `By accessing and using Lit & Learn, you agree to use this website for personal, non-commercial educational purposes only. All written content — including book reviews, lesson materials, and resources — is the intellectual property of Lit & Learn and may not be reproduced or redistributed without permission. We reserve the right to update or remove content at any time. Use of this site is at your own discretion.`,
  'Cookie Policy': `Lit & Learn uses only essential cookies necessary for the site to function correctly. We do not use advertising or tracking cookies. Anonymous analytics may be collected to help us understand how visitors use the site and improve the experience. By continuing to use this website, you consent to the use of these limited cookies. You can disable cookies in your browser settings at any time.`,
};

const LegalModal = ({ title, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '560px', width: '100%', padding: '36px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: 'none', borderRadius: '8px', width: 32, height: 32, cursor: 'pointer', fontSize: '16px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: '700', color: '#0F172A' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.75' }}>{LEGAL[title]}</p>
    </div>
  </div>
);

const Footer = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [legalModal, setLegalModal] = useState(null);

  return (
    <footer style={{ background: '#0F172A', color: '#94A3B8', marginTop: '80px', padding: '60px 20px 30px' }}>
      {legalModal && <LegalModal title={legalModal} onClose={() => setLegalModal(null)} />}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px', marginBottom: '48px' }}>

          {/* Brand */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>Lit &amp; Learn</p>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', lineHeight: '1.7', color: '#64748B' }}>Mastering English through global literature — one page at a time.</p>
            <div style={{ display: 'flex', gap: '14px' }}>
              {[
                { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.649zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { label: 'IG', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
                { label: 'YT', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
              ].map(s => (
                <a key={s.label} href="#" style={{ width: 36, height: 36, borderRadius: '10px', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1E293B'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#94A3B8"><path d={s.path}/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Explore</p>
            {['Book Reviews', 'English Corner', 'Resources', 'About', 'Contact'].map(l => (
              <p key={l} style={{ margin: '0 0 10px' }}>
                <a href="#" onClick={e => { e.preventDefault(); onNavigate(l); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#C7D2FE'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>{l}</a>
              </p>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Newsletter</p>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6 }}>Get new reviews and lessons delivered to your inbox.</p>
            {subscribed ? (
              <p style={{ color: '#86EFAC', fontSize: '0.875rem', fontWeight: '500' }}>Thanks for subscribing!</p>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" style={{ flex: 1, minWidth: 140, padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #1E293B', background: '#1E293B', color: '#fff', fontSize: '0.875rem', outline: 'none' }}/>
                <button onClick={() => email && setSubscribed(true)} style={{ padding: '9px 18px', borderRadius: '10px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>© 2025 Lit &amp; Learn. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Terms of Use', 'Cookie Policy'].map(l => (
              <a key={l} href="#" onClick={e => { e.preventDefault(); setLegalModal(l); }} style={{ fontSize: '0.8rem', color: '#475569', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Book Reviews');
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '420px', margin: '0 auto', display: 'block' }}>
            <defs>
              <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F8FAFC"/><stop offset="100%" stopColor="#EEF2FF"/></linearGradient>
              <linearGradient id="markGrad" x1="0%" y1="0%" x2="135%" y2="135%"><stop offset="0%" stopColor="#4338CA"/><stop offset="50%" stopColor="#6D28D9"/><stop offset="100%" stopColor="#9333EA"/></linearGradient>
              <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4F46E5"/><stop offset="100%" stopColor="#9333EA"/></linearGradient>
              <linearGradient id="pageLeft" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.85"/></linearGradient>
              <linearGradient id="pageRight" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.85"/></linearGradient>
              <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#EDE9FE"/><stop offset="100%" stopColor="#C4B5FD"/></linearGradient>
              <linearGradient id="coverLeft2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#818CF8"/><stop offset="100%" stopColor="#6D28D9"/></linearGradient>
              <linearGradient id="coverRight2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient>
              <linearGradient id="shimmer" x1="0%" y1="0%" x2="60%" y2="60%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.18"/><stop offset="100%" stopColor="#ffffff" stopOpacity="0"/></linearGradient>
              <filter id="badgeShadow"><feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#4F46E5" floodOpacity="0.3"/></filter>
              <filter id="bookShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2E1065" floodOpacity="0.35"/></filter>
              <filter id="textShadow2"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#4F46E5" floodOpacity="0.1"/></filter>
            </defs>
            <rect width="600" height="360" fill="url(#bgGrad)" rx="20"/>
            <circle cx="162" cy="180" r="80" fill="none" stroke="#6366F1" strokeWidth="0.8" opacity="0.1"/>
            <circle cx="162" cy="180" r="95" fill="none" stroke="#9333EA" strokeWidth="0.5" opacity="0.06"/>
            <circle cx="162" cy="180" r="66" fill="url(#markGrad)" filter="url(#badgeShadow)"/>
            <circle cx="162" cy="180" r="66" fill="url(#shimmer)"/>
            <circle cx="162" cy="180" r="60" fill="none" stroke="white" strokeWidth="0.6" opacity="0.15"/>
            <g transform="translate(162,183)" filter="url(#bookShadow)">
              <ellipse cx="0" cy="30" rx="38" ry="5" fill="#1E1B4B" opacity="0.25"/>
              <path d="M-42,-28 L-6,-28 L-6,28 L-42,28 Q-45,28 -45,25 L-45,-25 Q-45,-28 -42,-28 Z" fill="url(#coverLeft2)"/>
              <path d="M-45,25 L-45,30 Q-45,33 -42,33 L-6,33 L-6,28 Z" fill="#4338CA" opacity="0.6"/>
              <path d="M6,-28 L42,-28 Q45,-28 45,-25 L45,25 Q45,28 42,28 L6,28 L6,-28 Z" fill="url(#coverRight2)"/>
              <path d="M45,25 L45,30 Q45,33 42,33 L6,33 L6,28 Z" fill="#6D28D9" opacity="0.6"/>
              <rect x="-39" y="-24" width="33" height="48" rx="1" fill="#EEF2FF" opacity="0.5"/>
              <rect x="-38" y="-25" width="32" height="48" rx="1" fill="url(#pageLeft)"/>
              <rect x="6" y="-24" width="33" height="48" rx="1" fill="#EEF2FF" opacity="0.5"/>
              <rect x="6" y="-25" width="32" height="48" rx="1" fill="url(#pageRight)"/>
              {[[-14,-34,-10],[-7,-34,-10],[0,-34,-10],[7,-34,-10],[14,-34,-18]].map(([y,x1,x2],i)=>(
                <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
              ))}
              {[[-14,10,34],[-7,10,34],[0,10,34],[7,10,34],[14,10,24]].map(([y,x1,x2],i)=>(
                <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
              ))}
              <rect x="-5.5" y="-30" width="11" height="64" rx="2" fill="url(#spineGrad)"/>
              <line x1="-3" y1="-22" x2="3" y2="-22" stroke="#A78BFA" strokeWidth="0.8" opacity="0.6"/>
              <line x1="-3" y1="20" x2="3" y2="20" stroke="#A78BFA" strokeWidth="0.8" opacity="0.6"/>
              <g transform="translate(-22,-20)" opacity="0.55">
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#4F46E5" strokeWidth="1" strokeLinecap="round"/>
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#4F46E5" strokeWidth="1" strokeLinecap="round"/>
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#4F46E5" strokeWidth="0.7" strokeLinecap="round"/>
                <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#4F46E5" strokeWidth="0.7" strokeLinecap="round"/>
              </g>
            </g>
            <line x1="252" y1="120" x2="252" y2="240" stroke="url(#textGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            <text x="276" y="168" fontFamily="Georgia, 'Times New Roman', serif" fontSize="48" fontWeight="700" fill="url(#textGrad)" filter="url(#textShadow2)" letterSpacing="-0.02em">Lit &amp; Learn</text>
            <text x="278" y="196" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11" fontWeight="600" fill="#6366F1" letterSpacing="0.2em" opacity="0.75">ENGLISH · LITERATURE · LANGUAGE</text>
            <rect x="276" y="208" width="282" height="2" rx="1" fill="url(#textGrad)" opacity="0.2"/>
          </svg>
        </header>

        <div style={styles.navContainer}>
          <nav style={styles.nav}>
            {['Book Reviews', 'English Corner', 'Resources', 'About', 'Contact'].map(tab => (
              <button key={tab} style={styles.navButton(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </nav>
        </div>

        <main>
          {activeTab === 'Book Reviews' && <BookReviews />}
          {activeTab === 'English Corner' && <EnglishCorner />}
          {activeTab === 'Resources' && (
            <div>
              <h2 style={styles.sectionTitle}>Materials</h2>
              <div style={styles.grid}>
                {RESOURCES.map(r => (
                  <div key={r.id} style={styles.card}>
                    <div style={{ padding: '20px 18px' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{r.icon}</div>
                      <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: '1.05rem', fontWeight: '600' }}>{r.title}</h3>
                      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>{r.description}</p>
                      <button style={{ ...styles.miniPdfButton, margin: 0, width: '100%', justifyContent: 'center' }}>Download {r.type}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'About' && (
            <div style={{ ...styles.card, maxWidth: '700px', margin: '0 auto', padding: '40px' }}>
              <h2 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>About the Teacher</h2>
              <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.7' }}>Welcome to my classroom. I am passionate about blending literature with language learning to help you achieve absolute fluency.</p>
            </div>
          )}
          {activeTab === 'Contact' && (
            <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
              <h2 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>Get in Touch</h2>
              <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0 0 24px' }}>Want to book a tutoring session or ask a question?</p>
              <a href="mailto:teacher@litandlearn.com" style={{ display: 'inline-block', backgroundColor: '#4F46E5', color: '#fff', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>Email Me</a>
            </div>
          )}
        </main>
      </div>
      <Footer onNavigate={setActiveTab} />
    </div>
  );
}