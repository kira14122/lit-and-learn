import React, { useState } from 'react';
import TextHighlighter from './TextHighlighter';
import { CustomAudioPlayer } from './CustomAudioPlayer';

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

  const handleSelectAnswer = (idx: number, opt: string, subId?: string) => { 
    setUserAnswers({ ...userAnswers, [subId ? `${idx}-${subId}` : `${idx}`]: opt }); 
  };

  const attemptExit = () => {
    if (!quizFinished) setShowExitWarning(true);
    else onClose();
  };

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
  const progressPercentage = ((currentItemIndex + 1) / quizItems.length) * 100;

  return (
    <div id="quiz-container" style={{ backgroundColor: '#F3F6F8', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      
      <div className="lesson-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 1000 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Lit <span style={{ color: '#4F46E5' }}>&</span> Learn
        </h2>
        <div style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }} className="desktop-only-title">
          {isLevelExam ? 'Level Placement Test' : 'Unit Assessment'}
        </div>
        <button onClick={attemptExit} style={{ padding: '10px 24px', backgroundColor: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
          ✕ Close
        </button>
      </div>

      <div className="lesson-wrapper" style={{ maxWidth: quizItems[currentItemIndex]?._type === 'comprehensionBlock' ? '1000px' : '800px', margin: '0 auto', padding: '40px 20px 120px 20px' }}>
        
        {!quizFinished ? (
          <>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span>Part {currentItemIndex + 1} of {quizItems.length}</span>
                <span style={{ color: '#4F46E5' }}>{quizItems[currentItemIndex]?._type === 'comprehensionBlock' ? quizItems[currentItemIndex]?.contentType : quizItems[currentItemIndex]?.skill}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#4F46E5', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div className="responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '50px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
              
              {quizItems[currentItemIndex]?._type === 'comprehensionBlock' ? (
                <div>
                  <div style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '2px dashed #E2E8F0' }}>
                    <h2 style={{ fontSize: '2.2rem', color: '#0F172A', fontWeight: '600', marginBottom: '16px', lineHeight: '1.2' }}>{quizItems[currentItemIndex]?.title}</h2>
                    <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '24px', fontWeight: '500' }}>{quizItems[currentItemIndex]?.instruction}</p>
                    
                    {quizItems[currentItemIndex]?.contentType === 'Listening (Audio)' && quizItems[currentItemIndex]?.blockAudioUrl && (
                      <div style={{ marginBottom: '24px' }}>
                        <CustomAudioPlayer src={quizItems[currentItemIndex].blockAudioUrl} title="Listen to the Track" />
                      </div>
                    )}

                    {quizItems[currentItemIndex]?.readingPassage && (
                      <div className="reading-box" style={{ background: '#F8FAFC', padding: '40px', borderRadius: '24px', color: '#334155', fontSize: '1.2rem', lineHeight: '1.8', border: '1px solid #E2E8F0' }}>
                        {/* FIXED: Passed dictionary prop here! */}
                        <TextHighlighter 
                          text={quizItems[currentItemIndex].readingPassage} 
                          dictionary={dictionary}
                          savedWords={savedWords} 
                          onSaveWord={toggleSaveWord} 
                        />
                      </div>
                    )}
                  </div>
                  {quizItems[currentItemIndex]?.questions && quizItems[currentItemIndex].questions.map((q: any, i: number) => (
                    <div key={q._key} style={{ marginBottom: '40px' }}>
                      <h3 style={{ fontSize: '1.4rem', color: '#0F172A', fontWeight: '600', marginBottom: '20px', lineHeight: '1.4' }}>
                        <span style={{ color: '#4F46E5', marginRight: '8px' }}>{i + 1}.</span> {q.questionText}
                      </h3>
                      {q.questionFormat === 'True / False / Not Given' ? (
                        <div className="tfng-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                          {['True', 'False', 'Not Given'].map(opt => {
                            const isSelected = userAnswers[`${currentItemIndex}-${q._key}`] === opt;
                            return (
                              <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt, q._key)} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: isSelected ? '#4F46E5' : '#0F172A', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const isSelected = userAnswers[`${currentItemIndex}-${q._key}`] === opt;
                            return (
                              <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt, q._key)} style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', padding: '16px', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: '#0F172A', fontSize: '1.1rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                <span style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: isSelected ? '#4F46E5' : '#F1F5F9', color: isSelected ? '#ffffff' : '#475569', width: '32px', height: '32px', borderRadius: '50%', marginRight: '16px', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s ease' }}>{opt}</span>
                                <span className="quiz-btn-text" style={{ lineHeight: '1.4' }}>{q[`option${opt}`]}</span>
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
                    <div style={{ marginBottom: '40px' }}>
                      <CustomAudioPlayer src={quizItems[currentItemIndex].questionAudioUrl} title="Listen to the Track" />
                    </div>
                  )}

                  {quizItems[currentItemIndex]?.questionFormat === 'True / False / Not Given' ? (
                    <div className="tfng-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '40px' }}>
                      {['True', 'False', 'Not Given'].map(opt => {
                        const isSelected = userAnswers[`${currentItemIndex}`] === opt;
                        return (
                          <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt)} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: isSelected ? '#4F46E5' : '#0F172A', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const isSelected = userAnswers[`${currentItemIndex}`] === opt;
                        return (
                          <button key={opt} onClick={() => handleSelectAnswer(currentItemIndex, opt)} style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', padding: '16px', borderRadius: '16px', border: isSelected ? '2px solid #4F46E5' : '2px solid #E2E8F0', background: isSelected ? '#EEF2FF' : '#ffffff', color: '#0F172A', fontSize: '1.1rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            <span style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: isSelected ? '#4F46E5' : '#F1F5F9', color: isSelected ? '#ffffff' : '#475569', width: '32px', height: '32px', borderRadius: '50%', marginRight: '16px', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s ease' }}>{opt}</span>
                            <span className="quiz-btn-text" style={{ lineHeight: '1.4' }}>{quizItems[currentItemIndex][`option${opt}`]}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => {
                  if (currentItemIndex < quizItems.length - 1) {
                    setCurrentItemIndex(i => i + 1);
                    document.getElementById('quiz-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    setQuizFinished(true);
                    document.getElementById('quiz-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }} 
                style={{ background: '#4F46E5', color: '#ffffff', padding: '18px 24px', borderRadius: '9999px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '1.15rem', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}
              >
                {currentItemIndex < quizItems.length - 1 ? 'Next Question' : 'Submit Assessment'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ animation: 'fadeInDown 0.4s ease-out' }}>
            <div className="responsive-card" style={{ backgroundColor: totalPercentage >= 80 ? '#F0FDF4' : '#ffffff', borderRadius: '32px', padding: '60px 40px', textAlign: 'center', marginBottom: '40px', border: totalPercentage >= 80 ? '2px solid #10B981' : '2px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '600', color: '#0F172A', margin: '0 0 16px', letterSpacing: '-1px' }}>
                {isLevelExam ? 'Placement Results' : 'Assessment Results'}
              </h2>
              <div className="result-number" style={{ fontSize: '6rem', fontWeight: '700', color: totalPercentage >= 80 ? '#10B981' : '#F59E0B', margin: '20px 0', lineHeight: '1' }}>
                {totalPercentage}%
              </div>
              <div style={{ color: '#64748B', fontSize: '1.2rem', fontWeight: '500', margin: 0 }}>
                You answered {totalCorrect} out of {totalQuestions} questions correctly.
              </div>
            </div>
            
            {wrongAnswers.length > 0 && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '60px' }}>
                  <h3 style={{ fontSize: '2rem', color: '#0F172A', fontWeight: '600', marginBottom: '10px' }}>Targeted Review</h3>
                  {wrongAnswers.map((wa, idx) => (
                    <div key={idx} className="responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px', borderLeft: '6px solid #EF4444', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <span style={{ background: '#FEF2F2', color: '#EF4444', padding: '6px 14px', borderRadius: '9999px', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {wa.skill} Match Error
                        </span>
                      </div>
                      <p style={{ fontSize: '1.3rem', color: '#0F172A', fontWeight: '500', marginBottom: '30px', lineHeight: '1.5' }}>{wa.question}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                          <span style={{ display: 'block', color: '#64748B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Your Answer</span>
                          <span style={{ color: '#EF4444', fontWeight: '500', fontSize: '1.15rem' }}>{wa.userAnsText}</span>
                        </div>
                        <div style={{ background: '#ECFDF5', padding: '20px', borderRadius: '16px', border: '1px solid #A7F3D0' }}>
                          <span style={{ display: 'block', color: '#059669', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Correct Answer</span>
                          <span style={{ color: '#10B981', fontWeight: '600', fontSize: '1.15rem' }}>{wa.correctAnsText}</span>
                        </div>
                      </div>

                      {wa.explanation && ( 
                        <div style={{ background: '#FFFBEB', color: '#92400E', padding: '24px', borderRadius: '16px', marginTop: '24px', lineHeight: '1.6', fontSize: '1.05rem', border: '1px solid #FDE68A' }}>
                          <strong style={{ display: 'block', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Diagnostic Explanation</strong> 
                          {wa.explanation}
                        </div> 
                      )}
                    </div>
                  ))}
               </div>
            )}

            <div style={{ marginTop: '60px', textAlign: 'center' }}>
               <button onClick={onClose} style={{ background: '#F1F5F9', color: '#0F172A', padding: '16px 36px', borderRadius: '9999px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '1.15rem', transition: 'all 0.2s' }}>
                 Return to Dashboard
               </button>
            </div>
          </div>
        )}

      </div>

      {showExitWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowExitWarning(false)}>
          <div className="responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', maxWidth: '450px', textAlign: 'center', padding: '50px', boxShadow: '0 50px 100px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>Leave Assessment?</h2>
            <p style={{ color: '#64748B', fontSize: '1.15rem', marginBottom: '32px', lineHeight: '1.6' }}>You have unsaved progress. If you leave now, you will lose your current answers.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowExitWarning(false)} style={{ background: '#F1F5F9', color: '#475569', padding: '16px 28px', borderRadius: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', flex: 1 }}>Cancel</button>
              <button onClick={onClose} style={{ background: '#EF4444', color: '#ffffff', padding: '16px 28px', borderRadius: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', flex: 1 }}>Yes, Leave</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 1024px) {
          .desktop-only-title { display: none !important; }
        }
        
        @media (max-width: 768px) {
          .lesson-wrapper { padding: 20px 16px 120px 16px !important; }
          .lesson-header { padding: 16px !important; }
          .reading-box { padding: 24px !important; border-radius: 20px !important; }
          .responsive-card { padding: 30px 20px !important; border-radius: 24px !important; }
          .result-number { font-size: 5rem !important; }
          .options-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .tfng-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};