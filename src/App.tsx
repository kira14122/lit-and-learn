import React, { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import { VocabVault } from './components/VocabVault';
import { QuizOverlay } from './components/QuizOverlay';
import { ResourceLibrary } from './components/ResourceLibrary';
import { InteractiveLesson } from './components/InteractiveLesson';
import { CustomAudioPlayer } from './components/CustomAudioPlayer';
import TextHighlighter from './components/TextHighlighter';

// --- 1. SLEEK SVG ICONS (No native emojis) ---
const IconFiction = ({ size = 18 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconNonFiction = ({ size = 18 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>);
const IconBeginner = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" strokeOpacity="0.2"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconIntermediate = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconAdvanced = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" fill="currentColor"/></svg>);
const IconSearch = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const IconQuiz = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconLock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconCheck = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconTarget = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IconStar = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IconMail = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>);
const IconDoc = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const IconAudio = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>);
const IconLibrary = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);

const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.05)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

// --- 2. CONSTANTS & STYLES ---
const fictionCategories = ["British Literature", "American Literature", "Russian Literature", "Arabic Literature", "Other Literature"];
const nonFictionCategories = ["Informative & Educational", "Self Improvement", "Language Learning & Teaching"];
const LEVELS = [ { name: "Beginner", icon: <IconBeginner />, subLevels: ["Level 1", "Level 2", "Level 3"] }, { name: "Intermediate", icon: <IconIntermediate />, subLevels: ["Level 4", "Level 5", "Level 6"] }, { name: "Advanced", icon: <IconAdvanced />, subLevels: ["Level 7", "Level 8", "Business English"] } ];

const styles: any = {
  page: { fontFamily: '"Fredoka", sans-serif', backgroundColor: '#F3F6F8', minHeight: '100vh', color: '#0F172A', padding: '40px 0 0 0' },
  container: { width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 40px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ background: a ? '#4F46E5' : 'transparent', color: a ? '#ffffff' : '#64748B', border: 'none', fontSize: '17px', fontWeight: '600', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s ease' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column' },
  actionButton: { background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s' },
  readMoreBtn: { fontFamily: '"Fredoka", sans-serif', background: '#F8FAFC', border: 'none', color: '#4F46E5', fontWeight: '600', fontSize: '1.05rem', padding: '12px 20px', borderRadius: '16px', marginTop: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', width: '100%' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '50px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)' },
  closeButton: { position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#0F172A', fontWeight: 'bold', fontSize: '1.4rem', zIndex: 10 },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('English Corner');
  
  const [bookCategory, setBookCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null); 
  const [reviews, setReviews] = useState<any[]>([]);
  
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeSubLevel, setActiveSubLevel] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<number | null>(null);

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [unitMetadataList, setUnitMetadataList] = useState<any[]>([]);

  const [resources, setResources] = useState<any[]>([]);
  const [interactiveLessons, setInteractiveLessons] = useState<any[]>([]);
  const [dictionary, setDictionary] = useState<Record<string, any>>({});
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isLevelExam, setIsLevelExam] = useState(false);
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [isInteractiveLesson, setIsInteractiveLesson] = useState(false);
  const [activeLessonData, setActiveLessonData] = useState<any | null>(null);
  
  const [showNoQuizModal, setShowNoQuizModal] = useState(false);

  useEffect(() => {
    client.fetch('*[_type == "review"] | order(title asc)').then(setReviews);
    client.fetch('*[_type == "resource"] | order(unit asc) {..., "fileUrl": file.asset->url, "audioUrl": audio.asset->url}').then(setResources);
    client.fetch('*[_type == "unitMetadata"]').then(setUnitMetadataList);

    client.fetch(`*[_type == "interactiveLesson"] | order(lessonOrder asc) {
      ...,
      lessonBlocks[]{
        ...,
        "audioUrl": audio.asset->url,
        visualHook{ ..., asset->{ url } }
      }
    }`).then(setInteractiveLessons);

    client.fetch('*[_type == "dictionaryWord"]').then((data) => {
      const dictMap: Record<string, any> = {};
      data.forEach((item: any) => { if (item.word) dictMap[item.word.toLowerCase()] = { pos: item.pos, def: item.definition, level: item.level }; });
      setDictionary(dictMap);
    });

    const localVault = localStorage.getItem('vocabVault');
    if (localVault) setSavedWords(JSON.parse(localVault));

    const localProgress = localStorage.getItem('litAndLearnProgress');
    if (localProgress) setCompletedLessons(JSON.parse(localProgress));
  }, []);

  const toggleSaveWord = (word: string, info: any) => {
    if (!word) return;
    setSavedWords((prevVault) => {
      const cleanWord = word.trim().toLowerCase();
      const exists = prevVault.some(w => w?.word?.trim().toLowerCase() === cleanWord);
      let updatedVault;
      if (exists) {
        updatedVault = prevVault.filter(w => w?.word?.trim().toLowerCase() !== cleanWord);
      } else {
        updatedVault = [...prevVault, { word: word.trim(), ...info }];
      }
      localStorage.setItem('vocabVault', JSON.stringify(updatedVault));
      return updatedVault;
    });
  };

  const handleMarkLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => {
      if (prev.includes(lessonId)) return prev;
      const newProgress = [...prev, lessonId];
      localStorage.setItem('litAndLearnProgress', JSON.stringify(newProgress));
      return newProgress;
    });
  };

  const getUnitMeta = (u: number) => {
    const meta = unitMetadataList.find(m => m.level === activeLevel && m.subLevel === activeSubLevel && m.unitNumber === u);
    
    if (meta) {
      return {
        title: meta.title,
        desc: meta.description,
        objectives: meta.objectives || []
      };
    }

    return { 
      title: `Curriculum Syllabus`, 
      desc: "Learning objectives and details will be published soon.", 
      objectives: ["Complete all reading assignments", "Finish interactive grammar labs"] 
    };
  };

  const displayedReviews = reviews.filter(rev => {
    if (!bookCategory || !activeSubCategory) return false;
    const mainCat = rev.mainCategory || rev.category || 'Fiction';
    const subCat = rev.subCategory || ''; 
    return mainCat === bookCategory && subCat === activeSubCategory;
  });

  const searchResultsReviews = reviews.filter(rev => rev.title?.toLowerCase().includes(searchTerm.toLowerCase()) || (typeof rev.content === 'string' && rev.content.toLowerCase().includes(searchTerm.toLowerCase())) );
  const searchResultsResources = resources.filter(res => res.title?.toLowerCase().includes(searchTerm.toLowerCase()) || res.category?.toLowerCase().includes(searchTerm.toLowerCase()) || res.subLevel?.toLowerCase().includes(searchTerm.toLowerCase()) );

  const startQuiz = async (runAsLevelExam: boolean = false) => {
    const singleQuery = runAsLevelExam ? `*[_type == "quizQuestion" && level == "${activeLevel}"]{..., "questionAudioUrl": audioSnippet.asset->url, "lessonUrl": relatedLesson->file.asset->url, "lessonTitle": relatedLesson->title}` : `*[_type == "quizQuestion" && unit == ${activeUnit} && level == "${activeLevel}"]{..., "questionAudioUrl": audioSnippet.asset->url, "lessonUrl": relatedLesson->file.asset->url, "lessonTitle": relatedLesson->title}`;
    const blockQuery = runAsLevelExam ? `*[_type == "comprehensionBlock" && level == "${activeLevel}"]{..., "blockAudioUrl": audioFile.asset->url}` : `*[_type == "comprehensionBlock" && unit == ${activeUnit} && level == "${activeLevel}"]{..., "blockAudioUrl": audioFile.asset->url}`;
    
    const [singleData, blockData] = await Promise.all([client.fetch(singleQuery), client.fetch(blockQuery)]);
    let allItems = [...singleData, ...blockData].sort(() => 0.5 - Math.random()).slice(0, 15);
    
    if (allItems.length === 0) {
      setShowNoQuizModal(true);
      return; 
    }

    setQuizItems(allItems); 
    setIsLevelExam(runAsLevelExam); 
    setIsQuizMode(true);
  };

  const handleNavigation = (tab?: string) => {
    if (tab) setActiveTab(tab);
    setBookCategory(null);
    setActiveSubCategory(null);
    setActiveLevel(null);
    setActiveSubLevel(null);
    setActiveUnit(null);
    setIsQuizMode(false);
    setIsLevelExam(false);
    setIsInteractiveLesson(false);
    setActiveLessonData(null);
  };

  const isOverlayActive = isQuizMode || isInteractiveLesson;

  const unitLessons = interactiveLessons.filter(l => l.unit === activeUnit && l.subLevel === activeSubLevel).sort((a, b) => a.lessonOrder - b.lessonOrder);
  const allLessonsCompleted = unitLessons.length > 0 && unitLessons.every(l => completedLessons.includes(l._id));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; font-family: 'Fredoka', sans-serif !important; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .soft-card:hover { transform: translateY(-8px); box-shadow: 0 40px 60px -15px rgba(15, 23, 42, 0.1) !important; }
        .back-btn:hover { background-color: #EEF2FF !important; transform: translateX(-4px); }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 768px) {
          .app-container { padding: 0 16px !important; }
          .page-header h1 { font-size: 3.2rem !important; }
          .timeline-row { gap: 12px !important; }
          .timeline-icon-col { width: 44px !important; }
          .timeline-icon { width: 44px !important; height: 44px !important; font-size: 1.1rem !important; }
          .timeline-card { padding: 20px !important; flex-direction: column !important; align-items: stretch !important; gap: 16px !important; border-radius: 20px !important; }
          .timeline-card h3 { font-size: 1.4rem !important; line-height: 1.3 !important; margin-top: 4px !important; }
          .timeline-card button { width: 100% !important; justify-content: center !important; padding: 14px !important; }
          .timeline-final-icon { width: 50px !important; height: 50px !important; font-size: 1.5rem !important; }
          .timeline-final-card { padding: 24px !important; align-items: stretch !important; border-radius: 20px !important; }
          .timeline-final-card h3 { font-size: 1.6rem !important; }
          .timeline-final-card button { width: 100% !important; justify-content: center !important; padding: 14px !important; }
        }
      `}</style>

      <div style={styles.page}>
        <header style={styles.header}>
          <h1 className="page-header" style={{ fontSize: '4.5rem', fontWeight: '600', color: '#0F172A', margin: '0 0 10px 0' }}>Lit <span style={{ color: '#4F46E5' }}>&</span> Learn</h1>
          <p style={{color: '#94A3B8', letterSpacing: '3px', fontWeight: '500', fontSize: '1rem', textTransform: 'uppercase', margin: 0}}>English • Literature • Language</p>
          
          <div style={{ marginTop: '30px' }}>
            {!isOverlayActive && (
              <nav style={styles.nav}>
                {['Book Reviews', 'English Corner', 'Resources', 'Word Bank', 'About', 'Contact'].map(tab => (
                  <button key={tab} style={styles.navButton(activeTab === tab)} onClick={() => handleNavigation(tab)}>{tab}</button>
                ))}
              </nav>
            )}
          </div>
        </header>

        <div className="app-container" style={styles.container}>
          {!isOverlayActive ? (
            <>
              {/* TOP ACTION BAR */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', gap: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 8px 0', fontWeight: '600', letterSpacing: '-1px' }}>
                    {searchTerm ? 'Search Results' : activeTab}
                  </h2>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem' }}>
                    {searchTerm ? `Showing results for "${searchTerm}"` : 
                      activeTab === 'Book Reviews' ? 'Explore literary analysis and critiques.' : 
                      activeTab === 'English Corner' ? 'Master grammar, vocabulary, and skills.' :
                      activeTab === 'Resources' ? 'Download worksheets and audio lessons.' :
                      activeTab === 'Word Bank' ? 'Review your saved vocabulary.' : 'Welcome to Lit & Learn.'}
                  </p>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}><IconSearch /></div>
                  <input 
                    type="text" placeholder="Search everything..." 
                    style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.05rem', fontWeight: '500', borderRadius: '16px', border: '2px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A', outline: 'none', transition: 'all 0.2s' }} 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                    onFocus={(e) => e.target.style.borderColor = '#4F46E5'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>

              {searchTerm ? (
                /* --- SEARCH RESULTS --- */
                <div>
                  {searchResultsReviews.length > 0 && (
                    <div style={{ marginBottom: '60px' }}>
                      <h3 style={{ color: '#4F46E5', fontWeight: '600', fontSize: '1.8rem', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Literature & Reviews</h3>
                      <div style={styles.grid}>
                        {searchResultsReviews.map(book => (
                           <div key={book._id} className="soft-card" style={styles.card}>
                             <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                             <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                               <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center' }}>{book.title}</h3>
                               <button style={{ ...styles.actionButton, width: '100%', marginTop: 'auto' }} onClick={() => setSelectedBook(book)}>Read Review</button>
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
                             <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', color: '#94A3B8' }}>
                               {res.isGeneral ? <IconDoc /> : res.audioUrl ? <IconAudio /> : <IconLibrary />}
                             </div>
                             <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>
                               {res.isGeneral ? 'General Guide' : `${res.subLevel} • Unit ${res.unit}`}
                             </span>
                             <h3 style={{ margin: '0 0 24px', fontWeight: '600', color: '#0F172A', fontSize: '1.4rem' }}>{res.title}</h3>
                             
                             {/* THE INJECTED CUSTOM PLAYER FOR SEARCH RESULTS */}
                             {res.audioUrl && ( 
                               <div style={{ width: '100%', marginBottom: '24px' }}>
                                 <CustomAudioPlayer src={res.audioUrl} title="Listen to Track" />
                               </div> 
                             )}
                             
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
                  {/* BOOK REVIEWS FLOW */}
                  {activeTab === 'Book Reviews' && (
                    <div>
                      {!bookCategory ? (
                        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
                            <button onClick={() => setBookCategory('Fiction')} className="soft-card" style={{ flex: '1 1 300px', maxWidth: '350px', padding: '50px 40px', backgroundColor: '#ffffff', border: '2px solid #E2E8F0', borderRadius: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', transition: 'all 0.3s' }}>
                              <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '24px', borderRadius: '50%', display: 'flex' }}><IconFiction size={40} /></div>
                              <h3 style={{ fontSize: '2rem', color: '#0F172A', margin: 0 }}>Fiction</h3>
                              <p style={{ color: '#64748B', margin: 0, fontSize: '1.1rem' }}>Novels, short stories, and classics.</p>
                            </button>

                            <button onClick={() => setBookCategory('Non-Fiction')} className="soft-card" style={{ flex: '1 1 300px', maxWidth: '350px', padding: '50px 40px', backgroundColor: '#ffffff', border: '2px solid #E2E8F0', borderRadius: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', transition: 'all 0.3s' }}>
                              <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '24px', borderRadius: '50%', display: 'flex' }}><IconNonFiction size={40} /></div>
                              <h3 style={{ fontSize: '2rem', color: '#0F172A', margin: 0 }}>Non-Fiction</h3>
                              <p style={{ color: '#64748B', margin: 0, fontSize: '1.1rem' }}>Essays and educational texts.</p>
                            </button>
                          </div>
                        </div>
                      ) : !activeSubCategory ? (
                        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-block', textAlign: 'left', width: '100%', maxWidth: '1000px' }}>
                              <BackButton onClick={() => setBookCategory(null)} text="Back to Library" />
                              <h3 style={{ fontSize: '2.2rem', color: '#0F172A', margin: '16px 0 8px 0' }}>Select a Genre</h3>
                              <p style={{ color: '#64748B', fontSize: '1.1rem', margin: 0 }}>{bookCategory}</p>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                            {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => ( 
                              <button key={cat} className="soft-card" style={{ flex: '1 1 250px', maxWidth: '300px', padding: '30px 20px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px', fontSize: '1.3rem', fontWeight: '600', color: '#4F46E5', cursor: 'pointer', textAlign: 'center' }} onClick={() => setActiveSubCategory(cat)}>{cat}</button> 
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                          <div style={{ marginBottom: '30px' }}>
                            <BackButton onClick={() => setActiveSubCategory(null)} text="Back to Genres" />
                            <h3 style={{ fontSize: '2.2rem', color: '#0F172A', margin: '16px 0 4px 0' }}>{activeSubCategory}</h3>
                            <span style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '500' }}>{bookCategory}</span>
                          </div>

                          <div style={styles.grid}>
                            {displayedReviews.length > 0 ? displayedReviews.map(book => (
                              <div key={book._id} className="soft-card" style={styles.card}>
                                <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center', lineHeight: '1.2' }}>{book.title}</h3>
                                  {book.content && ( <div style={{ width: '100%', marginTop: 'auto' }}><button style={styles.readMoreBtn} onClick={() => setSelectedBook(book)}>Read Review</button></div> )}
                                </div>
                              </div>
                            )) : ( 
                              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94A3B8', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0' }}>
                                <h3 style={{ fontWeight: '600', margin: 0, fontSize: '1.5rem', color: '#475569' }}>No books found</h3>
                                <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem' }}>Reviews for this category haven't been published yet.</p>
                              </div> 
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===================== ENGLISH CORNER FLOW ===================== */}
                  {activeTab === 'English Corner' && !activeLevel && (
                    <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
                        {LEVELS.map((lvl, index) => {
                          const colors = [ { bg: '#EEF2FF', icon: '#4F46E5' }, { bg: '#FEF3C7', icon: '#D97706' }, { bg: '#ECFDF5', icon: '#059669' } ];
                          return (
                            <button key={lvl.name} onClick={() => setActiveLevel(lvl.name)} className="soft-card" style={{ flex: '1 1 280px', maxWidth: '320px', padding: '50px 40px', backgroundColor: '#ffffff', border: '2px solid #E2E8F0', borderRadius: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', transition: 'all 0.3s' }}>
                              <div style={{ background: colors[index].bg, color: colors[index].icon, padding: '24px', borderRadius: '50%', display: 'flex' }}>{React.cloneElement(lvl.icon, { size: 40 })}</div>
                              <h3 style={{ fontSize: '2rem', color: '#0F172A', margin: 0 }}>{lvl.name}</h3>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'English Corner' && activeLevel && !activeSubLevel && (
                    <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', textAlign: 'left', width: '100%', maxWidth: '1000px' }}>
                          <BackButton onClick={() => setActiveLevel(null)} text="Back to Levels" />
                          <h3 style={{ fontSize: '2.2rem', color: '#0F172A', margin: '16px 0 8px 0' }}>Select a Path</h3>
                          <p style={{ color: '#64748B', fontSize: '1.1rem', margin: 0 }}>{activeLevel} Curriculum</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                        {LEVELS.find(l => l.name === activeLevel)?.subLevels.map(sub => (
                          <button key={sub} className="soft-card" style={{ flex: '1 1 250px', maxWidth: '300px', padding: '30px 20px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px', fontSize: '1.3rem', fontWeight: '600', color: '#4F46E5', cursor: 'pointer', textAlign: 'center' }} onClick={() => setActiveSubLevel(sub)}>
                            {sub}
                          </button> 
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'English Corner' && activeSubLevel && !activeUnit && (
                    <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                        <div>
                          <BackButton onClick={() => setActiveSubLevel(null)} text="Back to Paths" />
                          <h2 style={{ margin: '16px 0 4px 0', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem' }}>{activeSubLevel} Curriculum</h2>
                          <span style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '500' }}>{activeLevel}</span>
                        </div>
                        <button onClick={() => startQuiz(true)} style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '14px 28px', borderRadius: '16px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', marginTop: '20px' }}>
                          <IconStar /> Level Placement Test
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(u => {
                          const meta = getUnitMeta(u);
                          return ( 
                            <button key={u} className="soft-card" style={{ flex: '1 1 280px', maxWidth: '320px', padding: '32px', backgroundColor: '#ffffff', border: '2px solid #E2E8F0', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s' }} onClick={() => setActiveUnit(u)}>
                              <div style={{ width: '100%' }}>
                                 <h3 style={{ margin: '0 0 8px 0', fontSize: '2.4rem', color: '#0F172A', fontWeight: '700', letterSpacing: '-1px' }}>Unit {u}</h3>
                                 <span style={{ display: 'inline-block', color: '#4F46E5', fontWeight: '600', fontSize: '1.1rem' }}>{meta.title}</span>
                              </div>
                              <div style={{ height: '2px', width: '40px', backgroundColor: '#EEF2FF', borderRadius: '2px' }} />
                              <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0, lineHeight: '1.6', flexGrow: 1 }}>{meta.desc}</p>
                            </button> 
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ===================== THE UNIT LEARNING PATH ===================== */}
                  {activeTab === 'English Corner' && activeUnit && (
                    <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                      <div style={{ marginBottom: '30px' }}>
                        <BackButton onClick={() => setActiveUnit(null)} text="Back to Units" />
                      </div>

                      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                          <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '8px 20px', borderRadius: '9999px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                            {activeLevel} • {activeSubLevel}
                          </span>
                          <h2 style={{ margin: '0 0 16px', fontWeight: '600', fontSize: '3.5rem', color: '#0F172A', letterSpacing: '-1px', lineHeight: '1.1' }}>
                            Unit {activeUnit}:<br/>{getUnitMeta(activeUnit).title}
                          </h2>
                          <p style={{ color: '#64748B', fontSize: '1.2rem', margin: '0 auto', maxWidth: '600px', lineHeight: '1.6' }}>
                            {getUnitMeta(activeUnit).desc}
                          </p>
                        </div>

                        <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '30px', marginBottom: '60px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ color: '#4F46E5', display: 'flex' }}><IconTarget /></div>
                            Unit Objectives
                          </h3>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '1.1rem', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {getUnitMeta(activeUnit).objectives.map((obj: string, i: number) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {unitLessons.length > 0 ? unitLessons.map((lesson, index) => {
                            const isCompleted = completedLessons.includes(lesson._id);
                            const isLocked = index > 0 && !completedLessons.includes(unitLessons[index - 1]._id);
                            
                            let cardBg = '#ffffff'; let border = '2px solid #E2E8F0'; let iconBg = '#F1F5F9'; let iconColor = '#94A3B8';
                            if (isCompleted) { border = '2px solid #10B981'; iconBg = '#D1FAE5'; iconColor = '#10B981'; }
                            else if (!isLocked) { border = '2px solid #4F46E5'; iconBg = '#EEF2FF'; iconColor = '#4F46E5'; }

                            return (
                              <div key={lesson._id} className="timeline-row" style={{ display: 'flex', alignItems: 'stretch', gap: '24px', opacity: isLocked ? 0.6 : 1, pointerEvents: isLocked ? 'none' : 'auto', transition: 'all 0.3s' }}>
                                
                                <div className="timeline-icon-col" style={{ width: '64px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div className="timeline-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: isLocked ? 'none' : '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    {isCompleted ? <IconCheck /> : isLocked ? <IconLock /> : <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{index + 1}</span>}
                                  </div>
                                  {index < unitLessons.length - 1 && <div style={{ width: '4px', flexGrow: 1, background: isCompleted ? '#10B981' : '#E2E8F0', margin: '8px 0', borderRadius: '2px' }} />}
                                </div>

                                <div className="timeline-card soft-card" style={{ flexGrow: 1, background: cardBg, border, borderRadius: '24px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: index === unitLessons.length - 1 ? '40px' : '0' }}>
                                  <div>
                                    <span style={{ color: isCompleted ? '#10B981' : '#64748B', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                      {isCompleted ? 'Completed' : `Lesson ${lesson.lessonOrder}`}
                                    </span>
                                    <h3 style={{ margin: '8px 0 0 0', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A' }}>{lesson.title}</h3>
                                  </div>
                                  
                                  <button 
                                    onClick={() => {
                                      handleMarkLessonComplete(lesson._id);
                                      setActiveLessonData(lesson); 
                                      setIsInteractiveLesson(true); 
                                    }} 
                                    style={{ background: isCompleted ? '#F1F5F9' : '#4F46E5', color: isCompleted ? '#475569' : '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.05rem', cursor: 'pointer', boxShadow: isCompleted ? 'none' : '0 10px 20px rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center' }}
                                  >
                                    {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                                  </button>
                                </div>
                              </div>
                            )
                          }) : (
                            <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '24px', padding: '40px', textAlign: 'center', marginBottom: '40px' }}>
                              <span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: '500' }}>No lessons published for this unit yet.</span>
                            </div>
                          )}

                          <div className="timeline-row" style={{ display: 'flex', alignItems: 'stretch', gap: '24px', opacity: allLessonsCompleted ? 1 : 0.5, pointerEvents: allLessonsCompleted ? 'auto' : 'none', transition: 'all 0.3s' }}>
                            <div className="timeline-icon-col" style={{ width: '64px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div className="timeline-final-icon" style={{ width: '64px', height: '64px', borderRadius: '50%', background: allLessonsCompleted ? '#EEF2FF' : '#F1F5F9', color: allLessonsCompleted ? '#4F46E5' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: allLessonsCompleted ? '0 10px 20px rgba(79, 70, 229, 0.15)' : 'none', fontSize: '1.8rem' }}>
                                {allLessonsCompleted ? <IconStar /> : <IconLock />}
                              </div>
                            </div>
                            
                            <div className="timeline-final-card soft-card" style={{ flexGrow: 1, background: allLessonsCompleted ? '#ffffff' : '#ffffff', border: allLessonsCompleted ? '2px solid #4F46E5' : '2px dashed #E2E8F0', borderRadius: '32px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                              <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '600', color: '#0F172A' }}>Unit Assessment</h3>
                              <p style={{ color: '#64748B', margin: '0 0 24px 0', fontSize: '1.1rem', lineHeight: '1.5' }}>
                                {allLessonsCompleted ? 'You have completed all lessons inside the unit. You are ready to be tested.' : 'Complete all lessons above to unlock the assessment.'}
                              </p>
                              <button 
                                onClick={() => startQuiz(false)} 
                                disabled={!allLessonsCompleted}
                                style={{ background: allLessonsCompleted ? '#4F46E5' : '#E2E8F0', color: allLessonsCompleted ? '#ffffff' : '#94A3B8', border: 'none', padding: '16px 36px', borderRadius: '16px', fontWeight: '700', fontSize: '1.2rem', cursor: allLessonsCompleted ? 'pointer' : 'not-allowed', boxShadow: allLessonsCompleted ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                              >
                                <IconQuiz /> Start Assessment
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================== RESOURCES FLOW ===================== */}
                  {activeTab === 'Resources' && <ResourceLibrary resources={resources} />}

                  {activeTab === 'Word Bank' && <VocabVault savedWords={savedWords} toggleSaveWord={toggleSaveWord} />}

                  {activeTab === 'About' && (
                    <div className="soft-card" style={{ ...styles.card, maxWidth: '750px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
                      <h2 style={{ marginBottom: '30px', fontWeight: '600', fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1px' }}>About the Teacher</h2>
                      <p style={{ lineHeight: '2.2', color: '#475569', fontSize: '1.3rem', fontWeight: '400' }}>Welcome to my classroom. I am passionate about blending literature with language learning to help you achieve absolute fluency.</p>
                    </div>
                  )}

                  {activeTab === 'Contact' && (
                    <div className="soft-card" style={{ ...styles.card, maxWidth: '650px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
                      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><IconMail /></div>
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
                  onClose={() => {
                    setIsInteractiveLesson(false);
                    setActiveLessonData(null);
                  }}
                  dictionary={dictionary}
                  savedWords={savedWords}
                  toggleSaveWord={toggleSaveWord}
                  onComplete={() => handleMarkLessonComplete(activeLessonData._id)}
                />
              )}
            </>
          )}
        </div>

        {/* CUSTOM REACT MODAL FOR EMPTY QUIZ ALERTS */}
        {showNoQuizModal && (
          <div style={styles.modalOverlay} onClick={() => setShowNoQuizModal(false)}>
            <div className="responsive-card" style={{...styles.modalContent, maxWidth: '450px', textAlign: 'center', padding: '50px'}} onClick={e => e.stopPropagation()}>
              <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>No Questions Yet</h2>
              <p style={{ color: '#64748B', fontSize: '1.15rem', marginBottom: '32px', lineHeight: '1.6' }}>No assessment questions have been published for this unit yet. Check back later!</p>
              <button onClick={() => setShowNoQuizModal(false)} style={{ background: '#4F46E5', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                Understood
              </button>
            </div>
          </div>
        )}

        {/* BOOK REVIEW MODAL (WITH SANITY RICH TEXT FIX & TEXTHIGHLIGHTER) */}
        {selectedBook && (
          <div style={styles.modalOverlay} onClick={() => setSelectedBook(null)}>
            <div className="responsive-card" style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedBook(null)} style={styles.closeButton}>✕</button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '30px' }}>
                {selectedBook.coverImage ? (
                  <img src={urlFor(selectedBook.coverImage).url()} alt={selectedBook.title} style={{ height: '280px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }} />
                ) : (
                  <div style={{ height: '280px', width: '190px', background: '#F8FAFC', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', marginBottom: '24px' }}>No Cover</div>
                )}
                <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '8px', lineHeight: '1.2' }}>{selectedBook.title}</h2>
                <div style={{ height: '4px', width: '40px', backgroundColor: '#4F46E5', borderRadius: '2px', marginTop: '16px' }} />
              </div>

              <div style={{ fontSize: '1.2rem', color: '#334155', lineHeight: '2', whiteSpace: 'pre-wrap', padding: '0 20px' }}>
                <TextHighlighter 
                  text={
                    typeof selectedBook.content === 'string' 
                      ? selectedBook.content 
                      : Array.isArray(selectedBook.content) 
                        ? selectedBook.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n')
                        : "Review content is currently being updated."
                  } 
                  dictionary={dictionary} 
                  onSaveWord={toggleSaveWord} 
                  savedWords={savedWords} 
                />
              </div>
            </div>
          </div>
        )}

        <footer style={{ background: '#0F172A', color: '#94A3B8', marginTop: '100px', padding: '80px 20px', borderRadius: '40px 40px 0 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div>
              <h3 style={{ color: '#ffffff', margin: '0 0 20px', fontSize: '2.2rem', fontWeight: '600', letterSpacing: '-1px' }}>Lit & Learn</h3>
              <p style={{ margin: '0 auto', lineHeight: '1.8', maxWidth: '300px', fontWeight: '400', fontSize: '1.15rem' }}>Mastering English through global literature — one page at a time.</p>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '500', paddingTop: '30px' }}>© 2026 Lit & Learn. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
}