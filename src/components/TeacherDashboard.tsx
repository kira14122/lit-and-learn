import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';
import { generateStudentFeedback } from '../aiGenerator';

export const TeacherDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  
  // Form State
  const [assessmentName, setAssessmentName] = useState('Midterm Results');
  const [scoreText, setScoreText] = useState('Speaking: \nWriting: \nGrammar: \nListening: \nVocabulary: ');
  const [feedback, setFeedback] = useState('');
  
  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch past grades whenever you click on a new student
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentHistory(selectedStudent.id);
    } else {
      setStudentHistory([]);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('full_name', { ascending: true });

    if (data) setStudents(data);
  };

  const fetchStudentHistory = async (studentId: string) => {
    const token = await getToken({ template: 'supabase' });
    const supabase = getSupabaseClient(token || '');

    const { data } = await supabase
      .from('student_grades')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    if (data) setStudentHistory(data);
  };

  const handleGenerateFeedback = async () => {
    if (!selectedStudent || !scoreText.trim()) return;
    setIsGenerating(true);
    
    // Call our new Gemini function
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

    const { error } = await supabase.from('student_grades').insert([newGrade]);

    setIsSubmitting(false);

    if (!error) {
      alert(`✅ Official grade securely submitted for ${selectedStudent.full_name}!`);
      // Refresh their history instantly to show the new grade
      fetchStudentHistory(selectedStudent.id);
      
      // Reset form but keep the student selected
      setAssessmentName('Midterm Results');
      setScoreText('Speaking: \nWriting: \nGrammar: \nListening: \nVocabulary: ');
      setFeedback('');
    } else {
      alert(`❌ Error submitting grade: ${error.message}`);
    }
  };

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: STUDENT DIRECTORY */}
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
                  <div style={{ color: selectedStudent?.id === student.id ? '#4F46E5' : '#CBD5E1' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: GRADING PORTAL & HISTORY */}
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
              
              {/* THE FORM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>Assessment Name</label>
                  <input 
                    type="text" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', fontWeight: '500', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>Scores (One per line)</label>
                  <textarea 
                    value={scoreText} onChange={(e) => setScoreText(e.target.value)} rows={5}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#4F46E5', fontSize: '1.05rem', fontWeight: '700', outline: 'none', resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.9 }}>Teacher Feedback</label>
                    
                    {/* NEW: THE MAGIC AI BUTTON */}
                    <button 
                      onClick={handleGenerateFeedback} 
                      disabled={isGenerating}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: isGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                    >
                      {isGenerating ? '✨ Analyzing Scores...' : '✨ Draft with AI'}
                    </button>
                  </div>
                  
                  <textarea 
                    value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Leave a personalized note or click 'Draft with AI'..." rows={4}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', lineHeight: '1.5' }}
                  />
                </div>

                <button 
                  onClick={submitGrade} disabled={isSubmitting}
                  style={{ width: '100%', background: '#10B981', color: '#ffffff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '700', fontSize: '1.15rem', cursor: isSubmitting ? 'wait' : 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                >
                  {isSubmitting ? 'Submitting to Vault...' : 'Publish Official Grade'}
                </button>
              </div>

              {/* NEW: PAST PERFORMANCE PANEL */}
              {studentHistory.length > 0 && (
                <div style={{ marginTop: '40px', borderTop: '2px dashed rgba(255,255,255,0.2)', paddingTop: '32px' }}>
                  <h4 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    Past Performance
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {studentHistory.map((record, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <strong style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>{record.assessment_name}</strong>
                          <span style={{ fontSize: '0.85rem', opacity: 0.8, background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '99px' }}>
                            {new Date(record.date_recorded).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.95rem', opacity: 0.9, whiteSpace: 'pre-wrap', marginBottom: '12px', lineHeight: '1.6' }}>
                          {record.score}
                        </div>
                        {record.feedback && (
                          <div style={{ fontSize: '0.95rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #10B981', lineHeight: '1.5' }}>
                            "{record.feedback}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="soft-card" style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '32px', padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', marginBottom: '24px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.6rem' }}>Select a Student</h3>
              <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem', lineHeight: '1.6' }}>Click on a student from the directory to review their history and draft new grades.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};