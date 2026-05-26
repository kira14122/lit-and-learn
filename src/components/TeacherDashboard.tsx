import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';
import { generateStudentFeedback } from '../aiGenerator';
import { client } from '../sanityClient'; 
import { ActivityGenerator } from './ActivityGenerator';

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

export const TeacherDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Core UI ───────────────────────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState<'inbox'|'grading'|'progress'|'arena'|'studio'>('inbox');
  const [toastMessage, setToastMessage] = useState<{text:string,type:'success'|'error'}|null>(null);
  const showToast = (text:string, type:'success'|'error') => { setToastMessage({text,type}); setTimeout(()=>setToastMessage(null),4000); };

  // CHANGE 1: Added 'record' type to deleteTarget union
  const [deleteTarget, setDeleteTarget] = useState<
    |{type:'message'; id:number}
    |{type:'thread';  email:string}
    |{type:'student'; id:string; name:string}
    |{type:'record';  id:string}
    |null
  >(null);

  // ── Inbox ─────────────────────────────────────────────────────────────────
  const [messages, setMessages]           = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [selectedThreadEmail, setSelectedThreadEmail] = useState<string|null>(null);
  const [replyText, setReplyText]         = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isComposing, setIsComposing]     = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeText, setComposeText]     = useState('');
  const [composeAttachment, setComposeAttachment] = useState<{filename:string,content:string}|null>(null);
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  // ── Students & Directory ──────────────────────────────────────────────────
  const [students, setStudents]           = useState<any[]>([]);
  const [allGrades, setAllGrades]         = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any|null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);

  // CHANGE 3: Separate filter states for Grading tab
  const [gradingSearchQuery, setGradingSearchQuery] = useState('');
  const [gradingFilterLevel, setGradingFilterLevel] = useState('All Levels');
  const [gradingFilterTime, setGradingFilterTime]   = useState('All Times');

  // CHANGE 3: Separate filter states for Progress tab
  const [progressSearchQuery, setProgressSearchQuery] = useState('');
  const [progressFilterLevel, setProgressFilterLevel] = useState('All Levels');
  const [progressFilterTime, setProgressFilterTime]   = useState('All Times');

  const [gradingRosterMode, setGradingRosterMode] = useState<'directory'|'manual'>('directory');
  const [manualName, setManualName]       = useState('');
  const [manualEmail, setManualEmail]     = useState('');
  const [manualLevel, setManualLevel]     = useState('Level 1');
  const [manualTime, setManualTime]       = useState('Morning Class');

  // ── Profile editor ────────────────────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName]   = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfileLevel, setEditProfileLevel] = useState('');
  const [editProfileTime, setEditProfileTime]   = useState('');
  const [isSavingProfile, setIsSavingProfile]   = useState(false);

  // ── Draft (localStorage, no DB) ───────────────────────────────────────────
  const [draftVersion, setDraftVersion] = useState(0);
  const bumpDraft = () => setDraftVersion(v => v + 1);

  // ── Grading form ──────────────────────────────────────────────────────────
  const [assessmentName, setAssessmentName]     = useState('First Test');
  const [assessmentWeight, setAssessmentWeight] = useState('10');
  const [maxPoints, setMaxPoints]               = useState('50');
  const [isAbsent, setIsAbsent]                 = useState(false);
  const [scoreListening, setScoreListening]     = useState('');
  const [scoreGrammar, setScoreGrammar]         = useState('');
  const [scoreReading, setScoreReading]         = useState('');
  const [scoreWriting, setScoreWriting]         = useState('');
  const [scoreSpeaking, setScoreSpeaking]       = useState('');
  const [teacherNotes, setTeacherNotes]         = useState('');
  const [feedback, setFeedback]                 = useState('');
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [isGenerating, setIsGenerating]         = useState(false);

  // ── Record editor ─────────────────────────────────────────────────────────
  const [editingRecordId, setEditingRecordId]   = useState<string|null>(null);
  const [editScoreText, setEditScoreText]       = useState('');
  const [editFeedbackText, setEditFeedbackText] = useState('');
  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);

  // ── Progress ──────────────────────────────────────────────────────────────
  const [selectedProgressStudent, setSelectedProgressStudent] = useState<any|null>(null);
  const [studentVocab, setStudentVocab]     = useState<any[]>([]);
  const [isFetchingVocab, setIsFetchingVocab] = useState(false);

  // ── Live Arena ────────────────────────────────────────────────────────────
  const [liveQuizTopic, setLiveQuizTopic]   = useState('');
  const [liveGameMode, setLiveGameMode]     = useState<'standard'|'tug-of-war-all'|'tug-of-war-captain'>('standard');
  const [liveTimeLimit, setLiveTimeLimit]   = useState<number|null>(20);
  const [activeSession, setActiveSession]   = useState<any|null>(null);
  const [liveParticipants, setLiveParticipants] = useState<any[]>([]);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [availableQuizzes, setAvailableQuizzes] = useState<{title:string,category:string}[]>([]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchMessages(); fetchStudents(); fetchAllGrades(); }, []);

  useEffect(() => {
    if (selectedStudent) { fetchStudentHistory(selectedStudent.id); setIsEditingProfile(false); }
    else setStudentHistory([]);
    setEditingRecordId(null);
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedProgressStudent) fetchStudentVocab(selectedProgressStudent.id);
    else setStudentVocab([]);
  }, [selectedProgressStudent]);

  useEffect(() => {
    switch (assessmentName) {
      case 'First Test': case 'Third Test': setAssessmentWeight('10'); setMaxPoints('50'); break;
      case 'Midterm':    setAssessmentWeight('30'); setMaxPoints('100'); break;
      case 'Final Test': setAssessmentWeight('50'); setMaxPoints('100'); break;
    }
  }, [assessmentName]);

  useEffect(() => {
    if (adminTab === 'arena') {
      client.fetch('*[_type == "practiceBank"]{ title, category }').then((data:any) => {
        const v = data.filter((d:any) => d.title);
        setAvailableQuizzes(v);
        if (v.length > 0 && !liveQuizTopic) setLiveQuizTopic(v[0].title);
      }).catch(console.error);
    }
  }, [adminTab]);

  useEffect(() => {
    if (!activeSession) return;
    let channel: any;
    const sort = (p:any[]) => [...p].sort((a,b) => { const ca=a.correct_answers||0,cb=b.correct_answers||0; return cb!==ca?cb-ca:(b.score||0)-(a.score||0); });
    const setup = async () => {
      const token = await getToken({ template:'supabase' });
      const supabase = getSupabaseClient(token||'');
      const {data,error} = await supabase.from('live_participants').select('*').eq('session_id',activeSession.id).order('correct_answers',{ascending:false}).order('score',{ascending:false});
      if (!error && data) setLiveParticipants(data);
      channel = supabase.channel(`arena_${activeSession.id}`).on('postgres_changes',{event:'*',schema:'public',table:'live_participants',filter:`session_id=eq.${activeSession.id}`},(payload:any)=>{
        if (payload.eventType==='INSERT') setLiveParticipants(prev=>prev.find(p=>p.id===payload.new.id)?prev:sort([...prev,payload.new]));
        else if (payload.eventType==='UPDATE') setLiveParticipants(prev=>sort(prev.map(p=>p.id===payload.new.id?payload.new:p)));
      }).subscribe();
    };
    setup();
    return () => { if (channel) channel.unsubscribe(); };
  }, [activeSession, getToken]);

  // ── Memoized data ─────────────────────────────────────────────────────────
  const threads = useMemo(() => {
    const grouped = new Map<string,any[]>();
    messages.forEach(msg => { if (!grouped.has(msg.email)) grouped.set(msg.email,[]); grouped.get(msg.email)!.push(msg); });
    return Array.from(grouped.entries()).map(([email,msgs]) => {
      const sorted = [...msgs].sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
      return {email, name:sorted[sorted.length-1].name, user_id:sorted[sorted.length-1].user_id, messages:sorted, latestDate:sorted[sorted.length-1].created_at};
    }).sort((a,b)=>new Date(b.latestDate).getTime()-new Date(a.latestDate).getTime());
  }, [messages]);

  // CHANGE 3: Two separate filtered student lists
  const gradingFilteredStudents = useMemo(() => students.filter(s => {
    const ms = (s.full_name||'').toLowerCase().includes(gradingSearchQuery.toLowerCase()) || (s.email||'').toLowerCase().includes(gradingSearchQuery.toLowerCase());
    return ms && (gradingFilterLevel==='All Levels'||s.course_level===gradingFilterLevel) && (gradingFilterTime==='All Times'||s.class_time===gradingFilterTime);
  }), [students, gradingSearchQuery, gradingFilterLevel, gradingFilterTime]);

  const progressFilteredStudents = useMemo(() => students.filter(s => {
    const ms = (s.full_name||'').toLowerCase().includes(progressSearchQuery.toLowerCase()) || (s.email||'').toLowerCase().includes(progressSearchQuery.toLowerCase());
    return ms && (progressFilterLevel==='All Levels'||s.course_level===progressFilterLevel) && (progressFilterTime==='All Times'||s.class_time===progressFilterTime);
  }), [students, progressSearchQuery, progressFilterLevel, progressFilterTime]);

  useEffect(() => { if (selectedThreadEmail && !threads.find(t=>t.email===selectedThreadEmail)) setSelectedThreadEmail(null); }, [threads, selectedThreadEmail]);

  // ── CHANGE 2: Score display helper — renders JSON scores as the pretty string ──
  // Also handles old plain-text records gracefully (backward compatible)
  const formatScoreDisplay = (score: any): string => {
    try {
      const parsed = typeof score === 'string' ? JSON.parse(score) : score;
      if (typeof parsed === 'object' && parsed !== null && 'listening' in parsed) {
        const pps = Number(parsed.maxPoints) / 5;
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
  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {data,error} = await supabase.from('contact_messages').select('*').order('created_at',{ascending:false});
      if (error) throw error;
      setMessages(data||[]);
    } catch(e){console.error(e);} finally {setIsLoadingMessages(false);}
  };
  const fetchStudents = async () => {
    const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
    const {data} = await supabase.from('profiles').select('*').eq('is_admin',false).order('full_name',{ascending:true});
    if (data) setStudents(data);
  };
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
  const fetchStudentVocab = async (id:string) => {
    setIsFetchingVocab(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {data,error} = await supabase.from('vocab_vault').select('*').eq('user_id',id).order('created_at',{ascending:false});
      if (error) throw error;
      setStudentVocab(data||[]);
    } catch {showToast('Failed to load vocabulary.','error');} finally {setIsFetchingVocab(false);}
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
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      if (target.type === 'message') {
        setMessages(prev=>prev.filter(m=>m.id!==target.id));
        await supabase.from('contact_messages').delete().eq('id',target.id);
        showToast('Message deleted','success');
      } else if (target.type === 'thread') {
        if (selectedThreadEmail===target.email) setSelectedThreadEmail(null);
        setMessages(prev=>prev.filter(m=>m.email!==target.email));
        await supabase.from('contact_messages').delete().eq('email',target.email);
        showToast('Conversation deleted','success');
      } else if (target.type === 'student') {
        if (selectedStudent?.id===target.id) setSelectedStudent(null);
        setStudents(prev=>prev.filter(s=>s.id!==target.id));
        setAllGrades(prev=>prev.filter(g=>g.user_id!==target.id));
        await supabase.from('student_grades').delete().eq('user_id',target.id);
        await supabase.from('profiles').delete().eq('id',target.id);
        showToast(`${target.name} permanently removed.`,'success');
      } else if (target.type === 'record') {
        // CHANGE 1: Record deletion now goes through custom modal
        setAllGrades(prev=>prev.filter(g=>g.id!==target.id));
        setStudentHistory(prev=>prev.filter(g=>g.id!==target.id));
        await supabase.from('student_grades').delete().eq('id',target.id);
        showToast('Record deleted.','success');
      }
    } catch {showToast('Failed to delete.','error'); fetchMessages();}
  };

  // ── Inbox actions ─────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!replyText.trim()||!selectedThreadEmail) return;
    const t = threads.find(t=>t.email===selectedThreadEmail);
    if (!t) return;
    setIsSendingReply(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      await supabase.functions.invoke('send-email',{body:{toEmail:t.email,studentName:'',messageBody:replyText,subject:'Re: Message from Lit & Learn',replyTo:'dr.chouit@litnlearn.com'}});
      await supabase.from('contact_messages').insert([{name:'Dr. Chouit (Reply)',email:t.email,message:replyText,user_id:t.user_id}]);
      showToast(`Reply sent to ${t.name}!`,'success'); setReplyText(''); fetchMessages();
    } catch {showToast('Failed to send reply.','error');} finally {setIsSendingReply(false);}
  };

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size>4*1024*1024){showToast('Attachment too large. Limit 4MB.','error'); if(fileInputRef.current)fileInputRef.current.value=''; return;}
    const reader = new FileReader();
    reader.onloadend = () => { setComposeAttachment({filename:file.name,content:(reader.result as string).split(',')[1]}); showToast(`Attached: ${file.name}`,'success'); };
    reader.readAsDataURL(file);
  };
  const removeAttachment = () => { setComposeAttachment(null); if(fileInputRef.current)fileInputRef.current.value=''; };

  const handleSendCompose = async () => {
    if (!composeRecipient||!composeText.trim()) return;
    setIsSendingCompose(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      await supabase.functions.invoke('send-email',{body:{toEmail:composeRecipient,studentName:'',subject:composeSubject||'New Message from Lit & Learn',messageBody:composeText,attachment:composeAttachment,replyTo:'dr.chouit@litnlearn.com'}});
      const s = students.find(s=>s.email===composeRecipient);
      await supabase.from('contact_messages').insert([{name:'Dr. Chouit (Sent)',email:composeRecipient,message:composeText+(composeAttachment?`\n\n[Attachment: ${composeAttachment.filename}]`:''),user_id:s?.id||null}]);
      showToast('Message sent!','success'); setComposeText(''); setComposeRecipient(''); setComposeSubject(''); removeAttachment(); setIsComposing(false); fetchMessages();
    } catch {showToast('Failed to send.','error');} finally {setIsSendingCompose(false);}
  };

  // ── Student management ────────────────────────────────────────────────────
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

  const handleSaveRecordUpdate = async (recordId:string) => {
    setIsUpdatingRecord(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {data,error} = await supabase.from('student_grades').update({score:editScoreText,feedback:editFeedbackText}).eq('id',recordId).select().single();
      if (error) throw error;
      setAllGrades(prev=>prev.map(g=>g.id===recordId?data:g)); setStudentHistory(prev=>prev.map(g=>g.id===recordId?data:g));
      setEditingRecordId(null); showToast('Record updated.','success');
    } catch {showToast('Failed to update.','error');} finally {setIsUpdatingRecord(false);}
  };

  // ── Grading & math ────────────────────────────────────────────────────────
  const calculateTotals = () => {
    if (isAbsent) return {totalPoints:0, earnedWeight:0};
    const tp = (Number(scoreListening)||0)+(Number(scoreGrammar)||0)+(Number(scoreReading)||0)+(Number(scoreWriting)||0)+(Number(scoreSpeaking)||0);
    return {totalPoints:tp, earnedWeight:(tp/Number(maxPoints))*Number(assessmentWeight)};
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
    const draft = await generateStudentFeedback(selectedStudent.full_name, assessmentName, getFormattedScores(), teacherNotes+'\n\n'+pm);
    setFeedback(draft); setIsGenerating(false);
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
        ? { weight: assessmentWeight, maxPoints, isAbsent: true, listening: 0, grammar: 0, reading: 0, writing: 0, speaking: 0, totalPoints: 0, earnedWeight: 0 }
        : { weight: assessmentWeight, maxPoints, isAbsent: false, listening: Number(scoreListening)||0, grammar: Number(scoreGrammar)||0, reading: Number(scoreReading)||0, writing: Number(scoreWriting)||0, speaking: Number(scoreSpeaking)||0, totalPoints, earnedWeight }
    );

    const {data:inserted,error} = await supabase.from('student_grades').insert([{user_id:selectedStudent.id,assessment_name:assessmentName,score:scoreJson,feedback,date_recorded:new Date().toISOString()}]).select().single();
    if (error){setIsSubmitting(false);showToast(`DB Error: ${error.message}`,'error');return;}
    if (inserted){setAllGrades(prev=>[inserted,...prev]);setStudentHistory(prev=>[inserted,...prev]);}

    try {
      // Email still uses the pretty formatted string — students see the same beautiful layout
      const prettyScore = getFormattedScores();
      const statusNote = isAbsent?`**Status:** ABSENT (0%)`:`**Score Breakdown:**\n${prettyScore}`;
      const body = `Hello ${selectedStudent.full_name},\n\nI have finished grading your recent assessment, and your official results are now available. Below is a detailed breakdown of your performance, along with my personal feedback.\n\n**Assessment:** ${assessmentName} (${assessmentWeight}% of Final Grade)\n\n${statusNote}\n\n**Instructor Feedback:**\n"${feedback||'Please review your scores carefully.'}"\n\nBest regards,\n\nDr. Chouit Abderraouf\nLit & Learn\n📧 dr.chouit@litnlearn.com\n🌐 https://litnlearn.com`;
      await supabase.functions.invoke('send-email',{body:{toEmail:selectedStudent.email,studentName:'',subject:`Official Assessment Grade: ${assessmentName}`,messageBody:body,replyTo:'dr.chouit@litnlearn.com'}});
      showToast(`Grade recorded and emailed to ${selectedStudent.email}!`,'success');
    } catch {showToast('Grade recorded, but email failed.','error');}
    finally {
      setIsSubmitting(false);
      clearDraftAfterSubmit();
      setAssessmentName('First Test');setAssessmentWeight('10');setMaxPoints('50');setIsAbsent(false);
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
      const body = `Hello ${selectedStudent.full_name},\n\nI am resending your official assessment results.\n\n**Assessment:** ${rec.assessment_name}\n\n**Score Breakdown:**\n${prettyScore}\n\n**Instructor Feedback:**\n"${rec.feedback}"\n\nBest regards,\n\nDr. Chouit Abderraouf\nLit & Learn\n📧 dr.chouit@litnlearn.com\n🌐 https://litnlearn.com`;
      await supabase.functions.invoke('send-email',{body:{toEmail:selectedStudent.email,studentName:'',subject:`Official Assessment Grade: ${rec.assessment_name} (Resend)`,messageBody:body,replyTo:'dr.chouit@litnlearn.com'}});
      showToast(`Grade resent to ${selectedStudent.email}!`,'success');
    } catch {showToast('Failed to resend.','error');} finally {setIsSubmitting(false);}
  };

  // ── Live Arena ────────────────────────────────────────────────────────────
  const handleLaunchLobby = async () => {
    if (!liveQuizTopic.trim()) return;
    setIsCreatingLobby(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const pin = Math.floor(1000+Math.random()*9000).toString();
      const {data,error} = await supabase.from('live_sessions').insert([{pin_code:pin,quiz_id:liveQuizTopic,status:'waiting',game_mode:liveGameMode,time_limit:liveTimeLimit}]).select().single();
      if (error) throw error;
      setActiveSession(data); setLiveParticipants([]); showToast('Lobby created!','success');
    } catch {showToast('Failed to create lobby.','error');} finally {setIsCreatingLobby(false);}
  };
  const handleStartGame = async () => {
    if (!activeSession) return;
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      const {data,error} = await supabase.from('live_sessions').update({status:'active'}).eq('id',activeSession.id).select().single();
      if (error) throw error;
      setActiveSession(data); showToast('Game Started!','success');
    } catch {showToast('Failed to start.','error');}
  };
  const handleEndGame = async () => {
    if (!activeSession) return;
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');
      await supabase.from('live_sessions').update({status:'finished'}).eq('id',activeSession.id);
      setActiveSession(null); setLiveParticipants([]); setLiveQuizTopic(''); showToast('Session closed.','success');
    } catch {showToast('Failed to close.','error');}
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const isGameActive  = activeSession?.status==='active'||activeSession?.status==='finished';
  const isTugOfWar    = activeSession?.game_mode==='tug-of-war-all'||activeSession?.game_mode==='tug-of-war-captain';
  const bluePoints    = liveParticipants.filter(p=>p.team==='blue').reduce((s,p)=>s+(Number(p.correct_answers)||0),0);
  const redPoints     = liveParticipants.filter(p=>p.team==='red').reduce((s,p)=>s+(Number(p.correct_answers)||0),0);
  const bluePercent   = (bluePoints+redPoints)===0?50:(bluePoints/(bluePoints+redPoints))*100;
  const grammarQuizzes = availableQuizzes.filter(q=>q.category?.toLowerCase()==='grammar');
  const vocabQuizzes   = availableQuizzes.filter(q=>q.category?.toLowerCase()==='vocabulary');
  const pronQuizzes    = availableQuizzes.filter(q=>q.category?.toLowerCase()==='pronunciation');
  const activeThread   = threads.find(t=>t.email===selectedThreadEmail);
  const existingRecord = studentHistory.find(h=>h.assessment_name===assessmentName);
  const hasBeenGraded  = !!existingRecord;
  const hasAnyScore    = isAbsent||scoreListening||scoreGrammar||scoreReading||scoreWriting||scoreSpeaking;

  const _dk = (draftVersion>=0 && selectedStudent && !hasBeenGraded) ? makeDraftKey(selectedStudent.id, assessmentName) : null;
  let draftData: any = null;
  if (_dk) { try { const r=localStorage.getItem(_dk); if (r) draftData=JSON.parse(r); } catch {} }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{animation:'fadeInDown 0.3s ease-out',maxWidth:'1400px',margin:'0 auto',position:'relative'}}>

      {/* Delete confirmation modal — now handles message, thread, student, AND record */}
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

      {/* Toast */}
      {toastMessage && (
        <div style={{position:'fixed',top:'24px',left:'50%',transform:'translateX(-50%)',backgroundColor:toastMessage.type==='success'?'#10B981':'#EF4444',color:'#fff',padding:'16px 32px',borderRadius:'9999px',fontWeight:'700',fontSize:'1.1rem',boxShadow:'0 10px 25px rgba(0,0,0,0.2)',zIndex:9998}}>
          {toastMessage.text}
        </div>
      )}

      {/* Nav tabs */}
      <div style={{display:'flex',justifyContent:'center',marginBottom:'40px'}}>
        <div style={{display:'inline-flex',flexWrap:'wrap',justifyContent:'center',backgroundColor:'#fff',padding:'8px',borderRadius:'9999px',boxShadow:'0 10px 30px rgba(0,0,0,0.03)',gap:'8px'}}>
          {([['inbox','#4F46E5',<IconMail/>,'Inbox'],['grading','#4F46E5',<IconUsers/>,'Grading Portal'],['progress','#10B981',<IconChart/>,'Student Progress'],['arena','#F59E0B',<IconPlay/>,'Live Arena'],['studio','#8B5CF6',<IconSparkles/>,'Content Studio']] as [string,string,React.ReactNode,string][]).map(([tab,color,icon,label])=>(
            <button key={tab} onClick={()=>setAdminTab(tab as any)} style={{background:adminTab===tab?color:'transparent',color:adminTab===tab?'#fff':'#64748B',border:'none',padding:'14px 28px',borderRadius:'9999px',fontWeight:'600',fontSize:'1.1rem',cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'8px'}}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INBOX ── */}
      {adminTab==='inbox' && (
        <div style={{backgroundColor:'#fff',borderRadius:'32px',padding:'32px',border:'1px solid #E2E8F0',boxShadow:'0 10px 30px rgba(0,0,0,0.02)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px',paddingBottom:'20px',borderBottom:'2px solid #F1F5F9'}}>
            <div>
              <h2 style={{margin:'0 0 4px',fontSize:'2rem',color:'#0F172A',fontWeight:'600',letterSpacing:'-0.5px'}}>Admin Inbox</h2>
              <p style={{color:'#64748B',fontSize:'1.05rem',margin:0}}>{threads.length} Conversation{threads.length!==1?'s':''}</p>
            </div>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>{setIsComposing(true);setSelectedThreadEmail(null);}} style={{background:'#4F46E5',border:'none',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',fontSize:'0.95rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 10px rgba(79,70,229,0.2)'}}><IconEdit/> Compose</button>
              <button onClick={fetchMessages} style={{background:'#F8FAFC',border:'2px solid #E2E8F0',color:'#475569',padding:'10px 16px',borderRadius:'12px',fontWeight:'600',fontSize:'0.95rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}><IconRefresh/> Refresh</button>
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'32px',alignItems:'flex-start'}}>
            {/* Thread list */}
            <div style={{flex:'1 1 350px',maxWidth:'450px',display:'flex',flexDirection:'column',gap:'12px',maxHeight:'700px',overflowY:'auto',paddingRight:'8px'}}>
              {isLoadingMessages ? <div style={{textAlign:'center',padding:'40px',color:'#94A3B8'}}>Loading...</div>
               : threads.length===0 ? <div style={{textAlign:'center',padding:'40px',color:'#94A3B8',background:'#F8FAFC',borderRadius:'16px',border:'2px dashed #E2E8F0'}}>Inbox is empty</div>
               : threads.map(thread=>{
                const isSel=selectedThreadEmail===thread.email&&!isComposing;
                const latest=thread.messages[thread.messages.length-1];
                const snippet=latest.message.length>60?latest.message.substring(0,60)+'...':latest.message;
                const fmtTime=new Date(thread.latestDate).toLocaleDateString('en-US',{month:'short',day:'numeric'});
                return (
                  <div key={thread.email} onClick={()=>{setSelectedThreadEmail(thread.email);setIsComposing(false);}} style={{background:isSel?'#EEF2FF':'#fff',border:`2px solid ${isSel?'#4F46E5':'#E2E8F0'}`,borderRadius:'16px',padding:'16px',cursor:'pointer',transition:'all 0.2s',display:'flex',gap:'16px'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'50%',background:isSel?'#4F46E5':'#F1F5F9',color:isSel?'#fff':'#475569',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:'700',flexShrink:0}}>{thread.name?thread.name.charAt(0).toUpperCase():'?'}</div>
                    <div style={{overflow:'hidden',flexGrow:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'4px'}}>
                        <h4 style={{margin:0,fontSize:'1.1rem',color:isSel?'#4F46E5':'#0F172A',fontWeight:'700',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'flex',alignItems:'center',gap:'6px'}}>
                          {thread.name}
                          {thread.messages.length>1&&<span style={{background:isSel?'#C7D2FE':'#E2E8F0',color:isSel?'#3730A3':'#475569',fontSize:'0.75rem',padding:'2px 8px',borderRadius:'9999px'}}>{thread.messages.length}</span>}
                        </h4>
                        <span style={{fontSize:'0.8rem',color:isSel?'#4F46E5':'#94A3B8',fontWeight:'600'}}>{fmtTime}</span>
                      </div>
                      <p style={{margin:0,fontSize:'0.9rem',color:'#64748B',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{snippet}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Thread / Compose panel */}
            <div style={{flex:'2 1 500px'}}>
              {isComposing ? (
                <div style={{background:'#F8FAFC',borderRadius:'24px',padding:'32px',border:'1px solid #E2E8F0',minHeight:'500px',display:'flex',flexDirection:'column'}}>
                  <div style={{borderBottom:'2px solid #E2E8F0',paddingBottom:'20px',marginBottom:'24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <h3 style={{margin:0,color:'#0F172A',fontWeight:'700',display:'flex',alignItems:'center',gap:'12px'}}><IconEdit/> New Message</h3>
                    <button onClick={()=>setIsComposing(false)} style={{background:'transparent',border:'none',color:'#94A3B8',cursor:'pointer',fontSize:'1.2rem',fontWeight:'700'}}>✕</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'20px',flexGrow:1}}>
                    <div>
                      <label style={{display:'block',fontSize:'0.95rem',fontWeight:'600',marginBottom:'8px',color:'#475569'}}>To: Email Address</label>
                      <input type="email" list="enrolled-students" value={composeRecipient} onChange={e=>setComposeRecipient(e.target.value)} placeholder="Select a student or type any email..." style={{width:'100%',padding:'16px',borderRadius:'12px',border:'2px solid #E2E8F0',background:'#fff',color:'#0F172A',fontSize:'1.05rem',outline:'none'}}/>
                      <datalist id="enrolled-students">{students.map(s=><option key={s.id} value={s.email}>{s.full_name}</option>)}</datalist>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:'0.95rem',fontWeight:'600',marginBottom:'8px',color:'#475569'}}>Subject</label>
                      <input type="text" value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} placeholder="Enter email subject..." style={{width:'100%',padding:'16px',borderRadius:'12px',border:'2px solid #E2E8F0',background:'#fff',color:'#0F172A',fontSize:'1.05rem',outline:'none'}}/>
                    </div>
                    <div style={{flexGrow:1,display:'flex',flexDirection:'column'}}>
                      <label style={{display:'block',fontSize:'0.95rem',fontWeight:'600',marginBottom:'8px',color:'#475569'}}>Message</label>
                      <textarea value={composeText} onChange={e=>setComposeText(e.target.value)} placeholder="Draft your message here..." style={{width:'100%',flexGrow:1,minHeight:'150px',padding:'16px',borderRadius:'12px',border:'2px solid #E2E8F0',background:'#fff',color:'#0F172A',fontSize:'1.05rem',outline:'none',resize:'vertical'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display:'none'}}/>
                        <button onClick={()=>fileInputRef.current?.click()} style={{background:'#F1F5F9',border:'1px solid #CBD5E1',color:'#475569',padding:'10px 16px',borderRadius:'12px',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}><IconPaperclip/> Attach</button>
                        {composeAttachment&&<div style={{background:'#EEF2FF',color:'#4F46E5',padding:'8px 16px',borderRadius:'12px',fontSize:'0.9rem',fontWeight:'600',display:'flex',alignItems:'center',gap:'8px'}}><span style={{maxWidth:'150px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{composeAttachment.filename}</span><button onClick={removeAttachment} style={{background:'transparent',border:'none',color:'#4F46E5',cursor:'pointer',fontWeight:'700'}}>✕</button></div>}
                      </div>
                      <button onClick={handleSendCompose} disabled={isSendingCompose||!composeRecipient||!composeText.trim()} style={{background:'#4F46E5',color:'#fff',border:'none',padding:'14px 32px',borderRadius:'9999px',fontWeight:'600',fontSize:'1.05rem',cursor:(isSendingCompose||!composeRecipient||!composeText.trim())?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:'8px',opacity:(!composeRecipient||!composeText.trim())?0.5:1,boxShadow:'0 4px 15px rgba(79,70,229,0.2)'}}>
                        {isSendingCompose?'Sending...':<><IconSend/> Send Message</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeThread ? (
                <div style={{background:'#F8FAFC',borderRadius:'24px',padding:'32px',border:'1px solid #E2E8F0',maxHeight:'800px',display:'flex',flexDirection:'column'}}>
                  <div style={{borderBottom:'2px solid #E2E8F0',paddingBottom:'20px',marginBottom:'24px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <h3 style={{margin:'0 0 4px',fontSize:'1.8rem',color:'#0F172A',fontWeight:'700',display:'flex',alignItems:'center',gap:'12px'}}>
                        {activeThread.name}
                        {activeThread.user_id&&<span style={{background:'#D1FAE5',color:'#059669',padding:'4px 10px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'}}>Enrolled</span>}
                      </h3>
                      <div style={{color:'#4F46E5',fontSize:'1.05rem',fontWeight:'600'}}>{activeThread.email}</div>
                    </div>
                    <button onClick={()=>setDeleteTarget({type:'thread',email:activeThread.email})} style={{background:'#fff',color:'#94A3B8',border:'1px solid #E2E8F0',padding:'10px 16px',borderRadius:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontWeight:'600'}}><IconTrash/> Delete Thread</button>
                  </div>
                  <div style={{flexGrow:1,overflowY:'auto',paddingRight:'12px',display:'flex',flexDirection:'column',gap:'20px',marginBottom:'24px'}}>
                    {activeThread.messages.map((msg:any)=>(
                      <div key={msg.id} style={{background:'#fff',borderRadius:'20px',border:'1px solid #E2E8F0',padding:'24px',boxShadow:'0 4px 15px rgba(0,0,0,0.02)',position:'relative'}}>
                        <button onClick={()=>setDeleteTarget({type:'message',id:msg.id})} style={{position:'absolute',top:'20px',right:'20px',background:'transparent',border:'none',color:'#94A3B8',cursor:'pointer'}}><IconTrash/></button>
                        <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginBottom:'12px'}}>
                          <span style={{color:'#4F46E5',fontWeight:'700',fontSize:'1rem'}}>{msg.name}</span>
                          <span style={{color:'#94A3B8',fontSize:'0.85rem',fontWeight:'600'}}>• {new Date(msg.created_at).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</span>
                        </div>
                        <div style={{color:'#334155',fontSize:'1.1rem',lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{msg.message}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'#fff',borderRadius:'20px',border:'1px solid #E2E8F0',padding:'24px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#475569',fontWeight:'700',marginBottom:'16px'}}><IconReply/> Reply to {activeThread.name}</div>
                    <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Type your response..." rows={4} style={{width:'100%',padding:'16px',borderRadius:'12px',border:'2px solid #F1F5F9',background:'#F8FAFC',color:'#0F172A',fontSize:'1.05rem',outline:'none',resize:'vertical',marginBottom:'16px'}}/>
                    <div style={{display:'flex',justifyContent:'flex-end'}}>
                      <button onClick={handleSendReply} disabled={isSendingReply||!replyText.trim()} style={{background:'#4F46E5',color:'#fff',border:'none',padding:'12px 28px',borderRadius:'9999px',fontWeight:'600',fontSize:'1rem',cursor:(isSendingReply||!replyText.trim())?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:'8px',opacity:!replyText.trim()?0.5:1,boxShadow:'0 4px 10px rgba(79,70,229,0.2)'}}>
                        {isSendingReply?'Sending...':<><IconSend/> Send Reply</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{background:'#F8FAFC',borderRadius:'24px',border:'2px dashed #E2E8F0',height:'100%',minHeight:'500px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94A3B8'}}>
                  <IconMail/><h3 style={{margin:'16px 0 8px',fontSize:'1.5rem',color:'#475569'}}>Select a conversation</h3>
                  <p style={{margin:0,fontSize:'1.1rem',color:'#64748B'}}>Click a thread to view history or compose a new message.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GRADING PORTAL ── */}
      {adminTab==='grading' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))',gap:'32px',alignItems:'start'}}>
          {/* Directory panel — CHANGE 3: uses gradingFilteredStudents and grading-specific filter state */}
          <div style={{background:'#fff',borderRadius:'32px',padding:'32px',border:'1px solid #E2E8F0',boxShadow:'0 10px 30px rgba(0,0,0,0.02)'}}>
            <div style={{display:'flex',gap:'8px',background:'#F1F5F9',padding:'4px',borderRadius:'12px',marginBottom:'24px'}}>
              <button onClick={()=>setGradingRosterMode('directory')} style={{flex:1,padding:'8px 0',border:'none',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'600',cursor:'pointer',background:gradingRosterMode==='directory'?'#fff':'transparent',color:gradingRosterMode==='directory'?'#4F46E5':'#64748B',boxShadow:gradingRosterMode==='directory'?'0 2px 6px rgba(0,0,0,0.05)':'none',transition:'all 0.2s'}}>Directory</button>
              <button onClick={()=>setGradingRosterMode('manual')} style={{flex:1,padding:'8px 0',border:'none',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'600',cursor:'pointer',background:gradingRosterMode==='manual'?'#fff':'transparent',color:gradingRosterMode==='manual'?'#4F46E5':'#64748B',boxShadow:gradingRosterMode==='manual'?'0 2px 6px rgba(0,0,0,0.05)':'none',transition:'all 0.2s'}}>Add to Roster</button>
            </div>

            {gradingRosterMode==='directory' ? (
              <>
                <h3 style={{margin:'0 0 16px',color:'#0F172A',fontSize:'1.4rem'}}>Student Directory ({gradingFilteredStudents.length})</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'20px'}}>
                  <input type="text" placeholder="Search by name or email..." value={gradingSearchQuery} onChange={e=>setGradingSearchQuery(e.target.value)} style={{width:'100%',padding:'12px 16px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',fontSize:'0.95rem'}}/>
                  <div style={{display:'flex',gap:'8px'}}>
                    <select value={gradingFilterLevel} onChange={e=>setGradingFilterLevel(e.target.value)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',fontSize:'0.9rem',background:'#fff'}}>
                      <option value="All Levels">All Levels</option>
                      {['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}
                    </select>
                    <select value={gradingFilterTime} onChange={e=>setGradingFilterTime(e.target.value)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',fontSize:'0.9rem',background:'#fff'}}>
                      <option value="All Times">All Times</option>
                      {['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                {gradingFilteredStudents.length===0
                  ? <div style={{background:'#F8FAFC',padding:'30px',borderRadius:'16px',textAlign:'center',color:'#94A3B8',border:'2px dashed #E2E8F0'}}>No students match this search.</div>
                  : <div style={{display:'flex',flexDirection:'column',gap:'12px',maxHeight:'500px',overflowY:'auto',paddingRight:'8px'}}>
                      {gradingFilteredStudents.map(student=>{
                        const cnt = allGrades.filter(g=>g.user_id===student.id).length;
                        const isSel = selectedStudent?.id===student.id;
                        const hasDraftBadge = draftVersion >= 0 && ['First Test','Midterm','Third Test','Final Test'].some(a=>localStorage.getItem(makeDraftKey(student.id,a)));
                        return (
                          <div key={student.id} onClick={()=>setSelectedStudent(student)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',background:isSel?'#EEF2FF':'#F8FAFC',border:isSel?'2px solid #4F46E5':'2px solid transparent',borderRadius:'16px',cursor:'pointer',transition:'all 0.2s'}}>
                            <div style={{flexGrow:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                                <span style={{fontWeight:'700',color:isSel?'#4F46E5':'#0F172A',fontSize:'1.1rem'}}>{student.full_name}</span>
                                {hasDraftBadge&&<span style={{background:'#FFFBEB',color:'#D97706',border:'1px solid #F59E0B',fontSize:'0.7rem',fontWeight:'700',padding:'1px 6px',borderRadius:'6px'}}>Draft</span>}
                              </div>
                              <div style={{color:'#64748B',fontSize:'0.85rem',display:'flex',gap:'8px',marginTop:'4px'}}>
                                {student.course_level&&<span style={{background:'#E2E8F0',padding:'2px 8px',borderRadius:'6px'}}>{student.course_level}</span>}
                                {student.class_time&&<span style={{background:'#E2E8F0',padding:'2px 8px',borderRadius:'6px'}}>{student.class_time}</span>}
                              </div>
                            </div>
                            <div style={{display:'flex',alignItems:'center',flexShrink:0,marginLeft:'8px'}}>
                              {cnt>0&&<div style={{background:'#ECFDF5',color:'#10B981',padding:'6px 12px',borderRadius:'8px',fontSize:'0.85rem',fontWeight:'700'}}>{cnt} Record{cnt!==1?'s':''}</div>}
                              <button onClick={e=>{e.stopPropagation();setDeleteTarget({type:'student',id:student.id,name:student.full_name});}} title="Remove student" style={{background:'#FEF2F2',color:'#EF4444',border:'none',padding:'6px 8px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',marginLeft:'8px',flexShrink:0}}><IconTrash/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </>
            ) : (
              <div style={{background:'#F8FAFC',padding:'24px',borderRadius:'16px',border:'1px solid #E2E8F0'}}>
                <h3 style={{margin:'0 0 16px',color:'#0F172A',fontSize:'1.2rem'}}>Enroll New Student</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                  <div><label style={{display:'block',fontSize:'0.9rem',fontWeight:'600',marginBottom:'6px',color:'#475569'}}>Full Name</label><input type="text" value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="e.g., Yuko Tanaka" style={{width:'100%',padding:'12px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none'}}/></div>
                  <div><label style={{display:'block',fontSize:'0.9rem',fontWeight:'600',marginBottom:'6px',color:'#475569'}}>Email Address</label><input type="email" value={manualEmail} onChange={e=>setManualEmail(e.target.value)} placeholder="student@example.com" style={{width:'100%',padding:'12px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none'}}/></div>
                  <div style={{display:'flex',gap:'12px'}}>
                    <div style={{flex:1}}><label style={{display:'block',fontSize:'0.9rem',fontWeight:'600',marginBottom:'6px',color:'#475569'}}>Level</label><select value={manualLevel} onChange={e=>setManualLevel(e.target.value)} style={{width:'100%',padding:'12px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',background:'#fff'}}>{['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}</select></div>
                    <div style={{flex:1}}><label style={{display:'block',fontSize:'0.9rem',fontWeight:'600',marginBottom:'6px',color:'#475569'}}>Class Time</label><select value={manualTime} onChange={e=>setManualTime(e.target.value)} style={{width:'100%',padding:'12px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',background:'#fff'}}>{['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}</select></div>
                  </div>
                  <button onClick={handleAddStudentToRoster} style={{background:'#4F46E5',color:'#fff',padding:'14px',borderRadius:'10px',border:'none',fontWeight:'700',cursor:'pointer',marginTop:'8px'}}>Save Student to Directory</button>
                </div>
              </div>
            )}
          </div>

          {/* Grading panel */}
          <div style={{position:'sticky',top:'40px',maxHeight:'85vh',overflowY:'auto',paddingRight:'8px',display:'flex',flexDirection:'column',gap:'24px'}}>
            {selectedStudent ? (
              <>
                <div style={{background:'#4F46E5',borderRadius:'32px',padding:'40px',color:'#fff',boxShadow:'0 20px 40px rgba(79,70,229,0.3)',flexShrink:0}}>

                  {/* Profile editor */}
                  {isEditingProfile ? (
                    <div style={{background:'rgba(0,0,0,0.2)',padding:'24px',borderRadius:'24px',marginBottom:'24px'}}>
                      <h4 style={{margin:'0 0 16px',fontSize:'1.2rem',fontWeight:'700'}}>Editing Student Profile</h4>
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        <input type="text" value={editProfileName} onChange={e=>setEditProfileName(e.target.value)} placeholder="Full Name" style={{width:'100%',padding:'12px',borderRadius:'8px',border:'none',outline:'none',fontSize:'1rem'}}/>
                        <input type="email" value={editProfileEmail} onChange={e=>setEditProfileEmail(e.target.value)} placeholder="Email" style={{width:'100%',padding:'12px',borderRadius:'8px',border:'none',outline:'none',fontSize:'1rem'}}/>
                        <div style={{display:'flex',gap:'12px'}}>
                          <select value={editProfileLevel} onChange={e=>setEditProfileLevel(e.target.value)} style={{flex:1,padding:'12px',borderRadius:'8px',border:'none',outline:'none',fontSize:'1rem'}}>{['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}</select>
                          <select value={editProfileTime} onChange={e=>setEditProfileTime(e.target.value)} style={{flex:1,padding:'12px',borderRadius:'8px',border:'none',outline:'none',fontSize:'1rem'}}>{['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}</select>
                        </div>
                        <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                          <button onClick={()=>setIsEditingProfile(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'700',cursor:'pointer'}}>Cancel</button>
                          <button onClick={handleSaveProfileUpdate} disabled={isSavingProfile} style={{flex:1,padding:'10px',background:'#10B981',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'700',cursor:isSavingProfile?'wait':'pointer'}}>{isSavingProfile?'Saving...':'Save Profile'}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'32px'}}>
                      <div>
                        <div style={{textTransform:'uppercase',letterSpacing:'1.5px',fontSize:'0.85rem',fontWeight:'700',opacity:0.8,marginBottom:'8px'}}>Drafting Official Grade</div>
                        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                          <h3 style={{margin:0,fontSize:'2rem',lineHeight:'1.1'}}>{selectedStudent.full_name}</h3>
                          <button onClick={handleOpenProfileEditor} style={{background:'rgba(255,255,255,0.2)',border:'none',padding:'6px 12px',borderRadius:'8px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'0.8rem',fontWeight:'700'}}><IconEdit/> Edit</button>
                        </div>
                        <div style={{fontSize:'0.9rem',opacity:0.9,marginTop:'8px'}}>{selectedStudent.email} | {selectedStudent.course_level}</div>
                      </div>
                      <button onClick={()=>setSelectedStudent(null)} style={{background:'rgba(255,255,255,0.2)',border:'none',width:'36px',height:'36px',borderRadius:'50%',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </div>
                  )}

                  <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

                    {/* Draft banner */}
                    {draftData && (
                      <div style={{background:'rgba(255,255,255,0.95)',borderRadius:'14px',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',border:'2px solid #F59E0B'}}>
                        <div>
                          <div style={{color:'#92400E',fontWeight:'700',fontSize:'0.9rem'}}>📋 Saved scores draft</div>
                          {draftData.savedAt&&<div style={{color:'#B45309',fontSize:'0.78rem',marginTop:'2px'}}>Saved {new Date(draftData.savedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})} at {new Date(draftData.savedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>}
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button onClick={()=>handleLoadDraft(draftData)} style={{background:'#F59E0B',color:'#fff',border:'none',padding:'8px 16px',borderRadius:'9px',fontWeight:'700',cursor:'pointer',fontSize:'0.85rem'}}>📂 Load Scores</button>
                          <button onClick={handleDiscardDraft} style={{background:'rgba(239,68,68,0.1)',color:'#EF4444',border:'1px solid #FCA5A5',padding:'8px 10px',borderRadius:'9px',fontWeight:'700',cursor:'pointer',fontSize:'0.85rem'}}>✕</button>
                        </div>
                      </div>
                    )}

                    {/* Assessment selectors */}
                    <div style={{display:'flex',gap:'16px',alignItems:'flex-end'}}>
                      <div style={{flex:2}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                          <label style={{fontSize:'0.95rem',fontWeight:'600',opacity:0.9}}>Assessment Name</label>
                          <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'0.85rem',fontWeight:'700',background:isAbsent?'#EF4444':'rgba(255,255,255,0.2)',padding:'4px 10px',borderRadius:'8px',cursor:'pointer'}}>
                            <input type="checkbox" checked={isAbsent} onChange={e=>setIsAbsent(e.target.checked)} style={{cursor:'pointer'}}/> Student Absent
                          </label>
                        </div>
                        <select value={assessmentName} onChange={e=>setAssessmentName(e.target.value)} style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1.05rem',fontWeight:'700',outline:'none',cursor:'pointer'}}>
                          <option>First Test</option><option>Midterm</option><option>Third Test</option><option>Final Test</option>
                        </select>
                      </div>
                      <div style={{flex:1}}>
                        <label style={{display:'block',fontSize:'0.95rem',fontWeight:'600',marginBottom:'8px',opacity:0.9}}>Weight</label>
                        <select value={assessmentWeight} onChange={e=>setAssessmentWeight(e.target.value)} style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1.05rem',fontWeight:'700',outline:'none',cursor:'pointer'}}>
                          <option value="10">10%</option><option value="30">30%</option><option value="50">50%</option>
                        </select>
                      </div>
                      <div style={{flex:1}}>
                        <label style={{display:'block',fontSize:'0.95rem',fontWeight:'600',marginBottom:'8px',opacity:0.9}}>Max Points</label>
                        <select value={maxPoints} onChange={e=>setMaxPoints(e.target.value)} style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1.05rem',fontWeight:'700',outline:'none',cursor:'pointer'}}>
                          <option value="50">50 pts</option><option value="100">100 pts</option>
                        </select>
                      </div>
                    </div>

                    {/* Score inputs */}
                    <div style={{background:'rgba(255,255,255,0.1)',padding:'24px',borderRadius:'20px',opacity:isAbsent?0.5:1,pointerEvents:isAbsent?'none':'auto'}}>
                      <label style={{display:'block',fontSize:'1.05rem',fontWeight:'700',marginBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.2)',paddingBottom:'8px'}}>Raw Score Breakdown (Points)</label>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                        {[['Listening',scoreListening,setScoreListening],['Grammar & Vocab',scoreGrammar,setScoreGrammar],['Reading',scoreReading,setScoreReading],['Writing',scoreWriting,setScoreWriting]].map(([lbl,val,setter]:any)=>(
                          <div key={lbl}><label style={{display:'block',fontSize:'0.85rem',fontWeight:'600',marginBottom:'4px',opacity:0.9}}>{lbl}</label><input type="number" min="0" value={isAbsent?0:val} onChange={e=>setter(e.target.value)} placeholder={`Max: ${Number(maxPoints)/5}`} style={{width:'100%',padding:'12px',borderRadius:'10px',border:'none',background:'#fff',color:'#4F46E5',fontSize:'1rem',fontWeight:'700',outline:'none'}}/></div>
                        ))}
                        <div style={{gridColumn:'1 / -1'}}><label style={{display:'block',fontSize:'0.85rem',fontWeight:'600',marginBottom:'4px',opacity:0.9}}>Speaking</label><input type="number" min="0" value={isAbsent?0:scoreSpeaking} onChange={e=>setScoreSpeaking(e.target.value)} placeholder={`Max: ${Number(maxPoints)/5}`} style={{width:'100%',padding:'12px',borderRadius:'10px',border:'none',background:'#fff',color:'#4F46E5',fontSize:'1rem',fontWeight:'700',outline:'none'}}/></div>
                      </div>
                      <div style={{marginTop:'20px',background:'#3730A3',padding:'12px 16px',borderRadius:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.9rem',fontWeight:'600',opacity:0.9}}>Total: {calculateTotals().totalPoints}/{maxPoints} pts</span>
                        <span style={{fontSize:'1.1rem',fontWeight:'800',color:'#10B981'}}>Earns: {calculateTotals().earnedWeight.toFixed(1)}% / {assessmentWeight}%</span>
                      </div>
                    </div>

                    {/* Save as Draft button */}
                    {!hasBeenGraded && (
                      <button onClick={handleSaveDraft} disabled={!hasAnyScore} title={!hasAnyScore?'Enter at least one score to save a draft':'Save scores now, add feedback later'} style={{width:'100%',background:'rgba(255,255,255,0.12)',color:'#fff',border:'2px solid rgba(255,255,255,0.35)',padding:'13px',borderRadius:'13px',fontWeight:'700',fontSize:'0.95rem',cursor:hasAnyScore?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:hasAnyScore?1:0.5}}>
                        💾 Save Scores as Draft
                      </button>
                    )}

                    {/* Diagnostic notes */}
                    <div>
                      <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.95rem',fontWeight:'600',marginBottom:'8px',opacity:0.9}}><IconChart/> Diagnostic Notes (Hidden from student)</label>
                      <textarea value={teacherNotes} onChange={e=>setTeacherNotes(e.target.value)} placeholder="e.g., struggled with present continuous..." rows={2} style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1.05rem',outline:'none',resize:'vertical',lineHeight:'1.5'}}/>
                    </div>

                    {/* Feedback */}
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <label style={{fontSize:'0.95rem',fontWeight:'600',opacity:0.9}}>Official Feedback</label>
                        <button onClick={handleGenerateFeedback} disabled={isGenerating||hasBeenGraded} style={{background:'#fff',border:'none',color:'#4F46E5',padding:'8px 16px',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'700',cursor:(isGenerating||hasBeenGraded)?'not-allowed':'pointer',boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}>
                          {isGenerating?'✨ Analyzing...':'✨ Draft with AI'}
                        </button>
                      </div>
                      <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Generate AI feedback or type your own..." rows={4} style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:'none',background:'#fff',color:'#0F172A',fontSize:'1.05rem',outline:'none',resize:'vertical',lineHeight:'1.5'}}/>
                    </div>

                    {/* Submit / Already graded */}
                    {hasBeenGraded ? (
                      <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'10px'}}>
                        <div style={{background:'#D1FAE5',color:'#065F46',padding:'18px',borderRadius:'16px',fontWeight:'700',fontSize:'1.15rem',textAlign:'center'}}>✅ {assessmentName} already recorded!</div>
                        <button onClick={()=>handleResendEmail(existingRecord)} disabled={isSubmitting} style={{width:'100%',background:'rgba(255,255,255,0.2)',color:'#fff',border:'2px solid #fff',padding:'14px',borderRadius:'16px',fontWeight:'700',fontSize:'1.05rem',cursor:isSubmitting?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                          {isSubmitting?'Sending...':'🔄 Resend Grade Email'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={submitGrade} disabled={isSubmitting} style={{width:'100%',background:'#10B981',color:'#fff',border:'none',padding:'18px',borderRadius:'16px',fontWeight:'700',fontSize:'1.15rem',cursor:isSubmitting?'wait':'pointer',marginTop:'10px',boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}}>
                        {isSubmitting?'Submitting...':'Publish Official Grade & Email Student'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Previous records — CHANGE 2: uses formatScoreDisplay to render JSON scores */}
                {studentHistory.length>0 && (
                  <div style={{padding:'0 10px',flexShrink:0}}>
                    <h4 style={{color:'#0F172A',fontSize:'1.3rem',margin:'0 0 16px',display:'flex',alignItems:'center',gap:'8px'}}><IconChart/> Previous Records</h4>
                    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                      {studentHistory.map(hist=>(
                        <div key={hist.id} style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:'24px',padding:'24px',boxShadow:'0 4px 10px rgba(0,0,0,0.02)'}}>
                          {editingRecordId===hist.id ? (
                            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                              <span style={{fontWeight:'800',color:'#4F46E5',fontSize:'1.1rem'}}>Editing: {hist.assessment_name}</span>
                              <label style={{fontSize:'0.85rem',fontWeight:'700',color:'#64748B',textTransform:'uppercase'}}>Score (JSON)</label>
                              <textarea value={editScoreText} onChange={e=>setEditScoreText(e.target.value)} rows={6} style={{width:'100%',padding:'12px',borderRadius:'12px',border:'2px solid #CBD5E1',outline:'none',fontSize:'0.95rem'}}/>
                              <label style={{fontSize:'0.85rem',fontWeight:'700',color:'#64748B',textTransform:'uppercase'}}>Feedback</label>
                              <textarea value={editFeedbackText} onChange={e=>setEditFeedbackText(e.target.value)} rows={4} style={{width:'100%',padding:'12px',borderRadius:'12px',border:'2px solid #CBD5E1',outline:'none',fontSize:'0.95rem'}}/>
                              <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
                                <button onClick={()=>setEditingRecordId(null)} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:'#F1F5F9',color:'#475569',fontWeight:'700',cursor:'pointer'}}>Cancel</button>
                                <button onClick={()=>handleSaveRecordUpdate(hist.id)} disabled={isUpdatingRecord} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:'#10B981',color:'#fff',fontWeight:'700',cursor:isUpdatingRecord?'wait':'pointer'}}>{isUpdatingRecord?'Saving...':'Save Changes'}</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px',alignItems:'flex-start'}}>
                                <div>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontWeight:'800',color:'#0F172A',fontSize:'1.1rem'}}>{hist.assessment_name}</span><span style={{background:'#ECFDF5',color:'#059669',padding:'2px 8px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:'700'}}>✓ Emailed</span></div>
                                  <span style={{color:'#64748B',fontSize:'0.85rem',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'}}>{new Date(hist.date_recorded).toLocaleDateString()}</span>
                                </div>
                                <div style={{display:'flex',gap:'8px'}}>
                                  <button onClick={()=>{setEditingRecordId(hist.id);setEditScoreText(hist.score);setEditFeedbackText(hist.feedback);}} style={{background:'#F1F5F9',color:'#4F46E5',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontWeight:'700',fontSize:'0.85rem'}}><IconEdit/> Edit</button>
                                  {/* CHANGE 1: Delete now uses the custom modal, not window.confirm */}
                                  <button onClick={()=>handleDeleteRecord(hist.id)} style={{background:'#FEF2F2',color:'#EF4444',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontWeight:'700',fontSize:'0.85rem'}}><IconTrash/> Delete</button>
                                </div>
                              </div>
                              {/* CHANGE 2: formatScoreDisplay converts JSON scores to readable text */}
                              <div style={{background:'#F8FAFC',padding:'16px',borderRadius:'12px',border:'1px dashed #CBD5E1',color:'#4F46E5',fontWeight:'700',fontSize:'0.95rem',marginBottom:'16px',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{formatScoreDisplay(hist.score)}</div>
                              <p style={{margin:0,color:'#475569',fontSize:'1rem',fontStyle:'italic',lineHeight:'1.6'}}>"{hist.feedback}"</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{background:'#F8FAFC',border:'2px dashed #CBD5E1',borderRadius:'32px',padding:'60px 40px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <h3 style={{margin:'0 0 8px',color:'#0F172A',fontSize:'1.6rem'}}>Select a Student</h3>
                <p style={{margin:0,color:'#64748B',fontSize:'1.1rem',lineHeight:'1.6'}}>Click a student from the directory to review their history and draft new grades.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENT PROGRESS ── CHANGE 3: uses progressFilteredStudents and progress-specific filter state */}
      {adminTab==='progress' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))',gap:'32px',alignItems:'start'}}>
          <div style={{background:'#fff',borderRadius:'32px',padding:'32px',border:'1px solid #E2E8F0',boxShadow:'0 10px 30px rgba(0,0,0,0.02)'}}>
            <h3 style={{margin:'0 0 16px',color:'#0F172A',fontSize:'1.4rem'}}>Review Vocab Vaults ({progressFilteredStudents.length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'20px'}}>
              <input type="text" placeholder="Search by name or email..." value={progressSearchQuery} onChange={e=>setProgressSearchQuery(e.target.value)} style={{width:'100%',padding:'12px 16px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',fontSize:'0.95rem'}}/>
              <div style={{display:'flex',gap:'8px'}}>
                <select value={progressFilterLevel} onChange={e=>setProgressFilterLevel(e.target.value)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',fontSize:'0.9rem',background:'#fff'}}>
                  <option value="All Levels">All Levels</option>{['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Business English'].map(l=><option key={l}>{l}</option>)}
                </select>
                <select value={progressFilterTime} onChange={e=>setProgressFilterTime(e.target.value)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1px solid #CBD5E1',outline:'none',fontSize:'0.9rem',background:'#fff'}}>
                  <option value="All Times">All Times</option>{['Morning Class','Evening Class','Weekend Class'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {progressFilteredStudents.length===0
              ? <div style={{background:'#F8FAFC',padding:'30px',borderRadius:'16px',textAlign:'center',color:'#94A3B8',border:'2px dashed #E2E8F0'}}>No students match this search.</div>
              : <div style={{display:'flex',flexDirection:'column',gap:'12px',maxHeight:'500px',overflowY:'auto',paddingRight:'8px'}}>
                  {progressFilteredStudents.map(student=>(
                    <div key={student.id} onClick={()=>setSelectedProgressStudent(student)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',background:selectedProgressStudent?.id===student.id?'#F0FDF4':'#F8FAFC',border:selectedProgressStudent?.id===student.id?'2px solid #10B981':'2px solid transparent',borderRadius:'16px',cursor:'pointer',transition:'all 0.2s'}}>
                      <div><div style={{fontWeight:'700',color:selectedProgressStudent?.id===student.id?'#10B981':'#0F172A',fontSize:'1.1rem',marginBottom:'4px'}}>{student.full_name}</div><div style={{color:'#64748B',fontSize:'0.9rem'}}>{student.email}</div></div>
                    </div>
                  ))}
                </div>
            }
          </div>
          <div style={{position:'sticky',top:'40px'}}>
            {selectedProgressStudent ? (
              <div style={{background:'#fff',borderRadius:'32px',padding:'40px',border:'1px solid #E2E8F0',boxShadow:'0 20px 40px rgba(0,0,0,0.04)',maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px',paddingBottom:'24px',borderBottom:'2px solid #F1F5F9'}}>
                  <div><h3 style={{margin:'0 0 8px',fontSize:'1.8rem',color:'#0F172A'}}>{selectedProgressStudent.full_name}'s Vault</h3><div style={{color:'#64748B',fontWeight:'600'}}><span style={{color:'#10B981'}}>{studentVocab.length}</span> Words Saved</div></div>
                  <button onClick={()=>setSelectedProgressStudent(null)} style={{background:'#F1F5F9',border:'none',width:'36px',height:'36px',borderRadius:'50%',color:'#64748B',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
                <div style={{overflowY:'auto',flexGrow:1,paddingRight:'8px',display:'flex',flexDirection:'column',gap:'16px'}}>
                  {isFetchingVocab ? <div style={{textAlign:'center',padding:'40px',color:'#94A3B8'}}>Loading vault...</div>
                   : studentVocab.length===0 ? <div style={{background:'#F8FAFC',padding:'40px',borderRadius:'16px',textAlign:'center',color:'#94A3B8',border:'2px dashed #E2E8F0'}}>No vocabulary saved yet.</div>
                   : studentVocab.map(item=>(
                      <div key={item.id} style={{background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:'16px',padding:'20px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'8px'}}>
                          <div style={{fontSize:'1.3rem',fontWeight:'700',color:'#0F172A'}}>{item.word}</div>
                          <div style={{fontSize:'0.85rem',color:'#94A3B8',fontWeight:'600'}}>{new Date(item.created_at).toLocaleDateString()}</div>
                        </div>
                        {item.definition&&<div style={{color:'#475569',lineHeight:'1.5',marginBottom:item.example?'12px':0}}>{item.definition}</div>}
                        {item.example&&<div style={{color:'#64748B',fontStyle:'italic',background:'#F1F5F9',padding:'12px',borderRadius:'8px',fontSize:'0.95rem'}}>"{item.example}"</div>}
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div style={{background:'#F8FAFC',border:'2px dashed #CBD5E1',borderRadius:'32px',padding:'60px 40px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <IconChart/><h3 style={{margin:'16px 0 8px',color:'#0F172A',fontSize:'1.6rem'}}>Select a Student</h3>
                <p style={{margin:0,color:'#64748B',fontSize:'1.1rem',lineHeight:'1.6'}}>Click a student to open their Vocab Vault.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIVE ARENA ── */}
      {adminTab==='arena' && (
        <div style={{backgroundColor:'#fff',borderRadius:'32px',padding:'40px',border:'1px solid #E2E8F0',boxShadow:'0 10px 30px rgba(0,0,0,0.02)',minHeight:'600px',display:'flex',flexDirection:'column'}}>
          {!activeSession && (
            <div style={{maxWidth:'800px',margin:'0 auto',textAlign:'center',padding:'40px 0'}}>
              <div style={{background:'#FEF3C7',color:'#D97706',width:'80px',height:'80px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}><IconPlay/></div>
              <h2 style={{fontSize:'2.5rem',color:'#0F172A',marginBottom:'16px',fontWeight:'700'}}>Host a Live Contest</h2>
              <p style={{color:'#64748B',fontSize:'1.2rem',marginBottom:'40px',lineHeight:'1.6'}}>Select a topic and choose how your students will compete today.</p>
              <div style={{textAlign:'left',background:'#F8FAFC',padding:'32px',borderRadius:'24px',border:'1px solid #E2E8F0'}}>
                <label style={{display:'block',fontSize:'1.1rem',fontWeight:'700',color:'#334155',marginBottom:'12px'}}>Select Practice Hub Quiz</label>
                <div style={{position:'relative',marginBottom:'32px'}}>
                  <select value={liveQuizTopic} onChange={e=>setLiveQuizTopic(e.target.value)} style={{width:'100%',padding:'18px',borderRadius:'12px',border:'2px solid #CBD5E1',fontSize:'1.1rem',outline:'none',backgroundColor:'#fff',cursor:'pointer',appearance:'none',color:'#0F172A',fontWeight:'500'}}>
                    <option value="" disabled>-- Choose a Lesson --</option>
                    {grammarQuizzes.length>0&&<optgroup label="Grammar">{grammarQuizzes.map((q,i)=><option key={`g-${i}`} value={q.title}>{q.title}</option>)}</optgroup>}
                    {vocabQuizzes.length>0&&<optgroup label="Vocabulary">{vocabQuizzes.map((q,i)=><option key={`v-${i}`} value={q.title}>{q.title}</option>)}</optgroup>}
                    {pronQuizzes.length>0&&<optgroup label="Pronunciation">{pronQuizzes.map((q,i)=><option key={`p-${i}`} value={q.title}>{q.title}</option>)}</optgroup>}
                  </select>
                  <div style={{position:'absolute',right:'18px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#64748B',fontSize:'1.2rem'}}>▼</div>
                </div>
                <label style={{display:'block',fontSize:'1.1rem',fontWeight:'700',color:'#334155',marginBottom:'12px'}}>Game Format</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px',marginBottom:'32px'}}>
                  {([['standard','#4F46E5','#EEF2FF',<IconTrophy/>,'Individual Brawl','Random questions.\nEvery student for themselves.'],['tug-of-war-all','#D97706','#FEF3C7',<IconSwords/>,'Tug-of-War (All)','Synchronized.\nEveryone pulls.'],['tug-of-war-captain','#059669','#ECFDF5',<IconCrown/>,'Tug-of-War (Captain)','Synchronized.\nOnly Captain answers.']] as [string,string,string,React.ReactNode,string,string][]).map(([mode,col,bg,icon,label,desc])=>(
                    <button key={mode} onClick={()=>setLiveGameMode(mode as any)} style={{padding:'20px 16px',borderRadius:'16px',border:liveGameMode===mode?`2px solid ${col}`:'1px solid #E2E8F0',background:liveGameMode===mode?bg:'#fff',color:liveGameMode===mode?col:'#64748B',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',cursor:'pointer',transition:'all 0.2s'}}>
                      {icon}<div style={{fontSize:'1.05rem',fontWeight:'700'}}>{label}</div>
                      <div style={{fontSize:'0.85rem',opacity:0.8,textAlign:'center',lineHeight:'1.4',whiteSpace:'pre-line'}}>{desc}</div>
                    </button>
                  ))}
                </div>
                <label style={{display:'block',fontSize:'1.1rem',fontWeight:'700',color:'#334155',marginBottom:'12px'}}>Time Limit Per Question</label>
                <div style={{display:'flex',gap:'12px',marginBottom:'32px'}}>
                  {[20,60,null].map(time=>(
                    <button key={time||'unlimited'} onClick={()=>setLiveTimeLimit(time)} style={{flex:1,padding:'16px',borderRadius:'12px',border:liveTimeLimit===time?'2px solid #4F46E5':'1px solid #E2E8F0',background:liveTimeLimit===time?'#EEF2FF':'#fff',color:liveTimeLimit===time?'#4F46E5':'#64748B',fontWeight:'700',fontSize:'1.1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                      {time?<><IconHourglass/> {time}s</>:<><IconInfinity/> Unlimited</>}
                    </button>
                  ))}
                </div>
                <button onClick={handleLaunchLobby} disabled={isCreatingLobby||!liveQuizTopic.trim()} style={{width:'100%',padding:'20px',background:'#0F172A',color:'#fff',border:'none',borderRadius:'12px',fontSize:'1.2rem',fontWeight:'700',cursor:(isCreatingLobby||!liveQuizTopic.trim())?'not-allowed':'pointer',opacity:!liveQuizTopic.trim()?0.5:1}}>
                  {isCreatingLobby?'Initializing...':'Launch Secure Lobby'}
                </button>
              </div>
            </div>
          )}
          {activeSession && (
            <div style={{display:'flex',gap:'40px',alignItems:'flex-start'}}>
              <div style={{flex:isGameActive?'0 0 250px':'1',background:'#F8FAFC',padding:isGameActive?'32px 24px':'40px',borderRadius:'32px',border:'1px solid #E2E8F0',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)'}}>
                <h3 style={{fontSize:isGameActive?'1rem':'1.4rem',color:'#475569',margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'1px'}}>Join at litnlearn.com/play</h3>
                <h1 style={{fontSize:isGameActive?'3.5rem':'5rem',color:'#0F172A',margin:'0 0 24px',fontWeight:'800',letterSpacing:'4px'}}>{activeSession.pin_code}</h1>
                <div style={{background:'#fff',padding:isGameActive?'16px':'24px',borderRadius:'24px',boxShadow:'0 10px 25px rgba(0,0,0,0.05)',marginBottom:'32px',display:'flex',justifyContent:'center'}}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${isGameActive?'120x120':'200x200'}&data=${encodeURIComponent(`https://litnlearn.com/play?pin=${activeSession.pin_code}`)}`} alt="QR" width={isGameActive?120:200} height={isGameActive?120:200}/>
                </div>
                {activeSession.status==='waiting'
                  ?<button onClick={handleStartGame} style={{background:'#10B981',color:'#fff',padding:'16px 40px',fontSize:'1.2rem',fontWeight:'700',borderRadius:'9999px',border:'none',cursor:'pointer',boxShadow:'0 10px 20px rgba(16,185,129,0.3)',width:'100%'}}>Start Game</button>
                  :<button onClick={handleEndGame}   style={{background:'#EF4444',color:'#fff',padding:'16px 40px',fontSize:'1.2rem',fontWeight:'700',borderRadius:'9999px',border:'none',cursor:'pointer',boxShadow:'0 10px 20px rgba(239,68,68,0.3)',    width:'100%'}}>End Game</button>
                }
              </div>
              <div style={{flex:'1',minWidth:0,background:'#fff',borderRadius:'32px',border:'1px solid #E2E8F0',padding:'32px',boxShadow:'0 10px 30px rgba(0,0,0,0.02)',maxHeight:'700px',overflowY:'auto'}}>
                {isTugOfWar&&activeSession.status!=='waiting'&&(
                  <div style={{marginBottom:'40px',padding:'24px',background:'#F8FAFC',borderRadius:'24px',border:'1px solid #E2E8F0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                      <div style={{fontSize:'1.6rem',fontWeight:'800',color:'#3B82F6',display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'24px',height:'24px',background:'#3B82F6',borderRadius:'6px'}}></div> Team Blue <span style={{opacity:0.6}}>({bluePoints})</span></div>
                      <div style={{background:'#E2E8F0',color:'#475569',padding:'6px 16px',borderRadius:'9999px',fontWeight:'800',fontSize:'1rem',letterSpacing:'1px'}}>VS</div>
                      <div style={{fontSize:'1.6rem',fontWeight:'800',color:'#EF4444',display:'flex',alignItems:'center',gap:'12px'}}><span style={{opacity:0.6}}>({redPoints})</span> Team Red <div style={{width:'24px',height:'24px',background:'#EF4444',borderRadius:'6px'}}></div></div>
                    </div>
                    <div style={{width:'100%',height:'32px',background:'#EF4444',borderRadius:'16px',position:'relative',overflow:'hidden',boxShadow:'inset 0 4px 10px rgba(0,0,0,0.1)'}}>
                      <div style={{height:'100%',width:`${bluePercent}%`,background:'#3B82F6',transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)'}}/>
                      <div style={{position:'absolute',top:0,bottom:0,left:`${bluePercent}%`,width:'6px',background:'#fff',transform:'translateX(-50%)',boxShadow:'0 0 10px rgba(0,0,0,0.5)',transition:'left 0.6s cubic-bezier(0.4,0,0.2,1)',zIndex:10}}/>
                    </div>
                  </div>
                )}
                {(!isTugOfWar||activeSession.status==='waiting')&&(
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',borderBottom:'1px solid #E2E8F0',paddingBottom:'16px'}}>
                    <h3 style={{fontSize:'1.8rem',color:'#0F172A',margin:0}}>{activeSession.status==='waiting'?'Waiting for Players...':'Live Leaderboard'}</h3>
                    <span style={{background:'#F1F5F9',color:'#475569',padding:'8px 16px',borderRadius:'9999px',fontWeight:'700',fontSize:'1.1rem'}}>{liveParticipants.length} Joined</span>
                  </div>
                )}
                {liveParticipants.length===0
                  ?<div style={{textAlign:'center',padding:'60px 20px',color:'#94A3B8',fontSize:'1.2rem',fontWeight:'500'}}>Awaiting connections...</div>
                  :<div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {liveParticipants.map((player,index)=>(
                      <div key={player.id} style={{display:'flex',alignItems:'center',background:index===0&&activeSession.status!=='waiting'&&!isTugOfWar?'#FEF3C7':'#fff',padding:'16px 24px',borderRadius:'16px',border:index===0&&activeSession.status!=='waiting'&&!isTugOfWar?'2px solid #F59E0B':`1px solid ${player.team==='blue'?'#BFDBFE':player.team==='red'?'#FECACA':'#E2E8F0'}`,transition:'all 0.3s',gap:'16px'}}>
                        <div style={{width:'40px',fontSize:'1.2rem',fontWeight:'800',color:player.team==='blue'?'#3B82F6':player.team==='red'?'#EF4444':'#94A3B8',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {isTugOfWar?<div style={{width:'16px',height:'16px',borderRadius:'4px',background:player.team==='blue'?'#3B82F6':player.team==='red'?'#EF4444':'#E2E8F0'}}/>:`#${index+1}`}
                        </div>
                        <div style={{fontSize:'1.2rem',fontWeight:'700',color:'#0F172A',flexGrow:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{player.nickname}</div>
                        <div style={{display:'flex',alignItems:'center',gap:'12px',flexShrink:0,whiteSpace:'nowrap'}}>
                          {player.finished_at&&<div style={{background:'#10B981',color:'#fff',padding:'6px 12px',borderRadius:'8px',fontSize:'0.85rem',fontWeight:'800',textTransform:'uppercase'}}>Done</div>}
                          {player.total_questions!=null&&<div style={{fontSize:'1.1rem',color:'#10B981',fontWeight:'800',background:'#ECFDF5',padding:'8px 16px',borderRadius:'12px'}}>✓ {player.correct_answers||0}/{player.total_questions}</div>}
                          {player.total_time!=null&&<div style={{fontSize:'1.1rem',color:'#64748B',fontWeight:'700',background:'#F1F5F9',padding:'8px 16px',borderRadius:'12px'}}>{player.total_time}s</div>}
                          <div style={{fontSize:'1.3rem',fontWeight:'800',color:'#4F46E5',background:'#EEF2FF',padding:'8px 20px',borderRadius:'12px'}}>{player.score} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT STUDIO ── */}
      {adminTab==='studio' && <ActivityGenerator/>}
    </div>
  );
};