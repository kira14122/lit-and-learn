import React, { useState, useEffect, useMemo } from 'react';
import { client, urlFor } from '../sanityClient';

// --- Premium Line-Art SVGs (same style as PracticeHub) ---
const IconSearch = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconCheckCircle = () => (<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconAlert = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconArrowRight = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>);
const IconChevronRight = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>);
const IconItems = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>);
const IconBook = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconBack = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>);
const IconFileText = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IconCheckSmall = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>);
const IconEye = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);

// --- Type themes (mirrors the getCategoryTheme pattern) ---
const getTypeTheme = (type: string) => {
  if (type === 'gapFill') return {
    bg: '#ECFDF5', color: '#10B981', tagText: '#065F46', label: 'Gap Fill', pill: 'Gap Fill',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
  };
  if (type === 'combine') return {
    bg: '#FFF7ED', color: '#F97316', tagText: '#C2410C', label: 'Combine & Rewrite', pill: 'Rewrite',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7.5 7.5"/><path d="M3 3l7.5 7.5"/><path d="M12 12v9"/></svg>
  };
  if (type === 'trueFalseNG') return {
    bg: '#E0F2FE', color: '#0EA5E9', tagText: '#075985', label: 'True / False / Not Given', pill: 'True / False / NG',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><path d="m9 11 3 3L22 4"/></svg>
  };
  // multipleChoice (default)
  return {
    bg: '#EEF2FF', color: '#4F46E5', tagText: '#3730A3', label: 'Multiple Choice', pill: 'Multiple Choice',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h.01"/><path d="M8 6h13"/><path d="M3 12h.01"/><path d="M8 12h13"/><path d="M3 18h.01"/><path d="M8 18h13"/></svg>
  };
};

// --- Module colors: rotate through the site palette so the course list has rhythm ---
const MODULE_COLORS = [
  { bg: '#EEF2FF', color: '#4F46E5' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#ECFDF5', color: '#10B981' },
  { bg: '#FEE2E2', color: '#EF4444' },
  { bg: '#F3E8FF', color: '#A855F7' },
];
const getModuleColor = (n: number) => MODULE_COLORS[(Math.max(1, n || 1) - 1) % MODULE_COLORS.length];

// --- Item shapes ---
type MCItem = { kind: 'multipleChoice'; question: string; options: { A: string; B: string; C: string }; correct: string; explanation: string };
type GapItem = { kind: 'gapFill'; sentence: string; answers: string[]; why: string };
type CombineItem = { kind: 'combine'; instruction: string; given: string; model: string; hint: string };
type TFNGItem = { kind: 'trueFalseNG'; statement: string; answer: 'T' | 'F' | 'NG'; why: string };
type WritingItem = MCItem | GapItem | CombineItem | TFNGItem;

const TFNG_LABELS: Record<'T' | 'F' | 'NG', string> = { T: 'True', F: 'False', NG: 'Not Given' };

// --- Parsing: tab-separated rows, format decided by bank type ---
// Mirrored by countItems below so the number on the card always matches
// what the student actually receives.
const parseRows = (bulkData: string): string[][] => {
  if (!bulkData) return [];
  return bulkData
    .replace(/\r/g, '')
    .split('\n')
    .filter((row) => row.trim() !== '')
    .map((row) => row.split('\t').map((c) => c.trim()));
};

const rowToItem = (cols: string[], type: string): WritingItem | null => {
  if (type === 'gapFill') {
    if (cols.length >= 2 && cols[0].includes('___') && cols[1] !== '') {
      return {
        kind: 'gapFill',
        sentence: cols[0],
        answers: cols[1].split('|').map((a) => a.trim()).filter(Boolean),
        why: cols[2] || '',
      };
    }
    return null;
  }
  if (type === 'trueFalseNG') {
    if (cols.length >= 2 && cols[0] !== '' && cols[1] !== '') {
      const raw = cols[1].toUpperCase().trim();
      const answer: 'T' | 'F' | 'NG' | null = raw.startsWith('T') ? 'T' : raw.startsWith('F') ? 'F' : raw.startsWith('N') ? 'NG' : null;
      if (answer) {
        return { kind: 'trueFalseNG', statement: cols[0], answer, why: cols[2] || '' };
      }
    }
    return null;
  }
  if (type === 'combine') {
    if (cols.length >= 3 && cols[0] !== '' && cols[1] !== '' && cols[2] !== '') {
      return { kind: 'combine', instruction: cols[0], given: cols[1], model: cols[2], hint: cols[3] || '' };
    }
    return null;
  }
  // multipleChoice — identical rules to the Practice Hub quiz banks
  if (cols.length >= 5 && cols[0] !== '' && cols[0].toLowerCase() !== 'question') {
    return {
      kind: 'multipleChoice',
      question: cols[0],
      options: { A: cols[1], B: cols[2], C: cols[3] },
      correct: cols[4].toUpperCase().replace(/[^ABC]/g, ''),
      explanation: cols[5] || 'No explanation provided.',
    };
  }
  return null;
};

const itemKey = (item: WritingItem): string => {
  const base =
    item.kind === 'multipleChoice'
      ? item.question + item.options.A + item.options.B + item.options.C
      : item.kind === 'gapFill'
        ? item.sentence
        : item.kind === 'trueFalseNG'
          ? item.statement
          : item.instruction + item.given;
  return base.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const parseBank = (bank: any): WritingItem[] => {
  const rows = parseRows(bank?.bulkData || '');
  const items: WritingItem[] = [];
  const seen = new Set<string>();
  for (const cols of rows) {
    const item = rowToItem(cols, bank?.type || 'multipleChoice');
    if (item) {
      const key = itemKey(item);
      if (!seen.has(key)) { seen.add(key); items.push(item); }
    }
  }
  return items;
};

const countItems = (bank: any): number => parseBank(bank).length;

// Case-insensitive, whitespace-tolerant gap-fill matching with | alternatives
const normalizeAnswer = (s: string): string => s.toLowerCase().replace(/\s+/g, ' ').trim();
const checkGapAnswer = (typed: string, answers: string[]): boolean => {
  const clean = normalizeAnswer(typed);
  if (clean === '') return false;
  return answers.some((a) => normalizeAnswer(a) === clean);
};

// Renders **text** as bold brand-indigo emphasis. Safe by construction:
// it splits the string and never injects HTML. An unmatched ** is shown
// literally instead of bolding the rest of the line.
const renderEmphasis = (text: string): React.ReactNode => {
  if (!text || !text.includes('**')) return text;
  const parts = text.split('**');
  const unmatched = parts.length % 2 === 0;
  return parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    if (i % 2 === 1 && !(unmatched && isLast)) {
      return <strong key={i} style={{ color: '#4F46E5', fontWeight: 700 }}>{part}</strong>;
    }
    return <React.Fragment key={i}>{unmatched && isLast ? '**' + part : part}</React.Fragment>;
  });
};

const shuffleItems = (items: WritingItem[]): WritingItem[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Local progress (no account needed): completed lesson ids, saved on this device ---
const loadCourseProgress = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

// CourseLab: one generic course engine. Each course (Writing Lab, Reading Lab, ...)
// is a thin wrapper passing its own config. Fix a bug here, every course gets the fix.
export interface CourseLabConfig {
  bankType: string;      // Sanity document type for lessons, e.g. 'writingBank'
  moduleType: string;    // Sanity document type for modules, e.g. 'writingModule'
  progressKey: string;   // localStorage key for this course's progress
  heroTitle: string;
  heroSubtitle: string;
}

export const CourseLab = ({ config }: { config: CourseLabConfig }) => {
  const [banks, setBanks] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [completedBankIds, setCompletedBankIds] = useState<string[]>(() => loadCourseProgress(config.progressKey));
  const [activeBank, setActiveBank] = useState<any | null>(null);
  const [inPractice, setInPractice] = useState(false);
  const [items, setItems] = useState<WritingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Per-type answer state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // multiple choice
  const [gapInput, setGapInput] = useState('');                              // gap fill
  const [gapResult, setGapResult] = useState<'correct' | 'incorrect' | null>(null);
  const [combineAttempt, setCombineAttempt] = useState('');                  // combine & rewrite
  const [modelRevealed, setModelRevealed] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showPassageModal, setShowPassageModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('Any Level');
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);

  useEffect(() => {
    client.fetch(`*[_type == "${config.bankType}"] | order(title asc)`).then(setBanks);
    client.fetch(`*[_type == "${config.moduleType}"] | order(moduleNumber asc){ _id, moduleNumber, title, description, "banks": banks[]-> }`).then(setModules);
  }, [config.bankType, config.moduleType]);

  const availableCategories = useMemo(() => {
    const cats = new Set(banks.map(b => b.category).filter(Boolean));
    return ['All', ...Array.from(cats)].sort();
  }, [banks]);

  const availableLevels = useMemo(() => {
    const levels = new Set(banks.map(b => b.level).filter(Boolean));
    return ['Any Level', ...Array.from(levels).sort()];
  }, [banks]);

  const filteredBanks = useMemo(() => {
    return banks.filter(bank => {
      const matchesSearch = bank.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const matchesCategory = selectedCategory === 'All' || bank.category === selectedCategory;
      const matchesLevel = selectedLevel === 'Any Level' || bank.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [banks, searchQuery, selectedCategory, selectedLevel]);

  const activeItems = useMemo(() => (activeBank ? parseBank(activeBank) : []), [activeBank]);
  const lessonExampleLines = useMemo(() => {
    return (activeBank?.lessonExamples || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l !== '');
  }, [activeBank]);

  const isGradable = activeBank?.type !== 'combine';
  const showCourse = modules.length > 0;

  const courseStats = useMemo(() => {
    const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const all = modules.flatMap(m => (m.banks || []).filter(Boolean));
    const lvls = all
      .map((b: any) => b.level)
      .filter((l: string) => CEFR_ORDER.includes(l))
      .sort((a: string, b: string) => CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));
    const range = lvls.length === 0 ? null : lvls[0] === lvls[lvls.length - 1] ? lvls[0] : `${lvls[0]} → ${lvls[lvls.length - 1]}`;
    return { total: all.length, range };
  }, [modules]);

  useEffect(() => {
    if (isComplete && activeBank?._id && !completedBankIds.includes(activeBank._id)) {
      setCompletedBankIds(prev => {
        if (prev.includes(activeBank._id)) return prev;
        const next = [...prev, activeBank._id];
        try { localStorage.setItem(config.progressKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
        return next;
      });
    }
  }, [isComplete, activeBank, completedBankIds, config.progressKey]);

  const completedTotal = useMemo(() => {
    const courseIds = new Set(modules.flatMap(m => (m.banks || []).filter(Boolean).map((b: any) => b._id)));
    return completedBankIds.filter(id => courseIds.has(id)).length;
  }, [modules, completedBankIds]);
  const currentItem: WritingItem | undefined = items[currentIndex];

  const resetItemState = () => {
    setSelectedAnswer(null);
    setGapInput('');
    setGapResult(null);
    setCombineAttempt('');
    setModelRevealed(false);
  };

  const handleOpenBank = (bank: any) => {
    setActiveBank(bank);
    setInPractice(false);
    setIsComplete(false);
  };

  const handleStartPractice = () => {
    if (activeItems.length === 0) return;
    // Multiple choice and gap fill shuffle each run; combine keeps authored order
    const prepared = activeBank.type === 'combine' ? [...activeItems] : shuffleItems(activeItems);
    setItems(prepared);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    resetItemState();
    setInPractice(true);
  };

  const handleBackToList = () => {
    setActiveBank(null);
    setInPractice(false);
    setIsComplete(false);
    setShowExitModal(false);
    setShowLessonModal(false);
    setShowPassageModal(false);
    resetItemState();
  };

  const isItemAnswered = (): boolean => {
    if (!currentItem) return false;
    if (currentItem.kind === 'multipleChoice') return selectedAnswer !== null;
    if (currentItem.kind === 'gapFill') return gapResult !== null;
    if (currentItem.kind === 'trueFalseNG') return selectedAnswer !== null;
    return modelRevealed;
  };

  const handleAnswerClick = (key: string) => {
    if (selectedAnswer || !currentItem || currentItem.kind !== 'multipleChoice') return;
    setSelectedAnswer(key);
    if (key === currentItem.correct) setScore(prev => prev + 1);
  };

  const handleTFNGClick = (key: 'T' | 'F' | 'NG') => {
    if (selectedAnswer || !currentItem || currentItem.kind !== 'trueFalseNG') return;
    setSelectedAnswer(key);
    if (key === currentItem.answer) setScore(prev => prev + 1);
  };

  const handleCheckGap = () => {
    if (gapResult || !currentItem || currentItem.kind !== 'gapFill') return;
    if (gapInput.trim() === '') return;
    const correct = checkGapAnswer(gapInput, currentItem.answers);
    setGapResult(correct ? 'correct' : 'incorrect');
    if (correct) setScore(prev => prev + 1);
  };

  const nextItem = () => {
    resetItemState();
    if (currentIndex + 1 < items.length) setCurrentIndex(prev => prev + 1);
    else setIsComplete(true);
  };

  const progressPercent = items.length > 0 ? Math.round(((currentIndex + (isItemAnswered() ? 1 : 0)) / items.length) * 100) : 0;

  return (
    <>
      <style>{`
        .wl-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }
        .wl-search-row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .wl-search-input {
          flex: 1;
          width: 100%;
          padding: 16px 20px 16px 52px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 16px !important;
          outline: none;
          color: #0F172A;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        .wl-search-input:focus {
          border-color: #4F46E5;
          box-shadow: 0 4px 20px rgba(79,70,229,0.1);
        }
        .wl-dropdown-btn {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 16px !important;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          color: #0F172A;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }
        .wl-dropdown-btn:hover { border-color: #CBD5E1; }
        .wl-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          z-index: 50;
          overflow: hidden;
        }
        .wl-dropdown-item {
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #F1F5F9;
        }
        .wl-dropdown-item:last-child { border-bottom: none; }
        .wl-dropdown-item:hover { background: #F8FAFC; }
        .wl-cat-bar {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 6px;
          background: #ffffff;
          padding: 8px;
          border-radius: 24px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.06);
        }
        .wl-cat-btn {
          background: transparent;
          color: #64748B;
          border: none;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 22px;
          border-radius: 9999px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .wl-cat-btn:hover { color: #0F172A; }
        .wl-cat-btn.wl-cat-active {
          background: #4F46E5;
          color: #ffffff;
          box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25);
        }
        .wl-cat-btn.wl-cat-active:hover { color: #ffffff; }
        .wl-hero-title { font-size: 2.6rem; }
        .wl-course-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .wl-module-card {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          padding: 24px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 24px -10px rgba(15,23,42,0.06);
          width: 100%;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .wl-module-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -12px rgba(79,70,229,0.15);
          border-color: #C7D2FE;
        }
        .wl-module-card:hover .wl-card-arrow { transform: translateX(4px); }
        .wl-module-title { font-size: 22px; }
        .wl-module-desc { font-size: 15px; }
        .wl-lesson-row {
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 24px;
          text-align: left;
          font-family: inherit;
          transition: background 0.2s;
        }
        .wl-lesson-row:hover { background: #F8FAFC; }
        .wl-lesson-body {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .wl-lesson-meta {
          display: flex;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .wl-lesson-line {
          position: absolute;
          left: 39px;
          top: 30px;
          bottom: 30px;
          width: 2px;
          border-radius: 2px;
        }
        .wl-grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .wl-card {
          background-color: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 18px 20px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          box-shadow: 0 6px 20px -12px rgba(0,0,0,0.06);
          width: 100%;
        }
        .wl-card:hover {
          border-color: #C7D2FE;
          box-shadow: 0 12px 28px -14px rgba(79,70,229,0.18);
          transform: translateY(-2px);
        }
        .wl-card:hover .wl-chevron {
          color: #4F46E5;
          transform: translateX(2px);
        }
        .wl-gap-input {
          display: inline-block;
          min-width: 130px;
          max-width: 100%;
          padding: 6px 12px;
          margin: 0 4px;
          border: none;
          border-bottom: 3px solid #C7D2FE;
          background: #F8FAFC;
          border-radius: 8px 8px 0 0;
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          text-align: center;
          outline: none;
          transition: all 0.2s;
        }
        .wl-gap-input:focus { border-bottom-color: #4F46E5; background: #EEF2FF; }
        .wl-gap-correct { border-bottom-color: #10B981 !important; background: #ECFDF5 !important; color: #065F46 !important; }
        .wl-gap-incorrect { border-bottom-color: #EF4444 !important; background: #FEF2F2 !important; color: #991B1B !important; }
        .wl-combine-textarea {
          width: 100%;
          min-height: 90px;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 17px;
          font-family: inherit;
          line-height: 1.6;
          color: #0F172A;
          outline: none;
          resize: vertical;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .wl-combine-textarea:focus {
          border-color: #4F46E5;
          box-shadow: 0 4px 20px rgba(79,70,229,0.1);
        }
        @media (max-width: 767px) {
          .wl-cat-btn { padding: 10px 16px; font-size: 14px; }
          .wl-hero-title { font-size: 1.85rem; }
          .wl-module-title { font-size: 18px; }
          .wl-module-desc { font-size: 13px; }
          .wl-lesson-row { padding: 12px 16px; gap: 12px; align-items: flex-start; }
          .wl-lesson-num { margin-top: 2px; }
          .wl-lesson-body { flex-direction: column; align-items: flex-start; gap: 7px; }
          .wl-lesson-meta { margin-left: 0; }
          .wl-lesson-line { left: 31px; }
        }
        @media (min-width: 768px) {
          .wl-course-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
          .wl-controls { flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: wrap; }
          .wl-search-row { flex-direction: row; width: auto; max-width: 600px; gap: 16px; }
          .wl-dropdown-container { width: 200px; }
          .wl-grid-container { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        }
      `}</style>

      {isLevelMenuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setIsLevelMenuOpen(false)}
        />
      )}

      <div style={{ animation: 'fadeInDown 0.4s ease-out', maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>

        {!activeBank ? (
          <div>
            {showCourse ? (
              selectedModule ? (
                (() => {
                  const mc = getModuleColor(selectedModule.moduleNumber);
                  const lessons = (selectedModule.banks || []).filter(Boolean);
                  const done = lessons.filter((b: any) => completedBankIds.includes(b._id)).length;
                  return (
                    <div style={{ maxWidth: '760px', margin: '0 auto', animation: 'fadeInDown 0.3s ease-out' }}>
                      <button onClick={() => setSelectedModule(null)} style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', marginBottom: '24px' }}>
                        <IconBack />
                        All Modules
                      </button>

                      <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '28px', boxShadow: '0 16px 32px -14px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                        <div style={{ background: mc.bg, padding: '28px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <span style={{ display: 'inline-block', background: mc.color, color: '#ffffff', fontSize: '14px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '9999px' }}>
                              Module {selectedModule.moduleNumber}
                            </span>
                            <span style={{ display: 'inline-block', background: '#ffffff', color: done === lessons.length && lessons.length > 0 ? '#10B981' : mc.color, fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '9999px' }}>
                              {done > 0 ? `${done} of ${lessons.length} completed` : `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                          <h2 className="wl-module-title" style={{ margin: 0, color: '#0F172A', fontWeight: '700', lineHeight: '1.2' }}>{selectedModule.title}</h2>
                          {selectedModule.description && (
                            <p className="wl-module-desc" style={{ margin: '16px 0 0', color: '#475569', fontWeight: '500', lineHeight: '1.6' }}>{selectedModule.description}</p>
                          )}
                          <div style={{ height: '8px', background: '#ffffff', borderRadius: '9999px', overflow: 'hidden', marginTop: '18px' }}>
                            <div style={{ height: '8px', width: `${lessons.length ? Math.round((done / lessons.length) * 100) : 0}%`, background: done === lessons.length && lessons.length > 0 ? '#10B981' : mc.color, borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                          </div>
                        </div>

                        <div style={{ position: 'relative', padding: '14px 0' }}>
                          <div className="wl-lesson-line" style={{ background: mc.bg }} />
                          {lessons.map((bank: any, i: number) => {
                            const theme = getTypeTheme(bank.type);
                            return (
                              <button key={bank._id} className="wl-lesson-row" onClick={() => handleOpenBank(bank)}>
                                {completedBankIds.includes(bank._id) ? (
                                  <span className="wl-lesson-num" style={{ width: '32px', height: '32px', borderRadius: '9999px', background: '#ECFDF5', border: '2px solid #10B981', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}><IconCheckSmall /></span>
                                ) : (
                                  <span className="wl-lesson-num" style={{ width: '32px', height: '32px', borderRadius: '9999px', background: '#ffffff', border: `2px solid ${mc.color}`, color: mc.color, fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>{i + 1}</span>
                                )}
                                <span className="wl-lesson-body">
                                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', lineHeight: '1.35' }}>{bank.title}</span>
                                  <span className="wl-lesson-meta">
                                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', background: theme.bg, color: theme.tagText, whiteSpace: 'nowrap' }}>{theme.pill}</span>
                                    {bank.level && (
                                      <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', background: '#F1F5F9', color: '#64748B', whiteSpace: 'nowrap' }}>{bank.level}</span>
                                    )}
                                  </span>
                                </span>
                                <span style={{ color: '#CBD5E1', display: 'flex', flexShrink: 0 }}><IconChevronRight /></span>
                              </button>
                            );
                          })}
                          {lessons.length === 0 && (
                            <div style={{ padding: '16px 24px', color: '#94A3B8', fontSize: '14px', fontWeight: '600' }}>No lessons in this module yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                  {/* Course hero — edit the two lines below to reword the title or promise */}
                  <div style={{ textAlign: 'center', margin: '0 auto 44px', maxWidth: '720px' }}>
                    <h2 className="wl-hero-title" style={{ margin: '0 0 12px', color: '#0F172A', fontWeight: '700', letterSpacing: '-1px', lineHeight: '1.1' }}>{config.heroTitle}</h2>
                    <p style={{ margin: '0 0 22px', color: '#64748B', fontSize: '1.15rem', lineHeight: '1.6' }}>{config.heroSubtitle}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: '#ffffff', color: '#4F46E5', fontSize: '14px', fontWeight: '700', padding: '8px 18px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(30,35,60,0.06)' }}>
                        {modules.length} module{modules.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ background: '#ffffff', color: '#10B981', fontSize: '14px', fontWeight: '700', padding: '8px 18px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(30,35,60,0.06)' }}>
                        {completedTotal > 0 ? `${completedTotal} / ${courseStats.total} lessons` : `${courseStats.total} lesson${courseStats.total !== 1 ? 's' : ''}`}
                      </span>
                      {courseStats.range && (
                        <span style={{ background: '#ffffff', color: '#D97706', fontSize: '14px', fontWeight: '700', padding: '8px 18px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(30,35,60,0.06)' }}>
                          {courseStats.range}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="wl-course-grid">
                    {modules.map(mod => {
                      const lessons = (mod.banks || []).filter(Boolean);
                      const mc = getModuleColor(mod.moduleNumber);
                      const done = lessons.filter((b: any) => completedBankIds.includes(b._id)).length;
                      const isModuleDone = lessons.length > 0 && done === lessons.length;
                      return (
                        <button key={mod._id} className="wl-module-card" onClick={() => setSelectedModule(mod)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            <span style={{ display: 'inline-block', background: mc.color, color: '#ffffff', fontSize: '14px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '9999px' }}>
                              Module {mod.moduleNumber}
                            </span>
                            {completedTotal === 0 && mod.moduleNumber === 1 && (
                              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '9999px', background: mc.bg, color: mc.color }}>Start here</span>
                            )}
                          </div>
                          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#0F172A', lineHeight: '1.25' }}>{mod.title}</h3>
                          {mod.description && (
                            <p style={{ margin: '0 0 18px', fontSize: '14px', color: '#64748B', fontWeight: '500', lineHeight: '1.55', flexGrow: 1 }}>{mod.description}</p>
                          )}
                          <div style={{ width: '100%', marginTop: 'auto' }}>
                            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden', marginBottom: '10px' }}>
                              <div style={{ height: '6px', width: `${lessons.length ? Math.round((done / lessons.length) * 100) : 0}%`, background: isModuleDone ? '#10B981' : mc.color, borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                            </div>
                            {isModuleDone ? (
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IconCheckSmall /> Completed
                              </p>
                            ) : (
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: mc.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {done > 0 ? `Continue · ${done} / ${lessons.length}` : `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`} <span className="wl-card-arrow" style={{ display: 'flex', transition: 'transform 0.2s' }}><IconArrowRight /></span>
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div>
            <div className="wl-controls">
              <div>
                <div className="wl-cat-bar">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`wl-cat-btn ${selectedCategory === cat ? 'wl-cat-active' : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wl-search-row">
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                    <IconSearch />
                  </div>
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="wl-search-input"
                  />
                </div>

                <div className="wl-dropdown-container" style={{ position: 'relative', zIndex: 50 }}>
                  <button
                    onClick={() => setIsLevelMenuOpen(!isLevelMenuOpen)}
                    className="wl-dropdown-btn"
                  >
                    {selectedLevel}
                    <span style={{ color: '#64748B', fontSize: '12px', transition: 'transform 0.2s', transform: isLevelMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </button>

                  {isLevelMenuOpen && (
                    <div className="wl-dropdown-menu">
                      {availableLevels.map(level => (
                        <div
                          key={level}
                          onClick={() => { setSelectedLevel(level); setIsLevelMenuOpen(false); }}
                          className="wl-dropdown-item"
                          style={{
                            color: selectedLevel === level ? '#4F46E5' : '#0F172A',
                            background: selectedLevel === level ? '#EEF2FF' : 'transparent'
                          }}
                        >
                          {level}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px', color: '#94A3B8', fontWeight: '600', fontSize: '15px' }}>
              Showing {filteredBanks.length} lesson{filteredBanks.length !== 1 ? 's' : ''}
            </div>

            <div className="wl-grid-container">
              {filteredBanks.map(bank => {
                const theme = getTypeTheme(bank.type);
                const itemCount = countItems(bank);

                return (
                  <button
                    key={bank._id}
                    onClick={() => handleOpenBank(bank)}
                    className="wl-card soft-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {theme.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '7px', background: theme.bg, color: theme.tagText, lineHeight: '1.2' }}>
                            {theme.label}
                          </span>
                          {bank.level && (
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '7px', background: '#F1F5F9', color: '#64748B', lineHeight: '1.2' }}>
                              {bank.level}
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A', fontWeight: '700', lineHeight: '1.3', letterSpacing: '-0.2px' }}>
                          {bank.title}
                        </h3>
                      </div>

                      <span className="wl-chevron" style={{ color: '#CBD5E1', flexShrink: 0, display: 'flex', transition: 'all 0.2s' }}>
                        <IconChevronRight />
                      </span>
                    </div>

                    {itemCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                        <span style={{ display: 'flex', color: '#94A3B8' }}><IconItems /></span>
                        {itemCount} item{itemCount !== 1 ? 's' : ''} · with lesson
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredBanks.length === 0 && banks.length > 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                  <div style={{ display: 'inline-flex', marginBottom: '16px', opacity: 0.5 }}><IconSearch /></div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '24px', fontWeight: '600' }}>No matching lessons</h3>
                  <p style={{ margin: 0, fontSize: '16px' }}>Try adjusting your search or filters.</p>
                </div>
              )}

              {banks.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '24px', fontWeight: '600' }}>No lessons yet</h3>
                  <p style={{ margin: 0, fontSize: '16px' }}>New lessons are on their way. Check back soon!</p>
                </div>
              )}
            </div>
              </div>
            )}
          </div>
        ) : !inPractice ? (
          <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeInDown 0.4s ease-out' }}>
            <button onClick={handleBackToList} style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', marginBottom: '30px' }}>
              <IconBack />
              {selectedModule ? 'Back to Module' : 'Back to Course'}
            </button>

            <div style={{ background: '#ffffff', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', padding: '40px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '7px', background: getTypeTheme(activeBank.type).bg, color: getTypeTheme(activeBank.type).tagText, lineHeight: '1.2' }}>
                  {getTypeTheme(activeBank.type).label}
                </span>
                {activeBank.level && (
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '7px', background: '#F1F5F9', color: '#64748B', lineHeight: '1.2' }}>
                    {activeBank.level}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '28px', color: '#0F172A', margin: '0 0 20px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: '1.25' }}>
                {activeBank.lessonTitle || activeBank.title}
              </h2>

              {activeBank.lessonBody && (
                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <p style={{ margin: 0, color: '#334155', fontSize: '17px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {renderEmphasis(activeBank.lessonBody)}
                  </p>
                </div>
              )}

              {lessonExampleLines.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '12px' }}>Examples</div>
                  {lessonExampleLines.map((line: string, i: number) => (
                    <div key={i} style={{ borderLeft: '3px solid #C7D2FE', padding: '4px 0 4px 16px', marginBottom: '10px' }}>
                      <p style={{ margin: 0, color: '#475569', fontSize: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>{renderEmphasis(line)}</p>
                    </div>
                  ))}
                </div>
              )}

              {(activeBank.passage || activeBank.passageImage) && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '12px' }}>Reading Passage</div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px' }}>
                    {activeBank.passageImage && (
                      <img src={urlFor(activeBank.passageImage).url()} alt="Passage illustration" style={{ width: '100%', borderRadius: '12px', marginBottom: activeBank.passage ? '20px' : 0 }} />
                    )}
                    {activeBank.passage && (
                      <p style={{ margin: 0, color: '#334155', fontSize: '17px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
                        {renderEmphasis(activeBank.passage)}
                      </p>
                    )}
                    {activeBank.passageSource && (
                      <p style={{ margin: '16px 0 0', color: '#94A3B8', fontSize: '13px', fontWeight: '600', fontStyle: 'italic' }}>{activeBank.passageSource}</p>
                    )}
                  </div>
                </div>
              )}

              {activeItems.length > 0 ? (
                <button
                  onClick={handleStartPractice}
                  style={{ width: '100%', padding: '18px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '9999px', fontSize: '17px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  Start Practising · {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} <IconArrowRight />
                </button>
              ) : (
                <div style={{ padding: '20px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '16px', color: '#C2410C', fontSize: '15px', fontWeight: '600', textAlign: 'center' }}>
                  No items could be read from this bank yet. Check the Bulk Data in Sanity.
                </div>
              )}
            </div>
          </div>
        ) : isComplete ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ background: '#ECFDF5', padding: '24px', borderRadius: '50%' }}>
                <IconCheckCircle />
              </div>
            </div>
            <h2 style={{ fontSize: '32px', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>Practice Complete!</h2>
            {isGradable ? (
              <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '40px' }}>
                You scored <strong style={{ color: '#10B981', fontSize: '22px' }}>{score}</strong> out of <strong>{items.length}</strong>.
              </p>
            ) : (
              <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '40px' }}>
                You worked through all <strong style={{ color: '#4F46E5', fontSize: '22px' }}>{items.length}</strong> rewriting task{items.length !== 1 ? 's' : ''}. Well done!
              </p>
            )}

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleBackToList}
                style={{ padding: '16px 32px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '9999px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {selectedModule ? 'Back to Module' : 'Back to Course'}
              </button>
              <button
                onClick={handleStartPractice}
                style={{ padding: '16px 32px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '9999px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)' }}
              >
                Practise Again
              </button>
            </div>
            <p style={{ margin: '28px 0 0', color: '#94A3B8', fontSize: '13px', fontWeight: '600' }}>
              Progress saved on this device — no account needed.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => setShowExitModal(true)} style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <IconBack />
                Exit Practice
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {(activeBank.passage || activeBank.passageImage) && (
                  <button onClick={() => setShowPassageModal(true)} style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '9999px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                    <IconFileText />
                    Text
                  </button>
                )}
                <button onClick={() => setShowLessonModal(true)} style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '9999px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <IconBook />
                  Lesson
                </button>
                {isGradable && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', color: '#0F172A', padding: '10px 20px', borderRadius: '9999px', fontWeight: '700', border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', fontSize: '15px' }}>
                    Score: <span style={{ color: '#4F46E5' }}>{score}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>{activeBank.title}</span>
              <div style={{ color: '#94A3B8', fontSize: '15px', fontWeight: '600', marginTop: '8px' }}>
                Item {currentIndex + 1} of {items.length}
              </div>
            </div>

            <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '9999px', marginBottom: activeBank.practiceInstruction ? '24px' : '40px', overflow: 'hidden' }}>
              <div style={{ height: '8px', width: `${progressPercent}%`, background: '#4F46E5', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
            </div>

            {activeBank.practiceInstruction && (
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '16px', padding: '14px 20px', marginBottom: '32px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#3730A3', fontSize: '16px', fontWeight: '600', lineHeight: '1.6' }}>
                  {renderEmphasis(activeBank.practiceInstruction)}
                </p>
              </div>
            )}

            {currentItem && currentItem.kind === 'multipleChoice' && (
              <div>
                <h3 style={{ fontSize: '28px', color: '#0F172A', margin: '0 0 36px', lineHeight: '1.35', letterSpacing: '-0.5px', textAlign: 'center' }}>
                  {renderEmphasis(currentItem.question)}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['A', 'B', 'C'].map((key) => {
                    const optionText = currentItem.options[key as 'A' | 'B' | 'C'];
                    const isCorrect = key === currentItem.correct;
                    const isSelected = selectedAnswer === key;

                    let bgColor = '#ffffff';
                    let borderColor = '#F1F5F9';
                    let textColor = '#0F172A';

                    if (selectedAnswer) {
                      if (isCorrect) {
                        bgColor = '#ECFDF5'; borderColor = '#10B981'; textColor = '#065F46';
                      } else if (isSelected) {
                        bgColor = '#FEF2F2'; borderColor = '#EF4444'; textColor = '#991B1B';
                      } else {
                        bgColor = '#F8FAFC'; textColor = '#94A3B8'; borderColor = '#E2E8F0';
                      }
                    }

                    return (
                      <button
                        key={key}
                        disabled={!!selectedAnswer}
                        onClick={() => handleAnswerClick(key)}
                        style={{ width: '100%', padding: '24px', background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '24px', fontSize: '18px', fontWeight: '500', color: textColor, textAlign: 'left', cursor: selectedAnswer ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: selectedAnswer ? 'none' : '0 4px 15px rgba(0,0,0,0.03)' }}
                      >
                        <span style={{ background: selectedAnswer ? 'transparent' : '#F8FAFC', color: selectedAnswer ? textColor : '#64748B', border: selectedAnswer ? 'none' : '1px solid #E2E8F0', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>{key}</span>
                        {optionText}
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer && (
                  <div style={{ animation: 'fadeInDown 0.3s ease-out', marginTop: '32px', background: selectedAnswer === currentItem.correct ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${selectedAnswer === currentItem.correct ? '#A7F3D0' : '#FECACA'}`, padding: '32px', borderRadius: '28px' }}>
                    <h4 style={{ margin: '0 0 12px', color: selectedAnswer === currentItem.correct ? '#059669' : '#DC2626', fontSize: '20px', fontWeight: '700' }}>
                      {selectedAnswer === currentItem.correct ? 'Spot on!' : 'Not quite.'}
                    </h4>
                    <p style={{ margin: '0 0 32px', color: '#334155', fontSize: '18px', lineHeight: '1.7' }}>
                      {renderEmphasis(currentItem.explanation)}
                    </p>
                    <button
                      onClick={nextItem}
                      style={{ width: '100%', padding: '20px', background: selectedAnswer === currentItem.correct ? '#10B981' : '#EF4444', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedAnswer === currentItem.correct ? '0 10px 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                    >
                      {currentIndex + 1 < items.length ? 'Next Item' : 'Finish Practice'} <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '8px' }}><IconArrowRight /></span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentItem && currentItem.kind === 'gapFill' && (() => {
              const parts = currentItem.sentence.split('___');
              const gapClass = gapResult === 'correct' ? 'wl-gap-input wl-gap-correct' : gapResult === 'incorrect' ? 'wl-gap-input wl-gap-incorrect' : 'wl-gap-input';
              return (
                <div>
                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '40px 32px', boxShadow: '0 6px 20px -12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: '22px', color: '#0F172A', lineHeight: '2', margin: 0, fontWeight: '500' }}>
                      {parts.map((part, i) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < parts.length - 1 && (
                            <input
                              type="text"
                              className={gapClass}
                              value={gapInput}
                              disabled={gapResult !== null}
                              onChange={(e) => setGapInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleCheckGap(); }}
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              aria-label="Type the missing word"
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>

                  {gapResult === null && (
                    <button
                      onClick={handleCheckGap}
                      disabled={gapInput.trim() === ''}
                      style={{ width: '100%', marginTop: '24px', padding: '20px', background: gapInput.trim() === '' ? '#C7D2FE' : '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: gapInput.trim() === '' ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: gapInput.trim() === '' ? 'none' : '0 10px 20px -5px rgba(79,70,229,0.3)' }}
                    >
                      Check Answer
                    </button>
                  )}

                  {gapResult !== null && (
                    <div style={{ animation: 'fadeInDown 0.3s ease-out', marginTop: '32px', background: gapResult === 'correct' ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${gapResult === 'correct' ? '#A7F3D0' : '#FECACA'}`, padding: '32px', borderRadius: '28px' }}>
                      <h4 style={{ margin: '0 0 12px', color: gapResult === 'correct' ? '#059669' : '#DC2626', fontSize: '20px', fontWeight: '700' }}>
                        {gapResult === 'correct' ? 'Spot on!' : 'Not quite.'}
                      </h4>
                      {gapResult === 'incorrect' && (
                        <p style={{ margin: '0 0 12px', color: '#334155', fontSize: '18px', lineHeight: '1.7' }}>
                          The answer is <strong style={{ color: '#0F172A' }}>{currentItem.answers[0]}</strong>{currentItem.answers.length > 1 ? ` (also accepted: ${currentItem.answers.slice(1).join(', ')})` : ''}.
                        </p>
                      )}
                      {currentItem.why && (
                        <p style={{ margin: '0 0 32px', color: '#334155', fontSize: '18px', lineHeight: '1.7' }}>
                          {renderEmphasis(currentItem.why)}
                        </p>
                      )}
                      {!currentItem.why && <div style={{ marginBottom: '32px' }} />}
                      <button
                        onClick={nextItem}
                        style={{ width: '100%', padding: '20px', background: gapResult === 'correct' ? '#10B981' : '#EF4444', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: gapResult === 'correct' ? '0 10px 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                      >
                        {currentIndex + 1 < items.length ? 'Next Item' : 'Finish Practice'} <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '8px' }}><IconArrowRight /></span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {currentItem && currentItem.kind === 'trueFalseNG' && (
              <div>
                <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '36px 32px', boxShadow: '0 6px 20px -12px rgba(0,0,0,0.06)', textAlign: 'center', marginBottom: '28px' }}>
                  <p style={{ fontSize: '21px', color: '#0F172A', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
                    {renderEmphasis(currentItem.statement)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {(['T', 'F', 'NG'] as const).map((key) => {
                    const isCorrect = key === currentItem.answer;
                    const isSelected = selectedAnswer === key;
                    let bg = '#ffffff';
                    let border = '#F1F5F9';
                    let color = '#0F172A';
                    if (selectedAnswer) {
                      if (isCorrect) { bg = '#ECFDF5'; border = '#10B981'; color = '#065F46'; }
                      else if (isSelected) { bg = '#FEF2F2'; border = '#EF4444'; color = '#991B1B'; }
                      else { bg = '#F8FAFC'; border = '#E2E8F0'; color = '#94A3B8'; }
                    }
                    return (
                      <button
                        key={key}
                        disabled={!!selectedAnswer}
                        onClick={() => handleTFNGClick(key)}
                        style={{ flex: '1 1 140px', padding: '20px', background: bg, border: `2px solid ${border}`, borderRadius: '20px', fontSize: '17px', fontWeight: '700', color, cursor: selectedAnswer ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: selectedAnswer ? 'none' : '0 4px 15px rgba(0,0,0,0.03)' }}
                      >
                        {TFNG_LABELS[key]}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div style={{ animation: 'fadeInDown 0.3s ease-out', marginTop: '32px', background: selectedAnswer === currentItem.answer ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${selectedAnswer === currentItem.answer ? '#A7F3D0' : '#FECACA'}`, padding: '32px', borderRadius: '28px' }}>
                    <h4 style={{ margin: '0 0 12px', color: selectedAnswer === currentItem.answer ? '#059669' : '#DC2626', fontSize: '20px', fontWeight: '700' }}>
                      {selectedAnswer === currentItem.answer ? 'Spot on!' : 'Not quite.'}
                    </h4>
                    {selectedAnswer !== currentItem.answer && (
                      <p style={{ margin: '0 0 12px', color: '#334155', fontSize: '18px', lineHeight: '1.7' }}>
                        The answer is <strong style={{ color: '#0F172A' }}>{TFNG_LABELS[currentItem.answer]}</strong>.
                      </p>
                    )}
                    {currentItem.why && (
                      <p style={{ margin: '0 0 32px', color: '#334155', fontSize: '18px', lineHeight: '1.7' }}>
                        {renderEmphasis(currentItem.why)}
                      </p>
                    )}
                    {!currentItem.why && <div style={{ marginBottom: '32px' }} />}
                    <button
                      onClick={nextItem}
                      style={{ width: '100%', padding: '20px', background: selectedAnswer === currentItem.answer ? '#10B981' : '#EF4444', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedAnswer === currentItem.answer ? '0 10px 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                    >
                      {currentIndex + 1 < items.length ? 'Next Item' : 'Finish Practice'} <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '8px' }}><IconArrowRight /></span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentItem && currentItem.kind === 'combine' && (
              <div>
                <h3 style={{ fontSize: '24px', color: '#0F172A', margin: '0 0 24px', lineHeight: '1.4', letterSpacing: '-0.3px', textAlign: 'center' }}>
                  {currentItem.instruction}
                </h3>

                <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '28px 32px', boxShadow: '0 6px 20px -12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                  <p style={{ fontSize: '20px', color: '#334155', lineHeight: '1.8', margin: 0, fontStyle: 'italic' }}>
                    {currentItem.given}
                  </p>
                </div>

                <textarea
                  className="wl-combine-textarea"
                  placeholder="Type your version here (optional), then reveal the model answer..."
                  value={combineAttempt}
                  disabled={modelRevealed}
                  onChange={(e) => setCombineAttempt(e.target.value)}
                />

                {!modelRevealed && (
                  <button
                    onClick={() => setModelRevealed(true)}
                    style={{ width: '100%', marginTop: '20px', padding: '20px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <IconEye /> Show Model Answer
                  </button>
                )}

                {modelRevealed && (
                  <div style={{ animation: 'fadeInDown 0.3s ease-out', marginTop: '28px', background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '32px', borderRadius: '28px' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#4F46E5', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Model Answer
                    </h4>
                    <p style={{ margin: '0 0 20px', color: '#0F172A', fontSize: '20px', lineHeight: '1.7', fontWeight: '600' }}>
                      {renderEmphasis(currentItem.model)}
                    </p>
                    {currentItem.hint && (
                      <p style={{ margin: '0 0 28px', color: '#475569', fontSize: '16px', lineHeight: '1.7' }}>
                        {renderEmphasis(currentItem.hint)}
                      </p>
                    )}
                    {combineAttempt.trim() !== '' && (
                      <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', marginBottom: '28px', textAlign: 'left' }}>
                        <div style={{ color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '6px' }}>Your Version</div>
                        <p style={{ margin: 0, color: '#334155', fontSize: '17px', lineHeight: '1.6' }}>{combineAttempt}</p>
                      </div>
                    )}
                    <button
                      onClick={nextItem}
                      style={{ width: '100%', padding: '20px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)' }}
                    >
                      {currentIndex + 1 < items.length ? 'Next Item' : 'Finish Practice'} <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '8px' }}><IconArrowRight /></span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {showLessonModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowLessonModal(false)}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto', padding: '40px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)', animation: 'fadeInDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                  <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#0F172A', fontWeight: '700', letterSpacing: '-0.5px' }}>
                    {activeBank.lessonTitle || activeBank.title}
                  </h2>
                  {activeBank.lessonBody && (
                    <p style={{ margin: '0 0 24px', color: '#334155', fontSize: '17px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {renderEmphasis(activeBank.lessonBody)}
                    </p>
                  )}
                  {lessonExampleLines.length > 0 && (
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{ color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '12px' }}>Examples</div>
                      {lessonExampleLines.map((line: string, i: number) => (
                        <div key={i} style={{ borderLeft: '3px solid #C7D2FE', padding: '4px 0 4px 16px', marginBottom: '10px' }}>
                          <p style={{ margin: 0, color: '#475569', fontSize: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>{renderEmphasis(line)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setShowLessonModal(false)}
                    style={{ background: '#4F46E5', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '17px', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)' }}
                  >
                    Back to Practice
                  </button>
                </div>
              </div>
            )}

            {showPassageModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowPassageModal(false)}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '620px', maxHeight: '85vh', overflowY: 'auto', padding: '40px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)', animation: 'fadeInDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                  <div style={{ color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '16px' }}>Reading Passage</div>
                  {activeBank.passageImage && (
                    <img src={urlFor(activeBank.passageImage).url()} alt="Passage illustration" style={{ width: '100%', borderRadius: '12px', marginBottom: activeBank.passage ? '20px' : 0 }} />
                  )}
                  {activeBank.passage && (
                    <p style={{ margin: 0, color: '#334155', fontSize: '17px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
                      {renderEmphasis(activeBank.passage)}
                    </p>
                  )}
                  {activeBank.passageSource && (
                    <p style={{ margin: '16px 0 0', color: '#94A3B8', fontSize: '13px', fontWeight: '600', fontStyle: 'italic' }}>{activeBank.passageSource}</p>
                  )}
                  <button
                    onClick={() => setShowPassageModal(false)}
                    style={{ background: '#4F46E5', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '17px', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)', marginTop: '28px' }}
                  >
                    Back to Practice
                  </button>
                </div>
              </div>
            )}

            {showExitModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowExitModal(false)}>
                <div className="responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '450px', padding: '40px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)', textAlign: 'center', animation: 'fadeInDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                  <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                    <IconAlert />
                  </div>
                  <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#0F172A', fontWeight: '700', letterSpacing: '-0.5px' }}>Exit Practice?</h2>
                  <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '32px', lineHeight: '1.6' }}>Are you sure you want to leave? Your current progress will be lost.</p>
                  <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                    <button
                      onClick={() => setShowExitModal(false)}
                      style={{ background: '#F8FAFC', color: '#475569', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '18px', width: '100%', transition: 'all 0.2s' }}
                    >
                      Resume Practice
                    </button>
                    <button
                      onClick={handleBackToList}
                      style={{ background: '#EF4444', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '18px', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                    >
                      Yes, Exit Practice
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
};