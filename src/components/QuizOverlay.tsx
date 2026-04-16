import React, { useState } from 'react';
import { SmartText } from './SmartReader'; // Re-use our dictionary parser!

export const QuizOverlay = ({ 
  quizItems, 
  isLevelExam, 
  onClose, 
  dictionary, 
  savedWords, 
  toggleSaveWord 
}: { 
  quizItems: any[], 
  isLevelExam: boolean, 
  onClose: () => void,
  dictionary: Record<string, any>,
  savedWords: any[],
  toggleSaveWord: any
}) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // We bring the specific styles the quiz needs here
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' };
  const actionButton = { background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem' };
  const quizOptionBtn = (isSelected: boolean) => ({ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left' as const, padding: '16px', margin: '0', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: '#0F172A', fontSize: '1.1rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' });
  const tfngBtn = (isSelected: boolean) => ({ width: '100%', padding: '18px', margin: '0', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: isSelected ? '#4F46E5' : '#0F172A', fontSize: '1.3rem', fontWeight: '600', cursor: 'pointer' });
  const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };

  const handleSelectAnswer = (idx: number, opt: string, subId?: string) => { 
    setUserAnswers({ ...userAnswers, [subId ? `${idx}-${subId}` : `${idx}`]: opt }); 
  };

  const attemptExit = () => {
    if (!quizFinished) setShowExitWarning(true);
    else onClose();
  };

  // --- GRADING LOGIC ---
  const skillScores: Record<string, { correct: number, total: number }> = {};
  const wrongAnswers: any[] = [];
  let totalCorrect = 0;
  let totalQuestions = 0;

  quizItems.forEach((item, idx) => {
    if (item._type === 'quizQuestion') {
      const skill = item.skill || 'General'; 
      if (!skillScores[skill]) skillScores[skill] = { correct: 0, total: 0 };
      skillScores[skill].total += 1; 
      totalQuestions += 1;
      
      const isCorrect = userAnswers[`${idx}`] === item.correctAnswer;
      if (isCorrect) { 
        skillScores[skill].correct += 1; 
        totalCorrect += 1; 
      } else { 
        let uAns = item.questionFormat === 'True / False / Not Given' ? (userAnswers[`${idx}`] || 'Missed Question') : (userAnswers[`${idx}`] ? item[`option${userAnswers[`${idx}`]}`] : 'Missed Question');
        let cAns = item.questionFormat === 'True / False / Not Given' ? item.correctAnswer : item[`option${item.correctAnswer}`];
        wrongAnswers.push({ question: item.question, skill, userAnsText: uAns, correctAnsText: cAns, explanation: item.explanation, lessonUrl: item.lessonUrl, lessonTitle: item.lessonTitle }); 
      }
    } else if (item.questions) {
      const skill = item.contentType?.split(' ')[0] || 'Reading'; 
      if (!skillScores[skill]) skillScores[skill] = { correct: 0, total: 0 };

      item.questions.forEach((q: any) => {
        skillScores[skill].total += 1; 
        totalQuestions += 1; 
        const ansKey = `${idx}-${q._key}`;
        
        if (userAnswers[ansKey] === q.correctAnswer) { 
          skillScores[skill].correct += 1; 
          totalCorrect += 1; 
        } else { 
          let uAns = q.questionFormat === 'True / False / Not Given' ? (userAnswers[ansKey] || 'Missed Question') : (userAnswers[ansKey] ? q[`option${userAnswers[ansKey]}`] : 'Missed Question');
          let cAns = q.questionFormat === 'True / False / Not Given' ? q.correctAnswer : q[`option${q.correctAnswer}`];
          wrongAnswers.push({ question: q.questionText, skill, contextTitle: item.title, userAnsText: uAns, correctAnsText: cAns, explanation: q.explanation }); 
        }
      });
    }
  });

  const totalPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div style={{ maxWidth: quizItems[currentItemIndex]?._type === 'comprehensionBlock' ? '900px' : '800px', margin: '0 auto' }}>
      {!quizFinished ? (
        <>
          <button onClick={attemptExit} style={{ background: 'transparent', border: 'none', color: '#64748B', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', fontSize: '1.1rem' }}>← Exit Test</button>
          <div className="responsive-card" style={{ ...cardStyle, padding: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', color: '#64748B', fontWeight: '600' }}>
              <span>Part {currentItemIndex + 1} of {quizItems.length}</span>
              <span style={{ background: isLevelExam ? '#FEF3C7' : '#EEF2FF', color: isLevelExam ? '#D97706' : '#4F46E5', padding: '4px 12px', borderRadius: '9999px' }}>{quizItems[currentItemIndex]?._type === 'comprehensionBlock' ? quizItems[currentItemIndex]?.contentType : quizItems[currentItemIndex]?.skill}</span>
            </div>

            {quizItems[currentItemIndex]?._type === 'comprehensionBlock' ? (
              <div>
                <div style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '2px dashed #E2E8F0' }}>
                  <h2 style={{ fontSize: '2.2rem', color: '#0F172A', fontWeight: '600', marginBottom: '16px', lineHeight: '1.2' }}>{quizItems[currentItemIndex]?.title}</h2>
                  <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '24px', fontWeight: '500' }}>{quizItems[currentItemIndex]?.instruction}</p>
                  
                  {quizItems[currentItemIndex]?.contentType === 'Listening (Audio)' && quizItems[currentItemIndex]?.blockAudioUrl && (
                    <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '24px', border: '2px solid #E2E8F0', marginBottom: '24px' }}>
                      <audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={quizItems[currentItemIndex].blockAudioUrl} type="audio/mpeg" /></audio>
                    </div>
                  )}

                  {quizItems[currentItemIndex]?.readingPassage && (
                    <div className="reading-box" style={{ background: '#F8FAFC', padding: '30px', borderRadius: '24px', color: '#334155', fontSize: '1.2rem', lineHeight: '1.8', border: '1px solid #E2E8F0' }}>
                      <SmartText text={quizItems[currentItemIndex].readingPassage} dictionary={dictionary} savedWords={savedWords} onSaveWord={toggleSaveWord} />
                    </div>
                  )}
                </div>
                {quizItems[currentItemIndex]?.questions && quizItems[currentItemIndex].questions.map((q: any) => (
                  <div key={q._key} style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#0F172A', fontWeight: '600', marginBottom: '20px', lineHeight: '1.4' }}>{q.questionText}</h3>
                    {q.questionFormat === 'True / False / Not Given' ? (
                      <div className="tfng-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        {['True', 'False', 'Not Given'].map(opt => <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt, q._key)} style={tfngBtn(userAnswers[`${currentItemIndex}-${q._key}`] === opt)}>{opt}</button>)}
                      </div>
                    ) : (
                      <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const isSelected = userAnswers[`${currentItemIndex}-${q._key}`] === opt;
                          return (
                            <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt, q._key)} style={quizOptionBtn(isSelected)}>
                              <span style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: isSelected ? '#4F46E5' : '#F1F5F9', color: isSelected ? '#ffffff' : '#475569', width: '32px', height: '32px', borderRadius: '50%', marginRight: '16px', fontSize: '0.9rem', fontWeight: '600' }}>{opt}</span>
                              <span className="quiz-btn-text">{q[`option${opt}`]}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', marginBottom: '30px', lineHeight: '1.4' }}>{quizItems[currentItemIndex]?.question}</h3>
                
                {quizItems[currentItemIndex]?.questionAudioUrl && (
                  <div style={{ width: '100%', marginBottom: '40px', padding: '16px', background: '#F8FAFC', borderRadius: '24px', border: '2px solid #E2E8F0' }}>
                    <span style={{ display: 'block', marginBottom: '12px', color: '#4F46E5', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' }}>🎧 Listen to the Audio</span>
                    <audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={quizItems[currentItemIndex].questionAudioUrl} type="audio/mpeg" /></audio>
                  </div>
                )}

                {quizItems[currentItemIndex]?.questionFormat === 'True / False / Not Given' ? (
                  <div className="tfng-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '40px' }}>
                    {['True', 'False', 'Not Given'].map(opt => <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt)} style={tfngBtn(userAnswers[`${currentItemIndex}`] === opt)}>{opt}</button>)}
                  </div>
                ) : (
                  <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '40px' }}>
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt)} style={quizOptionBtn(userAnswers[`${currentItemIndex}`] === opt)}>
                        <span style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: userAnswers[`${currentItemIndex}`] === opt ? '#4F46E5' : '#F1F5F9', color: userAnswers[`${currentItemIndex}`] === opt ? '#ffffff' : '#475569', width: '32px', height: '32px', borderRadius: '50%', marginRight: '16px', fontSize: '0.9rem', fontWeight: '600' }}>{opt}</span>
                        <span className="quiz-btn-text">{quizItems[currentItemIndex][`option${opt}`]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => currentItemIndex < quizItems.length - 1 ? setCurrentItemIndex(i => i + 1) : setQuizFinished(true)} style={{ ...actionButton, marginTop: '20px', width: '100%', padding: '18px' }}>{currentItemIndex < quizItems.length - 1 ? 'Next Question' : 'Submit Test'}</button>
          </div>
        </>
      ) : (
        <>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748B', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', fontSize: '1.1rem' }}>← Return to Syllabus</button>
          <div className="responsive-card" style={{ ...cardStyle, padding: '50px', textAlign: 'center', marginBottom: '40px', background: totalPercentage >= 80 ? '#ECFDF5' : '#ffffff', border: totalPercentage >= 80 ? '2px solid #10B981' : 'none' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '600', color: '#0F172A', margin: '0 0 16px' }}>{isLevelExam ? 'Final Exam Results' : 'Diagnostic Results'}</h2>
            <div className="result-number" style={{ fontSize: '5rem', fontWeight: '700', color: totalPercentage >= 80 ? '#10B981' : '#F59E0B', marginBottom: '30px' }}>{totalPercentage}%</div>
            <div style={{ color: '#64748B', fontSize: '1.2rem', fontWeight: '500', marginBottom: '30px' }}>You answered {totalCorrect} out of {totalQuestions} questions correctly.</div>
          </div>
          
          {wrongAnswers.length > 0 && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '2rem', color: '#0F172A', fontWeight: '600' }}>Targeted Review</h3>
                {wrongAnswers.map((wa, idx) => (
                  <div key={idx} className="responsive-card" style={{ ...cardStyle, padding: '30px', borderLeft: '6px solid #EF4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}><span style={{ background: '#FEE2E2', color: '#EF4444', padding: '4px 12px', borderRadius: '9999px', fontWeight: '600', fontSize: '0.9rem' }}>{wa.skill} Match Error</span></div>
                    <p style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: '500', marginBottom: '24px', lineHeight: '1.4' }}>{wa.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}><span style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Your Answer</span><span style={{ color: '#EF4444', fontWeight: '500', fontSize: '1.1rem' }}>{wa.userAnsText}</span></div>
                      <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px' }}><span style={{ display: 'block', color: '#10B981', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Correct Answer</span><span style={{ color: '#059669', fontWeight: '500', fontSize: '1.1rem' }}>{wa.correctAnsText}</span></div>
                    </div>
                    {wa.explanation && ( <div style={{ background: '#FFFBEB', color: '#B45309', padding: '20px', borderRadius: '12px', marginTop: '24px', lineHeight: '1.6' }}><strong>Why it's wrong:</strong> {wa.explanation}</div> )}
                  </div>
                ))}
             </div>
          )}
        </>
      )}

      {/* THE EXIT WARNING MODAL MOVES HERE! */}
      {showExitWarning && (
        <div style={modalOverlay} onClick={() => setShowExitWarning(false)}>
          <div className="responsive-card" style={{...cardStyle, maxWidth: '450px', textAlign: 'center', padding: '40px'}} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0F172A', fontWeight: '600' }}>Leave Test?</h2>
            <p style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '32px', lineHeight: '1.5' }}>You have unsaved progress. If you leave now, you will lose your current answers.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowExitWarning(false)} style={{...actionButton, background: '#F1F5F9', color: '#475569', padding: '14px 28px'}}>Cancel</button>
              <button onClick={onClose} style={{...actionButton, background: '#EF4444', padding: '14px 28px'}}>Yes, Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};