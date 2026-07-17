import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { client, urlFor } from './sanityClient';
import { VocabVault } from './components/VocabVault';
import { QuizOverlay } from './components/QuizOverlay';
import { ResourceLibrary } from './components/ResourceLibrary';
import { InteractiveLesson } from './components/InteractiveLesson';
import { CustomAudioPlayer } from './components/CustomAudioPlayer';
import TextHighlighter from './components/TextHighlighter';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ContactPage } from './components/ContactPage';
import { PracticeHub } from './components/PracticeHub';
import { WritingLab } from './components/WritingLab';
import { BookReviews } from './components/BookReviews';
import { LivePlayer } from './components/LivePlayer'; 
import { ExamCheckIn } from './components/ExamCheckIn';
import { ExamDisplay } from './components/ExamDisplay';
import { MobileNav } from './components/MobileNav';
import { AboutPage } from './components/AboutPage';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/clerk-react'; 
import { getSupabaseClient } from './supabaseClient'; 

// --- 1. SLEEK SVG ICONS ---
const IconBeginner = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" strokeOpacity="0.2"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconIntermediate = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" rx="2" strokeOpacity="0.2"/></svg>);
const IconAdvanced = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="4" height="10" rx="2" fill="currentColor"/><rect x="16" y="6" width="4" height="14" fill="currentColor"/></svg>);
const IconSearch = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const IconQuiz = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconLock = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconCheck = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconTarget = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IconStar = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IconDoc = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const IconAudio = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>);
const IconLibrary = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconFlashcard = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/><path d="M7 15h10"/></svg>);

const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

// --- 2. CONSTANTS & STYLES ---
const LEVELS = [ { name: "Beginner", icon: <IconBeginner />, subLevels: ["Level 1", "Level 2", "Level 3"] }, { name: "Intermediate", icon: <IconIntermediate />, subLevels: ["Level 4", "Level 5", "Level 6"] }, { name: "Advanced", icon: <IconAdvanced />, subLevels: ["Level 7", "Level 8", "Business English"] } ];

// Writing Lab launch framing. The "NEW" nav badge and the "Just launched" pill on the
// featured card disappear automatically on this date — no code change needed later.
const WRITING_LAB_IS_NEW = new Date() < new Date('2026-09-15');

const styles: any = {
  page: { fontFamily: '"Fredoka", sans-serif', backgroundColor: '#F3F6F8', minHeight: '100vh', color: '#0F172A', padding: '40px 0 0 0' },
  container: { width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 40px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  nav: { display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: (a: boolean) => ({ background: a ? '#4F46E5' : 'transparent', color: a ? '#ffffff' : '#64748B', border: 'none', fontSize: '17px', fontWeight: '600', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: a ? '0 8px 16px rgba(79, 70, 229, 0.25)' : 'none' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },
  card: { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: '1px solid #F1F5F9', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' },
  actionButton: { background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s' },
  readMoreBtn: { fontFamily: '"Fredoka", sans-serif', background: '#F8FAFC', border: 'none', color: '#4F46E5', fontWeight: '600', fontSize: '1.05rem', padding: '12px 20px', borderRadius: '16px', marginTop: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', width: '100%' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '800px', maxHeight: '90vh', position: 'relative', padding: '50px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' },
  closeButton: { position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#0F172A', fontWeight: 'bold', fontSize: '1.4rem', zIndex: 10 },
};

// --- WRAP THE APP IN A ROUTER ---
export default function App() {
  return (
    <Router>
      <LitAndLearnMain />
    </Router>
  );
}

function LitAndLearnMain() {
  const { userId, getToken, isLoaded } = useAuth(); 
  const { user } = useUser(); 
  const navigate = useNavigate();
  const location = useLocation();

  const isPlayRoute = location.pathname.startsWith('/play');
  const isExamRoute = location.pathname.startsWith('/exam');
  const isTeacherAdmin = user?.primaryEmailAddress?.emailAddress === 'kira14122@gmail.com';

  const currentTabName = useMemo(() => {
    switch(location.pathname) {
      case '/': return 'English Corner';
      case '/practice': return 'Practice Hub'; 
      case '/writing': return 'Writing Lab';
      case '/reviews': return 'Book Reviews';
      case '/resources': return 'Resources';
      case '/progress': return 'My Progress';
      case '/admin': return 'Admin Dashboard';
      case '/about': return 'About';
      case '/contact': return 'Contact';
      default: return 'English Corner';
    }
  }, [location.pathname]);

  const TABS = [
    { name: 'English Corner', path: '/' },
    { name: 'Practice Hub', path: '/practice' },
    { name: 'Writing Lab', path: '/writing' },
    { name: 'Book Reviews', path: '/reviews' },
    { name: 'Resources', path: '/resources' },
    { name: 'My Progress', path: '/progress' },
    ...(isTeacherAdmin ? [{ name: 'Admin Dashboard', path: '/admin' }] : []),
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const [bookCategory, setBookCategory] = useState<string | null>(() => localStorage.getItem('ll_bookCat'));
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(() => localStorage.getItem('ll_subCat')); 
  const [reviews, setReviews] = useState<any[]>([]);
  
  const [activeLevel, setActiveLevel] = useState<string | null>(() => localStorage.getItem('ll_level'));
  const [activeSubLevel, setActiveSubLevel] = useState<string | null>(() => localStorage.getItem('ll_subLevel'));
  const [activeUnit, setActiveUnit] = useState<number | null>(() => {
    const saved = localStorage.getItem('ll_unit');
    return saved ? parseInt(saved, 10) : null;
  });

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [officialGrades, setOfficialGrades] = useState<any[]>([]); 
  const [unitMetadataList, setUnitMetadataList] = useState<any[]>([]);
  const [publishedAssessments, setPublishedAssessments] = useState<any[]>([]);

  const [resources, setResources] = useState<any[]>([]);
  const [interactiveLessons, setInteractiveLessons] = useState<any[]>([]);
  const [dictionary, setDictionary] = useState<Record<string, any>>({});
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingWords, setProcessingWords] = useState<Record<string, boolean>>({});

  const [selectedBook, setSelectedBook] = useState<any | null>(() => {
    const saved = localStorage.getItem('ll_book');
    return saved ? JSON.parse(saved) : null;
  });
  const [isInteractiveLesson, setIsInteractiveLesson] = useState(() => localStorage.getItem('ll_isLesson') === 'true');
  const [activeLessonData, setActiveLessonData] = useState<any | null>(() => {
    const saved = localStorage.getItem('ll_lessonData');
    return saved ? JSON.parse(saved) : null;
  });

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isLevelExam, setIsLevelExam] = useState(false);
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [showNoQuizModal, setShowNoQuizModal] = useState(false);

  useEffect(() => {
    if (bookCategory) localStorage.setItem('ll_bookCat', bookCategory); else localStorage.removeItem('ll_bookCat');
    if (activeSubCategory) localStorage.setItem('ll_subCat', activeSubCategory); else localStorage.removeItem('ll_subCat');
    if (activeLevel) localStorage.setItem('ll_level', activeLevel); else localStorage.removeItem('ll_level');
    if (activeSubLevel) localStorage.setItem('ll_subLevel', activeSubLevel); else localStorage.removeItem('ll_subLevel');
    if (activeUnit) localStorage.setItem('ll_unit', activeUnit.toString()); else localStorage.removeItem('ll_unit');
    
    if (selectedBook) localStorage.setItem('ll_book', JSON.stringify(selectedBook)); else localStorage.removeItem('ll_book');
    if (isInteractiveLesson) localStorage.setItem('ll_isLesson', 'true'); else localStorage.removeItem('ll_isLesson');
    if (activeLessonData) localStorage.setItem('ll_lessonData', JSON.stringify(activeLessonData)); else localStorage.removeItem('ll_lessonData');
  }, [bookCategory, activeSubCategory, activeLevel, activeSubLevel, activeUnit, selectedBook, isInteractiveLesson, activeLessonData]);

  useEffect(() => {
    client.fetch('*[_type == "review"] | order(title asc)').then(setReviews).catch(console.error);
    client.fetch('*[_type == "resource"] | order(unit asc) {..., "fileUrl": file.asset->url, "audioUrl": audio.asset->url}').then(setResources);
    client.fetch('*[_type == "unitMetadata"]').then(setUnitMetadataList);
    client.fetch('*[_type == "unitAssessment"]{_id, level, subLevel, unit}').then(setPublishedAssessments).catch(console.error);

    client.fetch(`*[_type == "interactiveLesson"] | order(lessonOrder asc) {
      ...,
      lessonBlocks[]{
        ...,
        "audioUrl": audio.asset->url,
        visualHook{ ..., asset->{ url } },
        "quickCheckQuiz": quickCheck
      }
    }`).then(setInteractiveLessons);

    client.fetch('*[_type == "dictionaryWord"]').then((data) => {
      const dictMap: Record<string, any> = {};
      data.forEach((item: any) => { 
        if (item.word) {
          const wordData = { 
            pos: item.pos, 
            def: item.definition, 
            level: item.level,
            example: item.example || null, 
            variations: item.variations || [] 
          }; 
          
          dictMap[item.word.toLowerCase().trim()] = wordData;

          if (item.variations && Array.isArray(item.variations)) {
             item.variations.forEach((v: string) => {
                if (v && v.trim() !== '') {
                   dictMap[v.toLowerCase().trim()] = wordData;
                }
             });
          }
        }
      });
      setDictionary(dictMap);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return; 

    const loadPersonalData = async () => {
      if (userId) {
        const token = await getToken({ template: 'supabase' });
        const supabase = getSupabaseClient(token || '');

        const { data: vocabData } = await supabase.from('vocab_vault').select('*').eq('user_id', userId);
        if (vocabData) setSavedWords(vocabData);

        const { data: lessonData } = await supabase.from('completed_lessons').select('lesson_id').eq('user_id', userId);
        if (lessonData) setCompletedLessons(lessonData.map(l => l.lesson_id));

        const { data: gradesData } = await supabase.from('student_grades').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (gradesData) setOfficialGrades(gradesData);

        if (user) {
          const userEmail = user.primaryEmailAddress?.emailAddress || '';
          const userFullName = user.fullName || 'Unknown Student';
          const isTeacher = userEmail === 'kira14122@gmail.com';

          await supabase.from('profiles').upsert({
            id: userId,
            email: userEmail,
            full_name: userFullName,
            is_admin: isTeacher
          });
        }
      } else {
        const localVault = localStorage.getItem('vocabVault');
        if (localVault) {
          try {
            const parsed = JSON.parse(localVault);
            const repairedVault = parsed.map((item: any) => ({
              word: item.word || item.name || '',
              pos: item.pos || 'N/A',
              definition: item.definition || item.def || 'Definition unavailable.',
              level: item.level || 'B2',
              example: item.example || ''
            })).filter((item: any) => item.word !== '');
            setSavedWords(repairedVault);
          } catch (e) {
            setSavedWords([]);
          }
        }

        const localProgress = localStorage.getItem('litAndLearnProgress');
        if (localProgress) setCompletedLessons(JSON.parse(localProgress));
        
        setOfficialGrades([]); 
      }
    };
    loadPersonalData();
  }, [userId, getToken, isLoaded, user]);

  const toggleSaveWord = async (word: string, info: any) => {
    if (!word) return;
    const cleanWord = word.trim().toLowerCase();
    
    if (processingWords[cleanWord]) return;
    setProcessingWords(prev => ({ ...prev, [cleanWord]: true }));

    try {
      const exists = savedWords.some(w => w?.word?.trim().toLowerCase() === cleanWord);
      const liveDictionaryMatch = dictionary[cleanWord];
      let secureExample = info.example || (liveDictionaryMatch ? liveDictionaryMatch.example : null) || null;

      const normalizedWordObj = {
        word: cleanWord,
        pos: info.pos || 'N/A',
        definition: info.definition || info.def || '',
        level: info.level || 'B2',
        example: secureExample
      };

      if (userId) {
        const token = await getToken({ template: 'supabase' });
        const supabase = getSupabaseClient(token || '');

        if (exists) {
          await supabase.from('vocab_vault').delete().eq('user_id', userId).eq('word', cleanWord);
          setSavedWords(prev => prev.filter(w => w?.word?.trim().toLowerCase() !== cleanWord));
        } else {
          const newWord = { user_id: userId, ...normalizedWordObj };
          await supabase.from('vocab_vault').insert([newWord]);
          setSavedWords(prev => [...prev, newWord]);
        }
      } else {
        setSavedWords((prevVault) => {
          let updatedVault;
          if (exists) {
            updatedVault = prevVault.filter(w => w?.word?.trim().toLowerCase() !== cleanWord);
          } else {
            updatedVault = [...prevVault, normalizedWordObj];
          }
          localStorage.setItem('vocabVault', JSON.stringify(updatedVault));
          return updatedVault;
        });
      }
    } finally {
      setProcessingWords(prev => ({ ...prev, [cleanWord]: false }));
    }
  };

  const handleMarkLessonComplete = async (lessonId: string) => {
    if (completedLessons.includes(lessonId)) return;

    if (userId) {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      await supabase.from('completed_lessons').insert([{ user_id: userId, lesson_id: lessonId }]);
      setCompletedLessons(prev => [...prev, lessonId]);
    } else {
      setCompletedLessons(prev => {
        const newProgress = [...prev, lessonId];
        localStorage.setItem('litAndLearnProgress', JSON.stringify(newProgress));
        return newProgress;
      });
    }
  };

  const getUnitMeta = (u: number) => {
    const meta = unitMetadataList.find(m => m.level === activeLevel && m.subLevel === activeSubLevel && m.unitNumber === u);
    if (meta) return { title: meta.title || '', desc: meta.description || '', objectives: meta.objectives || [] };
    return { title: '', desc: '', objectives: [] };
  };

  const searchResultsReviews = reviews.filter(rev => rev.title?.toLowerCase().includes(searchTerm.toLowerCase()) || (typeof rev.content === 'string' && rev.content.toLowerCase().includes(searchTerm.toLowerCase())) );
  const searchResultsResources = resources.filter(res => res.title?.toLowerCase().includes(searchTerm.toLowerCase()) || res.category?.toLowerCase().includes(searchTerm.toLowerCase()) || res.subLevel?.toLowerCase().includes(searchTerm.toLowerCase()) );

  const startQuiz = async (runAsLevelExam: boolean = false) => {
    const query = runAsLevelExam 
      ? `*[_type == "unitAssessment" && level == "${activeLevel}" && subLevel == "${activeSubLevel}"]{ title, questions[]{..., "questionAudioUrl": audioSnippet.asset->url} }` 
      : `*[_type == "unitAssessment" && level == "${activeLevel}" && subLevel == "${activeSubLevel}" && unit == ${activeUnit}]{ title, questions[]{..., "questionAudioUrl": audioSnippet.asset->url} }`;
    
    const assessments = await client.fetch(query);
    
    if (!assessments || assessments.length === 0) {
      setShowNoQuizModal(true);
      return; 
    }
    
    const allQuestionsFromAllBoxes = assessments.flatMap((assessment: any) => assessment.questions || []);
    const questionLimit = runAsLevelExam ? 30 : 15;
    let allItems = [...allQuestionsFromAllBoxes].sort(() => 0.5 - Math.random()).slice(0, questionLimit);
    
    if (allItems.length === 0) {
      setShowNoQuizModal(true);
      return; 
    }
    
    setQuizItems(allItems); 
    setIsLevelExam(runAsLevelExam); 
    setIsQuizMode(true);
  };

  const handleNavigation = (path?: string) => {
    if (path) navigate(path);
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

  const unitLessons = interactiveLessons.filter(l => 
    String(l.unit) === String(activeUnit) && String(l.subLevel) === String(activeSubLevel)
  ).sort((a, b) => Number(a.lessonOrder) - Number(b.lessonOrder));
  
  const allLessonsCompleted = unitLessons.length > 0 && unitLessons.every(l => completedLessons.includes(l._id));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Fraunces:ital,wght@1,500;1,600&display=swap');
        
        * { box-sizing: border-box; font-family: 'Fredoka', sans-serif !important; }
        
        html, body { 
          margin: 0; 
          padding: 0;
          overflow-x: hidden !important; 
          width: 100%;
          -webkit-font-smoothing: antialiased; 
          -moz-osx-font-smoothing: grayscale; 
        }
        
        .soft-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.06) !important; }
        .back-btn:hover { background-color: #F8FAFC !important; transform: translateX(-4px); }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* Featured Writing Lab card (the "Write." manifesto) */
        /* .wl-serif must out-rank the global "* !important" Fredoka rule, hence class + !important */
        .wl-serif, .wl-serif * { font-family: 'Fraunces', Georgia, 'Times New Roman', serif !important; }
        .wl-write { font-size: 5rem; }
        .wl-pen { width: 56px; height: 56px; }
        @media (max-width: 700px) {
          .wl-write { font-size: 3.4rem; }
          .wl-pen { width: 38px; height: 38px; top: 10px !important; }
          .wl-kicker { font-size: 0.62rem !important; letter-spacing: 1.5px !important; }
          .wl-manifesto-foot { flex-direction: column; align-items: stretch !important; }
          .wl-cta { width: 100%; }
        }
        
        .bento-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 40px; align-items: start; }
        
        /* --- BASE DESKTOP STYLES FOR CARDS --- */
        .lesson-card-wrapper, .assessment-card-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 30px;
            padding: 32px 40px !important;
        }
        .lesson-info-group {
            display: flex;
            align-items: center;
            gap: 24px;
            flex-grow: 1;
        }
        .lesson-badge {
            width: 64px;
            height: 64px;
            min-width: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 4px;
        }
        .lesson-action-group {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 12px;
            flex-shrink: 0;
        }
        .assessment-action-group {
            display: flex;
            flex-shrink: 0;
        }
        .status-text {
            color: #10B981;
            font-size: 0.85rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        @media (max-width: 992px) {
          .bento-layout { grid-template-columns: 1fr; gap: 40px; }
        }
        
        /* --- MOBILE OVERRIDES --- */
        @media (max-width: 768px) {
          .app-container { padding: 0 16px !important; }
          .page-header h1 { font-size: 3.2rem !important; }
          .responsive-card { padding: 30px 20px !important; border-radius: 24px !important; max-height: 85vh !important; }
          .modal-close-btn { top: 16px !important; right: 16px !important; width: 36px !important; height: 36px !important; font-size: 1.1rem !important; }
          .modal-text-content { padding: 0 !important; font-size: 1.1rem !important; }
          .adapt-padding { padding: 30px 20px !important; border-radius: 24px !important; }
          
          .mobile-table thead { display: none; }
          .mobile-table tbody { display: block; width: 100%; }
          .mobile-table tr { display: block; border-bottom: 2px dashed #E2E8F0 !important; padding: 10px 0; }
          .mobile-table tr:last-child { border-bottom: none !important; }
          .mobile-table td { display: block; width: 100%; text-align: left; padding: 12px 24px !important; border: none !important; }
          .mobile-table td::before { content: attr(data-label); display: block; position: static; width: 100%; font-weight: 700; color: #64748B; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }

          .mobile-nav-container {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            justify-content: flex-start !important;
            width: 100% !important;
            max-width: 100vw !important;
            border-radius: 24px !important; 
            padding: 12px !important;
            -ms-overflow-style: none;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          
          .mobile-nav-container::-webkit-scrollbar { display: none; }
          .mobile-nav-container button { flex-shrink: 0 !important; }

          .final-exam-wrapper { justify-content: flex-start !important; margin-top: 10px !important; }
          .final-exam-btn { max-width: 100% !important; justify-content: flex-start !important; }

          /* Mobile Alignment for Cards */
          .lesson-card-wrapper, .assessment-card-wrapper {
             flex-direction: column !important;
             align-items: stretch !important;
             padding: 24px 20px !important;
             gap: 20px !important;
          }
          .lesson-info-group {
             align-items: flex-start !important;
             gap: 16px !important;
             flex-direction: row !important;
          }
          .lesson-badge {
             width: 48px !important;
             height: 48px !important;
             min-width: 48px !important;
             font-size: 1.2rem !important;
             border-radius: 12px !important;
             margin-top: 0 !important;
          }
          .lesson-action-group, .assessment-action-group {
             align-items: stretch !important;
             width: 100% !important;
             margin-top: 0px !important;
          }
          .lesson-action-group button, .assessment-action-group button {
             width: 100% !important;
             justify-content: center !important;
          }
          .status-text {
             align-self: flex-start !important;
             margin-bottom: 4px !important;
          }
        }
      `}</style>

      {isPlayRoute ? (
        <Routes>
          <Route path="/play" element={<LivePlayer />} />
        </Routes>
     ) : isExamRoute ? (
        <Routes>
          <Route path="/exam/display/:code" element={<ExamDisplay />} />
          <Route path="/exam/:code" element={<ExamCheckIn />} />
          <Route path="/exam" element={<ExamCheckIn />} />
        </Routes>
      ) : (
        <div style={styles.page}>
          <header style={styles.header}>
            <h1 className="page-header" style={{ fontSize: '4.5rem', fontWeight: '600', color: '#0F172A', margin: '0 0 10px 0' }}>Lit <span style={{ color: '#4F46E5' }}>&</span> Learn</h1>
            <p style={{color: '#94A3B8', letterSpacing: '3px', fontWeight: '500', fontSize: '1rem', textTransform: 'uppercase', margin: 0}}>English • Literature • Language</p>
            
            <div style={{ marginTop: '30px' }}>
              {!isOverlayActive && (
                <nav className="mobile-nav-container" style={styles.nav}>
                  {TABS.map(tab => (
                    <button 
                      key={tab.name} 
                      style={{ ...styles.navButton(location.pathname === tab.path), position: 'relative' }} 
                      onClick={() => handleNavigation(tab.path)}
                    >
                      {tab.name}
                      {tab.name === 'Writing Lab' && WRITING_LAB_IS_NEW && (
                        <span style={{ position: 'absolute', top: '2px', right: '8px', background: '#F59E0B', color: '#ffffff', fontSize: '0.6rem', fontWeight: '800', padding: '2px 7px', borderRadius: '9999px', letterSpacing: '0.5px', lineHeight: '1.4' }}>NEW</span>
                      )}
                    </button>
                  ))}
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', paddingLeft: '16px', borderLeft: '2px solid #E2E8F0' }}>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button style={{ ...styles.navButton(false), background: '#10B981', color: '#ffffff' }}>Sign In</button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </div>
                </nav>
              )}
            </div>
            {!isOverlayActive && <MobileNav TABS={TABS} currentPath={location.pathname} onNavigate={handleNavigation} writingLabIsNew={WRITING_LAB_IS_NEW} />}
          </header>

          <div className="app-container" style={styles.container}>
            {!isOverlayActive ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', gap: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 8px 0', fontWeight: '600', letterSpacing: '-1px' }}>
                      {searchTerm ? 'Search Results' : currentTabName}
                    </h2>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem' }}>
                      {searchTerm ? `Showing results for "${searchTerm}"` : 
                        currentTabName === 'My Progress' ? 'Review your saved vocabulary and progress.' :
                        currentTabName === 'Admin Dashboard' ? 'Secure Command Center.' :
                        currentTabName === 'Book Reviews' ? 'Explore literary analysis and critiques.' : 
                        currentTabName === 'Practice Hub' ? 'Fast, interactive exercises to test your knowledge.' : 
                        currentTabName === 'Writing Lab' ? 'Learn the rule, then practice it.' :
                        currentTabName === 'English Corner' ? 'Master grammar, vocabulary, and skills.' :
                        currentTabName === 'Resources' ? 'Download worksheets and audio lessons.' :
                        'Welcome to Lit & Learn.'}
                    </p>
                  </div>

                  <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}><IconSearch size={20} /></div>
                    <input 
                      type="text" placeholder="Search everything..." 
                      style={{ width: '100%', padding: '14px 16px 14px 48px', fontSize: '1.05rem', fontWeight: '500', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff', color: '#0F172A', outline: 'none', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }} 
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                      onFocus={(e) => e.target.style.borderColor = '#4F46E5'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>
                </div>

                {searchTerm ? (
                  <div>
                    {searchResultsReviews.length > 0 && (
                      <div style={{ marginBottom: '60px' }}>
                        <h3 style={{ color: '#4F46E5', fontWeight: '600', fontSize: '1.8rem', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Literature & Reviews</h3>
                        <div style={styles.grid}>
                          {searchResultsReviews.map(book => (
                             <div key={book._id} className="soft-card" style={styles.card}>
                               <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                               <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                 <h3 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center', lineHeight: '1.2' }}>{book.title}</h3>
                                 {book.author && <span style={{ color: '#64748B', fontSize: '1.05rem', marginBottom: '16px', textAlign: 'center' }}>{book.author}</span>}
                                 {book.level && <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: 'auto', letterSpacing: '0.5px' }}>{book.level}</span>}
                                 <button style={{ ...styles.actionButton, width: '100%', marginTop: '20px' }} onClick={() => setSelectedBook(book)}>Read Review</button>
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
                  <Routes>
                    {/* --- ROUTE: PRACTICE HUB --- */}
                    <Route path="/practice" element={<PracticeHub />} />

                    {/* --- ROUTE: WRITING LAB --- */}
                    <Route path="/writing" element={<WritingLab />} />

                    {/* --- ROUTE: MY PROGRESS --- */}
                    <Route path="/progress" element={
                      <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '1100px', margin: '0 auto' }}>
                        <div className="bento-layout">
                          <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h3 style={{ margin: '0 0 30px 0', fontSize: '1.6rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '12px', borderRadius: '12px', display: 'flex' }}><IconFlashcard /></div>
                              Daily Review
                            </h3>
                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                              <VocabVault savedWords={savedWords} toggleSaveWord={toggleSaveWord} dictionary={dictionary} />
                            </div>
                          </div>

                          <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', height: '100%' }}>
                            <h3 style={{ margin: '0 0 30px 0', fontSize: '1.6rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ background: '#FEF3C7', color: '#D97706', padding: '12px', borderRadius: '12px', display: 'flex' }}><IconTarget size={20} /></div>
                              Acquisition Stats
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                              <div style={{ background: '#F8FAFC', padding: '30px', borderRadius: '24px', textAlign: 'center', border: '2px solid #F1F5F9' }}>
                                <div style={{ fontSize: '4rem', fontWeight: '700', color: '#4F46E5', lineHeight: '1', letterSpacing: '-2px' }}>{savedWords.length}</div>
                                <div style={{ color: '#64748B', fontWeight: '600', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Words Saved</div>
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => {
                                  const count = savedWords.filter(w => w.level === lvl).length;
                                  const isActive = count > 0;
                                  return (
                                    <div key={lvl} style={{ flex: '1 1 30%', background: isActive ? '#ffffff' : '#F8FAFC', border: isActive ? '2px solid #CBD5E1' : '2px dashed #E2E8F0', padding: '16px 10px', borderRadius: '16px', textAlign: 'center', opacity: isActive ? 1 : 0.4, transition: 'all 0.3s' }}>
                                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: isActive ? '#0F172A' : '#94A3B8' }}>{lvl}</div>
                                      <div style={{ fontSize: '1.4rem', fontWeight: '600', color: isActive ? '#4F46E5' : '#CBD5E1', marginTop: '4px' }}>{count}</div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px', marginBottom: '40px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ background: '#ECFDF5', color: '#10B981', padding: '12px', borderRadius: '12px', display: 'flex' }}><IconDoc /></div>
                              Curriculum Tracker
                            </h3>
                            <span style={{ background: '#F8FAFC', color: '#64748B', padding: '8px 16px', borderRadius: '9999px', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #E2E8F0' }}>
                              {completedLessons.length} Lesson{completedLessons.length !== 1 ? 's' : ''} Completed
                            </span>
                          </div>

                          {completedLessons.length === 0 ? (
                            <div style={{ background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', color: '#94A3B8', marginBottom: '16px' }}><IconLibrary /></div>
                              <p style={{ color: '#64748B', fontSize: '1.1rem', margin: 0 }}>You haven't completed any lessons yet. Head over to the English Corner to begin your journey!</p>
                            </div>
                          ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {[...completedLessons].reverse().map((lessonId, index) => {
                                const lessonData = interactiveLessons.find(l => l._id === lessonId);
                                if (!lessonData) return null;
                                return (
                                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', transition: 'all 0.2s' }}>
                                    <div style={{ width: '48px', height: '48px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <IconCheck size={20} />
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                      <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                        {lessonData.subLevel} • Unit {lessonData.unit}
                                      </div>
                                      <h4 style={{ margin: 0, fontSize: '1.3rem', color: '#0F172A', fontWeight: '600' }}>{lessonData.title}</h4>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px', marginBottom: '60px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '12px', borderRadius: '12px', display: 'flex' }}><IconStar size={24} /></div>
                              Official Gradebook
                            </h3>
                          </div>

                          <SignedIn>
                            {officialGrades.length === 0 ? (
                              <div style={{ background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
                                <p style={{ color: '#64748B', fontSize: '1.1rem', margin: 0 }}>No official assessments have been recorded yet.</p>
                              </div>
                            ) : (
                              <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                <table className="mobile-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                  <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '1.05rem' }}>Date</th>
                                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '1.05rem' }}>Assessment</th>
                                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '1.05rem' }}>Score</th>
                                      <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '1.05rem' }}>Teacher Feedback</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {officialGrades.map((grade, idx) => (
                                      <tr key={idx} style={{ borderBottom: idx === officialGrades.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                        <td data-label="Date" style={{ padding: '20px 24px', color: '#64748B', fontWeight: '500' }}>
                                          {new Date(grade.date_recorded).toLocaleDateString()}
                                        </td>
                                        <td data-label="Assessment" style={{ padding: '20px 24px', color: '#0F172A', fontWeight: '600', fontSize: '1.1rem' }}>
                                          {grade.assessment_name}
                                        </td>
                                        <td data-label="Score" style={{ padding: '20px 24px' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                            {grade.score.split('\n').map((line: string, i: number) => line.trim() ? (
                                              <span key={i} style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '0.95rem', display: 'inline-block' }}>
                                                {line}
                                              </span>
                                            ) : null)}
                                          </div>
                                        </td>
                                        <td data-label="Feedback" style={{ padding: '20px 24px', color: '#475569', fontStyle: 'italic', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                          "{grade.feedback || 'Excellent work!'}"
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </SignedIn>
                          
                          <SignedOut>
                            <div style={{ background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                              <div style={{ color: '#94A3B8' }}><IconLock size={20} /></div>
                              <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#0F172A' }}>Sign In Required</h4>
                              <p style={{ color: '#64748B', fontSize: '1.1rem', margin: '0 0 10px 0' }}>Official academic records and instructor feedback are only available for enrolled students.</p>
                              <SignInButton mode="modal">
                                <button style={{ background: '#10B981', color: '#ffffff', border: 'none', padding: '14px 32px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s' }}>View Official Records</button>
                              </SignInButton>
                            </div>
                          </SignedOut>
                        </div>
                      </div>
                    } />

                    {/* --- ROUTE: ADMIN DASHBOARD --- */}
                    <Route path="/admin" element={
                      isTeacherAdmin ? <TeacherDashboard /> : <Navigate to="/" />
                    } />

                    {/* --- ROUTE: BOOK REVIEWS --- */}
                    <Route path="/reviews" element={
                      <BookReviews
                        reviews={reviews}
                        bookCategory={bookCategory}
                        setBookCategory={setBookCategory}
                        activeSubCategory={activeSubCategory}
                        setActiveSubCategory={setActiveSubCategory}
                        onSelectBook={setSelectedBook}
                      />
                    } />

                    {/* --- ROUTE: ENGLISH CORNER (HOME) --- */}
                    <Route path="/" element={
                      <div>
                        {!activeLevel ? (
                          <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>

                            {/* --- FEATURED: WRITING LAB (the "Write." manifesto card) --- */}
                            <div className="soft-card" style={{ maxWidth: '1000px', margin: '0 auto 40px auto', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '32px', boxShadow: '0 20px 45px -18px rgba(15,23,42,0.12)', padding: '36px 40px 32px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid #0F172A', paddingBottom: '14px' }}>
                                <span className="wl-kicker" style={{ fontSize: '0.72rem', letterSpacing: '2.5px', color: '#0F172A', fontWeight: '600' }}>THE MASTER WRITING COURSE</span>
                                {WRITING_LAB_IS_NEW && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.72rem', letterSpacing: '2px', color: '#B45309', fontWeight: '600' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B' }} />NEW
                                  </span>
                                )}
                              </div>
                              <div style={{ position: 'relative', padding: '26px 0 10px' }}>
                                <h3 className="wl-serif wl-write" style={{ fontStyle: 'italic', fontWeight: '600', lineHeight: '0.95', color: '#0F172A', letterSpacing: '-2px', margin: 0 }}>Write<span style={{ color: '#4F46E5' }}>.</span></h3>
                                <svg className="wl-pen" style={{ position: 'absolute', right: '8px', top: '18px', transform: 'rotate(6deg)' }} viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              </div>
                              <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: '1.65', maxWidth: '440px', margin: 0 }}>From your first sentence to full academic essays — one lesson at a time.</p>
                              <p className="wl-serif" style={{ fontStyle: 'italic', fontSize: '1.15rem', color: '#B45309', margin: '10px 0 26px' }}>Free, for everyone. Always.</p>
                              <div className="wl-manifesto-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '20px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '32px' }}>
                                  <div><div style={{ fontSize: '1.35rem', fontWeight: '600', color: '#0F172A' }}>9</div><div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#94A3B8', fontWeight: '600' }}>MODULES</div></div>
                                  <div><div style={{ fontSize: '1.35rem', fontWeight: '600', color: '#0F172A' }}>67</div><div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#94A3B8', fontWeight: '600' }}>LESSONS</div></div>
                                  <div><div style={{ fontSize: '1.35rem', fontWeight: '600', color: '#0F172A' }}>A1–C1</div><div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#94A3B8', fontWeight: '600' }}>ALL LEVELS</div></div>
                                </div>
                                <button onClick={() => handleNavigation('/writing')} className="wl-cta" style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '15px 30px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 24px -8px rgba(79,70,229,0.45)', transition: 'all 0.2s', fontFamily: '"Fredoka", sans-serif' }}>Start the course →</button>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
                              {LEVELS.map((lvl, index) => {
                                const colors = [ { bg: '#EEF2FF', icon: '#4F46E5' }, { bg: '#FEF3C7', icon: '#D97706' }, { bg: '#ECFDF5', icon: '#10B981' } ];
                                return (
                                  <button key={lvl.name} onClick={() => setActiveLevel(lvl.name)} className="soft-card" style={{ flex: '1 1 280px', maxWidth: '320px', padding: '40px 40px', backgroundColor: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', transition: 'all 0.3s', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)' }}>
                                    <div style={{ background: colors[index].bg, color: colors[index].icon, width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {React.cloneElement(lvl.icon, { size: 36 })}
                                    </div>
                                    <h3 style={{ fontSize: '2rem', color: '#0F172A', margin: 0 }}>{lvl.name}</h3>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : !activeSubLevel ? (
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
                        ) : !activeUnit ? (
                          <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                              <div>
                                <BackButton onClick={() => setActiveSubLevel(null)} text="Back to Paths" />
                                <h2 style={{ margin: '16px 0 4px 0', color: '#0F172A', fontWeight: '600', fontSize: '2.5rem' }}>{activeSubLevel} Curriculum</h2>
                                <span style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '500' }}>{activeLevel}</span>
                              </div>
                              {(() => {
                                const currentPathAssessments = publishedAssessments.filter(a => a.level === activeLevel && a.subLevel === activeSubLevel);
                                const uniqueUnitsPublished = new Set(currentPathAssessments.map(a => a.unit)).size;
                                const isFinalExamUnlocked = uniqueUnitsPublished >= 12;

                                return (
                                  <div className="final-exam-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', flexGrow: 1, minWidth: '280px' }}>
                                    <button 
                                      onClick={() => startQuiz(true)} 
                                      disabled={!isFinalExamUnlocked}
                                      className="soft-card final-exam-btn"
                                      style={{ background: '#ffffff', border: isFinalExamUnlocked ? '2px solid #EEF2FF' : '1px solid #E2E8F0', padding: '16px 24px', borderRadius: '20px', cursor: isFinalExamUnlocked ? 'pointer' : 'not-allowed', boxShadow: isFinalExamUnlocked ? '0 10px 20px rgba(79, 70, 229, 0.1)' : '0 2px 5px rgba(15, 23, 42, 0.02)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', opacity: isFinalExamUnlocked ? 1 : 0.8, maxWidth: '350px', width: '100%' }}
                                    >
                                      <div style={{ background: isFinalExamUnlocked ? '#EEF2FF' : '#F1F5F9', color: isFinalExamUnlocked ? '#4F46E5' : '#94A3B8', padding: '14px', borderRadius: '14px', display: 'flex' }}>
                                        {isFinalExamUnlocked ? <IconStar size={24} /> : <IconLock size={20} />}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                                        <span style={{ fontWeight: '700', fontSize: '1.25rem', color: isFinalExamUnlocked ? '#4F46E5' : '#475569', lineHeight: '1.2' }}>Final Exam</span>
                                        {!isFinalExamUnlocked ? (
                                          <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '600', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Locked • {uniqueUnitsPublished}/12 Units</span>
                                        ) : (
                                          <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: '600', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Ready to Start</span>
                                        )}
                                      </div>
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(u => {
                                const meta = getUnitMeta(u);
                                return ( 
                                  <button key={u} className="soft-card" style={{ flex: '1 1 200px', maxWidth: '280px', padding: '40px 20px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.3s', justifyContent: 'center' }} onClick={() => setActiveUnit(u)}>
                                    <h3 style={{ margin: '0', fontSize: '2rem', color: '#0F172A', fontWeight: '700', letterSpacing: '-0.5px' }}>Unit {u}</h3>
                                    {meta.title && (
                                      <>
                                        <div style={{ width: '40px', height: '3px', background: '#4F46E5', borderRadius: '2px', margin: '8px 0' }} />
                                        <span style={{ display: 'block', color: '#64748B', fontWeight: '600', fontSize: '1.1rem', lineHeight: '1.4' }}>{meta.title}</span>
                                      </>
                                    )}
                                  </button> 
                                )
                              })}
                            </div>

                          </div>
                        ) : (
                          <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                            <div style={{ marginBottom: '30px' }}>
                              <BackButton onClick={() => setActiveUnit(null)} text="Back to Units" />
                            </div>
                            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                              
                              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', color: '#64748B', padding: '6px 16px', borderRadius: '9999px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                                  {activeLevel} • {activeSubLevel}
                                </span>
                                <h2 style={{ margin: '0 0 16px', fontWeight: '700', fontSize: '3.5rem', color: '#0F172A', letterSpacing: '-1px', lineHeight: '1.1' }}>
                                  Unit {activeUnit}{getUnitMeta(activeUnit).title ? `: ${getUnitMeta(activeUnit).title}` : ''}
                                </h2>
                                {getUnitMeta(activeUnit).desc && (
                                  <p style={{ color: '#64748B', fontSize: '1.2rem', margin: '0 auto', maxWidth: '650px', lineHeight: '1.6' }}>{getUnitMeta(activeUnit).desc}</p>
                                )}
                              </div>

                              {getUnitMeta(activeUnit).objectives.length > 0 && (
                                <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '30px', marginBottom: '60px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                  <h3 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ color: '#4F46E5', display: 'flex' }}><IconTarget size={20} /></div>
                                    Unit Objectives
                                  </h3>
                                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '1.1rem', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {getUnitMeta(activeUnit).objectives.map((obj: string, i: number) => <li key={i}>{obj}</li>)}
                                  </ul>
                                </div>
                              )}

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {unitLessons.length > 0 ? unitLessons.map((lesson, index) => {
                                  const isCompleted = completedLessons.includes(lesson._id);
                                  const isLocked = index > 0 && !completedLessons.includes(unitLessons[index - 1]._id);
                                  let cardBg = '#ffffff'; let border = '2px solid #E2E8F0'; 
                                  if (isCompleted) { border = '2px solid #10B981'; }
                                  else if (!isLocked) { border = '2px solid #4F46E5'; }

                                  return (
                                    <div key={lesson._id} className="soft-card lesson-card-wrapper" style={{ background: cardBg, border, borderRadius: '24px', transition: 'all 0.3s', marginBottom: index === unitLessons.length - 1 ? '40px' : '0' }}>
                                      
                                      <div className="lesson-info-group">
                                        <div className="lesson-badge" style={{ background: isCompleted ? '#ECFDF5' : (isLocked ? '#F8FAFC' : '#EEF2FF'), color: isCompleted ? '#10B981' : (isLocked ? '#94A3B8' : '#4F46E5') }}>
                                          {lesson.lessonOrder}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.5rem', fontWeight: '600', color: '#0F172A', lineHeight: '1.3' }}>{lesson.title}</h3>
                                          {lesson.grammarFocus && (
                                            <p style={{ margin: '0', color: '#475569', fontSize: '1.05rem', lineHeight: '1.5' }}>
                                              <strong style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '6px' }}>Focus:</strong>
                                              {lesson.grammarFocus}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="lesson-action-group">
                                        {isCompleted && <span className="status-text"><IconCheck size={16} /> Completed</span>}
                                        <button 
                                          onClick={() => { handleMarkLessonComplete(lesson._id); setActiveLessonData(lesson); setIsInteractiveLesson(true); }} 
                                          style={{ background: isCompleted ? '#F1F5F9' : '#4F46E5', color: isCompleted ? '#475569' : '#ffffff', border: 'none', padding: '14px 28px', borderRadius: '16px', fontWeight: '700', fontSize: '1.05rem', cursor: 'pointer', boxShadow: isCompleted ? 'none' : '0 10px 20px -5px rgba(79, 70, 229, 0.3)', whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isLocked ? 0.5 : 1 }}
                                          disabled={isLocked}
                                        >
                                          {isLocked ? <><IconLock size={18} /> Locked</> : isCompleted ? 'Review' : 'Start Lesson'}
                                        </button>
                                      </div>

                                    </div>
                                  )
                                }) : (
                                  <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '24px', padding: '40px', textAlign: 'center', marginBottom: '40px' }}>
                                    <span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: '500' }}>No lessons published for this unit yet.</span>
                                  </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'stretch', gap: '24px', opacity: allLessonsCompleted ? 1 : 0.5, pointerEvents: allLessonsCompleted ? 'auto' : 'none', transition: 'all 0.3s' }}>
                                  <div className="soft-card assessment-card-wrapper" style={{ flexGrow: 1, background: allLessonsCompleted ? '#ffffff' : '#F8FAFC', border: allLessonsCompleted ? '2px solid #4F46E5' : '2px dashed #E2E8F0', borderRadius: '24px', transition: 'all 0.3s' }}>
                                    
                                    <div className="lesson-info-group">
                                       <div className="lesson-badge" style={{ background: allLessonsCompleted ? '#EEF2FF' : '#F1F5F9', color: allLessonsCompleted ? '#4F46E5' : '#94A3B8' }}>
                                         {allLessonsCompleted ? <IconStar size={24} /> : <IconLock size={20} />}
                                       </div>
                                       <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', lineHeight: '1.2' }}>Unit Assessment</h3>
                                          <p style={{ color: '#64748B', margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
                                            {allLessonsCompleted ? 'You have completed all lessons. You are ready to be tested.' : 'Complete all lessons to unlock the assessment.'}
                                          </p>
                                       </div>
                                    </div>
                                    
                                    <div className="assessment-action-group lesson-action-group">
                                      <button onClick={() => startQuiz(false)} disabled={!allLessonsCompleted} style={{ background: allLessonsCompleted ? '#4F46E5' : '#E2E8F0', color: allLessonsCompleted ? '#ffffff' : '#94A3B8', border: 'none', padding: '14px 28px', borderRadius: '16px', fontWeight: '700', fontSize: '1.05rem', cursor: allLessonsCompleted ? 'pointer' : 'not-allowed', boxShadow: allLessonsCompleted ? '0 10px 20px -5px rgba(79, 70, 229, 0.3)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', width: '100%' }}>
                                        <IconQuiz size={18} /> {allLessonsCompleted ? 'Start Assessment' : 'Locked'}
                                      </button>
                                    </div>

                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    } />

                    {/* --- ROUTE: RESOURCES --- */}
                    <Route path="/resources" element={<ResourceLibrary resources={resources} />} />
                    
                    {/* --- ROUTE: ABOUT --- */}
                    <Route path="/about" element={<AboutPage onNavigate={handleNavigation} />} />

                    {/* --- ROUTE: CONTACT --- */}
                    <Route path="/contact" element={<ContactPage />} />
                  </Routes>
                )}
              </>
            ) : (
              <>
                {isQuizMode && <QuizOverlay quizItems={quizItems} isLevelExam={isLevelExam} onClose={() => handleNavigation('/')} dictionary={dictionary} savedWords={savedWords} toggleSaveWord={toggleSaveWord} />}
                {isInteractiveLesson && activeLessonData && (
                  <InteractiveLesson lessonData={activeLessonData} onClose={() => { setIsInteractiveLesson(false); setActiveLessonData(null); }} dictionary={dictionary} savedWords={savedWords} toggleSaveWord={toggleSaveWord} onComplete={() => handleMarkLessonComplete(activeLessonData._id)} />
                )}
              </>
            )}
          </div>

          {showNoQuizModal && (
            <div style={styles.modalOverlay} onClick={() => setShowNoQuizModal(false)}>
              <div className="responsive-card" style={{...styles.modalContent, maxWidth: '450px', textAlign: 'center', padding: '50px'}} onClick={e => e.stopPropagation()}>
                <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>No Questions Yet</h2>
                <p style={{ color: '#64748B', fontSize: '1.15rem', marginBottom: '32px', lineHeight: '1.6' }}>No assessment questions have been published for this unit yet. Check back later!</p>
                <button onClick={() => setShowNoQuizModal(false)} style={{ background: '#4F46E5', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>Understood</button>
              </div>
            </div>
          )}

          {selectedBook && (
            <div style={styles.modalOverlay} onClick={() => setSelectedBook(null)}>
              <div className="responsive-card" style={{...styles.modalContent, overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => setSelectedBook(null)} style={styles.closeButton}>✕</button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '30px' }}>
                  {selectedBook.coverImage ? (
                    <img src={urlFor(selectedBook.coverImage).url()} alt={selectedBook.title} style={{ height: '280px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }} />
                  ) : (
                    <div style={{ height: '280px', width: '190px', background: '#F8FAFC', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', marginBottom: '24px' }}>No Cover</div>
                  )}
                  <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '8px', lineHeight: '1.2' }}>{selectedBook.title}</h2>
                  {selectedBook.author && <span style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '16px' }}>by {selectedBook.author}</span>}
                  {selectedBook.level && <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedBook.level}</span>}
                  <div style={{ height: '4px', width: '40px', backgroundColor: '#4F46E5', borderRadius: '2px', marginTop: '24px' }} />
                </div>
                <div className="modal-text-content" style={{ fontSize: '1.2rem', color: '#334155', lineHeight: '2', whiteSpace: 'pre-wrap', padding: '0 20px' }}>
                  <TextHighlighter 
                    text={typeof selectedBook.content === 'string' ? selectedBook.content : Array.isArray(selectedBook.content) ? selectedBook.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n') : "Review content is currently being updated."} 
                    dictionary={dictionary} onSaveWord={toggleSaveWord} savedWords={savedWords} 
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
      )}
    </>
  );
}