import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { client } from '../sanityClient'; 

export const LivePlayer: React.FC = () => {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [session, setSession] = useState<any | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // --- GAME STATE ---
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // 1. Auto-fill the PIN if they scanned the QR code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinFromUrl = urlParams.get('pin');
    if (pinFromUrl) setPin(pinFromUrl);
  }, []);

  // 2. Listen for the teacher clicking "Start Game"
  useEffect(() => {
    if (!session) return;

    const supabase = getSupabaseClient(''); 
    
    const subscription = supabase
      .channel(`session_${session.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${session.id}` }, (payload) => {
        if (payload.new.status === 'active') {
          setSession(payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [session]);

  // 3. EXCEL-PARSING FETCH: Get Questions from Sanity when Game Starts
  useEffect(() => {
    if (session?.status === 'active' && questions.length === 0) {
      setIsLoadingQuestions(true);
      
      // Search for the specific practiceBank document that matches the lobby topic
      const query = `*[_type == "practiceBank" && title match "${session.quiz_id}*"][0]`;
      
      client.fetch(query)
        .then((topic) => {
          if (topic && topic.bulkData) {
            // Apply the exact same Excel-parsing logic used in PracticeHub
            const rows = topic.bulkData
              .replace(/\r/g, '') 
              .split('\n')
              .filter((row: string) => row.trim() !== '');
            
            const rawQuestions = rows.map((row: string) => {
              const cols = row.split('\t').map((c: string) => c.trim());
              if (cols.length >= 5 && cols[0] !== '' && cols[0].toLowerCase() !== 'question') {
                return {
                  question: cols[0],
                  options: { A: cols[1], B: cols[2], C: cols[3] },
                  correctAnswer: cols[4].toUpperCase().replace(/[^ABC]/g, '')
                };
              }
              return null;
            }).filter(Boolean); 

            const uniqueQuestions = [];
            const seen = new Set();
            for (const q of rawQuestions) {
              const cleanQ = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!seen.has(cleanQ)) {
                seen.add(cleanQ);
                uniqueQuestions.push(q);
              }
            }

            if (uniqueQuestions.length > 0) {
              const shuffled = uniqueQuestions.sort(() => 0.5 - Math.random());
              setQuestions(shuffled);
            } else {
              setError("Found the topic, but couldn't read the questions from the bulk data.");
            }
          } else {
            setError(`Could not find a Practice Hub topic for: "${session.quiz_id}". Check spelling!`);
          }
        })
        .catch((err) => {
          console.error("Sanity Fetch Error:", err);
          setError("Failed to load quiz data.");
        })
        .finally(() => setIsLoadingQuestions(false));
    }
  }, [session]);

  // --- JOIN LOBBY LOGIC ---
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    try {
      const supabase = getSupabaseClient(''); 

      const { data: sessionData, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('pin_code', pin)
        .eq('status', 'waiting')
        .single();

      if (sessionError || !sessionData) throw new Error('Invalid PIN or the game has already started.');

      const { data: participantData, error: participantError } = await supabase
        .from('live_participants')
        .insert([{ session_id: sessionData.id, nickname: nickname }])
        .select()
        .single();

      if (participantError) throw participantError;

      setSession(sessionData);
      setParticipantId(participantData.id);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // --- GAMEPLAY LOGIC ---
  const handleAnswer = async (selectedKey: string) => {
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedKey === currentQ.correctAnswer;
    
    // Give 100 points for a correct answer
    const newScore = isCorrect ? score + 100 : score; 
    if (isCorrect) setScore(newScore);

    // If there are more questions, go to the next one
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Game Over! Push the final score to the Teacher's Screen
      setIsFinished(true);
      const supabase = getSupabaseClient('');
      await supabase
        .from('live_participants')
        .update({ score: newScore, finished_at: new Date().toISOString() })
        .eq('id', participantId);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Fredoka", sans-serif' }}>
      
      {!session ? (
        // STATE 1: JOIN LOBBY
        <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ color: '#0F172A', fontSize: '2.5rem', marginBottom: '8px', fontWeight: '700', letterSpacing: '-1px' }}>Lit <span style={{color: '#4F46E5'}}>&</span> Learn</h1>
          <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '1.1rem' }}>Join the Live Arena</p>

          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Game PIN" 
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              required
              style={{ padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '1.4rem', textAlign: 'center', fontWeight: '700', letterSpacing: '4px', outline: 'none' }}
            />
            <input 
              type="text" 
              placeholder="Nickname" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={15}
              style={{ padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '1.2rem', textAlign: 'center', outline: 'none' }}
            />
            
            {error && <div style={{ color: '#EF4444', fontWeight: '600', fontSize: '0.95rem', background: '#FEF2F2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            
            <button 
              type="submit" 
              disabled={isJoining || !pin || !nickname}
              style={{ background: '#F59E0B', color: '#ffffff', padding: '16px', borderRadius: '16px', border: 'none', fontSize: '1.3rem', fontWeight: '700', cursor: 'pointer', marginTop: '8px', opacity: (isJoining || !pin || !nickname) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)' }}
            >
              {isJoining ? 'Joining...' : 'Enter Arena'}
            </button>
          </form>
        </div>

      ) : session.status === 'waiting' ? (
        // STATE 2: WAITING ROOM
        <div style={{ textAlign: 'center', background: '#ffffff', padding: '50px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '16px' }}>You're in, <span style={{color: '#4F46E5'}}>{nickname}</span>!</h2>
          <p style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '30px' }}>See your name on the board?</p>
          <div style={{ background: '#FEF3C7', color: '#D97706', padding: '16px 32px', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '700', display: 'inline-block', animation: 'pulse 2s infinite' }}>
            Waiting for teacher to start...
          </div>
        </div>

      ) : isFinished ? (
        // STATE 4: FINISHED
        <div style={{ textAlign: 'center', background: '#ffffff', padding: '50px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '8px' }}>Finished!</h2>
          <p style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '30px' }}>Look at the main screen to see your final rank.</p>
          <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '20px', borderRadius: '24px' }}>
            <div style={{ fontSize: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Final Score</div>
            <div style={{ fontSize: '3rem', fontWeight: '800' }}>{score}</div>
          </div>
        </div>

      ) : (
        // STATE 3: ACTIVE GAMEPLAY
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          {isLoadingQuestions ? (
            <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#64748B', fontWeight: '600' }}>Loading your challenge...</div>
          ) : questions.length > 0 ? (
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #F1F5F9', paddingBottom: '16px' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700', fontSize: '1.1rem' }}>Q {currentQuestionIndex + 1} / {questions.length}</span>
                <span style={{ background: '#ECFDF5', color: '#10B981', padding: '8px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem' }}>{score} pts</span>
              </div>
              
              <h2 style={{ fontSize: '1.8rem', color: '#0F172A', marginBottom: '40px', lineHeight: '1.4' }}>
                {questions[currentQuestionIndex].question}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['A', 'B', 'C'].map((key) => {
                  const optionText = questions[currentQuestionIndex].options[key as 'A' | 'B' | 'C'];
                  if (!optionText) return null;

                  return (
                    <button 
                      key={key} 
                      onClick={() => handleAnswer(key)}
                      style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', padding: '20px', borderRadius: '20px', fontSize: '1.2rem', color: '#334155', fontWeight: '600', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4F46E5'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#334155'; }}
                    >
                      <span style={{ background: '#F1F5F9', color: '#64748B', padding: '8px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem' }}>{key}</span>
                      {optionText}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#EF4444', fontWeight: '600', fontSize: '1.2rem' }}>{error || "An error occurred."}</div>
          )}
        </div>
      )}

    </div>
  );
};