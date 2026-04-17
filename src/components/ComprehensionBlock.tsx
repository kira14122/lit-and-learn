import React, { useState } from 'react';

export default function ComprehensionBlock({ block }: { block: any }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!block || !block.questions) return null;

  // Calculate how many questions they have answered to enable/disable the submit button
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = block.questions.length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelect = (index: number, answer: any) => {
    // If they already submitted, they can't change their answers!
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const calculateScore = () => {
    let score = 0;
    block.questions.forEach((q: any, i: number) => {
      if (q._type === 'mcq' && selectedAnswers[i] === q.correctAnswer) score++;
      if (q._type === 'tfq' && selectedAnswers[i] === q.isTrue) score++;
    });
    return score;
  };

  return (
    <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', marginBottom: '30px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '20px' }}>
        <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '16px', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', margin: 0 }}>
          {block.title || "Check Your Understanding"}
        </h2>
      </div>

      {/* INSTRUCTIONS */}
      {block.instruction && (
        <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '30px', lineHeight: '1.6' }}>
          {block.instruction}
        </p>
      )}

      {/* THE QUESTIONS LOOP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '40px' }}>
        {block.questions.map((q: any, i: number) => {
          const userAnswer = selectedAnswers[i];

          // ==========================================
          // RENDER TYPE 1: MULTIPLE CHOICE (mcq)
          // ==========================================
          if (q._type === 'mcq') {
            const isCorrect = userAnswer === q.correctAnswer;
            
            return (
              <div key={i} style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <span style={{ backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px', fontSize: '0.9rem' }}>{i + 1}</span>
                  <p style={{ fontSize: '1.2rem', color: '#334155', fontWeight: '600', margin: 0, marginTop: '2px', lineHeight: '1.5' }}>
                    {q.questionText}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '38px' }}>
                  {q.options?.map((opt: string, optIdx: number) => {
                    const isSelected = userAnswer === opt;
                    
                    // DEFAULT STYLING (Before Submit)
                    let bg = isSelected ? '#EEF2FF' : '#ffffff'; 
                    let border = isSelected ? '2px solid #4F46E5' : '2px solid #CBD5E1'; 
                    let textColor = isSelected ? '#312E81' : '#334155';

                    // FEEDBACK STYLING (After Submit)
                    if (isSubmitted) {
                      if (opt === q.correctAnswer) { 
                        bg = '#D1FAE5'; border = '2px solid #10B981'; textColor = '#065F46'; // Correct answer is always highlighted green
                      } else if (isSelected && !isCorrect) { 
                        bg = '#FEE2E2'; border = '2px solid #EF4444'; textColor = '#991B1B'; // Wrong pick turns red
                      } else {
                        bg = '#f8fafc'; border = '2px solid #e2e8f0'; textColor = '#94a3b8'; // Others fade out
                      }
                    }

                    return (
                      <button 
                        key={optIdx} 
                        onClick={() => handleSelect(i, opt)}
                        style={{ padding: '16px', textAlign: 'left', borderRadius: '12px', background: bg, border: border, color: textColor, fontSize: '1.1rem', cursor: isSubmitted ? 'default' : 'pointer', transition: 'all 0.2s', fontWeight: isSelected || (isSubmitted && opt === q.correctAnswer) ? '600' : '400' }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // ==========================================
          // RENDER TYPE 2: TRUE / FALSE (tfq)
          // ==========================================
          if (q._type === 'tfq') {
            const isCorrect = userAnswer === q.isTrue;
            
            return (
              <div key={i} style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <span style={{ backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px', fontSize: '0.9rem' }}>{i + 1}</span>
                  <p style={{ fontSize: '1.2rem', color: '#334155', fontWeight: '600', margin: 0, marginTop: '2px', lineHeight: '1.5' }}>
                    {q.statement}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', paddingLeft: '38px' }}>
                  {[true, false].map((boolVal) => {
                    const isSelected = userAnswer === boolVal;
                    
                    // DEFAULT STYLING (Before Submit)
                    let bg = isSelected ? '#EEF2FF' : '#ffffff'; 
                    let border = isSelected ? '2px solid #4F46E5' : '2px solid #CBD5E1'; 
                    let textColor = isSelected ? '#312E81' : '#334155';

                    // FEEDBACK STYLING (After Submit)
                    if (isSubmitted) {
                        if (boolVal === q.isTrue) {
                          bg = '#D1FAE5'; border = '2px solid #10B981'; textColor = '#065F46';
                        } else if (isSelected && !isCorrect) {
                          bg = '#FEE2E2'; border = '2px solid #EF4444'; textColor = '#991B1B';
                        } else {
                          bg = '#f8fafc'; border = '2px solid #e2e8f0'; textColor = '#94a3b8';
                        }
                    }

                    return (
                      <button
                        key={boolVal ? 'true' : 'false'}
                        onClick={() => handleSelect(i, boolVal)}
                        style={{ flex: 1, padding: '16px', textAlign: 'center', borderRadius: '12px', background: bg, border: border, color: textColor, fontSize: '1.1rem', cursor: isSubmitted ? 'default' : 'pointer', transition: 'all 0.2s', fontWeight: isSelected || (isSubmitted && boolVal === q.isTrue) ? '700' : '500' }}
                      >
                        {boolVal ? 'True' : 'False'}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null; 
        })}
      </div>

      {/* SUBMISSION & FEEDBACK AREA */}
      {!isSubmitted ? (
        <button 
          onClick={() => setIsSubmitted(true)}
          disabled={!allAnswered}
          style={{ width: '100%', padding: '20px', backgroundColor: allAnswered ? '#4F46E5' : '#CBD5E1', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: allAnswered ? 'pointer' : 'not-allowed', transition: 'background-color 0.3s' }}
        >
          {allAnswered ? 'Check Answers' : `Answer all questions to submit (${answeredCount}/${totalQuestions})`}
        </button>
      ) : (
        <div style={{ padding: '24px', backgroundColor: '#EEF2FF', borderRadius: '16px', border: '2px solid #C7D2FE', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
          <h3 style={{ margin: 0, color: '#312E81', fontSize: '1.5rem', marginBottom: '8px' }}>
            You scored {calculateScore()} out of {totalQuestions}!
          </h3>
          <p style={{ margin: 0, color: '#4F46E5', fontSize: '1.1rem' }}>
            Review your answers above to see what you got right and what you missed.
          </p>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}