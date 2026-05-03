import React, { useState, useEffect, useMemo } from 'react';
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

// --- MAIN DASHBOARD COMPONENT ---
export const TeacherDashboard: React.FC = () => {
  const { getToken } = useAuth();
  
  // Dashboard Navigation State
  const [adminTab, setAdminTab] = useState<'inbox' | 'grading'>('inbox');

  // --- GLOBAL TOAST NOTIFICATION STATE ---
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- SMART DELETE MODAL STATE ---
  // Tracks whether we are deleting a single message (by ID) or a full thread (by Email)
  const [deleteTarget, setDeleteTarget] = useState<{type: 'message', id: number} | {type: 'thread', email: string} | null>(null);

  // --- INBOX STATE ---
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [selectedThreadEmail, setSelectedThreadEmail] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // --- GRADING STATE ---
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [assessmentName, setAssessmentName] = useState('Midterm Results');
  const [scoreText, setScoreText] = useState('Speaking: \nWriting: \nGrammar: \nListening: \nVocabulary: ');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    fetchMessages();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentHistory(selectedStudent.id);
    } else {
      setStudentHistory([]);
    }
  }, [selectedStudent]);

  // --- THREADING LOGIC ---
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

  // Deselect thread if it gets deleted
  useEffect(() => {
    if (selectedThreadEmail && !threads.find(t => t.email === selectedThreadEmail)) {
      setSelectedThreadEmail(null);
    }
  }, [threads, selectedThreadEmail]);

  // --- INBOX FUNCTIONS ---
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

    const target = deleteTarget; // Capture current state
    setDeleteTarget(null); // Close modal instantly

    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = getSupabaseClient(token || '');

      if (target.type === 'message') {
        // Optimistic UI Update: Remove single message
        setMessages(prev => prev.filter(msg => msg.id !== target.id));
        const { error } = await supabase.from('contact_messages').delete().eq('id', target.id);
        if (error) throw error;
        showToast('Message deleted', 'success');

      } else if (target.type === 'thread') {
        // Optimistic UI Update: Remove entire thread
        if (selectedThreadEmail === target.email) setSelectedThreadEmail(null);
        setMessages(prev => prev.filter(msg => msg.email !== target.email));
        
        // Delete all rows matching this email
        const { error } = await supabase.from('contact_messages').delete().eq('email', target.email);
        if (error) throw error;
        showToast('Conversation deleted', 'success');
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      showToast('Failed to delete. Check console.', 'error');
      fetchMessages(); // Reset UI on failure
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
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          toEmail: activeThread.email,
          studentName: activeThread.name || 'Student',
          messageBody: replyText
        }
      });
      if (error) throw error;
      
      showToast(`Reply sent successfully to ${activeThread.name}!`, 'success');
      setReplyText('');
    } catch (error) {
      console.error("Error sending email:", error);
      showToast('Failed to send reply. Check console for details.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // --- GRADING FUNCTIONS ---
  const fetchStudents = async () => {
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');
    const { data } = await supabase.from('profiles').select('*').eq('is_admin', false).order('full_name', { ascending: true });
    if (data) setStudents(data);
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
    const aiDraft = await generateStudentFeedback(selectedStudent.full_name, assessmentName, scoreText);
    setFeedback(aiDraft);
    setIsGenerating(false);
  };

  const submitGrade = async () => {
    if (!selectedStudent || !assessmentName || !scoreText) return;
    setIsSubmitting(true);
    
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');

    const newGrade = {
      user_id: selectedStudent.id,
      assessment_name: assessmentName,
      score: scoreText,
      feedback: feedback,
      date_recorded: new Date().toISOString()
    };

    const { error: dbError } = await supabase.from('student_grades').insert([newGrade]);
    
    if (dbError) {
      setIsSubmitting(false);
      showToast(`Database Error: ${dbError.message}`, 'error');
      return;
    }

    try {
      const automatedEmailBody = `Your official assessment results have been posted to your Lit & Learn account.\n\n**Assessment:** ${assessmentName}\n\n**Scores:**\n${scoreText}\n\n**Instructor Feedback:**\n"${feedback || 'Excellent work!'}"\n\nYou can log into your student dashboard at any time to review your complete academic history.`;

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          toEmail: selectedStudent.email,
          studentName: selectedStudent.full_name,
          messageBody: automatedEmailBody
        }
      });

      if (emailError) throw emailError;
      showToast(`Grade saved and emailed to ${selectedStudent.full_name}!`, 'success');

    } catch (emailError) {
      console.error("Error sending grade email:", emailError);
      showToast(`Grade saved, but the email failed to send.`, 'error');
    } finally {
      setIsSubmitting(false);
      fetchStudentHistory(selectedStudent.id);
      setAssessmentName('Midterm Results');
      setScoreText('Speaking: \nWriting: \nGrammar: \nListening: \nVocabulary: ');
      setFeedback('');
    }
  };

  const activeThread = threads.find(t => t.email === selectedThreadEmail);

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {/* --- SMART DELETE MODAL --- */}
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

      {/* --- GLOBAL TOAST NOTIFICATION --- */}
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

      {/* DASHBOARD NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', backgroundColor: '#ffffff', padding: '8px', borderRadius: '9999px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', gap: '8px' }}>
          <button 
            onClick={() => setAdminTab('inbox')}
            style={{ background: adminTab === 'inbox' ? '#4F46E5' : 'transparent', color: adminTab === 'inbox' ? '#ffffff' : '#64748B', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconMail /> Inbox
          </button>
          <button 
            onClick={() => setAdminTab('grading')}
            style={{ background: adminTab === 'grading' ? '#4F46E5' : 'transparent', color: adminTab === 'grading' ? '#ffffff' : '#64748B', border: 'none', padding: '14px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconUsers /> Grading Portal
          </button>
        </div>
      </div>

      {/* --- TAB: THREADED EMAIL INBOX --- */}
      {adminTab === 'inbox' && (
        <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F1F5F9' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>Admin Inbox</h2>
              <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0 }}>{threads.length} Conversation{threads.length !== 1 ? 's' : ''}</p>
            </div>
            <button 
              onClick={fetchMessages}
              style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', color: '#475569', padding: '10px 16px', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <IconRefresh /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
            {/* LEFT COLUMN: CONVERSATION THREADS */}
            <div style={{ flex: '1 1 350px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '700px', overflowY: 'auto', paddingRight: '8px' }}>
              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '500' }}>Loading...</div>
              ) : threads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>Inbox is empty</div>
              ) : (
                threads.map((thread) => {
                  const isSelected = selectedThreadEmail === thread.email;
                  const latestMsg = thread.messages[thread.messages.length - 1];
                  const snippet = latestMsg.message.length > 60 ? latestMsg.message.substring(0, 60) + '...' : latestMsg.message;
                  const formattedTime = new Date(thread.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div 
                      key={thread.email} 
                      onClick={() => setSelectedThreadEmail(thread.email)}
                      style={{ background: isSelected ? '#EEF2FF' : '#ffffff', border: `2px solid ${isSelected ? '#4F46E5' : '#E2E8F0'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '16px' }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: isSelected ? '#4F46E5' : '#F1F5F9', color: isSelected ? '#ffffff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700', flexShrink: 0 }}>
                        {thread.name ? thread.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: isSelected ? '#4F46E5' : '#0F172A', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {thread.name}
                            {thread.messages.length > 1 && (
                              <span style={{ background: isSelected ? '#C7D2FE' : '#E2E8F0', color: isSelected ? '#3730A3' : '#475569', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px' }}>{thread.messages.length}</span>
                            )}
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

            {/* RIGHT COLUMN: READING PANE WITH CHAT HISTORY */}
            <div style={{ flex: '2 1 500px' }}>
              {activeThread ? (
                <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Thread Header WITH NEW DELETE BUTTON */}
                  <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.8rem', color: '#0F172A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {activeThread.name}
                        {activeThread.user_id && <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrolled</span>}
                      </h3>
                      <div style={{ color: '#4F46E5', fontSize: '1.05rem', fontWeight: '600' }}>{activeThread.email}</div>
                    </div>
                    
                    {/* NEW: Delete Entire Thread Button */}
                    <button 
                      onClick={() => setDeleteTarget({ type: 'thread', email: activeThread.email })} 
                      style={{ background: '#ffffff', color: '#94A3B8', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.2s' }} 
                      onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      <IconTrash /> Delete Thread
                    </button>
                  </div>

                  {/* Chat History List */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                    {activeThread.messages.map((msg, index) => (
                      <div key={msg.id} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', position: 'relative' }}>
                        
                        <button 
                          onClick={() => setDeleteTarget({ type: 'message', id: msg.id })}
                          title="Delete this message"
                          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                        >
                          <IconTrash />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                          {/* THIS IS THE FIX: Explicitly showing the name used for this specific message */}
                          <span style={{ color: '#4F46E5', fontWeight: '700', fontSize: '1rem' }}>
                            {msg.name}
                          </span>
                          <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '600' }}>
                            • {new Date(msg.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div style={{ color: '#334155', fontSize: '1.1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Box at the Bottom */}
                  <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '700', marginBottom: '16px' }}>
                      <IconReply /> Reply to {activeThread.name}
                    </div>
                    <textarea 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)} 
                      placeholder="Type your response here..." 
                      rows={4}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F1F5F9', background: '#F8FAFC', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', marginBottom: '16px' }}
                      onFocus={(e) => e.target.style.borderColor = '#EEF2FF'}
                      onBlur={(e) => e.target.style.borderColor = '#F1F5F9'}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={handleSendReply}
                        disabled={isSendingReply || !replyText.trim()}
                        style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: (isSendingReply || !replyText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!replyText.trim()) ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}
                      >
                        {isSendingReply ? 'Sending...' : <><IconSend /> Send Reply</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0', height: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <IconMail />
                  <h3 style={{ margin: '16px 0 8px', fontSize: '1.5rem', color: '#475569' }}>Select a conversation</h3>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>Click on any thread in the list to view the history and reply.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: GRADING PORTAL --- */}
      {adminTab === 'grading' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'start' }}>
          
          <div className="soft-card" style={{ background: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#0F172A', fontSize: '1.4rem' }}>Enrolled Students ({students.length})</h3>
            
            {students.length === 0 ? (
               <div style={{ background: '#F8FAFC', padding: '30px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0' }}>
                 No students have registered yet.
               </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: selectedStudent?.id === student.id ? '#EEF2FF' : '#F8FAFC', border: selectedStudent?.id === student.id ? '2px solid #4F46E5' : '2px solid transparent', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: selectedStudent?.id === student.id ? '#4F46E5' : '#0F172A', fontSize: '1.1rem', marginBottom: '4px' }}>
                        {student.full_name}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '0.9rem' }}>{student.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: '40px' }}>
            {selectedStudent ? (
              <div className="soft-card" style={{ background: '#4F46E5', borderRadius: '32px', padding: '40px', color: '#ffffff', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', maxHeight: '85vh', overflowY: 'auto' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.9 }}>Teacher Feedback</label>
                      <button onClick={handleGenerateFeedback} disabled={isGenerating} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: isGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
                        {isGenerating ? '✨ Analyzing...' : '✨ Draft with AI'}
                      </button>
                    </div>
                    <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Leave a personalized note..." rows={4} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', lineHeight: '1.5' }} />
                  </div>
                  
                  <button onClick={submitGrade} disabled={isSubmitting} style={{ width: '100%', background: '#10B981', color: '#ffffff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '700', fontSize: '1.15rem', cursor: isSubmitting ? 'wait' : 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                    {isSubmitting ? 'Submitting to Vault...' : 'Publish Official Grade'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="soft-card" style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '32px', padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.6rem' }}>Select a Student</h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem', lineHeight: '1.6' }}>Click on a student from the directory to review their history and draft new grades.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};