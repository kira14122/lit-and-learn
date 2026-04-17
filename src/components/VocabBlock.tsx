import React, { useState, useEffect } from 'react';

export default function VocabBlock({ block }: { block: any }) {
  const [huntAnswers, setHuntAnswers] = useState<Record<number, string>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({});
  const [activeBlank, setActiveBlank] = useState<number | null>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!block || (!block.vocabHunt && !block.fillInTheBlanks)) return null;

  const huntCount = block.vocabHunt?.length || 0;
  const blanksCount = block.fillInTheBlanks?.length || 0;
  const totalQuestions = huntCount + blanksCount;
  
  const answeredHunt = Object.values(huntAnswers).filter(val => val.trim() !== '').length;
  const answeredBlanks = Object.keys(blankAnswers).length;
  const allAnswered = (answeredHunt + answeredBlanks) === totalQuestions;

  useEffect(() => {
    if (isSubmitted) { setActiveBlank(null); return; }
    for (let i = 0; i < blanksCount; i++) {
      if (!blankAnswers[i]) { setActiveBlank(i); return; }
    }
    setActiveBlank(null);
  }, [blankAnswers, blanksCount, isSubmitted]);

  const handleBankWordClick = (word: string) => {
    if (isSubmitted || activeBlank === null) return;
    setBlankAnswers(prev => ({ ...prev, [activeBlank]: word }));
  };

  const handleBlankClick = (index: number) => {
    if (isSubmitted) return;
    if (blankAnswers[index]) {
      const newAnswers = { ...blankAnswers };
      delete newAnswers[index];
      setBlankAnswers(newAnswers);
      setActiveBlank(index);
    } else {
      setActiveBlank(index);
    }
  };

  const calculateScore = () => {
    let score = 0;
    block.vocabHunt?.forEach((q: any, i: number) => {
      if (huntAnswers[i]?.trim().toLowerCase() === q.targetWord?.trim().toLowerCase()) score++;
    });
    block.fillInTheBlanks?.forEach((q: any, i: number) => {
      if (blankAnswers[i] === q.correctWord) score++;
    });
    return score;
  };

  const usedWords = Object.values(blankAnswers);

  return (
    <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', marginBottom: '30px' }}>
      
      {/* HEADER (Now matching the app's primary Indigo theme) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '20px' }}>
        <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '16px', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', margin: 0 }}>
          {block.title || "Vocabulary Focus"}
        </h2>
      </div>

      {block.instruction && (
        <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '40px', lineHeight: '1.6' }}>{block.instruction}</p>
      )}

      {/* PART 1: VOCABULARY HUNT */}
      {block.vocabHunt && block.vocabHunt.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ backgroundColor: '#F1F5F9', padding: '4px 12px', borderRadius: '8px', fontSize: '1rem', color: '#475569', fontWeight: 'bold' }}>Part 1</span>
            Context Hunt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {block.vocabHunt.map((q: any, i: number) => {
              const userAnswer = huntAnswers[i] || '';
              const isCorrect = userAnswer.trim().toLowerCase() === q.targetWord?.trim().toLowerCase();
              
              // Only turns red or green AFTER submission
              let borderColor = '#CBD5E1'; let bgColor = '#ffffff'; let textColor = '#0F172A';
              if (userAnswer.length > 0 && !isSubmitted) { borderColor = '#6366F1'; } // Highlights active input
              if (isSubmitted) { 
                borderColor = isCorrect ? '#10B981' : '#EF4444'; 
                bgColor = isCorrect ? '#D1FAE5' : '#FEE2E2'; 
                textColor = isCorrect ? '#065F46' : '#991B1B';
              }

              return (
                <div key={i} style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '1.15rem', color: '#334155', fontWeight: '500' }}>"{q.definition}"</p>
                  <div>
                    <input type="text" value={userAnswer} onChange={(e) => !isSubmitted && setHuntAnswers(prev => ({ ...prev, [i]: e.target.value }))} disabled={isSubmitted} placeholder="Type the word here..." style={{ width: '100%', maxWidth: '300px', padding: '12px 16px', borderRadius: '8px', border: `2px solid ${borderColor}`, backgroundColor: bgColor, fontSize: '1.1rem', color: textColor, outline: 'none', transition: 'all 0.2s', fontWeight: '500' }} />
                    {isSubmitted && !isCorrect && <div style={{ marginTop: '8px', color: '#B91C1C', fontSize: '0.95rem', fontWeight: '600' }}>Correct answer: {q.targetWord}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PART 2: THE TAP-AND-SNAP DROP ZONES */}
      {block.fillInTheBlanks && block.fillInTheBlanks.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ backgroundColor: '#F1F5F9', padding: '4px 12px', borderRadius: '8px', fontSize: '1rem', color: '#475569', fontWeight: 'bold' }}>Part 2</span>
            Fill in the Blanks
          </h3>

          {/* THE INTERACTIVE WORD BANK */}
          {block.wordBank && block.wordBank.length > 0 && (
            <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1', marginBottom: '30px', minHeight: '80px' }}>
              <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 12px 0' }}>Tap a word to place it:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {block.wordBank.map((word: string, idx: number) => {
                  const isUsed = usedWords.includes(word);
                  return (
                    <button 
                      key={idx}
                      onClick={() => handleBankWordClick(word)}
                      disabled={isUsed || isSubmitted}
                      style={{ 
                        padding: '10px 20px', 
                        borderRadius: '12px', 
                        border: isUsed ? '2px solid #E2E8F0' : '2px solid #6366F1', // Changed to Indigo
                        backgroundColor: isUsed ? '#F1F5F9' : 'white', 
                        color: isUsed ? '#CBD5E1' : '#4F46E5', // Changed to Indigo
                        fontWeight: 'bold', 
                        fontSize: '1.1rem', 
                        cursor: isUsed || isSubmitted ? 'default' : 'pointer',
                        transform: isUsed ? 'scale(0.95)' : 'scale(1)',
                        opacity: isUsed ? 0.5 : 1,
                        transition: 'all 0.2s',
                        boxShadow: isUsed ? 'none' : '0 4px 6px rgba(99, 102, 241, 0.15)'
                      }}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {block.fillInTheBlanks.map((q: any, i: number) => {
              const parts = q.sentence.split('___');
              const currentWord = blankAnswers[i];
              const isCorrect = currentWord === q.correctWord;
              
              // Default Drop Zone Style
              let btnBg = '#F1F5F9';
              let btnBorder = activeBlank === i ? '2px solid #6366F1' : '2px dashed #CBD5E1'; // Indigo for active
              let btnColor = '#94A3B8';
              let btnShadow = activeBlank === i && !currentWord ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none';

              // Filled Style
              if (currentWord) {
                btnBg = 'white'; btnBorder = '2px solid #6366F1'; btnColor = '#4F46E5'; btnShadow = 'none';
              }
              
              // Submitted Style
              if (isSubmitted) {
                btnShadow = 'none';
                btnBorder = isCorrect ? '2px solid #10B981' : '2px solid #EF4444';
                btnBg = isCorrect ? '#D1FAE5' : '#FEE2E2';
                btnColor = isCorrect ? '#065F46' : '#991B1B';
              }

              return (
                <div key={i} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '1.2rem', color: '#334155', lineHeight: '2' }}>
                  {parts[0]}
                  
                  {/* THE DROP ZONE BUTTON */}
                  <button 
                    onClick={() => handleBlankClick(i)}
                    style={{ 
                      margin: '0 8px', 
                      padding: currentWord ? '6px 16px' : '6px 30px', 
                      borderRadius: '8px', 
                      border: btnBorder, 
                      backgroundColor: btnBg, 
                      color: btnColor,
                      fontSize: '1.1rem', 
                      fontWeight: 'bold',
                      cursor: isSubmitted ? 'default' : 'pointer', 
                      verticalAlign: 'middle',
                      transition: 'all 0.2s',
                      boxShadow: btnShadow
                    }}
                  >
                    {currentWord || ''}
                  </button>

                  {parts[1]}

                  {isSubmitted && !isCorrect && (
                    <div style={{ marginTop: '12px', color: '#B91C1C', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Correct answer: {q.correctWord}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBMISSION BUTTON */}
      {!isSubmitted ? (
        <button onClick={() => setIsSubmitted(true)} disabled={!allAnswered} style={{ width: '100%', padding: '20px', backgroundColor: allAnswered ? '#4F46E5' : '#CBD5E1', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: allAnswered ? 'pointer' : 'not-allowed', transition: 'background-color 0.3s' }}>
          {allAnswered ? 'Check Vocabulary' : `Complete all fields to submit (${answeredHunt + answeredBlanks}/${totalQuestions})`}
        </button>
      ) : (
        <div style={{ padding: '24px', backgroundColor: '#EEF2FF', borderRadius: '16px', border: '2px solid #C7D2FE', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#312E81', fontSize: '1.5rem', marginBottom: '8px' }}>You scored {calculateScore()} out of {totalQuestions}!</h3>
          <p style={{ margin: 0, color: '#4F46E5', fontSize: '1.1rem' }}>Review your answers above to see how you did.</p>
        </div>
      )}
    </div>
  );
}