import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { client } from '../sanityClient'; 

const IconClock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconCrown = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="2 16 5 4 12 9 19 4 22 16 2 16"></polygon><line x1="2" y1="20" x2="22" y2="20"></line></svg>);
const IconUsers = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);

export const LivePlayer: React.FC = () => {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [session, setSession] = useState<any | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [team, setTeam] = useState<'blue' | 'red' | null>(null); 
  const [teammates, setTeammates] = useState<any[]>([]);
  
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const [feedbackState, setFeedbackState] = useState<{ show: boolean, isCorrect: boolean, selectedKey: string | null } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null); 
  const [totalTimeMs, setTotalTimeMs] = useState<number>(0);

  const [broadcastEvent, setBroadcastEvent] = useState<any>(null);
  const channelRef = useRef<any>(null);
  const processingRef = useRef(false);

  let isCaptain = true;
  let captainName = '';
  let showCaptainBanner = false;
  
  if (session?.game_mode === 'tug-of-war-captain' && teammates.length > 0) {
    showCaptainBanner = true;
    const captainIndex = currentQuestionIndex % teammates.length;
    const currentCaptain = teammates[captainIndex];
    isCaptain = currentCaptain.id === participantId;
    captainName = currentCaptain.nickname;
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinFromUrl = urlParams.get('pin');
    if (pinFromUrl) setPin(pinFromUrl);
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    const supabase = getSupabaseClient(''); 
    const channel = supabase.channel(`session_${session.id}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;

    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${session.id}` }, (payload) => {
        if (payload.new.status === 'active') setSession(payload.new);
      })
      .on('broadcast', { event: 'captain_action' }, (payload) => {
        setBroadcastEvent({ ...payload.payload, timestamp: Date.now() });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    if (session?.status === 'active' && questions.length === 0) {
      setIsLoadingQuestions(true);
      if (session.game_mode === 'tug-of-war-captain' && team) {
        const supabase = getSupabaseClient('');
        supabase.from('live_participants').select('*').eq('session_id', session.id).eq('team', team).order('nickname', { ascending: true })
          .then(({ data }) => { if (data) setTeammates(data); });
      }

      const query = `*[_type == "practiceBank" && title match "${session.quiz_id}*"][0]`;
      client.fetch(query).then((topic) => {
          if (topic && topic.bulkData) {
            const rows = topic.bulkData.replace(/\r/g, '').split('\n').filter((row: string) => row.trim() !== '');
            const rawQuestions = rows.map((row: string) => {
              const cols = row.split('\t').map((c: string) => c.trim());
              if (cols.length >= 5 && cols[0] !== '' && cols[0].toLowerCase() !== 'question') {
                return { question: cols[0], options: { A: cols[1], B: cols[2], C: cols[3] }, correctAnswer: cols[4].toUpperCase().replace(/[^ABC]/g, ''), explanation: cols[5] || `Review this grammar rule. Correct answer: ${cols[4].toUpperCase()}.` };
              }
              return null;
            }).filter(Boolean); 

            const uniqueQuestions = [];
            const seen = new Set();
            for (const q of rawQuestions) {
              const cleanQ = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!seen.has(cleanQ)) { seen.add(cleanQ); uniqueQuestions.push(q); }
            }

            if (uniqueQuestions.length > 0) {
              if (session.game_mode === 'standard') {
                setQuestions(uniqueQuestions.sort(() => 0.5 - Math.random()));
              } else {
                setQuestions(uniqueQuestions);
              }
            } else { setError("Found topic, but couldn't read questions."); }
          } else { setError("Quiz data not found."); }
        }).catch(() => setError("Failed to load quiz."))
        .finally(() => setIsLoadingQuestions(false));
    }
  }, [session, team]);

  useEffect(() => {
    if (session?.status === 'active' && !isLoadingQuestions && questions.length > 0 && !isFinished && !feedbackState?.show) {
      setQuestionStartTime(Date.now());
      
      if (session.time_limit === null) {
        setTimeLeft(null); 
      } else {
        setTimeLeft(session.time_limit);
        const timerInterval = setInterval(() => {
          setTimeLeft((prev) => (prev !== null && prev <= 1) ? 0 : (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => clearInterval(timerInterval);
      }
    }
  }, [currentQuestionIndex, isLoadingQuestions, questions.length, session?.status, isFinished, feedbackState?.show, session?.time_limit]);

  useEffect(() => {
    if (timeLeft === 0 && session?.status === 'active' && !isFinished && !feedbackState?.show) handleAnswer(null); 
  }, [timeLeft, session?.status, isFinished, feedbackState?.show]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);
    try {
      const supabase = getSupabaseClient(''); 
      // NEW FIX: Allows students to join if the game is 'waiting' OR 'active'
      const { data: sessionData, error: sessionError } = await supabase.from('live_sessions').select('*').eq('pin_code', pin).in('status', ['waiting', 'active']).single();
      if (sessionError || !sessionData) throw new Error('Invalid PIN or game has finished.');

      const { count } = await supabase.from('live_participants').select('*', { count: 'exact', head: true }).eq('session_id', sessionData.id);
      const assignedTeam = (count || 0) % 2 === 0 ? 'blue' : 'red';

      const { data: participantData, error: participantError } = await supabase.from('live_participants').insert([{ session_id: sessionData.id, nickname: nickname, team: assignedTeam }]).select().single();
      if (participantError) throw participantError;

      setSession(sessionData);
      setParticipantId(participantData.id);
      setTeam(assignedTeam); 
    } catch (err: any) { setError(err.message); } finally { setIsJoining(false); }
  };

  const handleAnswer = async (selectedKey: string | null, isFromBroadcast = false) => {
    if (processingRef.current || isFinished || feedbackState?.show) return;
    if (session?.game_mode === 'tug-of-war-captain' && !isCaptain && !isFromBroadcast) return;

    processingRef.current = true;

    if (session?.game_mode === 'tug-of-war-captain' && isCaptain && !isFromBroadcast) {
      channelRef.current?.send({ type: 'broadcast', event: 'captain_action', payload: { action: 'ANSWER', key: selectedKey, team: team }});
    }

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedKey !== null && selectedKey === currentQ.correctAnswer;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) setCorrectCount(newCorrectCount);

    const maxTimeMs = session?.time_limit ? session.time_limit * 1000 : null;
    const timeTakenMs = selectedKey === null ? (maxTimeMs || 20000) : (Date.now() - questionStartTime);
    const newTotalTimeMs = totalTimeMs + timeTakenMs;
    setTotalTimeMs(newTotalTimeMs);

    let newScore = score;
    if (isCorrect) {
      if (maxTimeMs) {
        const timeRatio = Math.min(timeTakenMs / maxTimeMs, 1); 
        newScore = score + 100 + Math.floor(100 * (1 - timeRatio)); 
      } else {
        newScore = score + 100;
      }
      setScore(newScore);
    }

    const supabase = getSupabaseClient('');
    await supabase.from('live_participants').update({ score: newScore, total_time: parseFloat((newTotalTimeMs / 1000).toFixed(1)), correct_answers: newCorrectCount, total_questions: questions.length }).eq('id', participantId);
    setFeedbackState({ show: true, isCorrect, selectedKey });
    processingRef.current = false; 
  };

  const handleNextQuestion = async (isFromBroadcast = false) => {
    if (session?.game_mode === 'tug-of-war-captain' && isCaptain && !isFromBroadcast) {
      channelRef.current?.send({ type: 'broadcast', event: 'captain_action', payload: { action: 'NEXT', team: team } });
    }
    setFeedbackState(null);
    setQuestionStartTime(Date.now());
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
      const supabase = getSupabaseClient('');
      await supabase.from('live_participants').update({ finished_at: new Date().toISOString() }).eq('id', participantId);
    }
  };

  useEffect(() => {
    if (!broadcastEvent || !team) return;
    if (broadcastEvent.team === team) {
      if (broadcastEvent.action === 'ANSWER') handleAnswer(broadcastEvent.key, true);
      else if (broadcastEvent.action === 'NEXT') handleNextQuestion(true);
    }
  }, [broadcastEvent]);

  const theme = { bg: team === 'blue' ? '#EFF6FF' : team === 'red' ? '#FEF2F2' : '#F8FAFC', accent: team === 'blue' ? '#3B82F6' : team === 'red' ? '#EF4444' : '#4F46E5', border: team === 'blue' ? '#BFDBFE' : team === 'red' ? '#FECACA' : '#E2E8F0' };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Fredoka", sans-serif', transition: 'background 0.5s ease' }}>
      
      {team && session?.status !== 'finished' && session?.game_mode !== 'standard' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: theme.accent, color: '#fff', textAlign: 'center', padding: '14px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 50, fontSize: '0.9rem' }}>Team {team === 'blue' ? 'Blue' : 'Red'}</div>
      )}

      {!session ? (
        <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ color: '#0F172A', fontSize: '2.5rem', marginBottom: '8px', fontWeight: '700', letterSpacing: '-1px' }}>Lit <span style={{color: '#4F46E5'}}>&</span> Learn</h1>
          <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '1.1rem' }}>Join the Game</p>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Game PIN" value={pin} onChange={(e) => setPin(e.target.value.toUpperCase())} required style={{ padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '1.4rem', textAlign: 'center', fontWeight: '700', letterSpacing: '4px', outline: 'none' }} />
            <input type="text" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={15} style={{ padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '1.2rem', textAlign: 'center', outline: 'none' }} />
            {error && <div style={{ color: '#EF4444', fontWeight: '600', fontSize: '0.95rem', background: '#FEF2F2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            <button type="submit" disabled={isJoining || !pin || !nickname} style={{ background: '#0F172A', color: '#ffffff', padding: '18px', borderRadius: '16px', border: 'none', fontSize: '1.2rem', fontWeight: '700', cursor: 'pointer', marginTop: '8px', opacity: (isJoining || !pin || !nickname) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)' }}>{isJoining ? 'Joining...' : 'Join Game'}</button>
          </form>
        </div>
      ) : session.status === 'waiting' ? (
        <div style={{ textAlign: 'center', background: '#ffffff', padding: '50px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%', marginTop: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '16px' }}>You're in, <span style={{color: theme.accent}}>{nickname}</span>!</h2>
          <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '30px' }}>Look at the board to see your name.</p>
          <div style={{ background: '#F8FAFC', color: '#475569', padding: '16px 32px', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '600', display: 'inline-block', border: '1px solid #E2E8F0' }}>Waiting for your teacher to start...</div>
        </div>
      ) : isFinished ? (
        <div style={{ textAlign: 'center', background: '#ffffff', padding: '50px 30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%', marginTop: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '8px' }}>Finished!</h2>
          <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '30px' }}>Look at the board to see the final results.</p>
          <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, color: theme.accent, padding: '20px', borderRadius: '24px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Final Score</div>
            <div style={{ fontSize: '3rem', fontWeight: '800' }}>{score}</div>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', marginTop: '40px' }}>
          {isLoadingQuestions ? (
            <div style={{ textAlign: 'center', fontSize: '1.3rem', color: '#64748B', fontWeight: '600' }}>Loading questions...</div>
          ) : questions.length > 0 ? (
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: `1px solid ${theme.border}` }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Q {currentQuestionIndex + 1} / {questions.length}</span>
                <span style={{ color: (timeLeft !== null && timeLeft > 5) || timeLeft === null ? '#0F172A' : '#EF4444', fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconClock /> {timeLeft !== null ? `${timeLeft}s` : 'Unlimited'}
                </span>
                <span style={{ color: theme.accent, fontWeight: '700', fontSize: '1.1rem' }}>{score} pts</span>
              </div>

              {timeLeft !== null && session.time_limit && (
                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
                  <div style={{ width: `${(timeLeft / session.time_limit) * 100}%`, height: '100%', background: timeLeft > 5 ? '#0F172A' : '#EF4444', transition: 'width 1s linear, background 0.3s' }} />
                </div>
              )}

              {showCaptainBanner && !feedbackState?.show && (
                <div style={{ background: isCaptain ? '#0F172A' : '#F8FAFC', color: isCaptain ? '#ffffff' : '#64748B', padding: '16px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', border: isCaptain ? 'none' : '1px solid #E2E8F0', boxShadow: isCaptain ? '0 10px 20px rgba(15, 23, 42, 0.15)' : 'none' }}>
                  {isCaptain ? <IconCrown /> : <IconUsers />}
                  <div style={{ fontWeight: '600', fontSize: '1.05rem', lineHeight: '1.4' }}>
                    {isCaptain ? "You are the Captain! Choose the answer for your team." : `Discuss! ${captainName} will choose the answer.`}
                  </div>
                </div>
              )}
              
              <h2 style={{ fontSize: '1.6rem', color: '#0F172A', marginBottom: '40px', lineHeight: '1.5', fontWeight: '600' }}>{questions[currentQuestionIndex].question}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['A', 'B', 'C'].map((key) => {
                  const optionText = questions[currentQuestionIndex].options[key as 'A' | 'B' | 'C'];
                  if (!optionText) return null;

                  const isSelected = feedbackState?.selectedKey === key;
                  const isActuallyCorrect = questions[currentQuestionIndex].correctAnswer === key;
                  
                  let bgColor = '#F8FAFC'; let borderColor = '#E2E8F0'; let textColor = '#334155'; let opacity = 1;

                  if (feedbackState?.show) {
                    if (isActuallyCorrect) { bgColor = '#ECFDF5'; borderColor = '#10B981'; textColor = '#065F46'; } 
                    else if (isSelected) { bgColor = '#FEF2F2'; borderColor = '#EF4444'; textColor = '#991B1B'; } 
                    else { opacity = 0.4; }
                  } else if (showCaptainBanner && !isCaptain) {
                    opacity = 0.5; 
                  }

                  return (
                    <button key={key} onClick={() => handleAnswer(key)} disabled={feedbackState?.show || (showCaptainBanner && !isCaptain)} style={{ background: bgColor, border: `2px solid ${borderColor}`, color: textColor, opacity: opacity, padding: '20px', borderRadius: '20px', fontSize: '1.15rem', fontWeight: '600', textAlign: 'left', cursor: (feedbackState?.show || (showCaptainBanner && !isCaptain)) ? 'default' : 'pointer', transition: 'all 0.2s', outline: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ background: '#ffffff', color: '#0F172A', border: '1px solid #CBD5E1', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' }}>{key}</span>
                      {optionText}
                    </button>
                  );
                })}
              </div>

              {feedbackState?.show && (
                <div style={{ background: feedbackState.isCorrect ? '#ECFDF5' : '#FEF2F2', padding: '24px', borderRadius: '20px', border: `1px solid ${feedbackState.isCorrect ? '#A7F3D0' : '#FECACA'}`, marginTop: '32px', animation: 'fadeIn 0.3s ease-out' }}>
                  <h3 style={{ color: feedbackState.isCorrect ? '#059669' : '#DC2626', margin: '0 0 8px 0', fontSize: '1.3rem' }}>{feedbackState.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}</h3>
                  <p style={{ color: '#334155', fontSize: '1.05rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>{questions[currentQuestionIndex].explanation}</p>
                  
                  {(!showCaptainBanner || isCaptain) ? (
                    <button onClick={() => handleNextQuestion(false)} style={{ background: '#0F172A', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', width: '100%', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)' }}>
                      Next Question →
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748B', fontWeight: '600', padding: '10px' }}>Waiting for {captainName} to click next...</div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#EF4444', fontWeight: '600', fontSize: '1.2rem' }}>{error || "An error occurred."}</div>
          )}
        </div>
      )}
    </div>
  );
};