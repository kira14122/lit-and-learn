import React, { useState, useEffect, useRef } from 'react';
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
  
  // --- NEW: ACCURACY STATE ---
  const [correctCount, setCorrectCount] = useState<number>(0);

  // --- SPEED TIMER STATES ---
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(20); 
  const [totalTimeMs, setTotalTimeMs] = useState<number>(0);

  // A hidden referee to prevent double-clicking and handle timeouts perfectly
  const processingRef = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinFromUrl = urlParams.get('pin');
    if (pinFromUrl) setPin(pinFromUrl);
  }, []);

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

  useEffect(() => {
    if (session?.status === 'active' && questions.length === 0) {
      setIsLoadingQuestions(true);
      
      const query = `*[_type == "practiceBank" && title match "${session.quiz_id}*"][0]`;
      
      client.fetch(query)
        .then((topic) => {
          if (topic && topic.bulkData) {
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

  useEffect(() => {
    if (session?.status === 'active' && !isLoadingQuestions && questions.length > 0 && !isFinished) {
      setQuestionStartTime(Date.now());
      setTimeLeft(20); 
      
      const timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) return 0; 
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [currentQuestionIndex, isLoadingQuestions, questions.length, session?.status, isFinished]);

  useEffect(() => {
    if (timeLeft === 0 && session?.status === 'active' && !isFinished) {
      handleAnswer(null); 
    }
  }, [timeLeft, session?.status, isFinished]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    try {
      const supabase = getSupabaseClient(''); 
      const { data: sessionData, error: sessionError } = await supabase.from('live_sessions').select('*').eq('pin_code', pin).eq('status', 'waiting').single();
      if (sessionError || !sessionData) throw new Error('Invalid PIN or the game has already started.');

      const { data: participantData, error: participantError } = await supabase.from('live_participants').insert([{ session_id: sessionData.id, nickname: nickname }]).select().single();
      if (participantError) throw participantError;

      setSession(sessionData);
      setParticipantId(participantData.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // --- UPDATED GAMEPLAY LOGIC ---
  const handleAnswer = async (selectedKey: string | null) => {
    if (processingRef.current || isFinished) return;
    processingRef.current = true;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedKey !== null && selectedKey === currentQ.correctAnswer;
    
    // Track Correct Answers
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) setCorrectCount(newCorrectCount);

    const timeTakenMs = selectedKey === null ? 20000 : (Date.now() - questionStartTime);
    const newTotalTimeMs = totalTimeMs + timeTakenMs;
    setTotalTimeMs(newTotalTimeMs);

    let newScore = score;
    if (isCorrect) {
      const maxTimeMs = 20000; 
      const timeRatio = Math.min(timeTakenMs / maxTimeMs, 1); 
      const speedBonus = Math.floor(100 * (1 - timeRatio)); 
      newScore = score + 100 + speedBonus;
      setScore(newScore);
    }

    const formattedSeconds = parseFloat((newTotalTimeMs / 1000).toFixed(1));

    // Push everything (Score, Time, and Accuracy) to Supabase instantly!
    const supabase = getSupabaseClient('');
    await supabase
      .from('live_participants')
      .update({ 
        score: newScore,
        total_time: formattedSeconds,
        correct_answers: newCorrectCount,
        total_questions: questions.length
      })
      .eq('id', participantId);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      processingRef.current = false; 
    } else {
      setIsFinished(true);
      await supabase
        .from('live_participants')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', participantId);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Fredoka", sans-serif' }}>
      
      {!session ? (
        <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ color: '#0F172A', fontSize: '2.5rem', marginBottom: '8px', fontWeight: '700', letterSpacing: '-1px' }}>Lit <span style={{color: '#4F46E5'}}>&</span> Learn</h1>
          <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '1.1rem' }}>Join the Live Arena</p>

          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Game PIN" value={pin} onChange={(e) => setPin(e.target.value.toUpperCase())} required style={{ padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '1.4rem', textAlign: 'center', fontWeight: '700', letterSpacing: '4px', outline: 'none' }} />
            <input type="text" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={15} style={{ padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '1.2rem', textAlign: 'center', outline: 'none' }} />
            {error && <div style={{ color: '#EF4444', fontWeight: '600', fontSize: '0.95rem', background: '#FEF2F2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            <button type="submit" disabled={isJoining || !pin || !nickname} style={{ background: '#F59E0B', color: '#ffffff', padding: '16px', borderRadius: '16px', border: 'none', fontSize: '1.3rem', fontWeight: '700', cursor: 'pointer', marginTop: '8px', opacity: (isJoining || !pin || !nickname) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)' }}>
              {isJoining ? 'Joining...' : 'Enter Arena'}
            </button>
          </form>
        </div>
      ) : session.status === 'waiting' ? (
        <div style={{ textAlign: 'center', background: '#ffffff', padding: '50px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '16px' }}>You're in, <span style={{color: '#4F46E5'}}>{nickname}</span>!</h2>
          <p style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '30px' }}>See your name on the board?</p>
          <div style={{ background: '#FEF3C7', color: '#D97706', padding: '16px 32px', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '700', display: 'inline-block', animation: 'pulse 2s infinite' }}>
            Waiting for teacher to start...
          </div>
        </div>
      ) : isFinished ? (
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
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          {isLoadingQuestions ? (
            <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#64748B', fontWeight: '600' }}>Loading your challenge...</div>
          ) : questions.length > 0 ? (
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700', fontSize: '1.1rem' }}>Q {currentQuestionIndex + 1} / {questions.length}</span>
                <span style={{ background: timeLeft > 5 ? '#FEF3C7' : '#FEF2F2', color: timeLeft > 5 ? '#D97706' : '#EF4444', padding: '8px 16px', borderRadius: '9999px', fontWeight: '800', fontSize: '1.2rem', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⏳ {timeLeft}s
                </span>
                <span style={{ background: '#ECFDF5', color: '#10B981', padding: '8px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem' }}>{score} pts</span>
              </div>

              <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
                <div style={{ width: `${(timeLeft / 20) * 100}%`, height: '100%', background: timeLeft > 5 ? '#F59E0B' : '#EF4444', transition: 'width 1s linear, background 0.3s' }} />
              </div>
              
              <h2 style={{ fontSize: '1.8rem', color: '#0F172A', marginBottom: '40px', lineHeight: '1.4' }}>
                {questions[currentQuestionIndex].question}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['A', 'B', 'C'].map((key) => {
                  const optionText = questions[currentQuestionIndex].options[key as 'A' | 'B' | 'C'];
                  if (!optionText) return null;

                  return (
                    <button key={key} onClick={() => handleAnswer(key)} style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', padding: '20px', borderRadius: '20px', fontSize: '1.2rem', color: '#334155', fontWeight: '600', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none', display: 'flex', alignItems: 'center', gap: '16px' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4F46E5'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#334155'; }}>
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