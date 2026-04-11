import React, { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import { PortableText } from '@portabletext/react';

// --- 1. ICONS (Clean, geometric, modern) ---
const IconFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconNonFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>);
const IconBeginner = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>);
const IconIntermediate = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V4"/><path d="M18 20v-8"/><path d="M6 20v-4"/></svg>);
const IconAdvanced = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V4"/><path d="M18 20V4"/><path d="M6 20V4"/></svg>);

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

// --- 3. MODERN APP STYLES ---
const styles: any = {
  // Ultra-clean, slightly off-white background so the pure white cards pop
  page: { fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#F3F6F8', minHeight: '100vh', color: '#1E293B', padding: '60px 20px 0', WebkitFontSmoothing: 'antialiased' },
  container: { maxWidth: '1050px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '60px' },
  
  // Sleek, floating navigation pill
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '6px', borderRadius: '9999px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ background: a ? '#4F46E5' : 'transparent', color: a ? '#ffffff' : '#64748B', border: 'none', fontSize: '15px', fontWeight: '600', padding: '12px 24px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.25s ease', boxShadow: a ? '0 8px 20px -6px rgba(79,70,229,0.5)' : 'none' }),
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },
  
  // Soft, floating cards with high border radius
  card: { backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
  levelCard: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', border: 'none', fontSize: '1.25rem', fontWeight: '700', color: '#1E293B', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease' },
  
  // Pill-shaped sub-navigation
  subButton: (a: boolean) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#4F46E5' : '#E2E8F0', color: a ? '#ffffff' : '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: a ? '0 8px 20px -6px rgba(79,70,229,0.5)' : 'none' }),
  badgeButton: (a: boolean) => ({ padding: '10px 20px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#1E293B' : '#ffffff', color: a ? '#ffffff' : '#64748B', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }),
  
  backButton: { background: '#ffffff', border: 'none', color: '#1E293B', cursor: 'pointer', marginBottom: '30px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '9999px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease' },
  
  // Vibrant, highly-clickable action buttons
  actionButton: { background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', display: 'inline-block', textAlign: 'center', boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.3)', transition: 'transform 0.2s ease', border: 'none' }
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
        
        {/* --- BRANDING & LOGO (Sleek App Style) --- */}
        <header style={styles.header}>
           <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             <h1 style={{fontSize: '3.5rem', fontWeight: '800', margin: '0 0 5px', letterSpacing: '-1px'}}>Lit & Learn</h1>
           </div>
           <p style={{color: '#64748B', letterSpacing: '3px', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase'}}>English • Literature • Language</p>
        </header>

        {/* --- MAIN NAVIGATION --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <button style={styles.subButton(bookCategory === 'Fiction')} onClick={() => handleCategorySwitch('Fiction')}><IconFiction /> Fiction</button>
                <button style={styles.subButton(bookCategory === 'Non-Fiction')} onClick={() => handleCategorySwitch('Non-Fiction')}><IconNonFiction /> Non-Fiction</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '50px', flexWrap: 'wrap' }}>
                {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => (
                  <button key={cat} style={styles.badgeButton(activeSubCategory === cat)} onClick={() => setActiveSubCategory(cat)}>{cat}</button>
                ))}
              </div>
              
              <div style={styles.grid}>
                {displayedReviews.length > 0 ? displayedReviews.map(book => (
                  <div key={book._id} style={styles.card}>
                    {book.coverImage ? (
                      <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '260px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '600' }}>No Cover Image</div>
                    )}
                    <div style={{ padding: '24px' }}>
                      <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>{book.title}</h3>
                      <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        {!book.content ? (
                          <p style={{ color: '#94A3B8' }}>No review written yet.</p>
                        ) : typeof book.content === 'string' ? (
                          <p>{book.content}</p> 
                        ) : (
                          <PortableText value={book.content} /> 
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94A3B8', background: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontWeight: '600' }}>No reviews found for this category.</h3>
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
                  <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#0F172A', fontWeight: '800', fontSize: '2rem', letterSpacing: '-1px' }}>Select Your Level</h2>
                  <div style={styles.grid}>
                    {LEVELS.map(lvl => (
                      <div key={lvl.name} style={styles.levelCard} onClick={() => setActiveLevel(lvl.name)}>
                        <div style={{ color: '#4F46E5', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>{lvl.icon}</div>
                        {lvl.name}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeLevel && !activeSubLevel && (
                <>
                  <button style={styles.backButton} onClick={() => setActiveLevel(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to Levels
                  </button>
                  <h2 style={{ marginBottom: '30px', color: '#0F172A', fontWeight: '800', fontSize: '2rem', letterSpacing: '-1px' }}>{activeLevel} Tracks</h2>
                  <div style={styles.grid}>
                    {LEVELS.find(l => l.name === activeLevel)?.subLevels.map(sub => (
                      <div key={sub} style={{...styles.levelCard, padding: '30px'}} onClick={() => setActiveSubLevel(sub)}>
                        {sub}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeSubLevel && !activeUnit && (
                <>
                  <button style={styles.backButton} onClick={() => setActiveSubLevel(null)}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                     Back to {activeLevel}
                  </button>
                  <h2 style={{ marginBottom: '30px', color: '#0F172A', fontWeight: '800', fontSize: '2rem', letterSpacing: '-1px' }}>{activeSubLevel} Units</h2>
                  <div style={styles.grid}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(u => (
                      <div key={u} style={{...styles.card, padding: '24px', cursor: 'pointer', textAlign: 'center'}} onClick={() => setActiveUnit(u)}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: '800' }}>Unit {u}</h3>
                        <span style={{ display: 'inline-block', background: '#F1F5F9', color: '#64748B', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600' }}>View Lessons</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* UNIT VIEW (With Multiple PDF Support) */}
              {activeUnit && (
                <>
                  <button style={styles.backButton} onClick={() => setActiveUnit(null)}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                     Back to Units
                  </button>
                  
                  <div style={{ ...styles.card, padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                      <h2 style={{ margin: 0, fontWeight: '800', fontSize: '2rem', letterSpacing: '-1px' }}>Unit {activeUnit}</h2>
                      <span style={{ background: '#EEF2FF', padding: '6px 16px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '700', color: '#4F46E5' }}>{activeSubLevel}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {SKILLS.map(skill => {
                        const skillPdfs = resources.filter(r => 
                          !r.isGeneral && r.level === activeLevel && r.subLevel === activeSubLevel && r.unit === activeUnit && r.category === skill.name
                        );

                        return (
                          <div key={skill.name} style={{ display: 'flex', flexDirection: 'column', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '1.8rem', background: '#ffffff', padding: '10px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{skill.icon}</span>
                              <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.25rem', fontWeight: '800' }}>{skill.name}</h4>
                            </div>
                            
                            {skillPdfs.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '4px' }}>
                                {skillPdfs.map(pdf => (
                                  <div key={pdf._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '1rem' }}>{pdf.title}</span>
                                    <a href={pdf.fileUrl} target="_blank" rel="noreferrer" style={styles.actionButton}>Download</a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ paddingLeft: '4px' }}>
                                <span style={{ display: 'inline-block', background: '#E2E8F0', color: '#64748B', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700' }}>No lessons uploaded yet</span>
                              </div>
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
              <h2 style={{ textAlign: 'center', marginBottom: '40px', fontWeight: '800', fontSize: '2rem' }}>General Resources</h2>
              <div style={styles.grid}>
                {resources.filter(res => res.isGeneral).length > 0 ? resources.filter(res => res.isGeneral).map(res => (
                  <div key={res._id} style={styles.card}>
                    <div style={{ padding: '30px', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📄</div>
                      <h3 style={{ margin: '0 0 20px', fontWeight: '700' }}>{res.title}</h3>
                      {res.fileUrl && (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%', boxSizing: 'border-box' }}>Download Guide</a>
                      )}
                    </div>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#94A3B8', fontWeight: '600' }}>No general resources uploaded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'About' && (
            <div style={{ ...styles.card, maxWidth: '600px', margin: '0 auto', padding: '50px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '24px', fontWeight: '800', fontSize: '2rem' }}>About the Teacher</h2>
              <p style={{ lineHeight: '1.8', color: '#475569', fontSize: '1.1rem' }}>Welcome to my classroom. I am passionate about blending literature with language learning to help you achieve absolute fluency.</p>
            </div>
          )}

          {/* TAB 5: CONTACT */}
          {activeTab === 'Contact' && (
            <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto', padding: '50px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👋</div>
              <h2 style={{ marginBottom: '16px', fontWeight: '800', fontSize: '2rem' }}>Get in Touch</h2>
              <p style={{ color: '#64748B', marginBottom: '30px', fontSize: '1.1rem' }}>Want to book a tutoring session or ask a question?</p>
              <a href="mailto:teacher@litandlearn.com" style={{...styles.actionButton, padding: '14px 32px', fontSize: '1.1rem'}}>Email Me</a>
            </div>
          )}

        </main>
      </div>

      {/* --- FOOTER --- */}
      <footer style={{ marginTop: '100px', padding: '60px 20px', borderTop: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: '800', color: '#1E293B' }}>Lit & Learn</h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.95rem' }}>Mastering English through global literature.</p>
        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>© 2026 Lit & Learn. All rights reserved.</div>
      </footer>
    </div>
  );
}