import React, { useState } from 'react';

export default function WarmUpQuiz({ block, onComplete }: { block: any, onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasRevealed, setHasRevealed] = useState(false);

  if (!block) return null;

  const questions = block.questions || [];
  const currentQuestion = questions[currentStep];

  // Helper to safely grab the Sanity image URL
  const getImageUrl = (imageField: any) => {
    if (imageField?.asset?.url) return imageField.asset.url;
    if (typeof imageField === 'string') return imageField;
    return null;
  };

  const imageUrl = getImageUrl(block.visualHook);

  const handleSelect = (option: string) => {
    // Lock the answer once they click so they can read the reveal!
    if (hasRevealed) return; 
    setSelectedAnswer(option);
    setHasRevealed(true);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      // Move to the next slide and reset the state
      setCurrentStep(prev => prev + 1);
      setSelectedAnswer(null);
      setHasRevealed(false);
    } else {
      // They finished the warm-up! Unlock the reading text.
      onComplete(); 
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.1)' }}>
      
      {/* THE VISUAL HOOK (Cover Image) */}
      {imageUrl && (
        <div style={{ width: '100%', height: '350px', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#E2E8F0' }} />
      )}

      <div style={{ padding: '50px 40px' }}>
        
        {/* HEADER & INSTRUCTIONS */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {questions.length > 0 && (
            <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Slide {currentStep + 1} of {questions.length}
            </span>
          )}
          <h1 style={{ fontSize: '2.5rem', color: '#0F172A', marginTop: '24px', marginBottom: '12px' }}>{block.title}</h1>
          <p style={{ fontSize: '1.2rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>{block.instruction}</p>
        </div>

        {/* THE SLIDESHOW */}
        {currentQuestion ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#1E293B', marginBottom: '24px', lineHeight: '1.5', textAlign: 'center' }}>
              {currentQuestion.questionText}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentQuestion.options?.map((opt: string, idx: number) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQuestion.correctAnswer;

                let bg = '#F8FAFC'; let border = '2px solid #E2E8F0'; let color = '#334155';

                // Post-Click Feedback
                if (hasRevealed) {
                  if (isCorrect) {
                    bg = '#D1FAE5'; border = '2px solid #10B981'; color = '#065F46'; // Correct highlights Green
                  } else if (isSelected) {
                    bg = '#FEE2E2'; border = '2px solid #EF4444'; color = '#991B1B'; // Wrong highlights Red
                  } else {
                    bg = '#FFFFFF'; border = '2px solid #F1F5F9'; color = '#CBD5E1'; // Others fade out
                  }
                } 

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    disabled={hasRevealed}
                    style={{ padding: '20px', borderRadius: '16px', border, backgroundColor: bg, color, fontSize: '1.15rem', fontWeight: '600', cursor: hasRevealed ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'left', outline: 'none' }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* THE REVEAL & PROGRESSION BUTTON */}
            {hasRevealed && (
              <div style={{ marginTop: '30px', animation: 'fadeIn 0.5s' }}>
                {currentQuestion.extraContext && (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', borderLeft: '4px solid #4F46E5', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The Full Story:</h4>
                    <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '1.1rem' }}>
                      {currentQuestion.extraContext}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  style={{ width: '100%', padding: '20px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)', transition: 'transform 0.2s' }}
                >
                  {currentStep < questions.length - 1 ? 'Next Question ➡️' : 'Start Reading Lesson 📖'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Fallback if they add a block with no questions */
          <div style={{ textAlign: 'center' }}>
            <button onClick={onComplete} style={{ padding: '20px 40px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}>
              Start Reading Lesson 📖
            </button>
          </div>
        )}

      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}