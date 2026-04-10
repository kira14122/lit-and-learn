import React, { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import { PortableText } from '@portabletext/react';

// --- 1. ICONS ---
const IconFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>);
const IconNonFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>);
const IconBeginner = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="1" strokeOpacity="0.2"/><rect x="16" y="6" width="4" height="14" rx="1" strokeOpacity="0.2"/></svg>);
const IconIntermediate = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="1" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="1" strokeOpacity="0.2"/></svg>);
const IconAdvanced = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="1" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="1" fill="currentColor"/></svg>);

// --- 2. CONSTANTS & DATA STRUCTURES ---
const fictionCategories = ["British Literature", "American Literature", "Russian Literature", "Arabic Literature", "Other Literature"];
const nonFictionCategories = ["Informative & Educational", "Self Improvement", "Language Learning & Teaching"];

const LEVELS = [
  { name: "Beginner", icon: <IconBeginner />, subLevels: ["Level 1", "Level 2", "Level 3"] },
  { name: "Intermediate", icon: <IconIntermediate />, subLevels: ["Level 4", "Level 5", "Level 6"] },
  { name: "Advanced", icon: <IconAdvanced />, subLevels: ["Level 7", "Level 8", "Business English"] },
];

const SKILLS = [
  { name: 'Grammar', icon: '📝' },
  { name: 'Vocabulary', icon: '🔤' },
  { name: 'Reading', icon: '📖' },
  { name: 'Listening', icon: '🎧' },
  { name: 'Writing', icon: '✍️' }
];

// --- 3. STYLES ---
const styles: any = {
  page: { fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8FAFC', backgroundImage: 'linear-gradient(135deg, #F8FAFC 0%, #E0E7FF 100%)', minHeight: '100vh', color: '#0F172A', padding: '40px 20px 0' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '50px' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ background: a ? '#4F46E5' : 'transparent', color: a ? '#fff' : '#64748B', border: 'none', fontSize: '15px', fontWeight: '600', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: a ? '0 4px 14px rgba(79,70,229,0.39)' : 'none' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', borderTop: '4px solid #818CF8', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  levelCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer', borderTop: '4px solid #A78BFA', fontSize: '1.2rem', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' },
  subButton: (a: boolean) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: '2px solid', borderColor: a ? '#4F46E5' : '#E2E8F0', backgroundColor: a ? '#EEF2FF' : '#fff', color: a ? '#4F46E5' : '#475569', fontWeight: '600', cursor: 'pointer' }),
  badgeButton: (a: boolean) => ({ padding: '8px 16px', borderRadius: '24px', border: 'none', backgroundColor: a ? '#1E293B' : '#fff', color: a ? '#fff' : '#475569', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }),
  backButton: { background: 'transparent', border: 'none', color: '#4F46E5', cursor: 'pointer', marginBottom: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  greenButton: { background: '#10B981', color: '#ffffff', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', display: 'inline-block', textAlign: 'center', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }
};

// --- 4. MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Book Reviews');
  
  const [bookCategory, setBookCategory] = useState('Fiction');
  const [activeSubCategory, setActiveSubCategory] = useState('American Literature');
  const [reviews, setReviews] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeSubLevel, setActiveSubLevel] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<number | null>(null);

  useEffect(() => {
    client.fetch('*[_type == "review"] | order(title asc)').then((data) => setReviews(data));
    client.fetch('*[_type == "resource"] | order(unit asc) {..., "fileUrl": file.asset->url}').then((data) => setResources(data));
  }, []);

  const handleCategorySwitch = (category: string) => {
    setBookCategory(category);
    setActiveSubCategory(category === 'Fiction' ? 'American Literature' : 'Self Improvement');
  };

  const displayedReviews = reviews.filter(rev => {
    const revCat = rev.category || 'Fiction';
    const revSubCat = rev.subCategory || 'American Literature';
    return revCat === bookCategory && revSubCat === activeSubCategory;
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* --- BRANDING & LOGO --- */}
        <header style={styles.header}>
          <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '420px', margin: '0 auto', display: 'block' }}>
            <defs>
              <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F8FAFC"/><stop offset="100%" stopColor="#EEF2FF"/></linearGradient>
              <linearGradient id="markGrad" x1="0%" y1="0%" x2="135%" y2="135%"><stop offset="0%" stopColor="#4338CA"/><stop offset="50%" stopColor="#6D28D9"/><stop offset="100%" stopColor="#9333EA"/></linearGradient>
              <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4F46E5"/><stop offset="100%" stopColor="#9333EA"/></linearGradient>
              <linearGradient id="pageLeft" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.85"/></linearGradient>
              <linearGradient id="pageRight" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.85"/></linearGradient>
              <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#EDE9FE"/><stop offset="100%" stopColor="#C4B5FD"/></linearGradient>
              <filter id="badgeShadow"><feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#4F46E5" floodOpacity="0.3"/></filter>
              <filter id="bookShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2E1065" floodOpacity="0.35"/></filter>
            </defs>
            <rect width="600" height="360" fill="url(#bgGrad)" rx="20"/>
            <circle cx="162" cy="180" r="66" fill="url(#markGrad)" filter="url(#badgeShadow)"/>
            <g transform="translate(162,183)" filter="url(#bookShadow)">
              <ellipse cx="0" cy="30" rx="38" ry="5" fill="#1E1B4B" opacity="0.25"/>
              <path d="M-42,-28 L-6,-28 L-6,28 L-42,28 Q-45,28 -45,25 L-45,-25 Q-45,-28 -42,-28 Z" fill="#818CF8"/>
              <path d="M6,-28 L42,-28 Q45,-28 45,-25 L45,25 Q45,28 42,28 L6,28 L6,-28 Z" fill="#A78BFA"/>
              <rect x="-38" y="-25" width="32" height="48" rx="1" fill="url(#pageLeft)"/>
              <rect x="6" y="-25" width="32" height="48" rx="1" fill="url(#pageRight)"/>
              <rect x="-5.5" y="-30" width="11" height="64" rx="2" fill="url(#spineGrad)"/>
            </g>
            <text x="276" y="168" fontFamily="Georgia, serif" fontSize="48" fontWeight="700" fill="url(#textGrad)" letterSpacing="-0.02em">Lit & Learn</text>
            <text x="278" y="196" fontFamily="system-ui" fontSize="11" fontWeight="600" fill="#6366F1" letterSpacing="0.2em">ENGLISH · LITERATURE · LANGUAGE</text>
            <rect x="276" y="208" width="282" height="2" rx="1" fill="url(#textGrad)" opacity="0.2"/>
          </svg>
        </header>

        {/* --- MAIN NAVIGATION --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '50px' }}>
          <nav style={styles.nav}>
            {['Book Reviews', 'English Corner', 'Resources', 'About', 'Contact'].map(tab => (
              <button key={tab} style={styles.navButton(activeTab === tab)} onClick={() => { setActiveTab(tab); setActiveLevel(null); setActiveSubLevel(null); setActiveUnit(null); }}>{tab}</button>
            ))}
          </nav>
        </div>

        <main>
          {/* TAB 1: BOOK REVIEWS */}
          {activeTab === 'Book Reviews' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button style={styles.subButton(bookCategory === 'Fiction')} onClick={() => handleCategorySwitch('Fiction')}><IconFiction /> Fiction</button>
                <button style={styles.subButton(bookCategory === 'Non-Fiction')} onClick={() => handleCategorySwitch('Non-Fiction')}><IconNonFiction /> Non-Fiction</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px', flexWrap: 'wrap' }}>
                {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => (
                  <button key={cat} style={styles.badgeButton(activeSubCategory === cat)} onClick={() => setActiveSubCategory(cat)}>{cat}</button>
                ))}
              </div>
              <div style={styles.grid}>
                {displayedReviews.length > 0 ? displayedReviews.map(book => (
                  <div key={book._id} style={styles.card}>
                    {book.coverImage ? (
                      <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '220px', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 'bold' }}>No Cover Image</div>
                    )}
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#0F172A' }}>{book.title}</h3>
                      
                      {/* --- THE CRASH-PROOF RICH TEXT RENDERER --- */}
                      <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        {!book.content ? (
                          <p style={{ fontStyle: 'italic', color: '#94A3B8' }}>No review written yet.</p>
                        ) : typeof book.content === 'string' ? (
                          <p>{book.content}</p> 
                        ) : (
                          <PortableText value={book.content} /> 
                        )}
                      </div>

                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#64748B', background: '#fff', borderRadius: '16px' }}>
                    <h3>No reviews found.</h3>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ENGLISH CORNER */}
          {activeTab === 'English Corner' && (
            <div>
              {!activeLevel && (
                <>
                  <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0F172A' }}>Select Your Level</h2>
                  <div style={styles.grid}>
                    {LEVELS.map(lvl => (
                      <div key={lvl.name} style={styles.levelCard} onClick={() => setActiveLevel(lvl.name)}>
                        <div style={{ color: '#8B5CF6', marginBottom: '15px', transform: 'scale(1.3)' }}>{lvl.icon}</div>
                        {lvl.name}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeLevel && !activeSubLevel && (
                <>
                  <button style={styles.backButton} onClick={() => setActiveLevel(null)}>← Back to Main Levels</button>
                  <h2 style={{ marginBottom: '24px', color: '#0F172A' }}>{activeLevel} Tracks</h2>
                  <div style={styles.grid}>
                    {LEVELS.find(l => l.name === activeLevel)?.subLevels.map(sub => (
                      <div key={sub} style={{...styles.levelCard, padding: '24px'}} onClick={() => setActiveSubLevel(sub)}>
                        {sub}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeSubLevel && !activeUnit && (
                <>
                  <button style={styles.backButton} onClick={() => setActiveSubLevel(null)}>← Back to {activeLevel}</button>
                  <h2 style={{ marginBottom: '24px', color: '#0F172A' }}>{activeSubLevel} Units</h2>
                  <div style={styles.grid}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(u => (
                      <div key={u} style={{...styles.card, padding: '20px', cursor: 'pointer', textAlign: 'center', borderTopColor: '#34D399'}} onClick={() => setActiveUnit(u)}>
                        <h3 style={{ margin: '0 0 5px' }}>Unit {u}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>View Lessons</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeUnit && (
                <>
                  <button style={styles.backButton} onClick={() => setActiveUnit(null)}>← Back to Units</button>
                  <div style={{ ...styles.card, padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                      <h2 style={{ margin: 0 }}>Unit {activeUnit}</h2>
                      <span style={{ background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{activeSubLevel}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {SKILLS.map(skill => {
                        const specificPdf = resources.find(r => 
                          !r.isGeneral &&
                          r.level === activeLevel && 
                          r.subLevel === activeSubLevel && 
                          r.unit === activeUnit && 
                          r.category === skill.name
                        );

                        return (
                          <div key={skill.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <span style={{ fontSize: '1.5rem' }}>{skill.icon}</span>
                              <div>
                                <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.05rem' }}>{skill.name}</h4>
                                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                                  {specificPdf ? specificPdf.title : 'No resource uploaded yet.'}
                                </p>
                              </div>
                            </div>
                            {specificPdf ? (
                              <a href={specificPdf.fileUrl} target="_blank" rel="noreferrer" style={styles.greenButton}>
                                Download PDF
                              </a>
                            ) : (
                              <span style={{ background: '#E2E8F0', color: '#94A3B8', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                                Coming Soon
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: RESOURCES */}
          {activeTab === 'Resources' && (
            <div>
              <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>General Resources & Guides</h2>
              <div style={styles.grid}>
                {resources.filter(res => res.isGeneral).length > 0 ? resources.filter(res => res.isGeneral).map(res => (
                  <div key={res._id} style={styles.card}>
                    <div style={{ padding: '24px' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📄</div>
                      <h3 style={{ margin: '0 0 10px' }}>{res.title}</h3>
                      {res.fileUrl && (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{...styles.greenButton, width: '100%', marginTop: '20px', boxSizing: 'border-box' }}>
                          Download Guide
                        </a>
                      )}
                    </div>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#64748B' }}>No general resources uploaded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'About' && (
            <div style={{ ...styles.card, maxWidth: '600px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '20px' }}>About the Teacher</h2>
              <p style={{ lineHeight: '1.8', color: '#475569' }}>Welcome to my classroom. I am passionate about blending literature with language learning to help you achieve absolute fluency.</p>
            </div>
          )}

          {/* TAB 5: CONTACT */}
          {activeTab === 'Contact' && (
            <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '10px' }}>Get in Touch</h2>
              <p style={{ color: '#64748B', marginBottom: '30px' }}>Want to book a tutoring session or ask a question?</p>
              <a href="mailto:teacher@litandlearn.com" style={{ display: 'inline-block', background: '#4F46E5', color: '#fff', padding: '12px 30px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Email Me</a>
            </div>
          )}

        </main>
      </div>

      {/* --- FOOTER --- */}
      <footer style={{ background: '#0F172A', color: '#94A3B8', marginTop: '100px', padding: '60px 20px', borderTop: '4px solid #4F46E5' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '1.5rem' }}>Lit & Learn</h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>Mastering English through global literature — one page at a time.</p>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.85rem', paddingTop: '40px' }}>
            © 2026 Lit & Learn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}