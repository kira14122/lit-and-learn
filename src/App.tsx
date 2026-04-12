import React, { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import { PortableText } from '@portabletext/react';

// --- 1. ICONS ---
const IconFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconNonFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>);
const IconBeginner = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" strokeOpacity="0.2"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconIntermediate = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconAdvanced = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" fill="currentColor"/></svg>);
const IconSearch = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);

// --- 2. SMART READER COMPONENTS ---
const SmartWord = ({ word, dictInfo }: { word: string, dictInfo: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{ 
          color: '#4F46E5', 
          fontWeight: '600', 
          borderBottom: '2px dashed #A5B4FC', 
          cursor: 'pointer',
          backgroundColor: isOpen ? '#EEF2FF' : 'transparent',
          padding: '2px 4px',
          borderRadius: '6px',
          transition: 'all 0.2s ease'
        }}
      >
        {word}
      </span>
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#0F172A', color: '#ffffff', padding: '20px', borderRadius: '24px',
          width: '320px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', zIndex: 9999,
          textAlign: 'left', fontFamily: '"Fredoka", sans-serif'
        }}>
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #0F172A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '600', color: '#818CF8' }}>{word.toLowerCase()}</span>
            <span style={{ fontSize: '0.9rem', background: '#334155', padding: '6px 12px', borderRadius: '9999px', fontWeight: '600', letterSpacing: '1px' }}>{dictInfo.level}</span>
          </div>
          <div style={{ color: '#94A3B8', fontSize: '1rem', fontStyle: 'italic', marginBottom: '12px', textTransform: 'lowercase' }}>{dictInfo.pos}</div>
          <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#F8FAFC', fontWeight: '400' }}>{dictInfo.def}</div>
        </div>
      )}
    </span>
  );
}

// SmartText now accepts the dynamic dictionary loaded from Sanity
const SmartText = ({ text, dictionary }: { text: string, dictionary: Record<string, any> }) => {
  const parts = text.split(/(\b[a-zA-Z]+\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        const cleanWord = part.toLowerCase();
        if (dictionary[cleanWord]) {
          return <SmartWord key={i} word={part} dictInfo={dictionary[cleanWord]} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

// --- 3. CONSTANTS ---
const fictionCategories = ["British Literature", "American Literature", "Russian Literature", "Arabic Literature", "Other Literature"];
const nonFictionCategories = ["Informative & Educational", "Self Improvement", "Language Learning & Teaching"];
const LEVELS = [ { name: "Beginner", icon: <IconBeginner />, subLevels: ["Level 1", "Level 2", "Level 3"] }, { name: "Intermediate", icon: <IconIntermediate />, subLevels: ["Level 4", "Level 5", "Level 6"] }, { name: "Advanced", icon: <IconAdvanced />, subLevels: ["Level 7", "Level 8", "Business English"] } ];
const SKILLS = [ { name: 'Grammar', icon: '📝' }, { name: 'Vocabulary', icon: '🔤' }, { name: 'Reading', icon: '📖' }, { name: 'Listening', icon: '🎧' }, { name: 'Writing', icon: '✍️' } ];

// --- 4. STYLES ---
const styles: any = {
  page: { fontFamily: '"Fredoka", sans-serif', backgroundColor: '#F3F6F8', minHeight: '100vh', color: '#0F172A', padding: '60px 0 0 0' },
  container: { width: '100%', maxWidth: '1800px', margin: '0 auto', padding: '0 40px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  searchContainer: { display: 'flex', justifyContent: 'center', marginBottom: '50px', position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto 50px auto' },
  searchInput: { fontFamily: '"Fredoka", sans-serif', width: '100%', padding: '20px 20px 20px 60px', fontSize: '1.2rem', fontWeight: '500', borderRadius: '9999px', border: 'none', backgroundColor: '#ffffff', color: '#0F172A', boxShadow: '0 15px 35px -10px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', outline: 'none' },
  searchIconWrapper: { position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', background: a ? '#4F46E5' : 'transparent', color: a ? '#ffffff' : '#64748B', border: 'none', fontSize: '17px', fontWeight: '600', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: a ? '0 10px 20px -5px rgba(79,70,229,0.4)' : 'none' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 400px))', justifyContent: 'center', gap: '40px' },
  card: { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' },
  levelCard: { fontFamily: '"Fredoka", sans-serif', backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', border: 'none', fontSize: '1.5rem', fontWeight: '600', color: '#0F172A', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', transition: 'all 0.3s ease' },
  subButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#4F46E5' : '#ffffff', color: a ? '#ffffff' : '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', boxShadow: a ? '0 10px 20px -5px rgba(79,70,229,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.05)', fontSize: '1.1rem' }),
  badgeButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', padding: '10px 20px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#0F172A' : '#ffffff', color: a ? '#ffffff' : '#64748B', fontWeight: '500', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.04)' }),
  backButton: { fontFamily: '"Fredoka", sans-serif', background: '#ffffff', border: 'none', color: '#0F172A', cursor: 'pointer', marginBottom: '40px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '9999px', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.08)', transition: 'all 0.3s', fontSize: '1.1rem' },
  actionButton: { fontFamily: '"Fredoka", sans-serif', background: '#4F46E5', color: '#ffffff', textDecoration: 'none', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', display: 'inline-block', textAlign: 'center', transition: 'all 0.3s', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)', fontSize: '1.1rem' },
  clampText: { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748B', fontSize: '1.05rem', lineHeight: '1.7', margin: 0, fontWeight: '400', textAlign: 'center' },
  readMoreBtn: { fontFamily: '"Fredoka", sans-serif', background: '#F8FAFC', border: 'none', color: '#4F46E5', fontWeight: '600', fontSize: '1.05rem', padding: '12px 20px', borderRadius: '16px', marginTop: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', transition: 'all 0.2s', width: '100%' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '50px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)' },
  closeButton: { position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#0F172A', fontWeight: 'bold', fontSize: '1.4rem' }
};

// --- 5. MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Book Reviews');
  const [bookCategory, setBookCategory] = useState('Fiction');
  const [activeSubCategory, setActiveSubCategory] = useState('American Literature');
  const [reviews, setReviews] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeSubLevel, setActiveSubLevel] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // NEW: State to hold the dynamic dictionary
  const [dictionary, setDictionary] = useState<Record<string, any>>({});

  useEffect(() => {
    // 1. Fetch Reviews
    client.fetch('*[_type == "review"] | order(title asc)').then((data) => setReviews(data));
    
    // 2. Fetch Resources (PDFs)
    client.fetch('*[_type == "resource"] | order(unit asc) {..., "fileUrl": file.asset->url}').then((data) => setResources(data));
    
    // 3. NEW: Fetch Dictionary Words!
    client.fetch('*[_type == "dictionaryWord"]').then((data) => {
      const dictMap: Record<string, any> = {};
      data.forEach((item: any) => {
        if (item.word) {
          dictMap[item.word.toLowerCase()] = {
            pos: item.pos,
            def: item.definition,
            level: item.level
          };
        }
      });
      setDictionary(dictMap); // Saves the dictionary into memory
    });
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

  const searchResultsReviews = reviews.filter(rev => 
    rev.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (typeof rev.content === 'string' && rev.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const searchResultsResources = resources.filter(res => 
    res.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.subLevel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; font-family: 'Fredoka', sans-serif !important; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .soft-card:hover { transform: translateY(-8px); box-shadow: 0 40px 60px -15px rgba(15, 23, 42, 0.1) !important; }
        .read-btn:hover { background: #EEF2FF !important; }
        .search-input:focus { box-shadow: 0 0 0 4px rgba(79,70,229,0.2) !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>

      <div style={styles.page}>
        
        {selectedBook && (
          <div style={styles.modalOverlay} onClick={() => setSelectedBook(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button style={styles.closeButton} onClick={() => setSelectedBook(null)}>✕</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  {selectedBook.coverImage && (
                    <img src={urlFor(selectedBook.coverImage).url()} alt={selectedBook.title} style={{ width: '220px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }} />
                  )}
                  <div>
                    <span style={{ display: 'inline-block', background: '#F1F5F9', color: '#64748B', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{selectedBook.subCategory || selectedBook.category}</span>
                    <h2 style={{ margin: '0 0 16px', fontSize: '3rem', fontWeight: '600', color: '#0F172A', letterSpacing: '-1px', lineHeight: '1.1' }}>{selectedBook.title}</h2>
                  </div>
                </div>
                
                <div style={{ color: '#475569', fontSize: '1.3rem', lineHeight: '2', fontWeight: '400', maxWidth: '650px', textAlign: 'left' }}>
                  {!selectedBook.content ? (
                    <p style={{ color: '#94A3B8', textAlign: 'center' }}>No review written yet.</p>
                  ) : typeof selectedBook.content === 'string' ? (
                    // We pass the dynamic dictionary here!
                    <p><SmartText text={selectedBook.content} dictionary={dictionary} /></p> 
                  ) : (
                    <p><SmartText text={selectedBook.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n')} dictionary={dictionary} /></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.container}>
          
          <header style={styles.header}>
            <h1 style={{ fontSize: '4.5rem', fontWeight: '600', margin: '0 auto 5px auto', letterSpacing: '-1px', color: '#0F172A', lineHeight: '1.1' }}>
              Lit <span style={{ color: '#4F46E5' }}>&</span> Learn
            </h1>
            <p style={{color: '#94A3B8', letterSpacing: '3px', fontWeight: '500', fontSize: '1rem', textTransform: 'uppercase', margin: 0}}>English • Literature • Language</p>
          </header>

          <div style={styles.searchContainer}>
            <div style={styles.searchIconWrapper}><IconSearch /></div>
            <input 
              type="text" 
              placeholder="Search books, grammar lessons, vocabulary..." 
              className="search-input"
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm ? (
             <div>
               <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px' }}>Search Results</h2>
               {searchResultsReviews.length > 0 && (
                 <div style={{ marginBottom: '60px' }}>
                   <h3 style={{ color: '#4F46E5', fontWeight: '600', fontSize: '1.8rem', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Literature & Reviews</h3>
                   <div style={styles.grid}>
                     {searchResultsReviews.map(book => (
                        <div key={book._id} className="soft-card" style={styles.card}>
                          <div style={{ padding: '16px 16px 0 16px' }}>
                            {book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.08)' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}
                          </div>
                          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '16px' }}><span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase' }}>{book.subCategory || book.category}</span></div>
                            <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center' }}>{book.title}</h3>
                            <button className="read-btn" style={styles.readMoreBtn} onClick={() => setSelectedBook(book)}>Read Review</button>
                          </div>
                        </div>
                     ))}
                   </div>
                 </div>
               )}
               {searchResultsResources.length > 0 && (
                 <div style={{ marginBottom: '60px' }}>
                   <h3 style={{ color: '#0F172A', fontWeight: '600', fontSize: '1.8rem', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Lessons & Guides</h3>
                   <div style={styles.grid}>
                     {searchResultsResources.map(res => (
                        <div key={res._id} className="soft-card" style={{...styles.card, padding: '30px', alignItems: 'center', textAlign: 'center'}}>
                          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{res.isGeneral ? '📄' : '📚'}</div>
                          <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase' }}>{res.isGeneral ? 'General Resource' : `${res.subLevel} • Unit ${res.unit}`}</span>
                          <h3 style={{ margin: '0 0 24px', fontWeight: '600', color: '#0F172A', fontSize: '1.4rem' }}>{res.title}</h3>
                          {res.fileUrl && <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%'}}>Download</a>}
                        </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
                <nav style={styles.nav}>
                  {['Book Reviews', 'English Corner', 'Resources', 'About', 'Contact'].map(tab => (
                    <button key={tab} style={styles.navButton(activeTab === tab)} onClick={() => { setActiveTab(tab); setActiveLevel(null); setActiveSubLevel(null); setActiveUnit(null); }}>{tab}</button>
                  ))}
                </nav>
              </div>

              {activeTab === 'Book Reviews' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                    <button style={styles.subButton(bookCategory === 'Fiction')} onClick={() => handleCategorySwitch('Fiction')}><IconFiction /> Fiction</button>
                    <button style={styles.subButton(bookCategory === 'Non-Fiction')} onClick={() => handleCategorySwitch('Non-Fiction')}><IconNonFiction /> Non-Fiction</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '60px', flexWrap: 'wrap' }}>
                    {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => (
                      <button key={cat} style={styles.badgeButton(activeSubCategory === cat)} onClick={() => setActiveSubCategory(cat)}>{cat}</button>
                    ))}
                  </div>
                  
                  <div style={styles.grid}>
                    {displayedReviews.length > 0 ? displayedReviews.map(book => (
                      <div key={book._id} className="soft-card" style={styles.card}>
                        <div style={{ padding: '16px 16px 0 16px' }}>
                          {book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.08)' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}
                        </div>
                        <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '16px' }}><span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{book.subCategory || book.category}</span></div>
                          <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', letterSpacing: '-0.5px', textAlign: 'center' }}>{book.title}</h3>
                          <div style={styles.clampText}>{!book.content ? <p style={{ color: '#94A3B8', margin: 0 }}>No review written yet.</p> : typeof book.content === 'string' ? book.content : <PortableText value={book.content} />}</div>
                          {book.content && ( <div style={{ width: '100%', marginTop: '24px' }}><button className="read-btn" style={styles.readMoreBtn} onClick={() => setSelectedBook(book)}>Read Review</button></div> )}
                        </div>
                      </div>
                    )) : ( <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94A3B8', background: '#ffffff', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}><h3 style={{ fontWeight: '600', margin: 0, fontSize: '1.5rem' }}>No reviews found</h3></div> )}
                  </div>
                </div>
              )}

              {activeTab === 'English Corner' && (
                <div>
                  {!activeLevel && (
                    <>
                      <h2 style={{ textAlign: 'center', marginBottom: '50px', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px' }}>Select Your Level</h2>
                      <div style={styles.grid}>{LEVELS.map(lvl => ( <div key={lvl.name} className="soft-card" style={styles.levelCard} onClick={() => setActiveLevel(lvl.name)}><div style={{ color: '#4F46E5', marginBottom: '24px', display: 'flex', justifyContent: 'center', transform: 'scale(1.4)' }}>{lvl.icon}</div>{lvl.name}</div> ))}</div>
                    </>
                  )}
                  {activeLevel && !activeSubLevel && (
                    <>
                      <button style={styles.backButton} onClick={() => setActiveLevel(null)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Back to Levels</button>
                      <h2 style={{ marginBottom: '40px', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px', textAlign: 'center' }}>{activeLevel} Tracks</h2>
                      <div style={styles.grid}>{LEVELS.find(l => l.name === activeLevel)?.subLevels.map(sub => ( <div key={sub} className="soft-card" style={{...styles.levelCard, padding: '40px'}} onClick={() => setActiveSubLevel(sub)}>{sub}</div> ))}</div>
                    </>
                  )}
                  {activeSubLevel && !activeUnit && (
                    <>
                      <button style={styles.backButton} onClick={() => setActiveSubLevel(null)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Back to {activeLevel}</button>
                      <h2 style={{ marginBottom: '40px', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px', textAlign: 'center' }}>{activeSubLevel} Units</h2>
                      <div style={styles.grid}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(u => ( <div key={u} className="soft-card" style={{...styles.card, padding: '30px', cursor: 'pointer', textAlign: 'center'}} onClick={() => setActiveUnit(u)}><h3 style={{ margin: '0 0 16px', fontSize: '1.8rem', fontWeight: '600', color: '#0F172A' }}>Unit {u}</h3><span style={{ display: 'inline-block', background: '#F1F5F9', color: '#475569', padding: '8px 20px', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '500' }}>View Lessons</span></div> ))}</div>
                    </>
                  )}
                  {activeUnit && (
                    <>
                      <button style={styles.backButton} onClick={() => setActiveUnit(null)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Back to Units</button>
                      <div style={{ ...styles.card, padding: '50px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '50px' }}><h2 style={{ margin: 0, fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px', color: '#0F172A' }}>Unit {activeUnit}</h2><span style={{ background: '#EEF2FF', padding: '8px 20px', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '500', color: '#4F46E5' }}>{activeSubLevel}</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          {SKILLS.map(skill => {
                            const skillPdfs = resources.filter(r => !r.isGeneral && r.level === activeLevel && r.subLevel === activeSubLevel && r.unit === activeUnit && r.category === skill.name);
                            return (
                              <div key={skill.name} style={{ display: 'flex', flexDirection: 'column', padding: '30px', background: '#F8FAFC', borderRadius: '28px', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '2rem', background: '#ffffff', padding: '16px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>{skill.icon}</span><h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.8rem', fontWeight: '600' }}>{skill.name}</h4></div>
                                {skillPdfs.length > 0 ? ( <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{skillPdfs.map(pdf => ( <div key={pdf._id} className="soft-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)' }}><span style={{ fontWeight: '600', color: '#0F172A', fontSize: '1.3rem' }}>{pdf.title}</span><a href={pdf.fileUrl} target="_blank" rel="noreferrer" style={styles.actionButton}>Download</a></div> ))}</div> ) : ( <span style={{ background: '#E2E8F0', color: '#64748B', padding: '10px 20px', borderRadius: '9999px', fontSize: '1rem', fontWeight: '500', width: 'fit-content' }}>No lessons uploaded yet</span> )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'Resources' && (
                <div>
                  <h2 style={{ textAlign: 'center', marginBottom: '50px', fontWeight: '600', fontSize: '2.5rem', color: '#0F172A', letterSpacing: '-1px' }}>General Resources</h2>
                  <div style={styles.grid}>{resources.filter(res => res.isGeneral).length > 0 ? resources.filter(res => res.isGeneral).map(res => ( <div key={res._id} className="soft-card" style={styles.card}><div style={{ padding: '40px', textAlign: 'center' }}><div style={{ fontSize: '4rem', marginBottom: '24px' }}>📄</div><h3 style={{ margin: '0 0 30px', fontWeight: '600', color: '#0F172A', fontSize: '1.8rem' }}>{res.title}</h3>{res.fileUrl && <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%', boxSizing: 'border-box', padding: '16px' }}>Download Guide</a>}</div></div> )) : <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#94A3B8', fontWeight: '500', fontSize: '1.3rem' }}>No general resources uploaded yet.</p>}</div>
                </div>
              )}

              {activeTab === 'About' && (
                <div style={{ ...styles.card, maxWidth: '750px', margin: '0 auto', padding: '60px', textAlign: 'center' }}><h2 style={{ marginBottom: '30px', fontWeight: '600', fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1px' }}>About the Teacher</h2><p style={{ lineHeight: '2.2', color: '#475569', fontSize: '1.3rem', fontWeight: '400' }}>Welcome to my classroom. I am passionate about blending literature with language learning to help you achieve absolute fluency.</p></div>
              )}

              {activeTab === 'Contact' && (
                <div style={{ ...styles.card, maxWidth: '650px', margin: '0 auto', padding: '60px', textAlign: 'center' }}><div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>👋</div><h2 style={{ marginBottom: '20px', fontWeight: '600', fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1px' }}>Get in Touch</h2><p style={{ color: '#475569', marginBottom: '40px', fontSize: '1.3rem', fontWeight: '400' }}>Want to book a tutoring session or ask a question?</p><a href="mailto:teacher@litandlearn.com" style={{...styles.actionButton, padding: '18px 48px', fontSize: '1.3rem', width: 'auto'}}>Email Me</a></div>
              )}
            </>
          )}
        </div>

        <footer style={{ background: '#0F172A', color: '#94A3B8', marginTop: '100px', padding: '80px 20px', borderRadius: '40px 40px 0 0' }}>
          <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div><h3 style={{ color: '#ffffff', margin: '0 0 20px', fontSize: '2.2rem', fontWeight: '600', letterSpacing: '-1px' }}>Lit & Learn</h3><p style={{ margin: '0 auto', lineHeight: '1.8', maxWidth: '300px', fontWeight: '400', fontSize: '1.15rem' }}>Mastering English through global literature — one page at a time.</p></div>
            <div style={{ fontSize: '1.1rem', fontWeight: '500', paddingTop: '30px' }}>© 2026 Lit & Learn. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
}