import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { GradingPortal } from './GradingPortal';
import { getSupabaseClient } from '../supabaseClient';
import { generateStudentFeedback } from '../aiGenerator';
import { client } from '../sanityClient'; 
import { ActivityGenerator } from './ActivityGenerator';
import { ExamMode } from './ExamMode';
import { AttendancePortal } from './AttendancePortal';

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
const IconCalendarCheck = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="9 16 11 18 15 14"></polyline></svg>);
const IconExternal  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>);
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


export const TeacherDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Core UI ───────────────────────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState<'inbox'|'grading'|'arena'|'studio'|'exam'|'attendance'>('inbox');
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

  // CHANGE 3: Separate filter states for Grading tab


  // ── Profile editor ────────────────────────────────────────────────────────

  // ── Draft (localStorage, no DB) ───────────────────────────────────────────
  const bumpDraft = () => setDraftVersion(v => v + 1);

  // ── Grading form ──────────────────────────────────────────────────────────

  // ── Quick feedback builder ──

  // ── Record editor ─────────────────────────────────────────────────────────

  // ── Live Arena ────────────────────────────────────────────────────────────
  const [liveQuizTopic, setLiveQuizTopic]   = useState('');
  const [liveGameMode, setLiveGameMode]     = useState<'standard'|'tug-of-war-all'|'tug-of-war-captain'>('standard');
  const [liveTimeLimit, setLiveTimeLimit]   = useState<number|null>(20);
  const [activeSession, setActiveSession]   = useState<any|null>(null);
  const [liveParticipants, setLiveParticipants] = useState<any[]>([]);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [availableQuizzes, setAvailableQuizzes] = useState<{title:string,category:string}[]>([]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchMessages(); fetchStudents(); }, []);

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
  useEffect(() => { if (selectedThreadEmail && !threads.find(t=>t.email===selectedThreadEmail)) setSelectedThreadEmail(null); }, [threads, selectedThreadEmail]);

  // ── CHANGE 2: Score display helper — renders JSON scores as the pretty string ──
  // Also handles old plain-text records gracefully (backward compatible)
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
      const { error: replyError } = await supabase.functions.invoke('send-email',{body:{toEmail:t.email,studentName:'',messageBody:replyText,subject:'Re: Message from Lit & Learn',replyTo:'dr.chouit@litnlearn.com'}});
      if (replyError) throw new Error(replyError.message);
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
      const { error: composeError } = await supabase.functions.invoke('send-email',{body:{toEmail:composeRecipient,studentName:'',subject:composeSubject||'New Message from Lit & Learn',messageBody:composeText,attachment:composeAttachment,replyTo:'dr.chouit@litnlearn.com'}});
      if (composeError) throw new Error(composeError.message);
      const s = students.find(s=>s.email===composeRecipient);
      await supabase.from('contact_messages').insert([{name:'Dr. Chouit (Sent)',email:composeRecipient,message:composeText+(composeAttachment?`\n\n[Attachment: ${composeAttachment.filename}]`:''),user_id:s?.id||null}]);
      showToast('Message sent!','success'); setComposeText(''); setComposeRecipient(''); setComposeSubject(''); removeAttachment(); setIsComposing(false); fetchMessages();
    } catch {showToast('Failed to send.','error');} finally {setIsSendingCompose(false);}
  };

  // ── Student management ────────────────────────────────────────────────────
  const handleLaunchLobby = async () => {
    if (!liveQuizTopic.trim()) return;
    setIsCreatingLobby(true);
    try {
      const supabase = getSupabaseClient((await getToken({template:'supabase'}))||'');

      // Auto-close any stuck active/waiting sessions before launching a new one.
      // Prevents students from accidentally joining old games from previous classes.
      await supabase
        .from('live_sessions')
        .update({ status: 'finished' })
        .in('status', ['active', 'waiting']);

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
          {([['inbox','#4F46E5',<IconMail/>,'Inbox'],['grading','#4F46E5',<IconUsers/>,'Grading Portal'],['arena','#F59E0B',<IconPlay/>,'Live Arena'],['studio','#8B5CF6',<IconSparkles/>,'Content Studio'],['exam','#E11D48',<IconClipboard/>,'Exam Mode'],['attendance','#0D9488',<IconCalendarCheck/>,'Attendance']] as [string,string,React.ReactNode,string][]).map(([tab,color,icon,label])=>(
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
      <div style={{display: adminTab==='grading' ? undefined : 'none'}}>
        <GradingPortal students={students} setStudents={setStudents} fetchStudents={fetchStudents} showToast={showToast} />
      </div>

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
                          {player.total_time!=null&&<div style={{fontSize:'1.1rem',color:'#64748B',fontWeight:'700',background:'#F1F5F9',padding:'8px 16px',borderRadius:'12px'}}>{formatTime(player.total_time)}</div>}
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
       {/* ── EXAM MODE ── */}
      {adminTab==='exam' && <ExamMode/>}

      {/* ── ATTENDANCE ── */}
      {adminTab==='attendance' && (
        <div style={{backgroundColor:'#fff',borderRadius:'32px',padding:'32px',border:'1px solid #E2E8F0',boxShadow:'0 10px 30px rgba(0,0,0,0.02)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px',paddingBottom:'20px',borderBottom:'2px solid #F1F5F9',flexWrap:'wrap',gap:'12px'}}>
            <div>
              <h2 style={{margin:'0 0 4px',fontSize:'2rem',color:'#0F172A',fontWeight:'600',letterSpacing:'-0.5px'}}>Attendance</h2>
              <p style={{color:'#64748B',fontSize:'1.05rem',margin:0}}>Check-in times, roster and printable sheet.</p>
            </div>
            <button
              onClick={()=>{ const w=window.open('/display','_blank'); if(!w){ window.location.href='/display'; } }}
              style={{background:'#0D9488',border:'none',color:'#fff',padding:'12px 22px',borderRadius:'12px',fontWeight:'600',fontSize:'0.98rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 10px rgba(13,148,136,0.2)'}}
              title="Opens the rotating QR code full screen — put this on the classroom TV."
            >
              <IconExternal/> Open Class Display
            </button>
          </div>
          <AttendancePortal/>
        </div>
      )}
    </div>
  );
};