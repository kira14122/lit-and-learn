import React, { useState } from 'react';

export default function GrammarDiscovery({ block }: { block: any }) {
  const [showRule, setShowRule] = useState(false);
  
  // NEW: State for the quiz
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [isQuizChecked, setIsQuizChecked] = useState(false);

  if (!block) return null;

  // Helper function: Turns *asterisks* from Sanity into highlighted purple text
  const highlightTargetGrammar = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={i} style={{ color: '#6366f1', fontWeight: '700', backgroundColor: '#eef2ff', padding: '2px 6px', borderRadius: '6px' }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Safely extracts the text if Sanity sends an object instead of a string
  const extractText = (item: any, keyName: string) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item[keyName] || item.text || item.sentence || item.question || "";
    }
    return "";
  };

  // NEW: Handle clicking an option
  const handleOptionClick = (questionIndex: number, option: string) => {
    if (isQuizChecked) return; // Prevent changing answer after checking
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  return (
    <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px', borderBottom: '2px solid #F1F5F9', paddingBottom: '20px' }}>
        <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '16px', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', margin: 0 }}>
          Grammar Discovery: <span style={{ color: '#4F46E5' }}>{block.title}</span>
        </h2>
      </div>

      {/* PHASE 1: Contextual Sentences */}
      <div style={{ marginBottom: '40px' }}>
        <h4 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: '600' }}>
          1. Analyze the Text
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {block.noticingSentences?.map((s: any, i: number) => {
            const sentenceText = extractText(s, 'sentenceText');
            return (
              <p key={i} style={{ margin: 0, padding: '16px 20px', backgroundColor: '#F8FAFC', borderRadius: '16px', borderLeft: '4px solid #4F46E5', fontSize: '1.2rem', color: '#334155', lineHeight: '1.6' }}>
                {highlightTargetGrammar(sentenceText)}
              </p>
            );
          })}
        </div>
      </div>

      {/* PHASE 2: Noticing Questions */}
      <div style={{ marginBottom: '40px' }}>
        <h4 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: '600' }}>
          2. Observe & Think
        </h4>
        <div style={{ padding: '24px', backgroundColor: '#FFFBEB', borderRadius: '16px', border: '1px solid #FEF3C7' }}>
          {block.noticingQuestions?.map((q: any, i: number) => {
            const qText = extractText(q, 'questionText');
            return (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i === (block.noticingQuestions?.length || 1) - 1 ? '0' : '16px' }}>
                <span style={{ color: '#D97706', fontSize: '1.2rem', marginTop: '2px' }}>💡</span>
                <p style={{ margin: 0, fontWeight: '500', color: '#92400E', fontSize: '1.15rem', lineHeight: '1.5' }}>{qText}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE 3 & 4: The Reveal and Quiz */}
      <div style={{ marginTop: '20px' }}>
        {!showRule ? (
          <button 
            onClick={() => setShowRule(true)}
            style={{ width: '100%', padding: '18px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: '600', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s ease', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
            Unlock the Rule
          </button>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* PHASE 3 */}
            <h4 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: '600' }}>
              3. The Core Concept
            </h4>
            <div style={{ padding: '30px', backgroundColor: '#EEF2FF', borderRadius: '24px', border: '2px solid #C7D2FE', position: 'relative', overflow: 'hidden', marginBottom: '40px' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, transform: 'rotate(15deg)' }}>
                <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <p style={{ margin: 0, lineHeight: '1.8', color: '#312E81', fontSize: '1.25rem', fontWeight: '500', position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap' }}>
                {block.grammarRule}
              </p>
            </div>

            {/* PHASE 4: THE NEW INTERACTIVE QUIZ SECTION */}
            {block.quickCheckQuiz && block.quickCheckQuiz.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: '600' }}>
                  4. Quick Check Quiz
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {block.quickCheckQuiz.map((quizItem: any, index: number) => {
                    const questionText = extractText(quizItem, 'questionText') || extractText(quizItem, 'question');
                    const correctAnswer = extractText(quizItem, 'correctAnswer');
                    const userAnswer = quizAnswers[index];

                    return (
                      <div key={index} style={{ padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                        <p style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#1E293B', fontWeight: '600' }}>
                          <span style={{ color: '#4F46E5', marginRight: '8px' }}>{index + 1}.</span> {questionText}
                        </p>
                        
                        {quizItem.options && quizItem.options.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                            {quizItem.options.map((opt: string, optIdx: number) => {
                              const isSelected = userAnswer === opt;
                              let bg = '#ffffff'; let border = '2px solid #E2E8F0'; let color = '#475569';
                              
                              if (isSelected && !isQuizChecked) { 
                                bg = '#EEF2FF'; border = '2px solid #4F46E5'; color = '#4F46E5'; 
                              }
                              if (isQuizChecked) {
                                if (opt === correctAnswer) { 
                                  bg = '#D1FAE5'; border = '2px solid #10B981'; color = '#065F46'; 
                                } else if (isSelected) { 
                                  bg = '#FEE2E2'; border = '2px solid #EF4444'; color = '#991B1B'; 
                                }
                              }

                              return (
                                <button 
                                  key={optIdx} 
                                  onClick={() => handleOptionClick(index, opt)}
                                  disabled={isQuizChecked}
                                  style={{ padding: '16px 20px', borderRadius: '12px', border, backgroundColor: bg, color, fontSize: '1.1rem', fontWeight: '500', cursor: isQuizChecked ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', outline: 'none' }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '24px' }}>
                  {!isQuizChecked ? (
                    <button 
                      onClick={() => setIsQuizChecked(true)}
                      disabled={Object.keys(quizAnswers).length !== block.quickCheckQuiz.length}
                      style={{ width: '100%', padding: '16px', background: Object.keys(quizAnswers).length === block.quickCheckQuiz.length ? '#4F46E5' : '#CBD5E1', color: '#ffffff', border: 'none', borderRadius: '16px', cursor: Object.keys(quizAnswers).length === block.quickCheckQuiz.length ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '1.15rem', transition: 'all 0.2s ease' }}
                    >
                      Check Answers
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setIsQuizChecked(false); setQuizAnswers({}); }}
                      style={{ width: '100%', padding: '16px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '600', fontSize: '1.15rem', transition: 'all 0.2s ease' }}
                    >
                      Retake Quiz
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}