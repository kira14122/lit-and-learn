import { useState } from 'react';

interface WarmUpProps {
  block: any;
  onComplete: () => void;
}

export default function WarmUpQuiz({ block, onComplete }: WarmUpProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [isRevealed, setIsRevealed] = useState(false);

  const questions = block.questions || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;

  const handleSelect = (qIndex: number, option: string) => {
    if (isRevealed) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '40px', 
      borderRadius: '16px', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
      maxWidth: '600px', 
      width: '100%' 
    }}>
      <h2 style={{ fontSize: '1.8rem', color: '#2563eb', marginBottom: '8px' }}>{block.title}</h2>
      <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.1rem' }}>{block.instruction}</p>

      {questions.map((q: any, qIdx: number) => (
        <div key={qIdx} style={{ marginBottom: '25px' }}>
          <p style={{ fontWeight: '600', marginBottom: '12px', fontSize: '1.05rem' }}>{q.questionText}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options?.map((option: string, i: number) => {
              const isSelected = selectedAnswers[qIdx] === option;
              const isCorrect = option === q.correctAnswer;
              
              let bgColor = 'white';
              let borderColor = '#e2e8f0';

              if (isRevealed) {
                if (isCorrect) {
                  bgColor = '#dcfce7'; // Green
                  borderColor = '#22c55e';
                } else if (isSelected) {
                  bgColor = '#fee2e2'; // Red
                  borderColor = '#ef4444';
                }
              } else if (isSelected) {
                bgColor = '#eff6ff'; // Blue
                borderColor = '#3b82f6';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(qIdx, option)}
                  disabled={isRevealed}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    borderRadius: '8px',
                    border: `2px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    cursor: isRevealed ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1rem'
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!isRevealed && allAnswered && (
        <button
          onClick={() => setIsRevealed(true)}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Check My Guesses
        </button>
      )}

      {isRevealed && (
        <div style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease-in' }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8fafc', 
            borderLeft: '4px solid #2563eb', 
            borderRadius: '4px',
            marginBottom: '25px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>The Truth...</h4>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#334155' }}>{block.postQuizReveal}</p>
          </div>

          <button
            onClick={onComplete}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            I'm Ready to Read! →
          </button>
        </div>
      )}
    </div>
  );
}