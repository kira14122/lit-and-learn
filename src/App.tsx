import React, { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';

// --- 1. ICONS ---
const IconFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconNonFiction = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>);
const IconBeginner = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" strokeOpacity="0.2"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconIntermediate = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconAdvanced = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" fill="currentColor"/></svg>);
const IconSearch = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const IconQuiz = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);

// --- 2. SMART READER COMPONENTS ---
const SmartWord = ({ word, dictInfo }: { word: string, dictInfo: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} style={{ color: '#4F46E5', fontWeight: '600', borderBottom: '2px dashed #A5B4FC', cursor: 'pointer', backgroundColor: isOpen ? '#EEF2FF' : 'transparent', padding: '2px 4px', borderRadius: '6px', transition: 'all 0.2s ease' }}>{word}</span>
      {isOpen && (
        <div style={{ position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0F172A', color: '#ffffff', padding: '20px', borderRadius: '24px', width: 'max-content', maxWidth: '320px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', zIndex: 9999, textAlign: 'left', fontFamily: '"Fredoka", sans-serif' }}>
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #0F172A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}><span style={{ fontSize: '1.3rem', fontWeight: '600', color: '#818CF8' }}>{word.toLowerCase()}</span><span style={{ fontSize: '0.8rem', background: '#334155', padding: '4px 10px', borderRadius: '9999px', fontWeight: '600', whiteSpace: 'nowrap' }}>{dictInfo.level}</span></div>
          <div style={{ color: '#94A3B8', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '8px' }}>{dictInfo.pos}</div>
          <div style={{ fontSize: '1rem', lineHeight: '1.5', color: '#F8FAFC', whiteSpace: 'normal' }}>{dictInfo.def}</div>
        </div>
      )}
    </span>
  );
}

const SmartText = ({ text, dictionary }: { text: string, dictionary: Record<string, any> }) => {
  const dictKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedKeys = dictKeys.map(escapeRegExp);
  const regexPattern = escapedKeys.length > 0 ? new RegExp(`(\\b(?:${escapedKeys.join('|')})\\b)`, 'gi') : null;
  const paragraphs = text.split(/\n+/);

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const parts = regexPattern ? paragraph.split(regexPattern) : [paragraph];
        return (
          <p key={pIndex} style={{ marginBottom: '1.5em', marginTop: 0 }}>
            {parts.map((part, i) => {
              const lowerPart = part.toLowerCase();
              if (dictionary[lowerPart]) { return <SmartWord key={i} word={part} dictInfo={dictionary[lowerPart]} />; }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
};

// --- 3. CONSTANTS & STYLES ---
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
  searchIconWrapper: { position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', background: a ? '#4F46E5' : 'transparent', color: a ? '#ffffff' : '#64748B', border: 'none', fontSize: '17px', fontWeight: '600', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: a ? '0 10px 20px -5px rgba(79,70,229,0.4)' : 'none' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 400px))', justifyContent: 'center', gap: '40px' },
  card: { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' },
  levelCard: { fontFamily: '"Fredoka", sans-serif', backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', border: 'none', fontSize: '1.5rem', fontWeight: '600', color: '#0F172A', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' },
  subButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#4F46E5' : '#ffffff', color: a ? '#ffffff' : '#475569', fontWeight: '600', cursor: 'pointer', boxShadow: a ? '0 10px 20px -5px rgba(79,70,229,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.05)', fontSize: '1.1rem' }),
  badgeButton: (a: boolean) => ({ fontFamily: '"Fredoka", sans-serif', padding: '10px 20px', borderRadius: '9999px', border: 'none', backgroundColor: a ? '#0F172A' : '#ffffff', color: a ? '#ffffff' : '#64748B', fontWeight: '500', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.04)' }),
  backButton: { fontFamily: '"Fredoka", sans-serif', background: '#ffffff', border: 'none', color: '#0F172A', cursor: 'pointer', marginBottom: '40px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '9999px', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.08)', fontSize: '1.1rem' },
  actionButton: { fontFamily: '"Fredoka", sans-serif', background: '#4F46E5', color: '#ffffff', textDecoration: 'none', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', display: 'inline-block', textAlign: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)', fontSize: '1.1rem' },
  quizOptionBtn: (isSelected: boolean) => ({ display: 'block', width: '100%', textAlign: 'left', padding: '20px', margin: '12px 0', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: '#0F172A', fontSize: '1.2rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }),
  tfngBtn: (isSelected: boolean) => ({ display: 'block', width: '100%', textAlign: 'center', padding: '18px', margin: '10px 0', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: isSelected ? '#4F46E5' : '#0F172A', fontSize: '1.3rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }),
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '50px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)' },
  closeButton: { position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#0F172A', fontWeight: 'bold', fontSize: '1.4rem' },
  readMoreBtn: { fontFamily: '"Fredoka", sans-serif', background: '#F8FAFC', border: 'none', color: '#4F46E5', fontWeight: '600', fontSize: '1.05rem', padding: '12px 20px', borderRadius: '16px', marginTop: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', width: '100%' }
};

// --- 4. MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Book Reviews');
  const [bookCategory, setBookCategory] = useState('Fiction');
  const [activeSubCategory, setActiveSubCategory] = useState('American Literature');
  const [reviews, setReviews] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [dictionary, setDictionary] = useState<Record<string, any>>({});
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeSubLevel, setActiveSubLevel] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- QUIZ ENGINE STATE ---
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isLevelExam, setIsLevelExam] = useState(false);
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    client.fetch('*[_type == "review"] | order(title asc)').then(setReviews);
    client.fetch('*[_type == "resource"] | order(unit asc) {..., "fileUrl": file.asset->url, "audioUrl": audio.asset->url}').then(setResources);
    client.fetch('*[_type == "dictionaryWord"]').then((data) => {
      const dictMap: Record<string, any> = {};
      data.forEach((item: any) => { if (item.word) dictMap[item.word.toLowerCase()] = { pos: item.pos, def: item.definition, level: item.level }; });
      setDictionary(dictMap);
    });
  }, []);

  const handleCategorySwitch = (category: string) => { setBookCategory(category); setActiveSubCategory(category === 'Fiction' ? 'American Literature' : 'Self Improvement'); };
  const displayedReviews = reviews.filter(rev => { return (rev.category || 'Fiction') === bookCategory && (rev.subCategory || 'American Literature') === activeSubCategory; });
  const searchResultsReviews = reviews.filter(rev => rev.title?.toLowerCase().includes(searchTerm.toLowerCase()) || (typeof rev.content === 'string' && rev.content.toLowerCase().includes(searchTerm.toLowerCase())) );
  const searchResultsResources = resources.filter(res => res.title?.toLowerCase().includes(searchTerm.toLowerCase()) || res.category?.toLowerCase().includes(searchTerm.toLowerCase()) || res.subLevel?.toLowerCase().includes(searchTerm.toLowerCase()) );

  const startQuiz = async (runAsLevelExam: boolean = false) => {
    const singleQuery = runAsLevelExam
      ? `*[_type == "quizQuestion" && level == "${activeLevel}"]{..., "questionAudioUrl": audioSnippet.asset->url, "lessonUrl": relatedLesson->file.asset->url, "lessonTitle": relatedLesson->title}`
      : `*[_type == "quizQuestion" && unit == ${activeUnit} && level == "${activeLevel}"]{..., "questionAudioUrl": audioSnippet.asset->url, "lessonUrl": relatedLesson->file.asset->url, "lessonTitle": relatedLesson->title}`;
    
    const blockQuery = runAsLevelExam
      ? `*[_type == "comprehensionBlock" && level == "${activeLevel}"]{..., "blockAudioUrl": audioFile.asset->url}`
      : `*[_type == "comprehensionBlock" && unit == ${activeUnit} && level == "${activeLevel}"]{..., "blockAudioUrl": audioFile.asset->url}`;

    const [singleData, blockData] = await Promise.all([client.fetch(singleQuery), client.fetch(blockQuery)]);
    let allItems = [...singleData, ...blockData];
    const finalShuffle = allItems.sort(() => 0.5 - Math.random()).slice(0, 15);
    
    setQuizItems(finalShuffle);
    setCurrentItemIndex(0);
    setUserAnswers({});
    setQuizFinished(false);
    setIsLevelExam(runAsLevelExam);
    setIsQuizMode(true);
  };

  const handleSelectAnswer = (itemIndex: number, optionLabel: string, subQuestionId?: string) => {
    const key = subQuestionId ? `${itemIndex}-${subQuestionId}` : `${itemIndex}`;
    setUserAnswers({ ...userAnswers, [key]: optionLabel });
  };
  
  const submitQuiz = () => setQuizFinished(true);

  // --- UPGRADED DIAGNOSTIC LOGIC (Handles TFNG formatting) ---
  const skillScores: Record<string, { correct: number, total: number }> = {};
  const wrongAnswers: any[] = [];
  let totalCorrect = 0;
  let totalQuestions = 0;

  quizItems.forEach((item, idx) => {
    if (item._type === 'quizQuestion') {
      const skill = item.skill || 'General';
      if (!skillScores[skill]) skillScores[skill] = { correct: 0, total: 0 };
      skillScores[skill].total += 1;
      totalQuestions += 1;

      const isCorrect = userAnswers[`${idx}`] === item.correctAnswer;
      if (isCorrect) {
        skillScores[skill].correct += 1;
        totalCorrect += 1;
      } else {
        // TFNG Check for Single Questions
        let uAns = 'Missed Question';
        let cAns = 'Unknown';
        if (item.questionFormat === 'True / False / Not Given') {
          uAns = userAnswers[`${idx}`] || 'Missed Question';
          cAns = item.correctAnswer;
        } else {
          uAns = userAnswers[`${idx}`] ? item[`option${userAnswers[`${idx}`]}`] : 'Missed Question';
          cAns = item[`option${item.correctAnswer}`];
        }

        wrongAnswers.push({
          question: item.question,
          skill: skill,
          userAnsText: uAns,
          correctAnsText: cAns,
          explanation: item.explanation,
          lessonUrl: item.lessonUrl,
          lessonTitle: item.lessonTitle
        });
      }
    } 
    else if (item._type === 'comprehensionBlock' && item.questions) {
      const skill = item.contentType.split(' ')[0]; 
      if (!skillScores[skill]) skillScores[skill] = { correct: 0, total: 0 };

      item.questions.forEach((q: any) => {
        skillScores[skill].total += 1;
        totalQuestions += 1;

        const ansKey = `${idx}-${q._key}`;
        const isCorrect = userAnswers[ansKey] === q.correctAnswer;
        if (isCorrect) {
          skillScores[skill].correct += 1;
          totalCorrect += 1;
        } else {
          // TFNG Check for Block Questions
          let uAns = 'Missed Question';
          let cAns = 'Unknown';
          if (q.questionFormat === 'True / False / Not Given') {
            uAns = userAnswers[ansKey] || 'Missed Question';
            cAns = q.correctAnswer;
          } else {
            uAns = userAnswers[ansKey] ? q[`option${userAnswers[ansKey]}`] : 'Missed Question';
            cAns = q[`option${q.correctAnswer}`];
          }

          wrongAnswers.push({
            question: q.questionText,
            skill: skill,
            contextTitle: item.title,
            userAnsText: uAns,
            correctAnsText: cAns,
            explanation: q.explanation
          });
        }
      });
    }
  });

  const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const currentItem = quizItems[currentItemIndex];return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; font-family: 'Fredoka', sans-serif !important; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .soft-card:hover { transform: translateY(-8px); box-shadow: 0 40px 60px -15px rgba(15, 23, 42, 0.1) !important; }
        .search-input:focus { box-shadow: 0 0 0 4px rgba(79,70,229,0.2) !important; }
      `}</style>

      <div style={styles.page}>
        
        {/* BOOK MODAL */}
        {selectedBook && (
          <div style={styles.modalOverlay} onClick={() => setSelectedBook(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button style={styles.closeButton} onClick={() => setSelectedBook(null)}>✕</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  {selectedBook.coverImage && <img src={urlFor(selectedBook.coverImage).url()} alt={selectedBook.title} style={{ width: '220px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }} />}
                  <div>
                    <span style={{ display: 'inline-block', background: '#F1F5F9', color: '#64748B', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{selectedBook.subCategory || selectedBook.category}</span>
                    <h2 style={{ margin: '0 0 16px', fontSize: '3rem', fontWeight: '600', color: '#0F172A', letterSpacing: '-1px', lineHeight: '1.1' }}>{selectedBook.title}</h2>
                  </div>
                </div>
                <div style={{ color: '#475569', fontSize: '1.3rem', lineHeight: '2', fontWeight: '400', maxWidth: '650px', textAlign: 'left' }}>
                  {!selectedBook.content ? ( <p style={{ color: '#94A3B8', textAlign: 'center' }}>No review written yet.</p> ) : typeof selectedBook.content === 'string' ? ( <SmartText text={selectedBook.content} dictionary={dictionary} /> ) : ( <SmartText text={selectedBook.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n')} dictionary={dictionary} /> )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={{ fontSize: '4.5rem', fontWeight: '600', margin: '0 auto 5px auto', letterSpacing: '-1px', color: '#0F172A', lineHeight: '1.1' }}>Lit <span style={{ color: '#4F46E5' }}>&</span> Learn</h1>
            <p style={{color: '#94A3B8', letterSpacing: '3px', fontWeight: '500', fontSize: '1rem', textTransform: 'uppercase', margin: 0}}>English • Literature • Language</p>
          </header>

          {!isQuizMode ? (
            <>
              {/* OMNI-SEARCH & NAVIGATION */}
              <div style={styles.searchContainer}>
                <div style={styles.searchIconWrapper}><IconSearch /></div>
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
                             <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{res.isGeneral ? '📄' : res.audioUrl ? '🎧' : '📚'}</div>
                             <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase' }}>{res.isGeneral ? 'General Resource' : `${res.subLevel} • Unit ${res.unit}`}</span>
                             <h3 style={{ margin: '0 0 24px', fontWeight: '600', color: '#0F172A', fontSize: '1.4rem' }}>{res.title}</h3>
                             {res.audioUrl && ( <div style={{ width: '100%', marginBottom: '16px', padding: '8px', background: '#F8FAFC', borderRadius: '9999px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}><audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={res.audioUrl} type="audio/mpeg" /></audio></div> )}
                             {res.fileUrl && <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%', background: res.audioUrl ? '#EEF2FF' : '#4F46E5', color: res.audioUrl ? '#4F46E5' : '#ffffff', boxShadow: res.audioUrl ? 'none' : '0 10px 20px -5px rgba(79,70,229,0.4)'}}>{res.audioUrl ? 'Download Worksheet' : 'Download Lesson'}</a>}
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* --- STANDARD TABS --- */
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
                        {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => ( <button key={cat} style={styles.badgeButton(activeSubCategory === cat)} onClick={() => setActiveSubCategory(cat)}>{cat}</button> ))}
                      </div>
                      <div style={styles.grid}>
                        {displayedReviews.length > 0 ? displayedReviews.map(book => (
                          <div key={book._id} className="soft-card" style={styles.card}>
                            <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                            <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center' }}>{book.title}</h3>
                              {book.content && ( <div style={{ width: '100%', marginTop: '24px' }}><button className="read-btn" style={styles.readMoreBtn} onClick={() => setSelectedBook(book)}>Read Review</button></div> )}
                            </div>
                          </div>
                        )) : ( <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94A3B8', background: '#ffffff', borderRadius: '32px' }}><h3 style={{ fontWeight: '600', margin: 0, fontSize: '1.5rem' }}>No reviews found</h3></div> )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'English Corner' && (
                    <div>
                      {!activeLevel && (
                        <div style={styles.grid}>{LEVELS.map(lvl => ( <div key={lvl.name} className="soft-card" style={styles.levelCard} onClick={() => setActiveLevel(lvl.name)}><div style={{ color: '#4F46E5', marginBottom: '24px', display: 'flex', justifyContent: 'center', transform: 'scale(1.4)' }}>{lvl.icon}</div>{lvl.name}</div> ))}</div>
                      )}
                      
                      {activeLevel && !activeSubLevel && (
                        <>
                          <button style={styles.backButton} onClick={() => setActiveLevel(null)}>Back to Levels</button>
                          <div style={styles.grid}>{LEVELS.find(l => l.name === activeLevel)?.subLevels.map(sub => ( <div key={sub} className="soft-card" style={{...styles.levelCard, padding: '40px'}} onClick={() => setActiveSubLevel(sub)}>{sub}</div> ))}</div>
                        </>
                      )}
                      
                      {activeSubLevel && !activeUnit && (
                        <>
                          <button style={styles.backButton} onClick={() => setActiveSubLevel(null)}>Back to {activeLevel}</button>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                            <h2 style={{ margin: 0, color: '#0F172A', fontWeight: '600', fontSize: '2.5rem', letterSpacing: '-1px' }}>{activeSubLevel} Curriculum</h2>
                            <button onClick={() => startQuiz(true)} style={{ ...styles.actionButton, background: '#F59E0B', boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)', padding: '16px 32px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🌟 Take Final Exam</button>
                          </div>
                          <div style={styles.grid}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(u => ( <div key={u} className="soft-card" style={{...styles.card, padding: '30px', cursor: 'pointer', textAlign: 'center'}} onClick={() => setActiveUnit(u)}><h3 style={{ margin: '0 0 16px', fontSize: '1.8rem', fontWeight: '600', color: '#0F172A' }}>Unit {u}</h3><span style={{ display: 'inline-block', background: '#F1F5F9', color: '#475569', padding: '8px 20px', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '500' }}>Enter Syllabus</span></div> ))}</div>
                        </>
                      )}
                      
                      {activeUnit && (
                        <>
                          <button style={styles.backButton} onClick={() => setActiveUnit(null)}>Back to Units</button>
                          <div style={{ ...styles.card, padding: '50px', textAlign: 'left', maxWidth: '1000px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px', paddingBottom: '40px', borderBottom: '2px solid #F1F5F9' }}>
                              <div>
                                <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '8px 20px', borderRadius: '9999px', fontSize: '1rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '16px' }}>{activeLevel} • {activeSubLevel}</span>
                                <h2 style={{ margin: 0, fontWeight: '600', fontSize: '3rem', letterSpacing: '-1px', color: '#0F172A' }}>Unit {activeUnit} Syllabus</h2>
                              </div>
                              <button onClick={() => startQuiz(false)} style={{ ...styles.actionButton, display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', fontSize: '1.2rem', background: '#10B981', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)' }}><IconQuiz /> Test Your Knowledge</button>
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
                                              {pdf.fileUrl && <a href={pdf.fileUrl} target="_blank" rel="noreferrer" style={{...styles.actionButton, width: '100%', background: pdf.audioUrl ? '#EEF2FF' : '#4F46E5', color: pdf.audioUrl ? '#4F46E5' : '#ffffff', boxShadow: pdf.audioUrl ? 'none' : '0 10px 20px -5px rgba(79,70,229,0.4)'}}>{pdf.audioUrl ? 'Download Worksheet' : 'Open Lesson'}</a>}
                                            </div>
                                          </div>
                                        ))}
                                      </div> 
                                    ) : ( <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '24px', padding: '32px', textAlign: 'center' }}><span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: '500' }}>No {skill.name.toLowerCase()} materials published yet.</span></div> )}
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
                    <div style={{ ...styles.card, maxWidth: '650px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
                      <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>👋</div>
                      <h2 style={{ marginBottom: '20px', fontWeight: '600', fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1px' }}>Get in Touch</h2>
                      <p style={{ color: '#475569', marginBottom: '40px', fontSize: '1.3rem', fontWeight: '400' }}>Want to book a tutoring session or ask a question?</p>
                      <a href="mailto:teacher@litandlearn.com" style={{...styles.actionButton, padding: '18px 48px', fontSize: '1.3rem', width: 'auto'}}>Email Me</a>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* --- THE QUIZ OVERLAY VIEW --- */
            <div>
              {!quizFinished && quizItems.length > 0 && currentItem && (
                <div style={{ maxWidth: currentItem._type === 'comprehensionBlock' ? '900px' : '800px', margin: '0 auto' }}>
                  <button style={styles.backButton} onClick={() => { setIsQuizMode(false); setIsLevelExam(false); }}>{isLevelExam ? 'Exit Final Exam' : 'Exit Quiz'}</button>
                  <div style={{ ...styles.card, padding: '50px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', color: '#64748B', fontWeight: '600' }}>
                      <span>Part {currentItemIndex + 1} of {quizItems.length}</span>
                      <span style={{ background: isLevelExam ? '#FEF3C7' : '#EEF2FF', color: isLevelExam ? '#D97706' : '#4F46E5', padding: '4px 12px', borderRadius: '9999px' }}>
                        {currentItem._type === 'comprehensionBlock' ? currentItem.contentType : currentItem.skill}
                      </span>
                    </div>

                    {/* SCENARIO A: COMPREHENSION BLOCK RENDER */}
                    {currentItem._type === 'comprehensionBlock' ? (
                      <div>
                        <div style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '2px dashed #E2E8F0' }}>
                          <h2 style={{ fontSize: '2.2rem', color: '#0F172A', fontWeight: '600', marginBottom: '16px' }}>{currentItem.title}</h2>
                          <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '24px', fontWeight: '500' }}>{currentItem.instruction}</p>
                          
                          {currentItem.contentType === 'Listening (Audio)' && currentItem.blockAudioUrl && (
                            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '24px', border: '2px solid #E2E8F0' }}>
                              <audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={currentItem.blockAudioUrl} type="audio/mpeg" /></audio>
                            </div>
                          )}
                          
                          {currentItem.contentType === 'Reading (Text)' && currentItem.readingPassage && (
                            <div style={{ background: '#F8FAFC', padding: '30px', borderRadius: '24px', color: '#334155', fontSize: '1.2rem', lineHeight: '1.8', border: '1px solid #E2E8F0' }}>
                              <SmartText text={currentItem.readingPassage} dictionary={dictionary} />
                            </div>
                          )}
                        </div>

                        {currentItem.questions && currentItem.questions.map((q: any, qIndex: number) => (
                          <div key={q._key} style={{ marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#0F172A', fontWeight: '600', marginBottom: '20px' }}>{qIndex + 1}. {q.questionText}</h3>
                            
                            {/* --- TFNG LOGIC FOR BLOCKS --- */}
                            {q.questionFormat === 'True / False / Not Given' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                                {['True', 'False', 'Not Given'].map(opt => (
                                  <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt, q._key)} style={styles.tfngBtn(userAnswers[`${currentItemIndex}-${q._key}`] === opt)}>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {['A', 'B', 'C', 'D'].map(opt => {
                                  const isSelected = userAnswers[`${currentItemIndex}-${q._key}`] === opt;
                                  return (
                                    <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt, q._key)} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: '#0F172A', fontSize: '1.1rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
                                      <span style={{ background: isSelected ? '#4F46E5' : '#F1F5F9', color: isSelected ? '#ffffff' : '#475569', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', marginRight: '12px', fontSize: '0.9rem', flexShrink: 0 }}>{opt}</span>
                                      {q[`option${opt}`]}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* SCENARIO B: SINGLE QUESTION RENDER */
                      <div>
                        <h3 style={{ fontSize: '2rem', color: '#0F172A', fontWeight: '600', marginBottom: '30px', lineHeight: '1.4' }}>{currentItem.question}</h3>
                        
                        {currentItem.questionAudioUrl && (
                          <div style={{ width: '100%', marginBottom: '40px', padding: '16px', background: '#F8FAFC', borderRadius: '24px', border: '2px solid #E2E8F0' }}>
                            <span style={{ display: 'block', marginBottom: '12px', color: '#4F46E5', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' }}>🎧 Listen to the Audio</span>
                            <audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={currentItem.questionAudioUrl} type="audio/mpeg" /></audio>
                          </div>
                        )}

                        {/* --- TFNG LOGIC FOR SINGLE QUESTIONS --- */}
                        {currentItem.questionFormat === 'True / False / Not Given' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                            {['True', 'False', 'Not Given'].map(opt => (
                              <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt)} style={styles.tfngBtn(userAnswers[`${currentItemIndex}`] === opt)}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt)} style={styles.quizOptionBtn(userAnswers[`${currentItemIndex}`] === opt)}>
                                <span style={{ display: 'inline-block', background: userAnswers[`${currentItemIndex}`] === opt ? '#4F46E5' : '#F1F5F9', color: userAnswers[`${currentItemIndex}`] === opt ? '#ffffff' : '#475569', width: '30px', height: '30px', textAlign: 'center', lineHeight: '30px', borderRadius: '50%', marginRight: '16px' }}>{opt}</span>
                                {currentItem[`option${opt}`]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '30px', borderTop: currentItem._type === 'comprehensionBlock' ? '2px solid #F1F5F9' : 'none' }}>
                      {currentItemIndex < quizItems.length - 1 ? ( 
                        <button onClick={() => setCurrentItemIndex(prev => prev + 1)} style={styles.actionButton}>Next Part</button> 
                      ) : ( 
                        <button onClick={submitQuiz} style={{ ...styles.actionButton, background: '#10B981', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)' }}>Submit Test</button> 
                      )}
                    </div>
                  </div>
                </div>
              )}

              {quizFinished && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <button style={styles.backButton} onClick={() => { setIsQuizMode(false); setIsLevelExam(false); }}>{isLevelExam ? 'Return to Curriculum' : 'Return to Syllabus'}</button>
                  
                  <div style={{ ...styles.card, padding: '50px', textAlign: 'center', marginBottom: '40px', background: totalPercentage >= 80 ? '#ECFDF5' : '#ffffff', border: totalPercentage >= 80 ? '2px solid #10B981' : 'none' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '600', color: '#0F172A', margin: '0 0 16px' }}>{isLevelExam ? 'Final Exam Results' : 'Diagnostic Results'}</h2>
                    <div style={{ fontSize: '5rem', fontWeight: '700', color: totalPercentage >= 80 ? '#10B981' : '#F59E0B', marginBottom: '30px' }}>{totalPercentage}%</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {Object.entries(skillScores).map(([skill, score]) => (
                        <div key={skill} style={{ background: '#F8FAFC', padding: '12px 24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                          <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{skill}</div>
                          <div style={{ color: '#0F172A', fontSize: '1.2rem', fontWeight: '600' }}>{score.correct} / {score.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {wrongAnswers.length > 0 ? (
                    <>
                      <h3 style={{ fontSize: '2rem', color: '#0F172A', fontWeight: '600', marginBottom: '24px' }}>Targeted Review Needed</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {wrongAnswers.map((wa, idx) => (
                          <div key={idx} style={{ ...styles.card, padding: '30px', borderLeft: '6px solid #EF4444' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                              <span style={{ background: '#FEE2E2', color: '#EF4444', padding: '4px 12px', borderRadius: '9999px', fontWeight: '600', fontSize: '0.9rem' }}>{wa.skill} Match Error</span>
                              {wa.contextTitle && <span style={{ color: '#64748B', fontWeight: '600', fontSize: '0.9rem', paddingRight: '10px' }}>From: {wa.contextTitle}</span>}
                            </div>
                            <p style={{ fontSize: '1.3rem', color: '#0F172A', fontWeight: '500', marginBottom: '24px' }}>{wa.question}</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                                <span style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Your Answer</span>
                                <span style={{ color: '#EF4444', fontWeight: '500', fontSize: '1.1rem' }}>{wa.userAnsText}</span>
                              </div>
                              <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px' }}>
                                <span style={{ display: 'block', color: '#10B981', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Correct Answer</span>
                                <span style={{ color: '#059669', fontWeight: '500', fontSize: '1.1rem' }}>{wa.correctAnsText}</span>
                              </div>
                            </div>

                            {wa.explanation && (
                              <div style={{ background: '#FFFBEB', color: '#B45309', padding: '20px', borderRadius: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
                                <strong>Why it's wrong:</strong> {wa.explanation}
                              </div>
                            )}

                            {wa.lessonUrl && (
                              <a href={wa.lessonUrl} target="_blank" rel="noreferrer" style={{ ...styles.actionButton, background: '#F8FAFC', color: '#4F46E5', boxShadow: 'none', border: '2px solid #E2E8F0', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                📄 Review Lesson: {wa.lessonTitle}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#10B981', fontSize: '1.5rem', fontWeight: '600', padding: '40px' }}>
                      🎉 Flawless! You mastered every concept.
                    </div>
                  )}
                </div>
              )}

              {!quizFinished && quizItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <h3 style={{ color: '#0F172A', fontWeight: '600', fontSize: '1.5rem' }}>No test material available yet.</h3>
                  <button onClick={() => { setIsQuizMode(false); setIsLevelExam(false); }} style={{ ...styles.actionButton, marginTop: '24px' }}>Go Back</button>
                </div>
              )}
            </div>
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