import React, { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import { SmartText } from './components/SmartReader';
import { VocabVault } from './components/VocabVault';
import { QuizOverlay } from './components/QuizOverlay';
import { ResourceLibrary } from './components/ResourceLibrary';
import { InteractiveLesson } from './components/InteractiveLesson';
import TextHighlighter from './components/TextHighlighter';

// --- 1. ICONS ---
const IconFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconNonFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>);
const IconBeginner = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" strokeOpacity="0.2"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconIntermediate = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconAdvanced = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" fill="currentColor"/></svg>);
const IconSearch = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const IconQuiz = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);

// --- 2. CONSTANTS & STYLES ---
const fictionCategories = ["British Literature", "American Literature", "Russian Literature", "Arabic Literature", "Other Literature"];
const nonFictionCategories = ["Informative & Educational", "Self Improvement", "Language Learning & Teaching"];
const LEVELS = [ { name: "Beginner", icon: <IconBeginner />, subLevels: ["Level 1", "Level 2", "Level 3"] }, { name: "Intermediate", icon: <IconIntermediate />, subLevels: ["Level 4", "Level 5", "Level 6"] }, { name: "Advanced", icon: <IconAdvanced />, subLevels: ["Level 7", "Level 8", "Business English"] } ];
const SKILLS = [ { name: 'Grammar', icon: '📝', color: '#EF4444', bg: '#FEE2E2' }, { name: 'Vocabulary', icon: '🔤', color: '#F59E0B', bg: '#FEF3C7' }, { name: 'Reading', icon: '📖', color: '#10B981', bg: '#D1FAE5' }, { name: 'Listening', icon: '🎧', color: '#3B82F6', bg: '#DBEAFE' }, { name: 'Writing', icon: '✍️', color: '#8B5CF6', bg: '#EDE9FE' } ];

const styles: any = {
  page: { fontFamily: '"Fredoka", sans-serif', backgroundColor: '#F3F6F8', minHeight: '100vh', color: '#0F172A', padding: '60px 0 0 0' },
  container: { width: '100%', maxWidth: '1800px', margin: '0 auto', padding: '0 40px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  searchContainer: { display: 'flex', justifyContent: 'center', marginBottom: '50px', position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto 50px auto' },
  searchInput: { fontFamily: '"Fredoka", sans-serif', width: '100%', padding: '20px 20px 20px 60px', fontSize: '1.2rem', fontWeight: '500', borderRadius: '9999px', border: 'none', backgroundColor: '#ffffff', color: '#0F172A', boxShadow: '0 15px 35px -10px rgba(0,0,0,0.06)', outline: 'none' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ background: a ? '#4F46E5' : 'transparent', color: a ? '#ffffff' : '#64748B', border: 'none', fontSize: '17px', fontWeight: '600', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s ease' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 400px))', justifyContent: 'center', gap: '40px' },
  card: { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column' },
  actionButton: { background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem' },
  badgeButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', padding: '10px 20px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#0F172A' : '#ffffff', color: a ? '#ffffff' : '#64748B', fontWeight: '500', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.04)' }),
  readMoreBtn: { fontFamily: '"Fredoka", sans-serif', background: '#F8FAFC', border: 'none', color: '#4F46E5', fontWeight: '600', fontSize: '1.05rem', padding: '12px 20px', borderRadius: '16px', marginTop: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', width: '100%' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '50px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)' },
  closeButton: { position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#0F172A', fontWeight: 'bold', fontSize: '1.4rem' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('English Corner');
  const [bookCategory, setBookCategory] = useState('Fiction');
  const [activeSubCategory, setActiveSubCategory] = useState('American Literature');
  const [reviews, setReviews] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  
  const [interactiveLessons, setInteractiveLessons] = useState<any[]>([]);
  
  const [dictionary, setDictionary] = useState<Record<string, any>>({});
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeSubLevel, setActiveSubLevel] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isLevelExam, setIsLevelExam] = useState(false);
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [isInteractiveLesson, setIsInteractiveLesson] = useState(false);
  
  const [activeLessonData, setActiveLessonData] = useState<any | null>(null);

  useEffect(() => {
    client.fetch('*[_type == "review"] | order(title asc)').then(setReviews);
    client.fetch('*[_type == "resource"] | order(unit asc) {..., "fileUrl": file.asset->url, "audioUrl": audio.asset->url}').then(setResources);
    
    client.fetch(`*[_type == "interactiveLesson"] | order(lessonOrder asc) {
      ...,
      lessonBlocks[]{
        ...,
        "audioUrl": audio.asset->url
      }
    }`).then(setInteractiveLessons);

    client.fetch('*[_type == "dictionaryWord"]').then((data) => {
      const dictMap: Record<string, any> = {};
      data.forEach((item: any) => { if (item.word) dictMap[item.word.toLowerCase()] = { pos: item.pos, def: item.definition, level: item.level }; });
      setDictionary(dictMap);
    });

    const localVault = localStorage.getItem('vocabVault');
    if (localVault) {
      setSavedWords(JSON.parse(localVault));
    }
  }, []);

  // --- THE BULLETPROOF SAVE FUNCTION ---
  const toggleSaveWord = (word: string, info: any) => {
    if (!word) return;
    
    // Using a functional update strictly links the toggle to the LIVE vault
    setSavedWords((prevVault) => {
      const cleanWord = word.trim().toLowerCase();
      const exists = prevVault.some(w => w?.word?.trim().toLowerCase() === cleanWord);
      
      let updatedVault;
      if (exists) {
        // If it exists, remove it
        updatedVault = prevVault.filter(w => w?.word?.trim().toLowerCase() !== cleanWord);
      } else {
        // If it doesn't exist, add it
        updatedVault = [...prevVault, { word: word.trim(), ...info }];
      }
      
      localStorage.setItem('vocabVault', JSON.stringify(updatedVault));
      return updatedVault; // Returns the fresh array back into state
    });
  };

  const handleCategorySwitch = (category: string) => { 
    setBookCategory(category); 
    setActiveSubCategory(category === 'Fiction' ? 'American Literature' : 'Self Improvement'); 
  };

  const displayedReviews = reviews.filter(rev => { return (rev.category || 'Fiction') === bookCategory && (rev.subCategory || 'American Literature') === activeSubCategory; });
  const searchResultsReviews = reviews.filter(rev => rev.title?.toLowerCase().includes(searchTerm.toLowerCase()) || (typeof rev.content === 'string' && rev.content.toLowerCase().includes(searchTerm.toLowerCase())) );
  const searchResultsResources = resources.filter(res => res.title?.toLowerCase().includes(searchTerm.toLowerCase()) || res.category?.toLowerCase().includes(searchTerm.toLowerCase()) || res.subLevel?.toLowerCase().includes(searchTerm.toLowerCase()) );

  const startQuiz = async (runAsLevelExam: boolean = false) => {
    const singleQuery = runAsLevelExam ? `*[_type == "quizQuestion" && level == "${activeLevel}"]{..., "questionAudioUrl": audioSnippet.asset->url, "lessonUrl": relatedLesson->file.asset->url, "lessonTitle": relatedLesson->title}` : `*[_type == "quizQuestion" && unit == ${activeUnit} && level == "${activeLevel}"]{..., "questionAudioUrl": audioSnippet.asset->url, "lessonUrl": relatedLesson->file.asset->url, "lessonTitle": relatedLesson->title}`;
    const blockQuery = runAsLevelExam ? `*[_type == "comprehensionBlock" && level == "${activeLevel}"]{..., "blockAudioUrl": audioFile.asset->url}` : `*[_type == "comprehensionBlock" && unit == ${activeUnit} && level == "${activeLevel}"]{..., "blockAudioUrl": audioFile.asset->url}`;
    
    const [singleData, blockData] = await Promise.all([client.fetch(singleQuery), client.fetch(blockQuery)]);
    let allItems = [...singleData, ...blockData].sort(() => 0.5 - Math.random()).slice(0, 15);
    
    if (allItems.length === 0) {
      alert("⚠️ No quiz questions have been published for this unit yet! Please add them in Sanity.");
      return; 
    }

    setQuizItems(allItems); 
    setIsLevelExam(runAsLevelExam); 
    setIsQuizMode(true);
  };

  const handleNavigation = (tab?: string) => {
    if (tab) setActiveTab(tab);
    setIsQuizMode(false);
    setIsLevelExam(false);
    setIsInteractiveLesson(false);
    setActiveLessonData(null);
  };

  const isOverlayActive = isQuizMode || isInteractiveLesson;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; font-family: 'Fredoka', sans-serif !important; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .soft-card:hover { transform: translateY(-8px); box-shadow: 0 40px 60px -15px rgba(15, 23, 42, 0.1) !important; }
        .search-input:focus { box-shadow: 0 0 0 4px rgba(79,70,229,0.2) !important; }

        @media (max-width: 768px) {
          .app-container { padding: 0 16px !important; }
          .page-header h1 { font-size: 3.2rem !important; }
          .responsive-card { padding: 24px !important; }
          .reading-box { padding: 20px !important; font-size: 1.1rem !important; }
          .options-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .tfng-grid { grid-template-columns: 1fr !important; }
          .quiz-btn-text { font-size: 1rem !important; line-height: 1.4 !important; }
          .result-number { font-size: 4rem !important; }
        }
      `}</style>

      <div style={styles.page}>
        <header style={styles.header}>
          <h1 className="page-header" style={{ fontSize: '4.5rem', fontWeight: '600', color: '#0F172A', margin: '0 0 10px 0' }}>Lit <span style={{ color: '#4F46E5' }}>&</span> Learn</h1>
          <p style={{color: '#94A3B8', letterSpacing: '3px', fontWeight: '500', fontSize: '1rem', textTransform: 'uppercase', margin: 0}}>English • Literature • Language</p>
          
          <div style={{ marginTop: '40px' }}>
            {!isOverlayActive && (
              <nav style={styles.nav}>
                {['Book Reviews', 'English Corner', 'Resources', 'My Vault', 'About', 'Contact'].map(tab => (
                  <button key={tab} style={styles.navButton(activeTab === tab)} onClick={() => handleNavigation(tab)}>{tab}</button>
                ))}
              </nav>
            )}
          </div>
        </header>

        <div className="app-container" style={styles.container}>
          {!isOverlayActive ? (
            <>
              {/* OMNI-SEARCH */}
              <div style={styles.searchContainer}>
                <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)' }}><IconSearch /></div>
                <input type="text" placeholder="Search books, grammar lessons, vocabulary..." className="search-input" style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              {searchTerm ? (
                /* --- SEARCH RESULTS --- */
                <div>
                  <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px' }}>Search Results</h2>
                  
                  {searchResultsReviews.length > 0 && (
                    <div style={{ marginBottom: '60px' }}>
                      <h3 style={{ color: '#4F46E5', fontWeight: '600', fontSize: '1.8rem', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Literature & Reviews</h3>
                      <div style={styles.grid}>
                        {searchResultsReviews.map(book => (
                           <div key={book._id} className="soft-card" style={styles.card}>
                             <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                             <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                               <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center' }}>{book.title}</h3>
                               <button style={{ ...styles.actionButton, width: '100%', marginTop: '16px' }} onClick={() => setSelectedBook(book)}>Read Review</button>
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
                             <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{res.isGeneral ? '📄' : res.audioUrl ? '🎧' : '📚'}</div>
                             <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase' }}>{res.isGeneral ? 'General Resource' : `${res.subLevel} • Unit ${res.unit}`}</span>
                             <h3 style={{ margin: '0 0 24px', fontWeight: '600', color: '#0F172A', fontSize: '1.4rem' }}>{res.title}</h3>
                             {res.audioUrl && ( <div style={{ width: '100%', marginBottom: '16px', padding: '8px', background: '#F8FAFC', borderRadius: '9999px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}><audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={res.audioUrl} type="audio/mpeg" /></audio></div> )}
                             {res.fileUrl && <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%', background: res.audioUrl ? '#EEF2FF' : '#4F46E5', color: res.audioUrl ? '#4F46E5' : '#ffffff', boxShadow: res.audioUrl ? 'none' : '0 10px 20px -5px rgba(79,70,229,0.4)', textDecoration: 'none'}}>{res.audioUrl ? 'Download Worksheet' : 'Download Lesson'}</a>}
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* --- TABS --- */
                <>
                  {activeTab === 'Book Reviews' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                        <button style={{...styles.actionButton, background: bookCategory === 'Fiction' ? '#4F46E5' : '#ffffff', color: bookCategory === 'Fiction' ? '#ffffff' : '#475569', boxShadow: bookCategory === 'Fiction' ? '0 10px 20px -5px rgba(79,70,229,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => handleCategorySwitch('Fiction')}><IconFiction /> Fiction</button>
                        <button style={{...styles.actionButton, background: bookCategory === 'Non-Fiction' ? '#4F46E5' : '#ffffff', color: bookCategory === 'Non-Fiction' ? '#ffffff' : '#475569', boxShadow: bookCategory === 'Non-Fiction' ? '0 10px 20px -5px rgba(79,70,229,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => handleCategorySwitch('Non-Fiction')}><IconNonFiction /> Non-Fiction</button>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '60px', flexWrap: 'wrap' }}>
                        {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => ( <button key={cat} style={styles.badgeButton(activeSubCategory === cat)} onClick={() => setActiveSubCategory(cat)}>{cat}</button> ))}
                      </div>

                      <div style={styles.grid}>
                        {displayedReviews.length > 0 ? displayedReviews.map(book => (
                          <div key={book._id} className="soft-card" style={styles.card}>
                            <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                            <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center' }}>{book.title}</h3>
                              {book.content && ( <div style={{ width: '100%', marginTop: 'auto' }}><button style={styles.readMoreBtn} onClick={() => setSelectedBook(book)}>Read Review</button></div> )}
                            </div>
                          </div>
                        )) : ( <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94A3B8', background: '#ffffff', borderRadius: '32px' }}><h3 style={{ fontWeight: '600', margin: 0, fontSize: '1.5rem' }}>No reviews found</h3></div> )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'English Corner' && !activeLevel && (
                     <div style={styles.grid}>{LEVELS.map(lvl => ( <div key={lvl.name} className="soft-card" style={{...styles.card, padding: '40px', textAlign: 'center', cursor: 'pointer', fontSize: '1.5rem', fontWeight: '600', color: '#0F172A'}} onClick={() => setActiveLevel(lvl.name)}><div style={{ color: '#4F46E5', marginBottom: '20px', transform: 'scale(1.4)' }}>{lvl.icon}</div>{lvl.name}</div> ))}</div>
                  )}

                  {activeTab === 'English Corner' && activeLevel && !activeSubLevel && (
                    <>
                      <button onClick={() => setActiveLevel(null)} style={{ background: 'transparent', border: 'none', color: '#64748B', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', fontSize: '1.1rem' }}>← Back to Levels</button>
                      <div style={styles.grid}>{LEVELS.find(l => l.name === activeLevel)?.subLevels.map(sub => ( <div key={sub} className="soft-card" style={{...styles.card, padding: '40px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', cursor: 'pointer'}} onClick={() => setActiveSubLevel(sub)}>{sub}</div> ))}</div>
                    </>
                  )}

                  {activeTab === 'English Corner' && activeSubLevel && !activeUnit && (
                    <>
                      <button onClick={() => setActiveSubLevel(null)} style={{ background: 'transparent', border: 'none', color: '#64748B', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', fontSize: '1.1rem' }}>← Back</button>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                        <h2 style={{ margin: 0, color: '#0F172A', fontWeight: '600', fontSize: '2.5rem' }}>{activeSubLevel} Curriculum</h2>
                        <button onClick={() => startQuiz(true)} style={{ ...styles.actionButton, background: '#F59E0B', boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)' }}>🌟 Take Final Exam</button>
                      </div>
                      <div style={styles.grid}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(u => ( <div key={u} className="soft-card" style={{...styles.card, padding: '30px', cursor: 'pointer', textAlign: 'center'}} onClick={() => setActiveUnit(u)}><h3 style={{ margin: '0 0 16px', fontSize: '1.8rem', color: '#0F172A' }}>Unit {u}</h3><span style={{ background: '#F1F5F9', color: '#475569', padding: '8px 20px', borderRadius: '9999px', fontWeight: '500' }}>Enter Syllabus</span></div> ))}</div>
                    </>
                  )}

                  {activeTab === 'English Corner' && activeUnit && (
                    <>
                      <button onClick={() => setActiveUnit(null)} style={{ background: 'transparent', border: 'none', color: '#64748B', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', fontSize: '1.1rem' }}>← Back to Units</button>
                      <div className="responsive-card" style={{ ...styles.card, padding: '50px', maxWidth: '1000px', margin: '0 auto' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px', paddingBottom: '40px', borderBottom: '2px solid #F1F5F9' }}>
                          <div>
                            <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '8px 20px', borderRadius: '9999px', fontWeight: '600', marginBottom: '16px' }}>{activeLevel} • {activeSubLevel}</span>
                            <h2 style={{ margin: 0, fontWeight: '600', fontSize: '3rem', color: '#0F172A' }}>Unit {activeUnit} Syllabus</h2>
                          </div>
                          <button onClick={() => startQuiz(false)} style={{ ...styles.actionButton, background: '#10B981', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}><IconQuiz /> Test Your Knowledge</button>
                        </div>

                        <div style={{ marginBottom: '40px' }}>
                          <h3 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', marginBottom: '20px' }}>Interactive Modules</h3>
                          
                          {interactiveLessons.filter(l => l.unit === activeUnit && l.subLevel === activeSubLevel).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {interactiveLessons.filter(l => l.unit === activeUnit && l.subLevel === activeSubLevel).map((lesson) => (
                                <div key={lesson._id} style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '24px', padding: '30px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                  <div>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Module {lesson.lessonOrder}</span>
                                    <h3 style={{ margin: '12px 0 0 0', fontSize: '1.8rem', fontWeight: '600' }}>{lesson.title}</h3>
                                  </div>
                                  <button 
                                    onClick={() => { setActiveLessonData(lesson); setIsInteractiveLesson(true); }} 
                                    style={{ background: '#ffffff', color: '#4F46E5', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                  >
                                    Start Lesson
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '24px', padding: '32px', textAlign: 'center' }}><span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: '500' }}>No interactive lessons published for this unit yet.</span></div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          {SKILLS.map(skill => {
                            const skillPdfs = resources.filter(r => !r.isGeneral && r.level === activeLevel && r.subLevel === activeSubLevel && r.unit === activeUnit && r.category === skill.name);
                            return (
                              <div key={skill.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                  <span style={{ fontSize: '1.8rem', background: skill.bg, color: skill.color, padding: '12px', borderRadius: '16px' }}>{skill.icon}</span>
                                  <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.6rem', fontWeight: '600' }}>{skill.name}</h4>
                                </div>
                                
                                {skillPdfs.length > 0 ? ( 
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {skillPdfs.map(pdf => (
                                      <div key={pdf._id} className="soft-card" style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', border: '2px solid #F1F5F9', padding: '24px', borderRadius: '24px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', marginBottom: '8px' }}>{pdf.audioUrl ? '🎧 Audio Lesson' : '📄 PDF Material'}</span>
                                        <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '1.2rem', marginBottom: '24px', lineHeight: '1.4' }}>{pdf.title}</span>
                                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                          {pdf.audioUrl && ( <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '9999px' }}><audio controls style={{ width: '100%', height: '40px' }}><source src={pdf.audioUrl} type="audio/mpeg" /></audio></div> )}
                                          {pdf.fileUrl && <a href={pdf.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%', background: pdf.audioUrl ? '#EEF2FF' : '#4F46E5', color: pdf.audioUrl ? '#4F46E5' : '#ffffff', border: 'none', textAlign: 'center', textDecoration: 'none'}}>{pdf.audioUrl ? 'Download Worksheet' : 'Open Lesson'}</a>}
                                        </div>
                                      </div>
                                    ))}
                                  </div> 
                                ) : ( 
                                  <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '24px', padding: '32px', textAlign: 'center' }}><span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: '500' }}>No {skill.name.toLowerCase()} materials published yet.</span></div> 
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'Resources' && <ResourceLibrary resources={resources} />}

                  {activeTab === 'My Vault' && <VocabVault savedWords={savedWords} toggleSaveWord={toggleSaveWord} />}

                  {activeTab === 'About' && (
                    <div className="soft-card" style={{ ...styles.card, maxWidth: '750px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
                      <h2 style={{ marginBottom: '30px', fontWeight: '600', fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1px' }}>About the Teacher</h2>
                      <p style={{ lineHeight: '2.2', color: '#475569', fontSize: '1.3rem', fontWeight: '400' }}>Welcome to my classroom. I am passionate about blending literature with language learning to help you achieve absolute fluency.</p>
                    </div>
                  )}

                  {activeTab === 'Contact' && (
                    <div className="soft-card" style={{ ...styles.card, maxWidth: '650px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
                      <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>👋</div>
                      <h2 style={{ marginBottom: '20px', fontWeight: '600', fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1px' }}>Get in Touch</h2>
                      <p style={{ color: '#475569', marginBottom: '40px', fontSize: '1.3rem', fontWeight: '400' }}>Want to book a tutoring session or ask a question?</p>
                      <a href="mailto:teacher@litandlearn.com" style={{...styles.actionButton, padding: '18px 48px', fontSize: '1.3rem', width: 'auto', textDecoration: 'none'}}>Email Me</a>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* --- OVERLAY RENDERER --- */
            <>
              {isQuizMode && <QuizOverlay quizItems={quizItems} isLevelExam={isLevelExam} onClose={() => handleNavigation()} dictionary={dictionary} savedWords={savedWords} toggleSaveWord={toggleSaveWord} />}
              
              {isInteractiveLesson && activeLessonData && (
                <InteractiveLesson
                  lessonData={activeLessonData}
                  onClose={() => handleNavigation()}
                  dictionary={dictionary}
                  savedWords={savedWords}
                  toggleSaveWord={toggleSaveWord}
                />
              )}
            </>
          )}
        </div>

        <footer style={{ background: '#0F172A', color: '#94A3B8', marginTop: '100px', padding: '80px 20px', borderRadius: '40px 40px 0 0' }}>
          <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div>
              <h3 style={{ color: '#ffffff', margin: '0 0 20px', fontSize: '2.2rem', fontWeight: '600', letterSpacing: '-1px' }}>Lit & Learn</h3>
              <p style={{ margin: '0 auto', lineHeight: '1.8', maxWidth: '300px', fontWeight: '400', fontSize: '1.15rem' }}>Mastering English through global literature — one page at a time.</p>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '500', paddingTop: '30px' }}>© 2026 Lit & Learn. All rights reserved.</div>
          </div>
        </footer>
      </div>

      {selectedBook && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBook(null)}>
          <div className="responsive-card" style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setSelectedBook(null)}>✕</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {selectedBook.coverImage && <img src={urlFor(selectedBook.coverImage).url()} alt={selectedBook.title} style={{ width: '220px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }} />}
                <div>
                  <span style={{ display: 'inline-block', background: '#F1F5F9', color: '#64748B', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{selectedBook.subCategory || selectedBook.category}</span>
                  <h2 style={{ margin: '0 0 16px', fontSize: '3rem', fontWeight: '600', color: '#0F172A', letterSpacing: '-1px', lineHeight: '1.1' }}>{selectedBook.title}</h2>
                </div>
              </div>
              <div className="reading-box" style={{ color: '#475569', fontSize: '1.3rem', lineHeight: '2', fontWeight: '400', maxWidth: '650px', textAlign: 'left' }}>
                {!selectedBook.content ? ( 
                  <p style={{ color: '#94A3B8', textAlign: 'center' }}>No review written yet.</p> 
                ) : typeof selectedBook.content === 'string' ? ( 
                  <TextHighlighter text={selectedBook.content} onSaveWord={toggleSaveWord} savedWords={savedWords} /> 
                ) : ( 
                  <TextHighlighter text={selectedBook.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n')} onSaveWord={toggleSaveWord} savedWords={savedWords} /> 
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}