import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';
import { generateStudentFeedback } from '../aiGenerator';

// --- ICONS ---
const IconMail = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>);
const IconTrash = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const IconRefresh = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const IconUsers = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const IconSend = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);
const IconReply = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>);
const IconChart = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>);
const IconEdit = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const IconPaperclip = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>);
const IconPlay = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);

export const TeacherDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [adminTab, setAdminTab] = useState<'inbox' | 'grading' | 'progress' | 'arena'>('inbox');
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [deleteTarget, setDeleteTarget] = useState<{type: 'message', id: number} | {type: 'thread', email: string} | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [selectedThreadEmail, setSelectedThreadEmail] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [isComposing, setIsComposing] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeText, setComposeText] = useState('');
  const [composeAttachment, setComposeAttachment] = useState<{filename: string, content: string} | null>(null);
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [assessmentName, setAssessmentName] = useState('Midterm Results');
  const [scoreText, setScoreText] = useState('Speaking: \nWriting: \nGrammar: \nListening: \nVocabulary: ');
  const [teacherNotes, setTeacherNotes] = useState(''); 
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedProgressStudent, setSelectedProgressStudent] = useState<any | null>(null);
  const [studentVocab, setStudentVocab] = useState<any[]>([]);
  const [isFetchingVocab, setIsFetchingVocab] = useState(false);

  const [liveQuizTopic, setLiveQuizTopic] = useState('');
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [liveParticipants, setLiveParticipants] = useState<any[]>([]);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchStudents();
    fetchAllGrades(); 
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentHistory(selectedStudent.id);
    } else {
      setStudentHistory([]);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedProgressStudent) {
      fetchStudentVocab(selectedProgressStudent.id);
    } else {
      setStudentVocab([]);
    }
  }, [selectedProgressStudent]);

  // --- LIVE ARENA REALTIME SUBSCRIPTION (RACE-CONDITION PROOF) ---
  useEffect(() => {
    if (!activeSession) return;

    let channel: any;

    const setupRealtime = async () => {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      
      // We only fetch once at the very beginning
      const fetchInitialLeaderboard = async () => {
        const { data, error } = await supabase
          .from('live_participants')
          .select('*')
          .eq('session_id', activeSession.id)
          .order('score', { ascending: false });
        
        if (!error && data) setLiveParticipants(data);
      };

      await fetchInitialLeaderboard();

      // Instead of re-fetching, we inject the live data directly into the React state!
      channel = supabase
        .channel(`arena_${activeSession.id}`) 
        .on(
          'postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'live_participants', 
            filter: `session_id=eq.${activeSession.id}` 
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setLiveParticipants(prev => {
                const exists = prev.find(p => p.id === payload.new.id);
                if (exists) return prev;
                return [...prev, payload.new].sort((a, b) => b.score - a.score);
              });
            } else if (payload.eventType === 'UPDATE') {
              setLiveParticipants(prev => {
                return prev.map(p => p.id === payload.new.id ? payload.new : p)
                           .sort((a, b) => b.score - a.score);
              });
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [activeSession, getToken]);


  const threads = useMemo(() => {
    const grouped = new Map<string, any[]>();
    messages.forEach(msg => {
      if (!grouped.has(msg.email)) grouped.set(msg.email, []);
      grouped.get(msg.email)!.push(msg);
    });

    return Array.from(grouped.entries()).map(([email, msgs]) => {
      const sorted = [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return {
        email,
        name: sorted[sorted.length - 1].name, 
        user_id: sorted[sorted.length - 1].user_id,
        messages: sorted,
        latestDate: sorted[sorted.length - 1].created_at
      };
    }).sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()); 
  }, [messages]);

  useEffect(() => {
    if (selectedThreadEmail && !threads.find(t => t.email === selectedThreadEmail)) {
      setSelectedThreadEmail(null);
    }
  }, [threads, selectedThreadEmail]);

  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      if (target.type === 'message') {
        setMessages(prev => prev.filter(msg => msg.id !== target.id));
        const { error } = await supabase.from('contact_messages').delete().eq('id', target.id);
        if (error) throw error;
        showToast('Message deleted', 'success');
      } else if (target.type === 'thread') {
        if (selectedThreadEmail === target.email) setSelectedThreadEmail(null);
        setMessages(prev => prev.filter(msg => msg.email !== target.email));
        const { error } = await supabase.from('contact_messages').delete().eq('email', target.email);
        if (error) throw error;
        showToast('Conversation deleted', 'success');
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      showToast('Failed to delete. Check console.', 'error');
      fetchMessages();
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadEmail) return;
    const activeThread = threads.find(t => t.email === selectedThreadEmail);
    if (!activeThread) return;
    setIsSendingReply(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: { toEmail: activeThread.email, studentName: '', messageBody: replyText, subject: 'Re: Message from Lit & Learn' }
      });
      if (emailError) throw emailError;
      const { error: dbError } = await supabase.from('contact_messages').insert([{
        name: 'Dr. Chouit (Reply)', email: activeThread.email, message: replyText, user_id: activeThread.user_id 
      }]);
      if (dbError) throw dbError;
      showToast(`Reply sent successfully to ${activeThread.name}!`, 'success');
      setReplyText('');
      fetchMessages();
    } catch (error) {
      console.error("Error sending email or saving reply:", error);
      showToast('Failed to send reply. Check console for details.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("Attachment is too large. Limit is 4MB.", "error");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setComposeAttachment({ filename: file.name, content: base64String });
      showToast(`Attached: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setComposeAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendCompose = async () => {
    if (!composeRecipient || !composeText.trim()) return;
    const student = students.find(s => s.email === composeRecipient);
    const studentId = student ? student.id : null;
    setIsSendingCompose(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: { toEmail: composeRecipient, studentName: '', subject: composeSubject || 'New Message from Lit & Learn', messageBody: composeText, attachment: composeAttachment }
      });
      if (emailError) throw emailError;
      let dbMessageText = composeText;
      if (composeAttachment) dbMessageText += `\n\n[Attachment sent: ${composeAttachment.filename}]`;
      const { error: dbError } = await supabase.from('contact_messages').insert([{
        name: 'Dr. Chouit (Sent)', email: composeRecipient, message: dbMessageText, user_id: studentId 
      }]);
      if (dbError) throw dbError;
      showToast(`Message securely sent!`, 'success');
      setComposeText(''); setComposeRecipient(''); setComposeSubject(''); removeAttachment(); setIsComposing(false); fetchMessages(); 
    } catch (error) {
      console.error("Error sending composed email:", error);
      showToast('Failed to send message. Check console for details.', 'error');
    } finally {
      setIsSendingCompose(false);
    }
  };

  const fetchStudents = async () => {
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');
    const { data } = await supabase.from('profiles').select('*').eq('is_admin', false).order('full_name', { ascending: true });
    if (data) setStudents(data);
  };

  const fetchAllGrades = async () => {
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');
    const { data } = await supabase.from('student_grades').select('*').order('created_at', { ascending: false });
    if (data) setAllGrades(data);
  };

  const fetchStudentHistory = async (studentId: string) => {
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');
    const { data } = await supabase.from('student_grades').select('*').eq('user_id', studentId).order('created_at', { ascending: false });
    if (data) setStudentHistory(data);
  };

  const handleGenerateFeedback = async () => {
    if (!selectedStudent || !scoreText.trim()) return;
    setIsGenerating(true);
    const aiDraft = await generateStudentFeedback(selectedStudent.full_name, assessmentName, scoreText, teacherNotes);
    setFeedback(aiDraft);
    setIsGenerating(false);
  };

  const submitGrade = async () => {
    if (!selectedStudent || !assessmentName || !scoreText) return;
    setIsSubmitting(true);
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');
    const newGrade = { user_id: selectedStudent.id, assessment_name: assessmentName, score: scoreText, feedback: feedback, date_recorded: new Date().toISOString() };
    const { data: insertedGrade, error: dbError } = await supabase.from('student_grades').insert([newGrade]).select().single();
    if (dbError) { setIsSubmitting(false); showToast(`Database Error: ${dbError.message}`, 'error'); return; }
    try {
      const automatedEmailBody = `Your official assessment results have been posted to your Lit & Learn account.\n\n**Assessment:** ${assessmentName}\n\n**Scores:**\n${scoreText}\n\n**Instructor Feedback:**\n"${feedback || 'Excellent work!'}"\n\nYou can log into your student dashboard at any time to review your complete academic history.`;
      const { error: emailError } = await supabase.functions.invoke('send-email', { body: { toEmail: selectedStudent.email, studentName: selectedStudent.full_name, subject: `Official Assessment Grade: ${assessmentName}`, messageBody: automatedEmailBody } });
      if (emailError) throw emailError;
      showToast(`Grade saved and emailed to ${selectedStudent.full_name}!`, 'success');
    } catch (emailError) {
      console.error("Error sending grade email:", emailError);
      showToast(`Grade saved, but the email failed to send.`, 'error');
    } finally {
      setIsSubmitting(false);
      if (insertedGrade) { setAllGrades(prev => [insertedGrade, ...prev]); setStudentHistory(prev => [insertedGrade, ...prev]); }
      setAssessmentName('Midterm Results'); setScoreText('Speaking: \nWriting: \nGrammar: \nListening: \nVocabulary: '); setTeacherNotes(''); setFeedback('');
    }
  };

  const fetchStudentVocab = async (studentId: string) => {
    setIsFetchingVocab(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      const { data, error } = await supabase.from('vocab_vault').select('*').eq('user_id', studentId).order('created_at', { ascending: false });
      if (error) throw error;
      setStudentVocab(data || []);
    } catch (error) {
      console.error("Error fetching vocab vault:", error);
      showToast('Failed to load student vocabulary.', 'error');
    } finally {
      setIsFetchingVocab(false);
    }
  };

  const handleLaunchLobby = async () => {
    if (!liveQuizTopic.trim()) return;
    setIsCreatingLobby(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      const { data, error } = await supabase.from('live_sessions').insert([{ pin_code: pin, quiz_id: liveQuizTopic, status: 'waiting' }]).select().single();
      if (error) throw error;
      setActiveSession(data);
      setLiveParticipants([]);
      showToast('Lobby created successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to create lobby. PIN might be taken.', 'error');
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const handleStartGame = async () => {
    if (!activeSession) return;
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      const { data, error } = await supabase.from('live_sessions').update({ status: 'active' }).eq('id', activeSession.id).select().single();
      if (error) throw error;
      setActiveSession(data);
      showToast('Game Started!', 'success');
    } catch (error) {
      showToast('Failed to start game.', 'error');
    }
  };

  const handleEndGame = async () => {
    if (!activeSession) return;
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');
      await supabase.from('live_sessions').update({ status: 'finished' }).eq('id', activeSession.id);
      setActiveSession(null);
      setLiveParticipants([]);
      setLiveQuizTopic('');
      showToast('Session closed.', 'success');
    } catch (error) {
      showToast('Failed to close session.', 'error');
    }
  };

  const activeThread = threads.find(t => t.email === selectedThreadEmail);

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <IconTrash />
            </div>
            <h3 style={{ margin: '0 0 12px', color: '#0F172A', fontSize: '1.4rem' }}>
              {deleteTarget.type === 'thread' ? 'Delete Conversation?' : 'Delete Message?'}
            </h3>
            <p style={{ color: '#64748B', margin: '0 0 24px', lineHeight: '1.5' }}>
              {deleteTarget.type === 'thread' 
                ? 'Are you sure you want to delete all messages from this student? This action cannot be undone.'
                : 'Are you sure you want to delete this specific message? This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
              <button onClick={executeDelete} style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#ffffff', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444', color: '#ffffff', padding: '16px 32px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9998, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {toastMessage.type === 'success' ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          )}
          {toastMessage.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', gap: '8px' }}>
          <button onClick={() => setAdminTab('inbox')} style={{ background: adminTab === 'inbox' ? '#4F46E5' : 'transparent', color: adminTab === 'inbox' ? '#ffffff' : '#64748B', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconMail /> Inbox
          </button>
          <button onClick={() => setAdminTab('grading')} style={{ background: adminTab === 'grading' ? '#4F46E5' : 'transparent', color: adminTab === 'grading' ? '#ffffff' : '#64748B', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconUsers /> Grading Portal
          </button>
          <button onClick={() => setAdminTab('progress')} style={{ background: adminTab === 'progress' ? '#10B981' : 'transparent', color: adminTab === 'progress' ? '#ffffff' : '#64748B', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconChart /> Student Progress
          </button>
          <button onClick={() => setAdminTab('arena')} style={{ background: adminTab === 'arena' ? '#F59E0B' : 'transparent', color: adminTab === 'arena' ? '#ffffff' : '#64748B', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconPlay /> Live Arena
          </button>
        </div>
      </div>

      {adminTab === 'arena' && (
        <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          
          {!activeSession && (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
              <div style={{ background: '#FEF3C7', color: '#D97706', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <IconPlay />
              </div>
              <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '16px', fontWeight: '700' }}>Host a Live Contest</h2>
              <p style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '40px', lineHeight: '1.6' }}>Turn your Practice Hub quizzes into a live multiplayer game. Students scan the QR code to join instantly from their phones.</p>
              
              <div style={{ textAlign: 'left', background: '#F8FAFC', padding: '32px', borderRadius: '24px', border: '2px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>Enter Quiz Topic / ID</label>
                <input 
                  type="text" 
                  value={liveQuizTopic}
                  onChange={(e) => setLiveQuizTopic(e.target.value)}
                  placeholder="e.g., Present Continuous vs Simple"
                  style={{ width: '100%', padding: '18px', borderRadius: '12px', border: '2px solid #CBD5E1', fontSize: '1.1rem', outline: 'none', marginBottom: '24px' }}
                />
                <button 
                  onClick={handleLaunchLobby}
                  disabled={isCreatingLobby || !liveQuizTopic.trim()}
                  style={{ width: '100%', padding: '18px', background: '#F59E0B', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '700', cursor: (isCreatingLobby || !liveQuizTopic.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: (!liveQuizTopic.trim()) ? 0.5 : 1 }}
                >
                  {isCreatingLobby ? 'Creating...' : 'Launch Lobby'}
                </button>
              </div>
            </div>
          )}

          {activeSession && (
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
              
              <div style={{ flex: '1', background: '#F8FAFC', padding: '40px', borderRadius: '32px', border: '2px dashed #CBD5E1', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Join at litnlearn.com/play</h3>
                <h1 style={{ fontSize: '5rem', color: '#0F172A', margin: '0 0 24px 0', fontWeight: '800', letterSpacing: '4px' }}>{activeSession.pin_code}</h1>
                
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://litnlearn.com/play?pin=${activeSession.pin_code}`)}`} alt="Join Game QR Code" width={200} height={200} />
                </div>

                {activeSession.status === 'waiting' ? (
                  <button onClick={handleStartGame} style={{ background: '#10B981', color: '#ffffff', padding: '16px 40px', fontSize: '1.2rem', fontWeight: '700', borderRadius: '9999px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>Start Game</button>
                ) : (
                  <button onClick={handleEndGame} style={{ background: '#EF4444', color: '#ffffff', padding: '16px 40px', fontSize: '1.2rem', fontWeight: '700', borderRadius: '9999px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)' }}>End Game</button>
                )}
              </div>

              <div style={{ flex: '1.5', background: '#ffffff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', maxHeight: '700px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #F1F5F9', paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#0F172A', margin: 0 }}>
                    {activeSession.status === 'waiting' ? 'Waiting for Players...' : 'Live Leaderboard'}
                  </h3>
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '8px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem' }}>
                    {liveParticipants.length} Joined
                  </span>
                </div>

                {liveParticipants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8', fontSize: '1.2rem' }}>
                    <div>Waiting for the first student to connect...</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {liveParticipants.map((player, index) => (
                      <div key={player.id} style={{ display: 'flex', alignItems: 'center', background: index === 0 && activeSession.status !== 'waiting' ? '#FEF3C7' : '#F8FAFC', padding: '20px 24px', borderRadius: '16px', border: index === 0 && activeSession.status !== 'waiting' ? '2px solid #F59E0B' : '1px solid #E2E8F0', transition: 'all 0.3s' }}>
                        
                        <div style={{ width: '40px', fontSize: '1.4rem', fontWeight: '800', color: index === 0 && activeSession.status !== 'waiting' ? '#D97706' : '#94A3B8' }}>
                          #{index + 1}
                        </div>
                        
                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0F172A', flexGrow: 1 }}>
                          {player.nickname}
                        </div>
                        
                        {/* RESTORED: THE MASSIVE SCORE AND TIME BADGES */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {player.total_time !== undefined && player.total_time !== null && (
                            <div style={{ fontSize: '1.2rem', color: '#64748B', fontWeight: '800', background: '#F1F5F9', padding: '10px 16px', borderRadius: '12px' }}>
                              ⏱ {player.total_time}s
                            </div>
                          )}
                          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4F46E5', background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(79,70,229,0.1)' }}>
                            {player.score} pts
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {adminTab === 'inbox' && (
        <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F1F5F9' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>Admin Inbox</h2>
              <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0 }}>{threads.length} Conversation{threads.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setIsComposing(true); setSelectedThreadEmail(null); }} style={{ background: '#4F46E5', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}>
                <IconEdit /> Compose
              </button>
              <button onClick={fetchMessages} style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', color: '#475569', padding: '10px 16px', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <IconRefresh /> Refresh
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 350px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '700px', overflowY: 'auto', paddingRight: '8px' }}>
              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '500' }}>Loading...</div>
              ) : threads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>Inbox is empty</div>
              ) : (
                threads.map((thread) => {
                  const isSelected = selectedThreadEmail === thread.email && !isComposing;
                  const latestMsg = thread.messages[thread.messages.length - 1];
                  const snippet = latestMsg.message.length > 60 ? latestMsg.message.substring(0, 60) + '...' : latestMsg.message;
                  const formattedTime = new Date(thread.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={thread.email} onClick={() => { setSelectedThreadEmail(thread.email); setIsComposing(false); }} style={{ background: isSelected ? '#EEF2FF' : '#ffffff', border: `2px solid ${isSelected ? '#4F46E5' : '#E2E8F0'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: isSelected ? '#4F46E5' : '#F1F5F9', color: isSelected ? '#ffffff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700', flexShrink: 0 }}>
                        {thread.name ? thread.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: isSelected ? '#4F46E5' : '#0F172A', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {thread.name}
                            {thread.messages.length > 1 && <span style={{ background: isSelected ? '#C7D2FE' : '#E2E8F0', color: isSelected ? '#3730A3' : '#475569', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px' }}>{thread.messages.length}</span>}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: isSelected ? '#4F46E5' : '#94A3B8', fontWeight: '600' }}>{formattedTime}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{snippet}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ flex: '2 1 500px' }}>
              {isComposing ? (
                <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', height: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 1.8rem', color: '#0F172A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}><IconEdit /> New Message</h3>
                    <button onClick={() => setIsComposing(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: '700' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>To: Email Address</label>
                      <input type="email" list="enrolled-students" value={composeRecipient} onChange={(e) => setComposeRecipient(e.target.value)} placeholder="Select a student or type any email address..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #E2E8F0', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none' }} />
                      <datalist id="enrolled-students">{students.map(s => <option key={s.id} value={s.email}>{s.full_name}</option>)}</datalist>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Subject</label>
                      <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Enter email subject..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #E2E8F0', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none' }} />
                    </div>
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Message</label>
                      <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Draft your message here..." style={{ width: '100%', flexGrow: 1, minHeight: '150px', padding: '16px', borderRadius: '12px', border: '2px solid #E2E8F0', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                        <button onClick={() => fileInputRef.current?.click()} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '10px 16px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}><IconPaperclip /> Attach Document</button>
                        {composeAttachment && (
                          <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{composeAttachment.filename}</span>
                            <button onClick={removeAttachment} style={{ background: 'transparent', border: 'none', color: '#4F46E5', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                          </div>
                        )}
                      </div>
                      <button onClick={handleSendCompose} disabled={isSendingCompose || !composeRecipient || !composeText.trim()} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '14px 32px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.05rem', cursor: (isSendingCompose || !composeRecipient || !composeText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!composeRecipient || !composeText.trim()) ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)' }}>
                        {isSendingCompose ? 'Sending...' : <><IconSend /> Send Message</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeThread ? (
                <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.8rem', color: '#0F172A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {activeThread.name}
                        {activeThread.user_id && <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrolled</span>}
                      </h3>
                      <div style={{ color: '#4F46E5', fontSize: '1.05rem', fontWeight: '600' }}>{activeThread.email}</div>
                    </div>
                    <button onClick={() => setDeleteTarget({ type: 'thread', email: activeThread.email })} style={{ background: '#ffffff', color: '#94A3B8', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.2s' }}>
                      <IconTrash /> Delete Thread
                    </button>
                  </div>
                  <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                    {activeThread.messages.map((msg, index) => (
                      <div key={msg.id} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', position: 'relative' }}>
                        <button onClick={() => setDeleteTarget({ type: 'message', id: msg.id })} title="Delete this message" style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', transition: 'color 0.2s' }}>
                          <IconTrash />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ color: '#4F46E5', fontWeight: '700', fontSize: '1rem' }}>{msg.name}</span>
                          <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '600' }}>• {new Date(msg.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ color: '#334155', fontSize: '1.1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '700', marginBottom: '16px' }}><IconReply /> Reply to {activeThread.name}</div>
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your response here..." rows={4} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F1F5F9', background: '#F8FAFC', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', marginBottom: '16px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={handleSendReply} disabled={isSendingReply || !replyText.trim()} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: (isSendingReply || !replyText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!replyText.trim()) ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}>
                        {isSendingReply ? 'Sending...' : <><IconSend /> Send Reply</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0', height: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <IconMail />
                  <h3 style={{ margin: '16px 0 8px', fontSize: '1.5rem', color: '#475569' }}>Select a conversation</h3>
                  <p style={{ margin: 0, fontSize: '1.1rem', color: '#64748B' }}>Click on a thread to view history, or compose a new message.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'grading' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'start' }}>
          <div className="soft-card" style={{ background: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#0F172A', fontSize: '1.4rem' }}>Enrolled Students ({students.length})</h3>
            {students.length === 0 ? (
               <div style={{ background: '#F8FAFC', padding: '30px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0' }}>No students have registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map(student => {
                  const pastGradesCount = allGrades.filter(g => g.user_id === student.id).length;
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <div key={student.id} onClick={() => setSelectedStudent(student)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: isSelected ? '#EEF2FF' : '#F8FAFC', border: isSelected ? '2px solid #4F46E5' : '2px solid transparent', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: isSelected ? '#4F46E5' : '#0F172A', fontSize: '1.1rem', marginBottom: '4px' }}>{student.full_name}</div>
                        <div style={{ color: '#64748B', fontSize: '0.9rem' }}>{student.email}</div>
                      </div>
                      {pastGradesCount > 0 && <div style={{ background: '#ECFDF5', color: '#10B981', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', marginLeft: 'auto' }}>{pastGradesCount} Record{pastGradesCount !== 1 ? 's' : ''}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ position: 'sticky', top: '40px', maxHeight: '85vh', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedStudent ? (
              <>
                <div className="soft-card" style={{ background: '#4F46E5', borderRadius: '32px', padding: '40px', color: '#ffffff', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                      <div style={{ textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem', fontWeight: '700', opacity: 0.8, marginBottom: '8px' }}>Drafting Official Grade</div>
                      <h3 style={{ margin: 0, fontSize: '2rem', lineHeight: '1.1' }}>{selectedStudent.full_name}</h3>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>Assessment Name</label>
                      <input type="text" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', fontWeight: '500', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>Scores (One per line)</label>
                      <textarea value={scoreText} onChange={(e) => setScoreText(e.target.value)} rows={5} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#4F46E5', fontSize: '1.05rem', fontWeight: '700', outline: 'none', resize: 'none', lineHeight: '1.5' }} />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}><IconChart /> Diagnostic Notes (Hidden from student)</label>
                      <textarea value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} placeholder="e.g., struggled with present continuous and dynamic verbs..." rows={2} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', lineHeight: '1.5' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.9 }}>Official Feedback</label>
                        <button onClick={handleGenerateFeedback} disabled={isGenerating} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: isGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>{isGenerating ? '✨ Analyzing...' : '✨ Draft with AI'}</button>
                      </div>
                      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Leave a personalized note..." rows={4} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', lineHeight: '1.5' }} />
                    </div>
                    <button onClick={submitGrade} disabled={isSubmitting} style={{ width: '100%', background: '#10B981', color: '#ffffff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '700', fontSize: '1.15rem', cursor: isSubmitting ? 'wait' : 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                      {isSubmitting ? 'Submitting to Vault...' : 'Publish Official Grade'}
                    </button>
                  </div>
                </div>
                {studentHistory.length > 0 && (
                  <div style={{ padding: '0 10px', flexShrink: 0 }}>
                    <h4 style={{ color: '#0F172A', fontSize: '1.3rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><IconChart /> Previous Records</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {studentHistory.map(history => (
                        <div key={history.id} style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '1.1rem' }}>{history.assessment_name}</span>
                            <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{new Date(history.date_recorded).toLocaleDateString()}</span>
                          </div>
                          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#4F46E5', fontWeight: '700', fontSize: '0.95rem', marginBottom: '16px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{history.score}</div>
                          <p style={{ margin: 0, color: '#475569', fontSize: '1rem', fontStyle: 'italic', lineHeight: '1.6' }}>"{history.feedback}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="soft-card" style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '32px', padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.6rem' }}>Select a Student</h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem', lineHeight: '1.6' }}>Click on a student from the directory to review their history and draft new grades.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'progress' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'start' }}>
          <div className="soft-card" style={{ background: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#0F172A', fontSize: '1.4rem' }}>Review Vocab Vaults ({students.length})</h3>
            {students.length === 0 ? (
               <div style={{ background: '#F8FAFC', padding: '30px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0' }}>No students have registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map(student => (
                  <div key={student.id} onClick={() => setSelectedProgressStudent(student)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: selectedProgressStudent?.id === student.id ? '#F0FDF4' : '#F8FAFC', border: selectedProgressStudent?.id === student.id ? '2px solid #10B981' : '2px solid transparent', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: selectedProgressStudent?.id === student.id ? '#10B981' : '#0F172A', fontSize: '1.1rem', marginBottom: '4px' }}>{student.full_name}</div>
                      <div style={{ color: '#64748B', fontSize: '0.9rem' }}>{student.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'sticky', top: '40px' }}>
            {selectedProgressStudent ? (
              <div className="soft-card" style={{ background: '#ffffff', borderRadius: '32px', padding: '40px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '24px', borderBottom: '2px solid #F1F5F9' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#0F172A' }}>{selectedProgressStudent.full_name}'s Vault</h3>
                    <div style={{ color: '#64748B', fontWeight: '600' }}><span style={{ color: '#10B981' }}>{studentVocab.length}</span> Words Saved</div>
                  </div>
                  <button onClick={() => setSelectedProgressStudent(null)} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
                </div>
                <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {isFetchingVocab ? (
                     <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '500' }}>Accessing secure vault...</div>
                  ) : studentVocab.length === 0 ? (
                    <div style={{ background: '#F8FAFC', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0' }}>This student hasn't saved any vocabulary words yet.</div>
                  ) : (
                    studentVocab.map(item => (
                      <div key={item.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0F172A' }}>{item.word}</div>
                          <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: '600' }}>{new Date(item.created_at).toLocaleDateString()}</div>
                        </div>
                        {item.definition && <div style={{ color: '#475569', lineHeight: '1.5', marginBottom: item.example ? '12px' : '0' }}>{item.definition}</div>}
                        {item.example && <div style={{ color: '#64748B', fontStyle: 'italic', background: '#F1F5F9', padding: '12px', borderRadius: '8px', fontSize: '0.95rem' }}>"{item.example}"</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="soft-card" style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '32px', padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconChart />
                <h3 style={{ margin: '16px 0 8px 0', color: '#0F172A', fontSize: '1.6rem' }}>Select a Student</h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem', lineHeight: '1.6' }}>Click on a student to instantly open their personal Vocab Vault.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};