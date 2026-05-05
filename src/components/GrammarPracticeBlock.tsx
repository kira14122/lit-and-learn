import React, { useState } from 'react';

export default function GrammarPracticeBlock({ block }: { block: any }) {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!block || !block.questions) return null;

  const totalQuestions = block.questions.length;

  // --- THE FIX: The Safety Net for Sanity Text ---
  const extractText = (item: any, keyName: string) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item[keyName] || item.text || item.sentence || item.question || "";
    }
    return "";
  };

  const instructionText = extractText(block, 'instruction');

  // Check if every question has a valid answer
  const allAnswered = block.questions.every((q: any, i: number) => {
    const ans = answers[i];
    const type = q.questionType || 'multipleChoice';
    if (type === 'unscramble') return Array.isArray(ans) && ans.length === q.scrambledWords?.length;
    return ans !== undefined && ans !== '';
  });

  const handleSelect = (qIndex: number, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleText = (qIndex: number, text: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: text }));
  };

  const toggleUnscrambleWord = (qIndex: number, wordIdx: number) => {
    if (isSubmitted) return;
    setAnswers(prev => {
      const currentArr = Array.isArray(prev[qIndex]) ? [...prev[qIndex]] : [];
      if (currentArr.includes(wordIdx)) {
        return { ...prev, [qIndex]: currentArr.filter((i: number) => i !== wordIdx) };
      } else {
        return { ...prev, [qIndex]: [...currentArr, wordIdx] };
      }
    });
  };

  const calculateScore = () => {
    let score = 0;
    block.questions.forEach((q: any, i: number) => {
      const ans = answers[i];
      if (!ans) return;
      const type = q.questionType || 'multipleChoice';
      
      if (type === 'multipleChoice') {
        if (ans === q.correctAnswer) score++;
      } else if (type === 'errorCorrection' || type === 'cloze') {
        if (typeof ans === 'string' && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) score++;
      } else if (type === 'unscramble') {
        if (Array.isArray(ans)) {
          const constructedSentence = ans.map((idx: number) => q.scrambledWords[idx]).join(' ');
          if (constructedSentence.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) score++;
        }
      }
    });
    return score;
  };

  return (
    <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', marginBottom: '30px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '20px' }}>
        <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '16px', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', margin: 0 }}>
          {block.title || "Grammar Practice"}
        </h2>
      </div>

      {/* FIX: Using extracted text and pre-wrap for line breaks */}
      {instructionText && (
        <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '40px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {instructionText}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
        {block.questions.map((q: any, i: number) => {
          const type = q.questionType || 'multipleChoice';
          const userAnswer = answers[i];
          const questionText = extractText(q, 'questionText');
          const explanationText = extractText(q, 'explanation');
          
          let isCorrect = false;
          if (type === 'multipleChoice') isCorrect = userAnswer === q.correctAnswer;
          if (type === 'errorCorrection' || type === 'cloze') isCorrect = typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          if (type === 'unscramble') {
            const constructedSentence = Array.isArray(userAnswer) ? userAnswer.map((idx: number) => q.scrambledWords[idx]).join(' ') : '';
            isCorrect = constructedSentence.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          }

          return (
            <div key={i} style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              
              {/* Question Header */}
              {questionText && (
                <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '20px', lineHeight: '1.5' }}>
                  <span style={{ color: '#4F46E5', marginRight: '8px', fontWeight: 'bold' }}>{i + 1}.</span> 
                  {type === 'errorCorrection' ? 'Find and fix the error: ' : ''}
                  {type === 'cloze' ? 'Fill in the blank: ' : ''}
                  <span style={{ fontWeight: type === 'errorCorrection' ? '500' : '600' }}>"{questionText}"</span>
                </h3>
              )}
              {type === 'unscramble' && !questionText && (
                 <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '20px', lineHeight: '1.5' }}>
                    <span style={{ color: '#4F46E5', marginRight: '8px', fontWeight: 'bold' }}>{i + 1}.</span> Unscramble the sentence:
                 </h3>
              )}

              {/* MODE 1: MULTIPLE CHOICE */}
              {type === 'multipleChoice' && q.options && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = userAnswer === opt;
                    let bg = '#ffffff'; let border = '2px solid #E2E8F0'; let color = '#334155';
                    
                    if (isSelected && !isSubmitted) { bg = '#EEF2FF'; border = '2px solid #4F46E5'; color = '#4F46E5'; }
                    if (isSubmitted) {
                      if (opt === q.correctAnswer) { bg = '#D1FAE5'; border = '2px solid #10B981'; color = '#065F46'; }
                      else if (isSelected) { bg = '#FEE2E2'; border = '2px solid #EF4444'; color = '#991B1B'; }
                    }

                    return (
                      <button key={optIdx} onClick={() => handleSelect(i, opt)} disabled={isSubmitted} style={{ padding: '16px 20px', borderRadius: '12px', border, backgroundColor: bg, color, fontSize: '1.1rem', fontWeight: '500', cursor: isSubmitted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', outline: 'none' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* MODE 2: ERROR CORRECTION & CLOZE */}
              {(type === 'errorCorrection' || type === 'cloze') && (
                <div>
                  <input 
                    type="text" 
                    value={userAnswer || ''} 
                    onChange={(e) => handleText(i, e.target.value)} 
                    disabled={isSubmitted}
                    placeholder={type === 'errorCorrection' ? "Type the correct sentence here..." : "Type the missing word..."}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', transition: 'all 0.2s',
                      border: isSubmitted ? (isCorrect ? '2px solid #10B981' : '2px solid #EF4444') : (userAnswer ? '2px solid #4F46E5' : '2px solid #CBD5E1'),
                      backgroundColor: isSubmitted ? (isCorrect ? '#D1FAE5' : '#FEE2E2') : '#ffffff',
                      color: isSubmitted ? (isCorrect ? '#065F46' : '#991B1B') : '#0F172A'
                    }} 
                  />
                  {isSubmitted && !isCorrect && (
                    <div style={{ marginTop: '12px', color: '#B91C1C', fontSize: '1rem', fontWeight: '600' }}>
                      Correct Answer: {q.correctAnswer}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: SENTENCE UNSCRAMBLE */}
              {type === 'unscramble' && q.scrambledWords && (
                <div>
                  {/* Drop Zone (Built Sentence) */}
                  <div style={{ minHeight: '60px', padding: '16px', borderRadius: '12px', backgroundColor: isSubmitted ? (isCorrect ? '#D1FAE5' : '#FEE2E2') : '#ffffff', border: isSubmitted ? (isCorrect ? '2px solid #10B981' : '2px solid #EF4444') : '2px dashed #CBD5E1', display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {(!userAnswer || userAnswer.length === 0) && !isSubmitted && <span style={{ color: '#94A3B8', fontStyle: 'italic', paddingTop: '4px' }}>Tap words below to build the sentence...</span>}
                    {Array.isArray(userAnswer) && userAnswer.map((wordIdx: number, mapIdx: number) => (
                      <button key={`ans-${mapIdx}`} onClick={() => toggleUnscrambleWord(i, wordIdx)} disabled={isSubmitted} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: isSubmitted ? (isCorrect ? '#10B981' : '#EF4444') : '#4F46E5', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: isSubmitted ? 'default' : 'pointer' }}>
                        {q.scrambledWords[wordIdx]}
                      </button>
                    ))}
                  </div>

                  {/* Word Bank */}
                  {!isSubmitted && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {q.scrambledWords.map((word: string, wordIdx: number) => {
                        const isUsed = Array.isArray(userAnswer) && userAnswer.includes(wordIdx);
                        if (isUsed) return null; // Hide used words
                        return (
                          <button key={`bank-${wordIdx}`} onClick={() => toggleUnscrambleWord(i, wordIdx)} style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#475569', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isSubmitted && !isCorrect && (
                    <div style={{ marginTop: '12px', color: '#B91C1C', fontSize: '1rem', fontWeight: '600' }}>
                      Correct Sentence: {q.correctAnswer}
                    </div>
                  )}
                </div>
              )}

              {/* Global Explanation */}
              {isSubmitted && explanationText && (
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: isCorrect ? '#ECFDF5' : '#FEF2F2', borderRadius: '12px', color: isCorrect ? '#065F46' : '#991B1B', fontSize: '1.05rem', lineHeight: '1.5' }}>
                  <strong>{isCorrect ? 'Great job!' : 'Review:'}</strong> {explanationText}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {!isSubmitted ? (
        <button onClick={() => setIsSubmitted(true)} disabled={!allAnswered} style={{ width: '100%', padding: '20px', backgroundColor: allAnswered ? '#4F46E5' : '#CBD5E1', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: allAnswered ? 'pointer' : 'not-allowed', transition: 'background-color 0.3s' }}>
          {allAnswered ? 'Check Answers' : `Complete all exercises to submit`}
        </button>
      ) : (
        <div style={{ padding: '24px', backgroundColor: '#EEF2FF', borderRadius: '16px', border: '2px solid #C7D2FE', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#312E81', fontSize: '1.5rem', marginBottom: '8px' }}>You scored {calculateScore()} out of {totalQuestions}!</h3>
        </div>
      )}
    </div>
  );
}