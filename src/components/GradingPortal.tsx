import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { draftHasContent, INSIGHT_SKILLS, computeInsights, insightsForAI, studentSkillWord, buildProgressEmailText, buildTermReviewEmailText, FEEDBACK_TIPS_KEY, DEFAULT_TIPS } from './gradingHelpers';
import { TermSummaryCard } from './TermSummaryCard';
import { PerformanceInsightsCard } from './PerformanceInsightsCard';
import { PreviousRecordsCard } from './PreviousRecordsCard';
import { getSupabaseClient } from '../supabaseClient';
import { generateStudentFeedback } from '../aiGenerator';
import { client } from '../sanityClient'; 
import { ActivityGenerator } from './ActivityGenerator';
import { ExamMode } from './ExamMode';

const IconMail      = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>);
const IconTrash     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const IconRefresh   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 0 20.49 15"></path></svg>);
const IconUsers     = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const IconSend      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);
const IconReply     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>);
const IconChart     = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>);
const IconEdit      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const IconPaperclip = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>);
const IconPlay      = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const IconTrophy    = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10M5 4h14v4a7 7 0 01-14 0V4z"></path></svg>);
const IconSwords    = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline><line x1="5" y1="14" x2="9" y2="18"></line><line x1="7" y1="17" x2="4" y2="20"></line><line x1="3" y1="19" x2="5" y2="21"></line></svg>);
const IconCrown     = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="2 16 5 4 12 9 19 4 22 16 2 16"></polygon><line x1="2" y1="20" x2="22" y2="20"></line></svg>);
const IconHourglass = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>);
const IconInfinity  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"></path></svg>);
const IconSparkles  = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path></svg>);
const IconClipboard = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>);
const IconArchive   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>);
const IconRestore   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M4 9h11a5 5 0 0 1 0 10h-5"></path></svg>);

// Format a duration stored in seconds as "Xm YYs" (or "Ys" under a minute).
// e.g. 90 -> "1m 30s", 65 -> "1m 05s", 45 -> "45s". The stored value keeps its
// decimal for tie-breaking; we only round for display here.
const formatTime = (totalSeconds: any): string => {
  if (totalSeconds == null || isNaN(Number(totalSeconds))) return '0s';
  const s = Math.round(Number(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${String(rem).padStart(2, '0')}s` : `${rem}s`;
};

export const GradingPortal: React.FC<{
  students:any[]; setStudents:React.Dispatch<React.SetStateAction<any[]>>;
  fetchStudents:()=>Promise<void>; showToast:(t:string,ty:'success'|'error')=>void;
}> = ({ students, setStudents, fetchStudents, showToast }) => {
  const { getToken } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<{type:'student';id:string;name:string}|{type:'record';id:string}|null>(null);
  const [allGrades, setAllGrades]         = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any|null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [gradingSearchQuery, setGradingSearchQuery] = useState('');
  const [gradingFilterLevel, setGradingFilterLevel] = useState('All Levels');
  const [gradingFilterTime, setGradingFilterTime]   = useState('All Times');
  const [gradingRosterMode, setGradingRosterMode] = useState<'directory'|'archived'|'manual'>('directory');
  const [manualName, setManualName]       = useState('');
  const [manualEmail, setManualEmail]     = useState('');
  const [manualLevel, setManualLevel]     = useState('Level 1');
  const [manualTime, setManualTime]       = useState('Morning Class');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName]   = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfileLevel, setEditProfileLevel] = useState('');
  const [editProfileTime, setEditProfileTime]   = useState('');
  const [isSavingProfile, setIsSavingProfile]   = useState(false);
  const [draftVersion, setDraftVersion] = useState(0);
  const [assessmentName, setAssessmentName]     = useState('First Test');
  const [assessmentWeight, setAssessmentWeight] = useState('10');
  const [maxPoints, setMaxPoints]               = useState('50');
  const [isAbsent, setIsAbsent]                 = useState(false);
  const [notApplicable, setNotApplicable]       = useState(false);
  const [scoreListening, setScoreListening]     = useState('');
  const [scoreGrammar, setScoreGrammar]         = useState('');
  const [scoreReading, setScoreReading]         = useState('');
  const [scoreWriting, setScoreWriting]         = useState('');
  const [scoreSpeaking, setScoreSpeaking]       = useState('');
  const [teacherNotes, setTeacherNotes]         = useState('');
  const [feedback, setFeedback]                 = useState('');
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [isGenerating, setIsGenerating]         = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [pendingSendRecord, setPendingSendRecord] = useState<any>(null);
  const [showPrevRecords, setShowPrevRecords] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [builderOpen, setBuilderOpen]       = useState(false);
  const [builderEditing, setBuilderEditing] = useState(false);
  const [builderUseOpening, setBuilderUseOpening] = useState(true);
  const [builderUseClosing, setBuilderUseClosing] = useState(true);
  const [builderStrengths, setBuilderStrengths]   = useState<Set<string>>(new Set());
  const [builderTipsSel, setBuilderTipsSel]       = useState<Set<string>>(new Set());
  const [builderExpanded, setBuilderExpanded]     = useState<Set<string>>(new Set());
  const [editingRecordId, setEditingRecordId]   = useState<string|null>(null);
  const [editScoreText, setEditScoreText]       = useState('');
  const [editFeedbackText, setEditFeedbackText] = useState('');
  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);
  const [feedbackTips, setFeedbackTips] = useState<Record<string,string[]>>(() => {
    try { const r = localStorage.getItem(FEEDBACK_TIPS_KEY); if (r) return { ...DEFAULT_TIPS, ...JSON.parse(r) }; } catch {}
    return DEFAULT_TIPS;
  });
  useEffect(() => { fetchAllGrades(); }, []);
  useEffect(() => {
    // Clear the previous student's marks whenever we switch students, so each
    // student starts with a clean score form. Assessment name / weight / max
    // points are intentionally KEPT — you grade the same test across the roster.
    setIsAbsent(false);
    setNotApplicable(false);
    setShowPrevRecords(false);
    setShowInsights(false);
    setScoreListening(''); setScoreGrammar(''); setScoreReading(''); setScoreWriting(''); setScoreSpeaking('');
    setTeacherNotes(''); setFeedback('');

    if (selectedStudent) { fetchStudentHistory(selectedStudent.id); setIsEditingProfile(false); }
    else setStudentHistory([]);
    setEditingRecordId(null);
  }, [selectedStudent]);

  const skipAutoDefaults = useRef(false);
  useEffect(() => {
    if (skipAutoDefaults.current) { skipAutoDefaults.current = false; return; }
    switch (assessmentName) {
      case 'First Test': setAssessmentWeight('10'); setMaxPoints('50'); break;
      case 'Midterm':    setAssessmentWeight('30'); setMaxPoints('100'); break;
      case 'Third Test': setAssessmentWeight('10'); setMaxPoints('100'); break;
      case 'Final Test': setAssessmentWeight('50'); setMaxPoints('100'); break;
    }
  }, [assessmentName]);

  const gradingFilteredStudents = useMemo(() => students.filter(s => {
    // Active views show non-archived students; the Archived view shows only archived ones.
    // (Students with no is_archived value yet are treated as active.)
    const matchesArchive = gradingRosterMode==='archived' ? s.is_archived===true : s.is_archived!==true;
    const ms = (s.full_name||'').toLowerCase().includes(gradingSearchQuery.toLowerCase()) || (s.email||'').toLowerCase().includes(gradingSearchQuery.toLowerCase());
    return matchesArchive && ms && (gradingFilterLevel==='All Levels'||s.course_level===gradingFilterLevel) && (gradingFilterTime==='All Times'||s.class_time===gradingFilterTime);
  }), [students, gradingSearchQuery, gradingFilterLevel, gradingFilterTime, gradingRosterMode]);

  // Focus mode: full-width single-student workspace with directory hidden.
  const focused = focusMode && !!selectedStudent;
  const gradingIdx = selectedStudent ? gradingFilteredStudents.findIndex(s=>s.id===selectedStudent.id) : -1;
  const goPrevStudent = () => { if (gradingIdx>0) setSelectedStudent(gradingFilteredStudents[gradingIdx-1]); };
  const goNextStudent = () => { if (gradingIdx>=0 && gradingIdx<gradingFilteredStudents.length-1) setSelectedStudent(gradingFilteredStudents[gradingIdx+1]); };

  // Weight-independent performance trend for the currently selected student.
  const insights = useMemo(() => computeInsights(studentHistory), [studentHistory]);

  // Same trend, but including the test currently being drafted — used for the email
  // and its preview so the student sees their record *after* this grade.
  const projectedInsights = useMemo(() => {
    if (!selectedStudent) return null;
    if (notApplicable) return computeInsights(studentHistory);
    if (studentHistory.some((h:any)=>h.assessment_name===assessmentName)) return computeInsights(studentHistory);
    const tp = isAbsent ? 0 : (Number(scoreListening)||0)+(Number(scoreGrammar)||0)+(Number(scoreReading)||0)+(Number(scoreWriting)||0)+(Number(scoreSpeaking)||0);
    const synthetic = {
      assessment_name: assessmentName,
      date_recorded: new Date().toISOString(),
      score: JSON.stringify({ maxPoints, isAbsent, listening:Number(scoreListening)||0, grammar:Number(scoreGrammar)||0, reading:Number(scoreReading)||0, writing:Number(scoreWriting)||0, speaking:Number(scoreSpeaking)||0, totalPoints: tp }),
    };
    return computeInsights([synthetic, ...studentHistory]);
  }, [selectedStudent, studentHistory, assessmentName, maxPoints, isAbsent, notApplicable, scoreListening, scoreGrammar, scoreReading, scoreWriting, scoreSpeaking]);

  // Term-at-a-glance: each test's status + the cumulative grade so far.
  // Grade so far = earned weight of tests taken / weight of tests taken (N/A excluded) × 100.
  // Absent counts as 0 earned but fills its slice of the denominator; N/A drops out entirely.
  const termSummary = useMemo(() => {
    const CANON = ['First Test','Midterm','Third Test','Final Test'];
    const tests = CANON.map(name => {
      const rec = studentHistory.find((h:any)=>h.assessment_name===name);
      if (!rec) return { name, status:'pending' as const };
      let p:any={}; try{p=JSON.parse(rec.score)||{};}catch{}
      const weight = Number(p.weight)||0;
      if (p.notApplicable) return { name, status:'na' as const, weight };
      const maxP = Number(p.maxPoints)||0;
      const totalP = Number(p.totalPoints)||0;
      const earnedWeight = p.isAbsent ? 0 : (p.earnedWeight!=null ? Number(p.earnedWeight) : (maxP? (totalP/maxP)*weight : 0));
      const mastery = p.isAbsent ? 0 : (maxP? (totalP/maxP)*100 : 0);
      return { name, status: (p.isAbsent?'absent':'graded') as const, weight, mastery, earnedWeight };
    });
    const taken = tests.filter((t:any)=>t.status==='graded'||t.status==='absent');
    const assessedWeight = taken.reduce((s:number,t:any)=>s+(t.weight||0),0);
    const earnedSum = taken.reduce((s:number,t:any)=>s+(t.earnedWeight||0),0);
    const standing = assessedWeight>0 ? (earnedSum/assessedWeight)*100 : null;
    const allDone = tests.filter((t:any)=>t.status!=='na').every((t:any)=>t.status!=='pending') && taken.length>0;
    return { tests, takenCount: taken.length, assessedWeight, earnedSum, standing, allDone };
  }, [studentHistory]);

  // Strength/focus for the Quick feedback builder, based ONLY on the test currently
  // being graded (not the trend) — feedback should reflect how they did this time.
  const currentTestSignal = useMemo(() => {
    if (!selectedStudent || isAbsent || notApplicable) return null;
    const per = Number(maxPoints) / 5;
    if (!per) return null;
    const raws: any = { listening: scoreListening, grammar: scoreGrammar, reading: scoreReading, writing: scoreWriting, speaking: scoreSpeaking };
    const skills = INSIGHT_SKILLS.map(sk => ({ ...sk, pct: Math.round(((Number(raws[sk.key])||0) / per) * 100) }));
    if (!skills.some(s => s.pct > 0)) return null; // no scores entered yet
    const strongKeys = new Set(skills.filter(s => s.pct >= 80).map(s => s.key));
    const low = skills.filter(s => s.pct < 70);
    const focusKeys = new Set<string>();
    if (low.length) low.forEach(s => focusKeys.add(s.key));
    else { const weakest = skills.reduce((m,s)=>s.pct<m.pct?s:m, skills[0]); if (weakest.pct < 80) focusKeys.add(weakest.key); }
    return { skills, strongKeys, focusKeys };
  }, [selectedStudent, isAbsent, notApplicable, maxPoints, scoreListening, scoreGrammar, scoreReading, scoreWriting, scoreSpeaking]);

  const formatScoreDisplay = (score: any): string => {
    try {
      const parsed = typeof score === 'string' ? JSON.parse(score) : score;
      if (typeof parsed === 'object' && parsed !== null && 'listening' in parsed) {
        const pps = Number(parsed.maxPoints) / 5;
        if (parsed.notApplicable) {
          return `Status: NOT APPLICABLE — excluded from grade & trend\nThis test did not apply to the student (enrolled later).`;
        }
        if (parsed.isAbsent) {
          return `Weight: ${parsed.weight}%\nMax Points: ${parsed.maxPoints}\nStatus: ABSENT (0%)\nEarned Weight Contribution: 0.0% / ${parsed.weight}%`;
        }
        return `Weight: ${parsed.weight}%\nMax Points: ${parsed.maxPoints}\nTotal Raw Score: ${parsed.totalPoints}/${parsed.maxPoints}\nEarned Weight Contribution: ${Number(parsed.earnedWeight).toFixed(1)}% / ${parsed.weight}%\n\nSkill Breakdown:\nListening: ${parsed.listening||0}/${pps}\nGrammar & Vocab: ${parsed.grammar||0}/${pps}\nReading: ${parsed.reading||0}/${pps}\nWriting: ${parsed.writing||0}/${pps}\nSpeaking: ${parsed.speaking||0}/${pps}`;
      }
    } catch {}
    // Fallback: return as-is for old plain-text records
    return typeof score === 'string' ? score : JSON.stringify(score);
  };

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchAllGrades = async () => {
    const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
    const {data} = await supabase.from('student_grades').select('*').order('created_at',{ascending:false});
    if (data) setAllGrades(data);
  };
  const fetchStudentHistory = async (id:string) => {
    const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
    const {data} = await supabase.from('student_grades').select('*').eq('user_id',id).order('created_at',{ascending:false});
    if (data) setStudentHistory(data);
  };

  // ── Draft management (localStorage only) ──────────────────────────────────
  const makeDraftKey = (sid:string, aName:string) => `ll_draft_${sid}_${aName}`;

  const handleSaveDraft = () => {
    if (!selectedStudent) return;
    const draft = { isAbsent, scoreListening, scoreGrammar, scoreReading, scoreWriting, scoreSpeaking, teacherNotes, savedAt: new Date().toISOString() };
    localStorage.setItem(makeDraftKey(selectedStudent.id, assessmentName), JSON.stringify(draft));
    bumpDraft();
    showToast(`✅ Scores saved for ${selectedStudent.full_name}!`, 'success');
  };

  const handleLoadDraft = (draft:any) => {
    setIsAbsent(draft.isAbsent || false);
    setScoreListening(draft.scoreListening || '');
    setScoreGrammar(draft.scoreGrammar   || '');
    setScoreReading(draft.scoreReading   || '');
    setScoreWriting(draft.scoreWriting   || '');
    setScoreSpeaking(draft.scoreSpeaking || '');
    setTeacherNotes(draft.teacherNotes   || '');
    showToast('Draft scores loaded!', 'success');
  };

  const handleDiscardDraft = () => {
    if (!selectedStudent) return;
    localStorage.removeItem(makeDraftKey(selectedStudent.id, assessmentName));
    bumpDraft();
    showToast('Draft discarded.', 'success');
  };

  const clearDraftAfterSubmit = () => {
    if (!selectedStudent) return;
    ['First Test','Midterm','Third Test','Final Test'].forEach(a => {
      localStorage.removeItem(makeDraftKey(selectedStudent.id, a));
    });
    bumpDraft();
  };

  // ── Delete (inbox + students + records) ───────────────────────────────────
  const handleAddStudentToRoster = async () => {
    if (!manualName.trim()||!manualEmail.trim()){showToast('Please enter Name and Email.','error');return;}
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {data,error} = await supabase.from('profiles').insert([{id:crypto.randomUUID(),full_name:manualName,email:manualEmail,is_admin:false,is_manual:true,course_level:manualLevel,class_time:manualTime}]).select().single();
      if (error) throw error;
      showToast(`${manualName} added!`,'success');
      setStudents(prev=>[...prev,data].sort((a,b)=>a.full_name.localeCompare(b.full_name)));
      setGradingRosterMode('directory'); setManualName(''); setManualEmail('');
    } catch {showToast('Failed to add student.','error');}
  };

  // ── Archive / Restore (non-destructive; hides from Grading Portal only) ─────
  // Optimistic: we flip is_archived in local state immediately, then persist.
  // If the DB write fails, we revert the local change so the UI stays honest.
  const handleArchiveStudent = async (id:string, name:string) => {
    if (selectedStudent?.id===id) setSelectedStudent(null); // archived student leaves the active list
    setStudents(prev=>prev.map(s=>s.id===id?{...s,is_archived:true}:s));
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {error} = await supabase.from('profiles').update({is_archived:true}).eq('id',id);
      if (error) throw error;
      showToast(`${name} archived.`,'success');
    } catch {
      setStudents(prev=>prev.map(s=>s.id===id?{...s,is_archived:false}:s)); // revert
      showToast('Failed to archive student.','error');
    }
  };

  const handleRestoreStudent = async (id:string, name:string) => {
    setStudents(prev=>prev.map(s=>s.id===id?{...s,is_archived:false}:s));
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {error} = await supabase.from('profiles').update({is_archived:false}).eq('id',id);
      if (error) throw error;
      showToast(`${name} restored to active.`,'success');
    } catch {
      setStudents(prev=>prev.map(s=>s.id===id?{...s,is_archived:true}:s)); // revert
      showToast('Failed to restore student.','error');
    }
  };

  const handleOpenProfileEditor = () => {
    if (!selectedStudent) return;
    setEditProfileName(selectedStudent.full_name||''); setEditProfileEmail(selectedStudent.email||'');
    setEditProfileLevel(selectedStudent.course_level||'Level 1'); setEditProfileTime(selectedStudent.class_time||'Morning Class');
    setIsEditingProfile(true);
  };

  const handleSaveProfileUpdate = async () => {
    if (!selectedStudent||!editProfileName.trim()||!editProfileEmail.trim()){showToast('Name and Email required.','error');return;}
    setIsSavingProfile(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {data,error} = await supabase.from('profiles').update({full_name:editProfileName,email:editProfileEmail,course_level:editProfileLevel,class_time:editProfileTime}).eq('id',selectedStudent.id).select().single();
      if (error) throw error;
      setStudents(prev=>prev.map(s=>s.id===selectedStudent.id?data:s)); setSelectedStudent(data); setIsEditingProfile(false);
      showToast('Profile updated.','success');
    } catch {showToast('Failed to update.','error');} finally {setIsSavingProfile(false);}
  };

  // ── Record management ─────────────────────────────────────────────────────
  // CHANGE 1: No more window.confirm — triggers the custom modal instead
  const handleDeleteRecord = (recordId:string) => {
    setDeleteTarget({type:'record', id:recordId});
  };

  // Loads a saved record back into the main grading panel so it can be edited
  // with the full tools (score fields, Quick builder, AI). Saving updates it.
  const loadRecordToForm = (rec:any) => {
    let p:any={}; try{p=JSON.parse(rec.score)||{};}catch{}
    if (rec.assessment_name !== assessmentName) skipAutoDefaults.current = true;
    setAssessmentName(rec.assessment_name);
    setAssessmentWeight(String(p.weight??'10'));
    setMaxPoints(String(p.maxPoints??'50'));
    setIsAbsent(!!p.isAbsent);
    setNotApplicable(!!p.notApplicable);
    setScoreListening(p.notApplicable||p.isAbsent?'':String(p.listening??''));
    setScoreGrammar(p.notApplicable||p.isAbsent?'':String(p.grammar??''));
    setScoreReading(p.notApplicable||p.isAbsent?'':String(p.reading??''));
    setScoreWriting(p.notApplicable||p.isAbsent?'':String(p.writing??''));
    setScoreSpeaking(p.notApplicable||p.isAbsent?'':String(p.speaking??''));
    setFeedback(rec.feedback||'');
    setBuilderOpen(false);
    setEditingRecordId(rec.id);
    if (typeof window!=='undefined') window.scrollTo({top:0,behavior:'smooth'});
  };
  const cancelEdit = () => {
    setEditingRecordId(null);
    setIsAbsent(false); setNotApplicable(false);
    setScoreListening(''); setScoreGrammar(''); setScoreReading(''); setScoreWriting(''); setScoreSpeaking('');
    setFeedback(''); setBuilderOpen(false);
  };
  // Saves edits from the main form back onto the existing record (keeps its
  // emailed/unsent state). No email is sent here — use Send afterward if needed.
  const handleSaveRecordUpdate = async (recordId:string) => {
    setIsUpdatingRecord(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const prev = studentHistory.find(h=>h.id===recordId);
      let pPrev:any={}; try{pPrev=JSON.parse(prev?.score||'{}')||{};}catch{}
      const wasEmailed = pPrev.emailed !== false; // preserve sent/unsent state
      const { totalPoints, earnedWeight } = calculateTotals();
      const scoreJson = JSON.stringify(
        notApplicable
          ? { weight: assessmentWeight, maxPoints, notApplicable: true, isAbsent: false, emailed: wasEmailed, listening:0, grammar:0, reading:0, writing:0, speaking:0, totalPoints:0, earnedWeight:0 }
          : isAbsent
          ? { weight: assessmentWeight, maxPoints, isAbsent: true, emailed: wasEmailed, listening:0, grammar:0, reading:0, writing:0, speaking:0, totalPoints:0, earnedWeight:0 }
          : { weight: assessmentWeight, maxPoints, isAbsent: false, emailed: wasEmailed, listening: Number(scoreListening)||0, grammar: Number(scoreGrammar)||0, reading: Number(scoreReading)||0, writing: Number(scoreWriting)||0, speaking: Number(scoreSpeaking)||0, totalPoints, earnedWeight }
      );
      const {data,error} = await supabase.from('student_grades').update({score:scoreJson,feedback}).eq('id',recordId).select().single();
      if (error) throw error;
      setAllGrades(prev=>prev.map(g=>g.id===recordId?data:g)); setStudentHistory(prev=>prev.map(g=>g.id===recordId?data:g));
      cancelEdit();
      showToast('Record updated.','success');
    } catch {showToast('Failed to update.','error');} finally {setIsUpdatingRecord(false);}
  };

  // ── Grading & math ────────────────────────────────────────────────────────
  const calculateTotals = () => {
    if (isAbsent || notApplicable) return {totalPoints:0, earnedWeight:0};
    const tp = (Number(scoreListening)||0)+(Number(scoreGrammar)||0)+(Number(scoreReading)||0)+(Number(scoreWriting)||0)+(Number(scoreSpeaking)||0);
    return {totalPoints:tp, earnedWeight:(tp/Number(maxPoints))*Number(assessmentWeight)};
  };

  // Projected term grade including the scores currently on the form — the saved
  // termSummary can't see them until the record is stored. Same policy as
  // termSummary.standing: rescale to tests taken, absent earns 0, N/A drops out.
  const projectedStanding = () => {
    const { earnedWeight } = calculateTotals();
    let earned = 0, assessed = 0;
    termSummary.tests.forEach((t:any) => {
      if (t.name === assessmentName) return; // superseded by the live form values
      if (t.status === 'graded' || t.status === 'absent') { earned += t.earnedWeight || 0; assessed += t.weight || 0; }
    });
    if (!notApplicable) { earned += isAbsent ? 0 : earnedWeight; assessed += Number(assessmentWeight) || 0; }
    return assessed > 0 ? (earned / assessed) * 100 : null;
  };

  const getFormattedScores = () => {
    const {totalPoints,earnedWeight} = calculateTotals();
    const pps = Number(maxPoints)/5;
    if (isAbsent) return `Weight: ${assessmentWeight}%\nMax Points: ${maxPoints}\nStatus: ABSENT (0%)\nEarned Weight Contribution: 0.0% / ${assessmentWeight}%`;
    return `Weight: ${assessmentWeight}%\nMax Points: ${maxPoints}\nTotal Raw Score: ${totalPoints}/${maxPoints}\nEarned Weight Contribution: ${earnedWeight.toFixed(1)}% / ${assessmentWeight}%\n\nSkill Breakdown:\nListening: ${scoreListening||0}/${pps}\nGrammar & Vocab: ${scoreGrammar||0}/${pps}\nReading: ${scoreReading||0}/${pps}\nWriting: ${scoreWriting||0}/${pps}\nSpeaking: ${scoreSpeaking||0}/${pps}`;
  };

  const handleGenerateFeedback = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    const pm = "Please vary vocabulary and structure. Do not use 'I was particularly impressed'. Be specific about scores.";
    const draft = await generateStudentFeedback(selectedStudent.full_name, assessmentName, getFormattedScores(), teacherNotes+'\n\n'+pm+insightsForAI(insights, assessmentName === 'Final Test'));
    setFeedback(draft); setIsGenerating(false);
  };

  // ── Quick feedback builder ──
  const saveFeedbackTips = (next: Record<string,string[]>) => {
    setFeedbackTips(next);
    try { localStorage.setItem(FEEDBACK_TIPS_KEY, JSON.stringify(next)); } catch {}
  };
  const openBuilder = () => {
    const sig = currentTestSignal;
    setBuilderStrengths(new Set(sig ? [...sig.strongKeys] : []));
    setBuilderExpanded(new Set(sig ? [...sig.focusKeys] : []));
    setBuilderTipsSel(new Set());
    setBuilderUseOpening(true);
    setBuilderUseClosing(true);
    setBuilderEditing(false);
    setBuilderOpen(true);
  };
  const buildFeedbackText = () => {
    const parts: string[] = [];
    const first = (selectedStudent?.full_name||'').split(' ')[0] || selectedStudent?.full_name || 'there';
    const { totalPoints } = calculateTotals();
    const listJoin = (arr:string[]) => arr.length===1 ? arr[0] : arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1];

    if (builderUseOpening) parts.push(`Hi ${first}, you scored ${totalPoints}/${maxPoints} on your ${assessmentName}.`);

    const strongLabels = INSIGHT_SKILLS.filter(s=>builderStrengths.has(s.key)).map(s=>s.label.toLowerCase());
    if (strongLabels.length) {
      const joined = strongLabels.length===1 ? strongLabels[0] : strongLabels.slice(0,-1).join(', ')+' and '+strongLabels[strongLabels.length-1];
      parts.push(strongLabels.length===1 ? `Your ${joined} was a real strength this time — well done.` : `Your ${joined} were real strengths this time — well done.`);
    }

    const groups = INSIGHT_SKILLS
      .map(sk => ({ label: sk.label.toLowerCase(), tips: (feedbackTips[sk.key]||[]).filter(t=>builderTipsSel.has(`${sk.key}::${t}`)) }))
      .filter(g => g.tips.length);
    if (groups.length === 1) {
      parts.push(`To keep improving your ${groups[0].label}, ${listJoin(groups[0].tips)}.`);
    } else if (groups.length > 1) {
      const clauses = groups.map(g => `for ${g.label}, ${listJoin(g.tips)}`);
      parts.push(`Going forward, here are a few things to focus on: ${clauses.slice(0,-1).join('; ')}; and ${clauses[clauses.length-1]}.`);
    }

    if (builderUseClosing) parts.push(`Keep up the good work, and let me know if you'd like extra practice on any of this.`);
    setFeedback(parts.join(' '));
    setBuilderOpen(false);
  };
  const toggleSet = (setter:any, value:string) => setter((prev:Set<string>)=>{ const n=new Set(prev); n.has(value)?n.delete(value):n.add(value); return n; });
  const removeTip = (skill:string, i:number) => saveFeedbackTips({...feedbackTips,[skill]:(feedbackTips[skill]||[]).filter((_,j)=>j!==i)});
  const resetTips = () => saveFeedbackTips({...DEFAULT_TIPS});
  const editTip   = (skill:string, i:number, text:string) => { const arr=[...(feedbackTips[skill]||[])]; arr[i]=text; saveFeedbackTips({...feedbackTips,[skill]:arr}); };
  const addTip    = (skill:string) => saveFeedbackTips({...feedbackTips,[skill]:[...(feedbackTips[skill]||[]),'']});

  // Records a test as "Not applicable" for this student (enrolled later): no scores,
  // no email, excluded from grade and trend. Stored via a flag in the score JSON.
  const recordNotApplicable = async () => {
    if (!selectedStudent||!assessmentName) return;
    setIsSubmitting(true);
    const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
    const scoreJson = JSON.stringify({ weight: assessmentWeight, maxPoints, notApplicable: true, isAbsent: false, listening: 0, grammar: 0, reading: 0, writing: 0, speaking: 0, totalPoints: 0, earnedWeight: 0 });
    const {data:inserted,error} = await supabase.from('student_grades').insert([{user_id:selectedStudent.id,assessment_name:assessmentName,score:scoreJson,feedback:'',date_recorded:new Date().toISOString()}]).select().single();
    if (error){setIsSubmitting(false);showToast(`DB Error: ${error.message}`,'error');return;}
    if (inserted){setAllGrades(prev=>[inserted,...prev]);setStudentHistory(prev=>[inserted,...prev]);}
    showToast(`${assessmentName} marked not applicable for ${selectedStudent.full_name}.`,'success');
    setIsSubmitting(false);
    clearDraftAfterSubmit();
    setAssessmentName('First Test');setAssessmentWeight('10');setMaxPoints('50');setIsAbsent(false);setNotApplicable(false);
    setScoreListening('');setScoreGrammar('');setScoreReading('');setScoreWriting('');setScoreSpeaking('');setTeacherNotes('');setFeedback('');
  };

  // Saves the grade to the database WITHOUT emailing the student. Records with
  // emailed:false so it shows as "not emailed yet" and can be sent later.
  const saveGradeOnly = async () => {
    if (!selectedStudent||!assessmentName) return;
    setIsSubmitting(true);
    const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
    const { totalPoints, earnedWeight } = calculateTotals();
    const scoreJson = JSON.stringify(
      isAbsent
        ? { weight: assessmentWeight, maxPoints, isAbsent: true, emailed: false, listening: 0, grammar: 0, reading: 0, writing: 0, speaking: 0, totalPoints: 0, earnedWeight: 0 }
        : { weight: assessmentWeight, maxPoints, isAbsent: false, emailed: false, listening: Number(scoreListening)||0, grammar: Number(scoreGrammar)||0, reading: Number(scoreReading)||0, writing: Number(scoreWriting)||0, speaking: Number(scoreSpeaking)||0, totalPoints, earnedWeight }
    );
    const {data:inserted,error} = await supabase.from('student_grades').insert([{user_id:selectedStudent.id,assessment_name:assessmentName,score:scoreJson,feedback,date_recorded:new Date().toISOString()}]).select().single();
    if (error){setIsSubmitting(false);showToast(`DB Error: ${error.message}`,'error');return;}
    if (inserted){setAllGrades(prev=>[inserted,...prev]);setStudentHistory(prev=>[inserted,...prev]);}
    showToast(`Grade saved for ${selectedStudent.full_name} — not emailed yet.`,'success');
    setIsSubmitting(false);
    clearDraftAfterSubmit();
    setAssessmentName('First Test');setAssessmentWeight('10');setMaxPoints('50');setIsAbsent(false);setNotApplicable(false);
    setScoreListening('');setScoreGrammar('');setScoreReading('');setScoreWriting('');setScoreSpeaking('');setTeacherNotes('');setFeedback('');
  };

  // CHANGE 2: submitGrade now saves a JSON object to the DB instead of a plain string
  // The email still uses getFormattedScores() for the pretty formatted text
  const submitGrade = async () => {
    if (!selectedStudent||!assessmentName) return;
    setIsSubmitting(true);
    const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');

    // Build the JSON score object — this is what gets stored in Supabase
    const { totalPoints, earnedWeight } = calculateTotals();
    const scoreJson = JSON.stringify(
      isAbsent
        ? { weight: assessmentWeight, maxPoints, isAbsent: true, emailed: true, listening: 0, grammar: 0, reading: 0, writing: 0, speaking: 0, totalPoints: 0, earnedWeight: 0 }
        : { weight: assessmentWeight, maxPoints, isAbsent: false, emailed: true, listening: Number(scoreListening)||0, grammar: Number(scoreGrammar)||0, reading: Number(scoreReading)||0, writing: Number(scoreWriting)||0, speaking: Number(scoreSpeaking)||0, totalPoints, earnedWeight }
    );

    const {data:inserted,error} = await supabase.from('student_grades').insert([{user_id:selectedStudent.id,assessment_name:assessmentName,score:scoreJson,feedback,date_recorded:new Date().toISOString()}]).select().single();
    if (error){setIsSubmitting(false);showToast(`DB Error: ${error.message}`,'error');return;}
    if (inserted){setAllGrades(prev=>[inserted,...prev]);setStudentHistory(prev=>[inserted,...prev]);}

    try {
      // Email still uses the pretty formatted string — students see the same beautiful layout
      const prettyScore = getFormattedScores();
      const statusNote = isAbsent?`**Status:** ABSENT (0%)`:`**Score Breakdown:**\n${prettyScore}`;
      const isFinalSend = assessmentName === 'Final Test';
      const progressBlock = isAbsent ? '' : (isFinalSend
        ? buildTermReviewEmailText(projectedInsights, projectedStanding(), feedbackTips)
        : buildProgressEmailText(projectedInsights));
      const body = `Hello ${selectedStudent.full_name},\n\n${isFinalSend ? 'I have finished grading your final assessment, and your official results for the term are now available. Below is a detailed breakdown of your performance, a review of your term, and my personal feedback.' : 'I have finished grading your recent assessment, and your official results are now available. Below is a detailed breakdown of your performance, along with my personal feedback.'}\n\n**Assessment:** ${assessmentName} (${assessmentWeight}% of Final Grade)\n\n${statusNote}${progressBlock}\n\n**Instructor Feedback:**\n"${feedback||'Please review your scores carefully.'}"\n\nBest regards,\n\nDr. Chouit Abderraouf\nLit & Learn\n📧 dr.chouit@litnlearn.com\n🌐 https://litnlearn.com`;
      const { error: emailError } = await supabase.functions.invoke('send-email',{body:{toEmail:selectedStudent.email,studentName:'',subject: isFinalSend ? 'Final Test Results & Your Term in Review' : `Official Assessment Grade: ${assessmentName}`,messageBody:body,replyTo:'dr.chouit@litnlearn.com'}});
      if (emailError) throw new Error(emailError.message);
      showToast(`Grade recorded and emailed to ${selectedStudent.email}!`,'success');
    } catch {showToast('Grade recorded, but email failed.','error');}
    finally {
      setIsSubmitting(false);
      clearDraftAfterSubmit();
      setAssessmentName('First Test');setAssessmentWeight('10');setMaxPoints('50');setIsAbsent(false);setNotApplicable(false);
      setScoreListening('');setScoreGrammar('');setScoreReading('');setScoreWriting('');setScoreSpeaking('');setTeacherNotes('');setFeedback('');
    }
  };

  // CHANGE 2: handleResendEmail uses formatScoreDisplay to render JSON scores into the pretty email string
  const handleResendEmail = async (rec:any) => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const prettyScore = formatScoreDisplay(rec.score);
      const body = `Hello ${selectedStudent.full_name},\n\nI am resending your official assessment results.\n\n**Assessment:** ${rec.assessment_name}\n\n**Score Breakdown:**\n${prettyScore}${rec.assessment_name === 'Final Test' ? buildTermReviewEmailText(insights, termSummary.standing, feedbackTips) : buildProgressEmailText(insights)}\n\n**Instructor Feedback:**\n"${rec.feedback}"\n\nBest regards,\n\nDr. Chouit Abderraouf\nLit & Learn\n📧 dr.chouit@litnlearn.com\n🌐 https://litnlearn.com`;
      const { error: resendError } = await supabase.functions.invoke('send-email',{body:{toEmail:selectedStudent.email,studentName:'',subject:`Official Assessment Grade: ${rec.assessment_name} (Resend)`,messageBody:body,replyTo:'dr.chouit@litnlearn.com'}});
      if (resendError) throw new Error(resendError.message);
      showToast(`Grade resent to ${selectedStudent.email}!`,'success');
    } catch {showToast('Failed to resend.','error');} finally {setIsSubmitting(false);}
  };

  // Sends the grade email for a record that was saved-but-not-emailed, then marks
  // it emailed:true in the database and local state.
  const handleSendRecord = async (rec:any) => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      let parsed:any={}; try{parsed=JSON.parse(rec.score)||{};}catch{}
      const prettyScore = formatScoreDisplay(rec.score);
      const statusNote = parsed.isAbsent ? `**Status:** ABSENT (0%)` : `**Score Breakdown:**\n${prettyScore}`;
      const progressBlock = parsed.isAbsent ? '' : (rec.assessment_name === 'Final Test'
        ? buildTermReviewEmailText(insights, termSummary.standing, feedbackTips)
        : buildProgressEmailText(insights));
      const body = `Hello ${selectedStudent.full_name},\n\nI have finished grading your recent assessment, and your official results are now available. Below is a detailed breakdown of your performance, along with my personal feedback.\n\n**Assessment:** ${rec.assessment_name} (${parsed.weight}% of Final Grade)\n\n${statusNote}${progressBlock}\n\n**Instructor Feedback:**\n"${rec.feedback||'Please review your scores carefully.'}"\n\nBest regards,\n\nDr. Chouit Abderraouf\nLit & Learn\n📧 dr.chouit@litnlearn.com\n🌐 https://litnlearn.com`;
      const { error: sendError } = await supabase.functions.invoke('send-email',{body:{toEmail:selectedStudent.email,studentName:'',subject:`Official Assessment Grade: ${rec.assessment_name}`,messageBody:body,replyTo:'dr.chouit@litnlearn.com'}});
      if (sendError) throw new Error(sendError.message);
      parsed.emailed = true;
      const newScore = JSON.stringify(parsed);
      await supabase.from('student_grades').update({score:newScore}).eq('id', rec.id);
      setStudentHistory(prev=>prev.map(h=>h.id===rec.id?{...h,score:newScore}:h));
      setAllGrades(prev=>prev.map(h=>h.id===rec.id?{...h,score:newScore}:h));
      showToast(`Grade emailed to ${selectedStudent.email}!`,'success');
    } catch {showToast('Failed to send email.','error');} finally {setIsSubmitting(false);}
  };

  // ── Live Arena ────────────────────────────────────────────────────────────
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      if (target.type === 'student') {
        if (selectedStudent?.id===target.id) setSelectedStudent(null);
        setStudents(prev=>prev.filter(s=>s.id!==target.id));
        setAllGrades(prev=>prev.filter(g=>g.user_id!==target.id));
        await supabase.from('student_grades').delete().eq('user_id',target.id);
        await supabase.from('profiles').delete().eq('id',target.id);
        showToast(`${target.name} permanently removed.`,'success');
      } else if (target.type === 'record') {
        setAllGrades(prev=>prev.filter(g=>g.id!==target.id));
        setStudentHistory(prev=>prev.filter(g=>g.id!==target.id));
        await supabase.from('student_grades').delete().eq('id',target.id);
        showToast('Record deleted.','success');
      }
    } catch {showToast('Failed to delete.','error');}
  };
  const existingRecord = studentHistory.find(h=>h.assessment_name===assessmentName);
  const hasBeenGraded  = !!existingRecord;
  let existingIsNA = false, existingEmailed = true;
  try { const _p = JSON.parse(existingRecord?.score||'{}')||{}; existingIsNA = !!_p.notApplicable; existingEmailed = _p.emailed !== false; } catch {}
  // When a graded test is selected and we're not editing it, show it locked (read-only).
  const gradedLocked = hasBeenGraded && !editingRecordId;
  let lockedData: any = null;
  if (gradedLocked && existingRecord) { try { lockedData = JSON.parse(existingRecord.score)||{}; } catch {} }
  const lockedPer = lockedData ? Number(lockedData.maxPoints)/5 : 0;
  const hasAnyScore    = isAbsent||notApplicable||scoreListening||scoreGrammar||scoreReading||scoreWriting||scoreSpeaking;

  const _dk = (draftVersion>=0 && selectedStudent && !hasBeenGraded) ? makeDraftKey(selectedStudent.id, assessmentName) : null;
  let draftData: any = null;
  if (_dk) { try { const r=localStorage.getItem(_dk); if (r) { const parsed=JSON.parse(r); if (draftHasContent(parsed)) draftData=parsed; } } catch {} }

  return (
    <div style={{maxWidth:'1400px',margin:'0 auto',position:'relative'}}>
      {showEmailPreview && selectedStudent && (()=>{
        const pr = pendingSendRecord;
        let prs:any={}; if(pr){ try{prs=JSON.parse(pr.score)||{};}catch{} }
        const dAssessment = pr ? pr.assessment_name : assessmentName;
        const dWeight  = pr ? prs.weight : assessmentWeight;
        const dMax     = pr ? prs.maxPoints : maxPoints;
        const dAbsent  = pr ? !!prs.isAbsent : isAbsent;
        const dTotal   = pr ? (prs.totalPoints||0) : calculateTotals().totalPoints;
        const dEarned  = pr ? Number(prs.earnedWeight||0) : calculateTotals().earnedWeight;
        const dPer     = Number(dMax)/5;
        const dSkill   = (k:string, formVal:any) => pr ? (prs[k]||0) : (formVal||0);
        const dFeedback= pr ? (pr.feedback||'') : feedback;
        const dInsights= pr ? insights : projectedInsights;
        const dIsFinal = dAssessment === 'Final Test';
        const dTermGrade = pr ? termSummary.standing : projectedStanding();
        // Tiny renderer so the preview shows the exact builder output, **bold** included.
        const boldify = (line:string) => line.split('**').map((seg,i)=> i%2 ? <strong key={i}>{seg}</strong> : seg);
        return (
  <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
    <div style={{background:'#fff',borderRadius:'24px',width:'100%',maxWidth:'640px',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 40px rgba(0,0,0,0.15)'}}>
      <div style={{padding:'24px 28px',borderBottom:'1px solid #E2E8F0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h3 style={{margin:'0 0 4px',fontSize:'1.3rem',color:'#0F172A',fontWeight:'700'}}>📧 Email Preview</h3>
          <p style={{margin:0,fontSize:'0.85rem',color:'#64748B'}}>Sending to: {selectedStudent.email}</p>
        </div>
        <button onClick={()=>{setShowEmailPreview(false);setPendingSendRecord(null);}} style={{background:'#F1F5F9',border:'none',width:'36px',height:'36px',borderRadius:'50%',cursor:'pointer',fontSize:'1.1rem',color:'#64748B'}}>✕</button>
      </div>
      <div style={{overflowY:'auto',padding:'28px',flexGrow:1,fontFamily:'Arial,sans-serif',fontSize:'14px',lineHeight:'1.7',color:'#1e293b'}}>
        <p>Hello {selectedStudent.full_name},</p>
        <p>{dIsFinal ? 'I have finished grading your final assessment, and your official results for the term are now available.' : 'I have finished grading your recent assessment, and your official results are now available.'}</p>
        <p><strong>Assessment:</strong> {dAssessment} ({dWeight}% of Final Grade)</p>
        {dAbsent ? (
          <p><strong>Status:</strong> ABSENT (0%)</p>
        ) : (
          <div style={{background:'#F8FAFC',padding:'16px',borderRadius:'8px',border:'1px solid #E2E8F0',margin:'12px 0'}}>
            <p style={{margin:'0 0 8px',fontWeight:'700'}}>Score Breakdown:</p>
            <p style={{margin:'2px 0'}}>Weight: {dWeight}%</p>
            <p style={{margin:'2px 0'}}>Max Points: {dMax}</p>
            <p style={{margin:'2px 0'}}>Total Raw Score: {dTotal}/{dMax}</p>
            <p style={{margin:'2px 0'}}>Earned Weight Contribution: {dEarned.toFixed(1)}% / {dWeight}%</p>
            <br/>
            <p style={{margin:'2px 0',fontWeight:'700'}}>Skill Breakdown:</p>
            <p style={{margin:'2px 0'}}>Listening: {dSkill('listening',scoreListening)}/{dPer}</p>
            <p style={{margin:'2px 0'}}>Grammar & Vocab: {dSkill('grammar',scoreGrammar)}/{dPer}</p>
            <p style={{margin:'2px 0'}}>Reading: {dSkill('reading',scoreReading)}/{dPer}</p>
            <p style={{margin:'2px 0'}}>Writing: {dSkill('writing',scoreWriting)}/{dPer}</p>
            <p style={{margin:'2px 0'}}>Speaking: {dSkill('speaking',scoreSpeaking)}/{dPer}</p>
          </div>
        )}
        {!dAbsent && dInsights && dIsFinal && (
          <div style={{background:'#F8FAFC',padding:'16px',borderRadius:'8px',border:'1px solid #E2E8F0',margin:'12px 0'}}>
            {buildTermReviewEmailText(dInsights, dTermGrade, feedbackTips).trim().split('\n').filter((l:string)=>l.trim()).map((line:string,i:number)=>(
              <p key={i} style={{margin: i===0?'0 0 8px':'6px 0', fontWeight: i===0?'700':'400'}}>{i===0 ? line.replace(/\*\*/g,'') : boldify(line)}</p>
            ))}
          </div>
        )}
        {!dAbsent && dInsights && !dIsFinal && dInsights.count>1 && (
          <div style={{background:'#F8FAFC',padding:'16px',borderRadius:'8px',border:'1px solid #E2E8F0',margin:'12px 0'}}>
            <p style={{margin:'0 0 8px',fontWeight:'700'}}>Your Progress So Far:</p>
            <p style={{margin:'2px 0 10px'}}>{dInsights.direction==='up'
              ? `Overall, your score improved from ${dInsights.overallPrev}% to ${dInsights.overallLast}% since your last test — nice work.`
              : dInsights.direction==='down'
              ? `Overall, your score moved from ${dInsights.overallPrev}% to ${dInsights.overallLast}% since your last test. Let's work on bringing that back up — you can do it.`
              : `Overall, your score has held steady at around ${dInsights.overallLast}% across your tests.`}</p>
            {dInsights.skills.map((s:any)=>(
              <p key={s.key} style={{margin:'2px 0'}}>{s.label} — {s.latest}% · {studentSkillWord(s)}</p>
            ))}
            <p style={{margin:'10px 0 2px'}}>The best area to focus on next is <strong>{dInsights.weakest.label}</strong>.</p>
          </div>
        )}
        <p><strong>Instructor Feedback:</strong></p>
        <p style={{fontStyle:'italic',background:'#F8FAFC',padding:'12px',borderRadius:'8px',border:'1px solid #E2E8F0'}}>{dFeedback||'No feedback written yet.'}</p>
        <hr style={{margin:'20px 0',borderColor:'#E2E8F0'}}/>
        <p style={{margin:'4px 0',fontWeight:'700'}}>Dr. Chouit Abderraouf</p>
        <p style={{margin:'4px 0',color:'#4F46E5'}}>dr.chouit@litnlearn.com</p>
        <p style={{margin:'4px 0',color:'#4F46E5'}}>litnlearn.com</p>
      </div>
      <div style={{padding:'20px 28px',borderTop:'1px solid #E2E8F0',display:'flex',gap:'12px',justifyContent:'flex-end'}}>
        <button onClick={()=>{setShowEmailPreview(false);setPendingSendRecord(null);}} style={{padding:'12px 24px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:'12px',fontWeight:'600',cursor:'pointer'}}>Cancel</button>
        <button onClick={()=>{const _p=pr;setShowEmailPreview(false);setPendingSendRecord(null);_p?handleSendRecord(_p):submitGrade();}} disabled={isSubmitting} style={{padding:'12px 24px',background:'#10B981',color:'#fff',border:'none',borderRadius:'12px',fontWeight:'600',cursor:'pointer',boxShadow:'0 4px 12px rgba(16,185,129,0.2)'}}>
          {isSubmitting?'Sending...':'✓ Confirm & Send'}
        </button>
      </div>
    </div>
  </div>
        );
      })()}
      {deleteTarget && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease-out'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'32px',width:'90%',maxWidth:'400px',boxShadow:'0 20px 40px rgba(0,0,0,0.1)',textAlign:'center'}}>
            <div style={{width:'64px',height:'64px',background:'#FEF2F2',color:'#EF4444',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}><IconTrash/></div>
            <h3 style={{margin:'0 0 12px',color:'#0F172A',fontSize:'1.4rem'}}>
              {deleteTarget.type==='thread'?'Delete Conversation?':deleteTarget.type==='student'?'Remove Student?':deleteTarget.type==='record'?'Delete Grade Record?':'Delete Message?'}
            </h3>
            <p style={{color:'#64748B',margin:'0 0 24px',lineHeight:'1.5'}}>
              {deleteTarget.type==='student'
                ?`This will permanently remove ${deleteTarget.name} and all their grade records. This cannot be undone.`
                :deleteTarget.type==='record'
                ?'This will permanently delete this grade record. This cannot be undone.'
                :'This action cannot be undone.'}
            </p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setDeleteTarget(null)} style={{flex:1,padding:'12px',background:'#F1F5F9',color:'#475569',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Cancel</button>
              <button onClick={executeDelete} style={{flex:1,padding:'12px',background:'#EF4444',color:'#fff',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

        <div style={{display:'grid',gridTemplateColumns:focused?'1fr':'repeat(auto-fit, minmax(360px, 1fr))',gap:'28px',alignItems:'start'}}>

          {/* ── Directory panel ── */}
          {!focused && (
          <div style={{background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'22px',padding:'24px',boxShadow:'0 1px 2px rgba(16,24,40,0.04), 0 14px 30px -12px rgba(16,24,40,0.16)'}}>
            <div style={{display:'flex',gap:'6px',background:'#EEF1F7',padding:'5px',borderRadius:'14px',marginBottom:'22px'}}>
              <button onClick={()=>setGradingRosterMode('directory')} style={{flex:1,padding:'9px 0',border:'none',borderRadius:'11px',fontSize:'0.85rem',fontWeight:'500',cursor:'pointer',background:gradingRosterMode==='directory'?'#fff':'transparent',color:gradingRosterMode==='directory'?'#4F46E5':'#64748B',boxShadow:gradingRosterMode==='directory'?'0 1px 3px rgba(16,24,40,0.12)':'none',transition:'all 0.2s'}}>Active students</button>
              <button onClick={()=>setGradingRosterMode('archived')} style={{flex:1,padding:'9px 0',border:'none',borderRadius:'11px',fontSize:'0.85rem',fontWeight:'500',cursor:'pointer',background:gradingRosterMode==='archived'?'#fff':'transparent',color:gradingRosterMode==='archived'?'#4F46E5':'#64748B',boxShadow:gradingRosterMode==='archived'?'0 1px 3px rgba(16,24,40,0.12)':'none',transition:'all 0.2s'}}>Archived</button>
              <button onClick={()=>setGradingRosterMode('manual')} style={{flex:1,padding:'9px 0',border:'none',borderRadius:'11px',fontSize:'0.85rem',fontWeight:'500',cursor:'pointer',background:gradingRosterMode==='manual'?'#fff':'transparent',color:gradingRosterMode==='manual'?'#4F46E5':'#64748B',boxShadow:gradingRosterMode==='manual'?'0 1px 3px rgba(16,24,40,0.12)':'none',transition:'all 0.2s'}}>Add to roster</button>
            </div>

            {gradingRosterMode!=='manual' ? (
              <>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
                  <h3 style={{margin:0,fontSize:'1.25rem',fontWeight:'600',color:'#0F172A'}}>{gradingRosterMode==='archived'?'Archived students':'Student directory'}</h3>
                  <span style={{background:'#EEF2FF',color:'#4F46E5',fontWeight:'600',fontSize:'0.8rem',padding:'2px 10px',borderRadius:'999px'}}>{gradingFilteredStudents.length}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
                  <div style={{position:'relative'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" placeholder="Search by name or email" value={gradingSearchQuery} onChange={e=>setGradingSearchQuery(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:'12px 14px 12px 42px',borderRadius:'12px',border:'1px solid #E3E7EF',background:'#FAFBFD',outline:'none',fontSize:'0.92rem',color:'#475569'}}/>
                  </div>
                  <div style={{display:'flex',gap:'10px'}}>
                    <select value={gradingFilterLevel} onChange={e=>setGradingFilterLevel(e.target.value)} style={{flex:1,padding:'11px 12px',borderRadius:'12px',border:'1px solid #E3E7EF',outline:'none',fontSize:'0.85rem',background:'#FAFBFD',color:'#475569'}}>
                      <option value="All Levels">All Levels</option>
                      {['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}
                    </select>
                    <select value={gradingFilterTime} onChange={e=>setGradingFilterTime(e.target.value)} style={{flex:1,padding:'11px 12px',borderRadius:'12px',border:'1px solid #E3E7EF',outline:'none',fontSize:'0.85rem',background:'#FAFBFD',color:'#475569'}}>
                      <option value="All Times">All Times</option>
                      {['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                {gradingFilteredStudents.length===0
                  ? <div style={{background:'#FAFBFD',padding:'30px',borderRadius:'16px',textAlign:'center',color:'#94A3B8',border:'1px dashed #D9DEE8'}}>{gradingRosterMode==='archived'?'No archived students.':'No students match this search.'}</div>
                  : <div style={{display:'flex',flexDirection:'column',gap:'10px',maxHeight:'520px',overflowY:'auto',paddingRight:'6px'}}>
                      {gradingFilteredStudents.map(student=>{
                        const studentGrades = allGrades.filter(g=>g.user_id===student.id);
                        const cnt = studentGrades.length;
                        const gradedNames = new Set(studentGrades.map(g=>g.assessment_name));
                        const isSel = selectedStudent?.id===student.id;
                        const draftedAssessments = (draftVersion >= 0 ? ['First Test','Midterm','Third Test','Final Test'] : []).filter(a=>{
                          if (gradedNames.has(a)) return false;
                          const raw = localStorage.getItem(makeDraftKey(student.id,a));
                          if (!raw) return false;
                          try { return draftHasContent(JSON.parse(raw)); } catch { return false; }
                        });
                        const hasDraftBadge = draftedAssessments.length > 0;
                        const _aOrder = ['First Test','Midterm','Third Test','Final Test'];
                        const _aAbbr: any = {'First Test':'1st','Midterm':'Mid','Third Test':'3rd','Final Test':'Final'};
                        const recordLabels = [..._aOrder.filter(a=>gradedNames.has(a)).map(a=>_aAbbr[a]), ...[...gradedNames].filter((a:any)=>!_aOrder.includes(a))];
                        const isArchivedRow = gradingRosterMode==='archived';
                        return (
                          <div key={student.id} onClick={isArchivedRow?undefined:()=>setSelectedStudent(student)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',background:isSel?'#F6F6FF':'#FAFBFD',border:isSel?'2px solid #4F46E5':'1px solid rgba(15,23,42,0.05)',borderRadius:'16px',cursor:isArchivedRow?'default':'pointer',transition:'all 0.2s',boxShadow:isSel?'0 8px 22px -10px rgba(79,70,229,0.45)':'none'}}>
                            <div style={{flexGrow:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'6px'}}>
                                <span style={{fontWeight:'600',color:isSel?'#4F46E5':'#0F172A',fontSize:'0.98rem'}}>{student.full_name}</span>
                                {hasDraftBadge&&<span onClick={isArchivedRow?undefined:e=>{e.stopPropagation();setSelectedStudent(student);setAssessmentName(draftedAssessments[0]);}} title={`Saved draft for: ${draftedAssessments.join(', ')} — click to review or discard`} style={{background:'#FFFBEB',color:'#B45309',border:'1px solid #FCD34D',fontSize:'0.68rem',fontWeight:'600',padding:'2px 8px',borderRadius:'7px',cursor:isArchivedRow?'default':'pointer',whiteSpace:'nowrap'}}>Draft: {draftedAssessments.join(', ')}</span>}
                              </div>
                              <div style={{display:'flex',gap:'6px'}}>
                                {student.course_level&&<span style={{background:'#EEF1F6',color:'#475569',padding:'3px 9px',borderRadius:'8px',fontSize:'0.75rem',fontWeight:'500'}}>{student.course_level}</span>}
                                {student.class_time&&<span style={{background:'#EEF1F6',color:'#475569',padding:'3px 9px',borderRadius:'8px',fontSize:'0.75rem',fontWeight:'500'}}>{student.class_time}</span>}
                              </div>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0,marginLeft:'8px'}}>
                              {cnt>0&&<span title={[...gradedNames].join(', ')} style={{background:'#ECFDF5',color:'#047857',padding:'6px 11px',borderRadius:'8px',fontSize:'0.78rem',fontWeight:'500',whiteSpace:'nowrap'}}>{recordLabels.join(' · ')}</span>}
                              {isArchivedRow
                                ? <button onClick={e=>{e.stopPropagation();handleRestoreStudent(student.id,student.full_name);}} title="Restore student to active" style={{display:'flex',alignItems:'center',gap:'6px',background:'#ECFDF5',color:'#059669',border:'none',padding:'7px 12px',borderRadius:'10px',cursor:'pointer',fontWeight:'600',fontSize:'0.8rem'}}><IconRestore/> Restore</button>
                                : <button onClick={e=>{e.stopPropagation();handleArchiveStudent(student.id,student.full_name);}} title="Archive student (hide from grading)" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'34px',height:'34px',background:'#EEF2FF',color:'#4F46E5',border:'none',borderRadius:'10px',cursor:'pointer'}}><IconArchive/></button>
                              }
                              <button onClick={e=>{e.stopPropagation();setDeleteTarget({type:'student',id:student.id,name:student.full_name});}} title="Remove student" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'34px',height:'34px',background:'#FEF2F2',color:'#EF4444',border:'none',borderRadius:'10px',cursor:'pointer'}}><IconTrash/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </>
            ) : (
              <div style={{background:'#FAFBFD',padding:'22px',borderRadius:'16px',border:'1px solid #E7EAF1'}}>
                <h3 style={{margin:'0 0 16px',color:'#0F172A',fontSize:'1.1rem',fontWeight:'600'}}>Enroll new student</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div><label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',marginBottom:'6px',color:'#475569'}}>Full name</label><input type="text" value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="e.g., Yuko Tanaka" style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:'12px',border:'1px solid #E3E7EF',background:'#fff',outline:'none'}}/></div>
                  <div><label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',marginBottom:'6px',color:'#475569'}}>Email address</label><input type="email" value={manualEmail} onChange={e=>setManualEmail(e.target.value)} placeholder="student@example.com" style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:'12px',border:'1px solid #E3E7EF',background:'#fff',outline:'none'}}/></div>
                  <div style={{display:'flex',gap:'12px'}}>
                    <div style={{flex:1}}><label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',marginBottom:'6px',color:'#475569'}}>Level</label><select value={manualLevel} onChange={e=>setManualLevel(e.target.value)} style={{width:'100%',padding:'12px',borderRadius:'12px',border:'1px solid #E3E7EF',outline:'none',background:'#fff'}}>{['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}</select></div>
                    <div style={{flex:1}}><label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',marginBottom:'6px',color:'#475569'}}>Class time</label><select value={manualTime} onChange={e=>setManualTime(e.target.value)} style={{width:'100%',padding:'12px',borderRadius:'12px',border:'1px solid #E3E7EF',outline:'none',background:'#fff'}}>{['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}</select></div>
                  </div>
                  <button onClick={handleAddStudentToRoster} style={{background:'#4F46E5',color:'#fff',padding:'14px',borderRadius:'12px',border:'none',fontWeight:'600',cursor:'pointer',marginTop:'4px',boxShadow:'0 8px 18px -8px rgba(79,70,229,0.5)'}}>Save student to directory</button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* ── Right column ── */}
          <div style={focused?{display:'flex',flexDirection:'column',gap:'20px',minWidth:0}:{position:'sticky',top:'24px',maxHeight:'88vh',overflowY:'auto',paddingRight:'6px',display:'flex',flexDirection:'column',gap:'20px'}}>
            {selectedStudent ? (
              <>
                {focused ? (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'16px',padding:'12px 16px',boxShadow:'0 1px 2px rgba(16,24,40,0.04)',flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                      <button onClick={()=>setFocusMode(false)} style={{background:'#EEF2FF',color:'#4F46E5',border:'none',fontSize:'0.82rem',fontWeight:'600',padding:'7px 12px',borderRadius:'9px',cursor:'pointer'}}>‹ All students</button>
                      <span style={{fontSize:'1.05rem',fontWeight:'600',color:'#0F172A'}}>{selectedStudent.full_name}</span>
                      {selectedStudent.course_level && <span style={{background:'#F1F5F9',color:'#475569',fontSize:'0.7rem',fontWeight:'500',padding:'3px 9px',borderRadius:'999px'}}>{selectedStudent.course_level}</span>}
                      {selectedStudent.class_time && <span style={{background:'#F1F5F9',color:'#475569',fontSize:'0.7rem',fontWeight:'500',padding:'3px 9px',borderRadius:'999px'}}>{selectedStudent.class_time}</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'0.75rem',color:'#94A3B8',fontWeight:'500'}}>{gradingIdx+1} / {gradingFilteredStudents.length}</span>
                      <button onClick={goPrevStudent} disabled={gradingIdx<=0} style={{width:'32px',height:'32px',borderRadius:'8px',border:'1px solid #E3E7EF',background:'#fff',color:'#475569',cursor:gradingIdx<=0?'not-allowed':'pointer',opacity:gradingIdx<=0?0.4:1,fontSize:'1rem'}}>‹</button>
                      <button onClick={goNextStudent} disabled={gradingIdx>=gradingFilteredStudents.length-1} style={{width:'32px',height:'32px',borderRadius:'8px',border:'1px solid #E3E7EF',background:'#fff',color:'#475569',cursor:gradingIdx>=gradingFilteredStudents.length-1?'not-allowed':'pointer',opacity:gradingIdx>=gradingFilteredStudents.length-1?0.4:1,fontSize:'1rem'}}>›</button>
                      <button onClick={()=>setFocusMode(false)} style={{background:'#4F46E5',color:'#fff',border:'none',fontSize:'0.82rem',fontWeight:'600',padding:'7px 13px',borderRadius:'9px',cursor:'pointer'}}>⤢ Exit focus</button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex',justifyContent:'flex-end',flexShrink:0}}>
                    <button onClick={()=>setFocusMode(true)} style={{background:'#EEF2FF',color:'#4F46E5',border:'none',fontSize:'0.82rem',fontWeight:'600',padding:'8px 14px',borderRadius:'10px',cursor:'pointer'}}>⤢ Focus on this student</button>
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:focused?'1.15fr 1fr':'1fr',gap:'20px',alignItems:'start'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:'20px',minWidth:0}}>
                {/* ── Grade-drafting hero (scores only) ── */}
                <div style={{background:'linear-gradient(140deg,#4F46E5 0%,#4338CA 55%,#3730A3 100%)',borderRadius:'24px',padding:'32px',color:'#fff',boxShadow:'0 20px 44px -16px rgba(67,56,202,0.55)',position:'relative',overflow:'hidden',flexShrink:0}}>
                  <div style={{position:'absolute',top:'-60px',right:'-40px',width:'220px',height:'220px',background:'radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)',pointerEvents:'none'}}/>

                  {isEditingProfile ? (
                    <div style={{background:'rgba(0,0,0,0.2)',padding:'24px',borderRadius:'18px',marginBottom:'22px',position:'relative'}}>
                      <h4 style={{margin:'0 0 16px',fontSize:'1.1rem',fontWeight:'700'}}>Editing student profile</h4>
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        <input type="text" value={editProfileName} onChange={e=>setEditProfileName(e.target.value)} placeholder="Full Name" style={{width:'100%',boxSizing:'border-box',padding:'12px',borderRadius:'10px',border:'none',outline:'none',fontSize:'1rem'}}/>
                        <input type="email" value={editProfileEmail} onChange={e=>setEditProfileEmail(e.target.value)} placeholder="Email" style={{width:'100%',boxSizing:'border-box',padding:'12px',borderRadius:'10px',border:'none',outline:'none',fontSize:'1rem'}}/>
                        <div style={{display:'flex',gap:'12px'}}>
                          <select value={editProfileLevel} onChange={e=>setEditProfileLevel(e.target.value)} style={{flex:1,padding:'12px',borderRadius:'10px',border:'none',outline:'none',fontSize:'1rem'}}>{['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}</select>
                          <select value={editProfileTime} onChange={e=>setEditProfileTime(e.target.value)} style={{flex:1,padding:'12px',borderRadius:'10px',border:'none',outline:'none',fontSize:'1rem'}}>{['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}</select>
                        </div>
                        <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                          <button onClick={()=>setIsEditingProfile(false)} style={{flex:1,padding:'11px',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'10px',color:'#fff',fontWeight:'600',cursor:'pointer'}}>Cancel</button>
                          <button onClick={handleSaveProfileUpdate} disabled={isSavingProfile} style={{flex:1,padding:'11px',background:'#10B981',border:'none',borderRadius:'10px',color:'#fff',fontWeight:'600',cursor:isSavingProfile?'wait':'pointer'}}>{isSavingProfile?'Saving...':'Save profile'}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'26px',position:'relative'}}>
                      <div>
                        <div style={{textTransform:'uppercase',letterSpacing:'1.6px',fontSize:'0.7rem',fontWeight:'600',color:'rgba(255,255,255,0.72)',marginBottom:'8px'}}>Drafting official grade</div>
                        <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                          <h3 style={{margin:0,fontSize:'1.9rem',lineHeight:'1.1'}}>{selectedStudent.full_name}</h3>
                          <button onClick={handleOpenProfileEditor} style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.16)',border:'none',padding:'7px 13px',borderRadius:'9px',color:'#fff',cursor:'pointer',fontSize:'0.78rem',fontWeight:'500'}}><IconEdit/> Edit</button>
                        </div>
                        <div style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.78)',marginTop:'8px'}}>{selectedStudent.email} · {selectedStudent.course_level}</div>
                      </div>
                      <button onClick={()=>setSelectedStudent(null)} style={{background:'rgba(255,255,255,0.16)',border:'none',width:'32px',height:'32px',borderRadius:'50%',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
                    </div>
                  )}

                  <div style={{display:'flex',flexDirection:'column',gap:'18px',position:'relative'}}>

                    {draftData && (
                      <div style={{background:'rgba(255,255,255,0.95)',borderRadius:'14px',padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #F59E0B'}}>
                        <div>
                          <div style={{color:'#92400E',fontWeight:'700',fontSize:'0.85rem'}}>📋 Saved scores draft</div>
                          {draftData.savedAt&&<div style={{color:'#B45309',fontSize:'0.75rem',marginTop:'2px'}}>Saved {new Date(draftData.savedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})} at {new Date(draftData.savedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>}
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button onClick={()=>handleLoadDraft(draftData)} style={{background:'#F59E0B',color:'#fff',border:'none',padding:'8px 15px',borderRadius:'9px',fontWeight:'700',cursor:'pointer',fontSize:'0.82rem'}}>📂 Load scores</button>
                          <button onClick={handleDiscardDraft} style={{background:'rgba(239,68,68,0.1)',color:'#EF4444',border:'1px solid #FCA5A5',padding:'8px 11px',borderRadius:'9px',fontWeight:'700',cursor:'pointer',fontSize:'0.82rem'}}>✕</button>
                        </div>
                      </div>
                    )}

                    <div style={{display:'flex',gap:'14px',alignItems:'flex-end'}}>
                      <div style={{flex:2}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px',gap:'10px',flexWrap:'wrap'}}>
                          <label style={{fontSize:'0.85rem',fontWeight:'500',color:'rgba(255,255,255,0.82)'}}>Assessment name</label>
                          {gradedLocked ? (
                            <span style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.16)',color:'#fff',fontSize:'0.76rem',fontWeight:'600',padding:'7px 13px',borderRadius:'9px'}}>🔒 {lockedData?.notApplicable?'Not applicable':lockedData?.isAbsent?'Absent · 0%':'Graded'} · locked</span>
                          ) : (
                          <div style={{display:'flex',gap:'4px',background:'rgba(255,255,255,0.16)',padding:'4px',borderRadius:'11px'}}>
                            {([['graded','Graded'],['absent','Absent'],['na','Not applicable']] as any).map(([val,lbl]:any)=>{
                              const active = val==='graded' ? (!isAbsent&&!notApplicable) : val==='absent' ? isAbsent : notApplicable;
                              return <button key={val} onClick={()=>{ setIsAbsent(val==='absent'); setNotApplicable(val==='na'); }} style={{padding:'6px 12px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'0.76rem',fontWeight:active?'700':'500',background:active?'#fff':'transparent',color:active?(val==='absent'?'#DC2626':val==='na'?'#475569':'#4F46E5'):'rgba(255,255,255,0.85)'}}>{lbl}</button>;
                            })}
                          </div>
                          )}
                        </div>
                        <select value={assessmentName} onChange={e=>setAssessmentName(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:'13px 15px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1rem',fontWeight:'600',outline:'none',cursor:'pointer',boxShadow:'0 1px 2px rgba(16,24,40,0.12)'}}>
                          <option>First Test</option><option>Midterm</option><option>Third Test</option><option>Final Test</option>
                        </select>
                      </div>
                      <div style={{flex:1}}>
                        <label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',color:'rgba(255,255,255,0.82)',marginBottom:'8px'}}>Weight</label>
                        {gradedLocked ? (
                          <div style={{width:'100%',boxSizing:'border-box',padding:'13px 15px',borderRadius:'12px',background:'rgba(255,255,255,0.16)',color:'#fff',fontSize:'1rem',fontWeight:'600'}}>{lockedData?.weight}%</div>
                        ) : (
                        <select value={assessmentWeight} onChange={e=>setAssessmentWeight(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:'13px 15px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1rem',fontWeight:'600',outline:'none',cursor:'pointer',boxShadow:'0 1px 2px rgba(16,24,40,0.12)'}}>
                          <option value="10">10%</option><option value="30">30%</option><option value="50">50%</option>
                        </select>
                        )}
                      </div>
                      <div style={{flex:1}}>
                        <label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',color:'rgba(255,255,255,0.82)',marginBottom:'8px'}}>Max points</label>
                        {gradedLocked ? (
                          <div style={{width:'100%',boxSizing:'border-box',padding:'13px 15px',borderRadius:'12px',background:'rgba(255,255,255,0.16)',color:'#fff',fontSize:'1rem',fontWeight:'600'}}>{lockedData?.maxPoints} pts</div>
                        ) : (
                        <select value={maxPoints} onChange={e=>setMaxPoints(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:'13px 15px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1rem',fontWeight:'600',outline:'none',cursor:'pointer',boxShadow:'0 1px 2px rgba(16,24,40,0.12)'}}>
                          <option value="50">50 pts</option><option value="100">100 pts</option>
                        </select>
                        )}
                      </div>
                    </div>

                    {gradedLocked ? (
                    <div style={{background:'rgba(255,255,255,0.10)',border:'1px solid rgba(255,255,255,0.16)',borderRadius:'18px',padding:'22px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',paddingBottom:'11px',borderBottom:'1px solid rgba(255,255,255,0.16)'}}>
                        <span style={{fontSize:'0.9rem',fontWeight:'600'}}>Recorded scores</span>
                        <button onClick={()=>loadRecordToForm(existingRecord)} style={{background:'#fff',color:'#4F46E5',border:'none',fontSize:'0.8rem',fontWeight:'700',padding:'7px 13px',borderRadius:'9px',cursor:'pointer',boxShadow:'0 1px 2px rgba(16,24,40,0.12)'}}>✏️ Edit scores</button>
                      </div>
                      {lockedData?.notApplicable ? (
                        <div style={{background:'rgba(255,255,255,0.14)',borderRadius:'12px',padding:'16px',textAlign:'center',fontSize:'0.92rem',fontWeight:'500'}}>Not applicable — excluded from the grade and trend.</div>
                      ) : lockedData?.isAbsent ? (
                        <div style={{background:'rgba(255,255,255,0.14)',borderRadius:'12px',padding:'16px',textAlign:'center',fontSize:'0.92rem',fontWeight:'500'}}>Absent — recorded as 0%.</div>
                      ) : (
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        {([['Listening','listening'],['Grammar & Vocab','grammar'],['Reading','reading'],['Writing','writing'],['Speaking','speaking']] as any).map(([lbl,key]:any)=>(
                          <div key={key} style={{gridColumn:key==='speaking'?'1 / -1':'auto',background:'rgba(255,255,255,0.14)',borderRadius:'11px',padding:'12px 15px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.85)'}}>{lbl}</span>
                            <span style={{fontWeight:'700',fontSize:'0.98rem'}}>{lockedData?.[key]??0}<span style={{opacity:0.6,fontWeight:'500'}}> / {lockedPer}</span></span>
                          </div>
                        ))}
                      </div>
                      )}
                      <div style={{marginTop:'18px',background:'rgba(15,23,42,0.22)',borderRadius:'13px',padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.85rem',fontWeight:'500',color:'rgba(255,255,255,0.9)'}}>{lockedData?.notApplicable?'Excluded':`Total: ${lockedData?.totalPoints??0} / ${lockedData?.maxPoints} pts`}</span>
                        <span style={{fontSize:'1rem',fontWeight:'700',color:'#34D399'}}>{lockedData?.notApplicable?'No grade effect':`Earns: ${Number(lockedData?.earnedWeight||0).toFixed(1)}% / ${lockedData?.weight}%`}</span>
                      </div>
                    </div>
                    ) : (
                    <div style={{background:'rgba(255,255,255,0.10)',border:'1px solid rgba(255,255,255,0.16)',borderRadius:'18px',padding:'22px',opacity:(isAbsent||notApplicable)?0.5:1,pointerEvents:(isAbsent||notApplicable)?'none':'auto'}}>
                      <div style={{fontSize:'0.9rem',fontWeight:'600',marginBottom:'16px',paddingBottom:'11px',borderBottom:'1px solid rgba(255,255,255,0.16)'}}>Raw score breakdown <span style={{color:'rgba(255,255,255,0.6)',fontWeight:'400'}}>(points)</span></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px'}}>
                        {[['Listening',scoreListening,setScoreListening],['Grammar & Vocab',scoreGrammar,setScoreGrammar],['Reading',scoreReading,setScoreReading],['Writing',scoreWriting,setScoreWriting]].map(([lbl,val,setter]:any)=>(
                          <div key={lbl}><label style={{display:'block',fontSize:'0.78rem',fontWeight:'500',marginBottom:'7px',color:'rgba(255,255,255,0.82)'}}>{lbl}</label><input type="number" min="0" value={(isAbsent||notApplicable)?0:val} onChange={e=>setter(e.target.value)} placeholder={`Max: ${Number(maxPoints)/5}`} style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'0.95rem',fontWeight:'600',outline:'none',boxShadow:'0 1px 2px rgba(16,24,40,0.12)'}}/></div>
                        ))}
                        <div style={{gridColumn:'1 / -1'}}><label style={{display:'block',fontSize:'0.78rem',fontWeight:'500',marginBottom:'7px',color:'rgba(255,255,255,0.82)'}}>Speaking</label><input type="number" min="0" value={(isAbsent||notApplicable)?0:scoreSpeaking} onChange={e=>setScoreSpeaking(e.target.value)} placeholder={`Max: ${Number(maxPoints)/5}`} style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'0.95rem',fontWeight:'600',outline:'none',boxShadow:'0 1px 2px rgba(16,24,40,0.12)'}}/></div>
                      </div>
                      <div style={{marginTop:'18px',background:'rgba(15,23,42,0.22)',borderRadius:'13px',padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.85rem',fontWeight:'500',color:'rgba(255,255,255,0.9)'}}>Total: {calculateTotals().totalPoints} / {maxPoints} pts</span>
                        <span style={{fontSize:'1rem',fontWeight:'700',color:'#34D399'}}>Earns: {calculateTotals().earnedWeight.toFixed(1)}% / {assessmentWeight}%</span>
                      </div>
                    </div>
                    )}

                    {notApplicable && (
                      <div style={{background:'rgba(255,255,255,0.95)',borderRadius:'14px',padding:'13px 16px',color:'#475569',fontSize:'0.85rem',lineHeight:'1.5',border:'1px solid rgba(255,255,255,0.4)'}}>
                        <strong style={{color:'#0F172A'}}>Not applicable</strong> — this test didn't apply to {selectedStudent?.full_name?.split(' ')[0]||'this student'} (enrolled later). It will be recorded as excluded, with no email and no effect on the grade or trend.
                      </div>
                    )}
                    {isAbsent && (
                      <div style={{background:'rgba(255,255,255,0.95)',borderRadius:'14px',padding:'13px 16px',color:'#92400E',fontSize:'0.85rem',lineHeight:'1.5',border:'1px solid #F59E0B'}}>
                        <strong>Absent</strong> — recorded as 0% and counts toward the final grade. The student still gets an email.
                      </div>
                    )}

                    {!hasBeenGraded && (
                      <button onClick={handleSaveDraft} disabled={!hasAnyScore} title={!hasAnyScore?'Enter at least one score to save a draft':'Save scores now, add feedback later'} style={{width:'100%',background:'rgba(255,255,255,0.13)',color:'#fff',border:'1px solid rgba(255,255,255,0.32)',padding:'13px',borderRadius:'13px',fontWeight:'500',fontSize:'0.92rem',cursor:hasAnyScore?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:hasAnyScore?1:0.5}}>
                        💾 Save scores as draft
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Feedback ── */}
                <div style={{background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'22px',padding:'26px',boxShadow:'0 1px 2px rgba(16,24,40,0.04), 0 14px 30px -12px rgba(16,24,40,0.16)',flexShrink:0}}>
                  <div style={{marginBottom:'18px'}}>
                    <h4 style={{margin:'0 0 3px',fontSize:'1.15rem',fontWeight:'600',color:'#0F172A'}}>Feedback</h4>
                    <p style={{margin:0,fontSize:'0.82rem',color:'#94A3B8'}}>Notes stay private. Feedback is emailed to the student.</p>
                  </div>

                  <div style={{marginBottom:'18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <span style={{fontSize:'0.88rem',fontWeight:'600',color:'#475569'}}>Diagnostic notes</span>
                      <span style={{background:'#F1F5F9',color:'#64748B',fontSize:'0.7rem',fontWeight:'600',padding:'2px 9px',borderRadius:'999px'}}>Hidden from student</span>
                    </div>
                    <textarea value={teacherNotes} onChange={e=>setTeacherNotes(e.target.value)} placeholder="e.g., struggled with present continuous; speaking fluency improving but hesitant..." rows={2} style={{width:'100%',boxSizing:'border-box',padding:'13px 14px',borderRadius:'13px',border:'1px solid #E3E7EF',background:'#FAFBFD',color:'#334155',fontSize:'0.98rem',outline:'none',resize:'vertical',lineHeight:'1.55'}}/>
                  </div>

                  <div style={{marginBottom:'20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px',gap:'8px',flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.88rem',fontWeight:'600',color:'#475569'}}>Official feedback</span>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button onClick={()=>builderOpen?setBuilderOpen(false):openBuilder()} disabled={hasBeenGraded&&!editingRecordId} style={{display:'flex',alignItems:'center',gap:'6px',background:builderOpen?'#4F46E5':'#EEF2FF',border:'none',color:builderOpen?'#fff':'#4F46E5',padding:'8px 14px',borderRadius:'10px',fontSize:'0.85rem',fontWeight:'600',cursor:(hasBeenGraded&&!editingRecordId)?'not-allowed':'pointer',opacity:(hasBeenGraded&&!editingRecordId)?0.6:1}}>⚡ Quick build</button>
                        <button onClick={handleGenerateFeedback} disabled={isGenerating||(hasBeenGraded&&!editingRecordId)} style={{display:'flex',alignItems:'center',gap:'7px',background:'#4F46E5',border:'none',color:'#fff',padding:'8px 15px',borderRadius:'10px',fontSize:'0.85rem',fontWeight:'600',cursor:(isGenerating||(hasBeenGraded&&!editingRecordId))?'not-allowed':'pointer',opacity:(isGenerating||(hasBeenGraded&&!editingRecordId))?0.6:1,boxShadow:'0 6px 14px -5px rgba(79,70,229,0.5)'}}>
                          {isGenerating?'✨ Analyzing...':'✨ Draft with AI'}
                        </button>
                      </div>
                    </div>
                    {builderOpen && (!hasBeenGraded || editingRecordId) && (
                      <div style={{background:'#FAFBFD',border:'1px solid #E7EAF1',borderRadius:'14px',padding:'16px',marginBottom:'14px'}}>
                        {builderEditing ? (
                          <>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                              <span style={{fontSize:'0.82rem',fontWeight:'700',color:'#0F172A'}}>Edit recommendation phrases</span>
                              <button onClick={()=>setBuilderEditing(false)} style={{background:'#4F46E5',border:'none',color:'#fff',fontSize:'0.75rem',fontWeight:'600',cursor:'pointer',padding:'6px 12px',borderRadius:'8px'}}>Done</button>
                            </div>
                            <p style={{margin:'0 0 12px',fontSize:'0.72rem',color:'#94A3B8'}}>Lowercase phrases work best — they slot into "for reading, …". Saved on this device.</p>
                            {INSIGHT_SKILLS.map(sk=>(
                              <div key={sk.key} style={{marginBottom:'14px'}}>
                                <div style={{fontSize:'0.78rem',fontWeight:'600',color:'#475569',marginBottom:'6px'}}>{sk.label}</div>
                                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                                  {(feedbackTips[sk.key]||[]).map((tip,i)=>(
                                    <div key={i} style={{display:'flex',gap:'6px',alignItems:'center'}}>
                                      <input value={tip} onChange={e=>editTip(sk.key,i,e.target.value)} style={{flex:1,boxSizing:'border-box',padding:'8px 10px',borderRadius:'9px',border:'1px solid #E3E7EF',background:'#fff',fontSize:'0.8rem',color:'#334155',outline:'none'}}/>
                                      <button onClick={()=>removeTip(sk.key,i)} title="Remove phrase" style={{flexShrink:0,width:'28px',height:'28px',borderRadius:'8px',border:'none',background:'#FEF2F2',color:'#EF4444',cursor:'pointer'}}>✕</button>
                                    </div>
                                  ))}
                                  <button onClick={()=>addTip(sk.key)} style={{alignSelf:'flex-start',background:'#EEF2FF',color:'#4F46E5',border:'none',padding:'6px 12px',borderRadius:'8px',fontSize:'0.78rem',fontWeight:'600',cursor:'pointer'}}>+ Add phrase</button>
                                </div>
                              </div>
                            ))}
                            <button onClick={resetTips} style={{background:'transparent',border:'1px solid #E3E7EF',color:'#64748B',padding:'8px 14px',borderRadius:'9px',fontSize:'0.78rem',fontWeight:'500',cursor:'pointer'}}>Reset to starter phrases</button>
                          </>
                        ) : (
                          <>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                              <span style={{fontSize:'0.82rem',fontWeight:'700',color:'#0F172A'}}>Quick feedback builder</span>
                              <button onClick={()=>{setBuilderTipsSel(new Set());setBuilderEditing(true);}} style={{background:'transparent',border:'none',color:'#4F46E5',fontSize:'0.75rem',fontWeight:'600',cursor:'pointer'}}>Edit phrases</button>
                            </div>
                            <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.85rem',color:'#334155',cursor:'pointer',marginBottom:'10px'}}>
                              <input type="checkbox" checked={builderUseOpening} onChange={e=>setBuilderUseOpening(e.target.checked)}/> Open with their score
                            </label>
                            <div style={{fontSize:'0.72rem',fontWeight:'600',color:'#64748B',textTransform:'uppercase',letterSpacing:'0.4px',margin:'4px 0 7px'}}>Praise a strength</div>
                            <div style={{display:'flex',gap:'7px',flexWrap:'wrap',marginBottom:'12px'}}>
                              {INSIGHT_SKILLS.map(sk=>{
                                const on=builderStrengths.has(sk.key);
                                return <button key={sk.key} onClick={()=>toggleSet(setBuilderStrengths,sk.key)} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'6px 12px',borderRadius:'999px',fontSize:'0.8rem',fontWeight:'500',cursor:'pointer',border:on?'1.5px solid #A7F3D0':'1.5px solid #E3E7EF',background:on?'#ECFDF5':'#fff',color:on?'#047857':'#475569'}}>{on?'✓ ':''}{sk.label}</button>;
                              })}
                            </div>
                            <div style={{fontSize:'0.72rem',fontWeight:'600',color:'#64748B',textTransform:'uppercase',letterSpacing:'0.4px',margin:'4px 0 7px'}}>Recommendations</div>
                            {INSIGHT_SKILLS.map(sk=>{
                              const expanded=builderExpanded.has(sk.key);
                              const isStrongNow=currentTestSignal?.strongKeys?.has(sk.key);
                              const isFocusNow=currentTestSignal?.focusKeys?.has(sk.key);
                              const tag=isStrongNow?{t:'Strength',c:'#047857',b:'#ECFDF5'}:(isFocusNow?{t:'Focus',c:'#C2410C',b:'#FFF7ED'}:null);
                              return (
                                <div key={sk.key} style={{borderTop:'1px solid #EEF1F6'}}>
                                  <div onClick={()=>toggleSet(setBuilderExpanded,sk.key)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',cursor:'pointer'}}>
                                    <span style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.85rem',fontWeight:'500',color:'#334155'}}>{sk.label}{tag&&<span style={{background:tag.b,color:tag.c,fontSize:'0.65rem',fontWeight:'700',padding:'1px 7px',borderRadius:'999px'}}>{tag.t}</span>}</span>
                                    <span style={{color:'#94A3B8',fontSize:'0.8rem'}}>{expanded?'▾':'▸'}</span>
                                  </div>
                                  {expanded && (
                                    <div style={{paddingBottom:'8px',display:'flex',flexDirection:'column',gap:'6px'}}>
                                      {(feedbackTips[sk.key]||[]).map((tip,i)=>{
                                        const id=`${sk.key}::${tip}`; const on=builderTipsSel.has(id);
                                        return <label key={i} style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'0.82rem',color:'#475569',cursor:'pointer',lineHeight:'1.4'}}><input type="checkbox" checked={on} onChange={()=>toggleSet(setBuilderTipsSel,id)} style={{marginTop:'3px'}}/> {tip}</label>;
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.85rem',color:'#334155',cursor:'pointer',margin:'12px 0 14px',borderTop:'1px solid #EEF1F6',paddingTop:'12px'}}>
                              <input type="checkbox" checked={builderUseClosing} onChange={e=>setBuilderUseClosing(e.target.checked)}/> Close with encouragement
                            </label>
                            <button onClick={buildFeedbackText} style={{width:'100%',background:'#4F46E5',color:'#fff',border:'none',padding:'12px',borderRadius:'11px',fontSize:'0.88rem',fontWeight:'600',cursor:'pointer',boxShadow:'0 8px 18px -8px rgba(79,70,229,0.5)'}}>↓ Build feedback</button>
                          </>
                        )}
                      </div>
                    )}
                    {gradedLocked ? (
                      <div style={{width:'100%',boxSizing:'border-box',padding:'13px 15px',borderRadius:'13px',border:'1px solid #E3E7EF',background:'#F8FAFC',color:'#334155',fontSize:'0.98rem',lineHeight:'1.6',whiteSpace:'pre-wrap',minHeight:'80px'}}>{existingRecord?.feedback || <span style={{color:'#94A3B8'}}>No written feedback was saved for this test.</span>}</div>
                    ) : (
                    <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Generate a draft with AI, then edit — or write your own..." rows={4} style={{width:'100%',boxSizing:'border-box',padding:'13px 14px',borderRadius:'13px',border:'1px solid #E3E7EF',background:'#FAFBFD',color:'#334155',fontSize:'0.98rem',outline:'none',resize:'vertical',lineHeight:'1.6'}}/>
                    )}
                    {insights && <div style={{display:'inline-flex',alignItems:'center',gap:'6px',marginTop:'10px',background:'#F5F5FF',border:'1px solid #E5E4FB',color:'#4F46E5',fontSize:'0.75rem',fontWeight:'600',padding:'5px 11px',borderRadius:'999px'}}>💡 AI uses this student's performance insights</div>}
                  </div>

                  {editingRecordId ? (
                    <div style={{display:'flex',gap:'10px'}}>
                      <button onClick={cancelEdit} disabled={isUpdatingRecord} style={{flex:1,background:'#F1F5F9',color:'#475569',border:'none',padding:'16px',borderRadius:'14px',fontWeight:'600',fontSize:'1rem',cursor:'pointer'}}>Cancel</button>
                      <button onClick={()=>handleSaveRecordUpdate(editingRecordId)} disabled={isUpdatingRecord} style={{flex:2,background:'linear-gradient(135deg,#10B981,#059669)',color:'#fff',border:'none',padding:'16px',borderRadius:'14px',fontWeight:'600',fontSize:'1rem',cursor:isUpdatingRecord?'wait':'pointer',boxShadow:'0 12px 24px -8px rgba(16,185,129,0.5)'}}>{isUpdatingRecord?'Saving...':'Save changes'}</button>
                    </div>
                  ) : hasBeenGraded ? (
                    existingIsNA ? (
                      <div style={{background:'#F1F5F9',color:'#475569',padding:'14px',borderRadius:'13px',fontWeight:'600',fontSize:'0.98rem',textAlign:'center',border:'1px solid #E2E8F0'}}>{assessmentName} marked not applicable · excluded</div>
                    ) : !existingEmailed ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div style={{background:'#FFF7ED',color:'#C2410C',padding:'14px',borderRadius:'13px',fontWeight:'700',fontSize:'1rem',textAlign:'center',border:'1px solid #FED7AA'}}>{assessmentName} saved · not emailed yet</div>
                      <button onClick={()=>{setPendingSendRecord(existingRecord);setShowEmailPreview(true);}} disabled={isSubmitting} style={{width:'100%',background:'linear-gradient(135deg,#10B981,#059669)',color:'#fff',border:'none',padding:'14px',borderRadius:'13px',fontWeight:'600',fontSize:'0.98rem',cursor:isSubmitting?'wait':'pointer',boxShadow:'0 8px 18px -8px rgba(16,185,129,0.5)'}}>
                        {isSubmitting?'Sending...':'✉ Preview & send email'}
                      </button>
                    </div>
                    ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div style={{background:'#ECFDF5',color:'#047857',padding:'14px',borderRadius:'13px',fontWeight:'700',fontSize:'1rem',textAlign:'center',border:'1px solid #A7F3D0'}}>✓ {assessmentName} recorded · emailed</div>
                      <button onClick={()=>handleResendEmail(existingRecord)} disabled={isSubmitting} style={{width:'100%',background:'#F1F5F9',color:'#475569',border:'none',padding:'14px',borderRadius:'13px',fontWeight:'600',fontSize:'0.98rem',cursor:isSubmitting?'wait':'pointer'}}>
                        {isSubmitting?'Sending...':'🔄 Resend grade email'}
                      </button>
                    </div>
                    )
                  ) : notApplicable ? (
                    <button onClick={recordNotApplicable} disabled={isSubmitting} style={{width:'100%',background:'#475569',color:'#fff',border:'none',padding:'16px',borderRadius:'14px',fontWeight:'600',fontSize:'1rem',cursor:isSubmitting?'wait':'pointer',boxShadow:'0 12px 24px -8px rgba(71,85,105,0.45)'}}>
                      {isSubmitting?'Recording...':'Mark as not applicable (no email)'}
                    </button>
                  ) : (
                    <>
                      <div style={{display:'flex',gap:'10px'}}>
                        <button onClick={saveGradeOnly} disabled={isSubmitting} style={{flex:1,background:'#4F46E5',color:'#fff',border:'none',padding:'16px',borderRadius:'14px',fontWeight:'600',fontSize:'1rem',cursor:isSubmitting?'wait':'pointer',boxShadow:'0 12px 24px -8px rgba(79,70,229,0.5)'}}>
                          {isSubmitting?'Saving...':'Save grade'}
                        </button>
                        <button onClick={()=>{setPendingSendRecord(null);setShowEmailPreview(true);}} disabled={isSubmitting} style={{flex:1,background:'linear-gradient(135deg,#10B981,#059669)',color:'#fff',border:'none',padding:'16px',borderRadius:'14px',fontWeight:'600',fontSize:'1rem',cursor:isSubmitting?'wait':'pointer',boxShadow:'0 12px 24px -8px rgba(16,185,129,0.5)'}}>
                          {isSubmitting?'Submitting...':'Save & email student'}
                        </button>
                      </div>
                      <p style={{margin:'10px 2px 0',fontSize:'0.78rem',color:'rgba(255,255,255,0.7)',textAlign:'center'}}>Save grade records it now without emailing — you can send the email later from Previous records.</p>
                    </>
                  )}
                </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'20px',minWidth:0}}>

                {/* ── Term summary ── */}
                <TermSummaryCard summary={termSummary} />

                {/* ── Performance insights ── */}
                <PerformanceInsightsCard insights={insights} show={showInsights} onToggle={()=>setShowInsights(v=>!v)} />
                {/* ── Previous records ── */}
                <PreviousRecordsCard
                  records={studentHistory}
                  show={showPrevRecords}
                  onToggle={()=>setShowPrevRecords(v=>!v)}
                  editingRecordId={editingRecordId}
                  onCancelEdit={cancelEdit}
                  onSend={(hist)=>{setPendingSendRecord(hist);setShowEmailPreview(true);}}
                  isSubmitting={isSubmitting}
                  onEdit={loadRecordToForm}
                  onDelete={handleDeleteRecord}
                  formatScoreDisplay={formatScoreDisplay}
                />
                  </div>
                </div>
              </>
            ) : (
              <div style={{background:'#fff',border:'1px dashed #D9DEE8',borderRadius:'22px',padding:'56px 40px',textAlign:'center',boxShadow:'0 1px 2px rgba(16,24,40,0.04)'}}>
                <h3 style={{margin:'0 0 8px',color:'#0F172A',fontSize:'1.4rem',fontWeight:'600'}}>Select a student</h3>
                <p style={{margin:0,color:'#64748B',fontSize:'1rem',lineHeight:'1.6'}}>Choose a student from the directory to review their history and draft a new grade.</p>
              </div>
            )}
          </div>
        </div>

    </div>
  );
};