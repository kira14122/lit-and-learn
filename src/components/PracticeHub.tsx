import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';

// --- Premium Icons ---
const IconDumbbell = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>);
const IconCheckCircle = () => (<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconAlert = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);

const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

export const PracticeHub = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTopic, setActiveTopic] = useState<any | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Results & Safety States
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    client.fetch('*[_type == "practiceBank"] | order(level asc)').then(setTopics);
  }, []);

  const handleStartTopic = (topic: any) => {
    if (!topic.bulkData) return;
    
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
          correct: cols[4].toUpperCase().replace(/[^ABC]/g, ''), 
          explanation: cols[5] || "No explanation provided."
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

    if (uniqueQuestions.length === 0) {
      alert("Oops! Couldn't read the questions. Check your Sanity text box to make sure the columns lined up perfectly and are separated by tabs.");
      return;
    }

    const shuffled = [...uniqueQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    
    setParsedQuestions(shuffled);
    setActiveTopic(topic);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsComplete(false);
    setScore(0);
  };

  const handleAnswerClick = (key: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(key);
    
    if (key === parsedQuestions[currentIndex].correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    if (currentIndex + 1 < parsedQuestions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {!activeTopic ? (
        // VIEW 1: TOPIC SELECTION MENU (Clean Grid)
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {topics.map(topic => (
            <button 
              key={topic._id} 
              onClick={() => handleStartTopic(topic)}
              className="soft-card" 
              style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '30px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ background: '#F8FAFC', color: '#475569', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', alignSelf: 'flex-start' }}>
                {topic.level} • {topic.category}
              </span>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.5rem', color: '#0F172A', fontWeight: '600', lineHeight: '1.3' }}>{topic.title}</h3>
              <span style={{ color: '#4F46E5', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                Start Practice <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </button>
          ))}
          {topics.length === 0 && (
             <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', border: '2px dashed #E2E8F0', padding: '40px', borderRadius: '24px', textAlign: 'center', color: '#94A3B8' }}>
               No practice exercises published yet. Add them in Sanity!
             </div>
          )}
        </div>
      ) : isComplete ? (
        // VIEW 3: RESULTS SCREEN
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: '#ECFDF5', padding: '24px', borderRadius: '50%' }}>
              <IconCheckCircle />
            </div>
          </div>
          <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>Practice Complete!</h2>
          <p style={{ color: '#64748B', fontSize: '1.2rem', marginBottom: '40px' }}>
            You scored <strong style={{ color: '#10B981', fontSize: '1.4rem' }}>{score}</strong> out of <strong>{parsedQuestions.length}</strong>.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTopic(null)}
              style={{ padding: '16px 32px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Back to Topics
            </button>
            <button 
              onClick={() => handleStartTopic(activeTopic)}
              style={{ padding: '16px 32px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)' }}
            >
              Restart Practice
            </button>
          </div>
        </div>
      ) : (
        // VIEW 2: THE ACTIVE QUIZ
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            {/* Safety Hook: Show Modal Instead of Exiting Immediately */}
            <BackButton onClick={() => setShowExitModal(true)} text="Exit Practice" />
            
            {/* Score Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', padding: '8px 16px', borderRadius: '9999px', fontWeight: '600', border: '2px solid #E2E8F0' }}>
              Score: {score}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>{activeTopic.title}</span>
            
            <div style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: '600', marginTop: '8px' }}>
              Question {currentIndex + 1} of {parsedQuestions.length}
            </div>

            <h3 style={{ fontSize: '2rem', color: '#0F172A', margin: '16px 0 0', lineHeight: '1.4' }}>
              {parsedQuestions[currentIndex].question}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['A', 'B', 'C'].map((key) => {
              const optionText = parsedQuestions[currentIndex].options[key as 'A' | 'B' | 'C'];
              const isCorrect = key === parsedQuestions[currentIndex].correct;
              const isSelected = selectedAnswer === key;
              
              let bgColor = '#ffffff';
              let borderColor = '#E2E8F0';
              let textColor = '#0F172A';

              if (selectedAnswer) {
                if (isCorrect) {
                  bgColor = '#ECFDF5'; borderColor = '#10B981'; textColor = '#065F46'; 
                } else if (isSelected) {
                  bgColor = '#FEF2F2'; borderColor = '#EF4444'; textColor = '#991B1B'; 
                } else {
                  bgColor = '#F8FAFC'; textColor = '#94A3B8'; 
                }
              }

              return (
                <button
                  key={key}
                  disabled={!!selectedAnswer}
                  onClick={() => handleAnswerClick(key)}
                  style={{ width: '100%', padding: '20px', background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '20px', fontSize: '1.2rem', fontWeight: '500', color: textColor, textAlign: 'left', cursor: selectedAnswer ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: selectedAnswer ? 'none' : '0 4px 10px rgba(0,0,0,0.02)' }}
                >
                  <span style={{ background: selectedAnswer ? 'transparent' : '#F1F5F9', color: selectedAnswer ? textColor : '#64748B', padding: '8px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem' }}>{key}</span>
                  {optionText}
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <div style={{ animation: 'fadeInDown 0.3s ease-out', marginTop: '30px', background: selectedAnswer === parsedQuestions[currentIndex].correct ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${selectedAnswer === parsedQuestions[currentIndex].correct ? '#A7F3D0' : '#FECACA'}`, padding: '24px', borderRadius: '24px' }}>
              <h4 style={{ margin: '0 0 12px', color: selectedAnswer === parsedQuestions[currentIndex].correct ? '#059669' : '#DC2626', fontSize: '1.2rem' }}>
                {selectedAnswer === parsedQuestions[currentIndex].correct ? 'Spot on!' : 'Not quite.'}
              </h4>
              <p style={{ margin: '0 0 24px', color: '#334155', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {parsedQuestions[currentIndex].explanation}
              </p>
              <button 
                onClick={nextQuestion}
                style={{ width: '100%', padding: '16px', background: selectedAnswer === parsedQuestions[currentIndex].correct ? '#10B981' : '#EF4444', color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {currentIndex + 1 < parsedQuestions.length ? 'Next Question' : 'Finish Practice'} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '8px' }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {/* THE SAFETY EXIT MODAL */}
          {showExitModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowExitModal(false)}>
              <div className="responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '450px', padding: '40px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)', textAlign: 'center', animation: 'fadeInDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  <IconAlert />
                </div>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0F172A', fontWeight: '600', letterSpacing: '-0.5px' }}>Exit Practice?</h2>
                <p style={{ color: '#64748B', fontSize: '1.15rem', marginBottom: '32px', lineHeight: '1.6' }}>Are you sure you want to leave? Your current score and progress will be lost.</p>
                <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                  <button 
                    onClick={() => setShowExitModal(false)} 
                    style={{ background: '#F1F5F9', color: '#475569', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '1.1rem', width: '100%', transition: 'all 0.2s' }}
                  >
                    Resume Practice
                  </button>
                  <button 
                    onClick={() => { setShowExitModal(false); setActiveTopic(null); }} 
                    style={{ background: '#EF4444', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '1.1rem', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                  >
                    Yes, Exit Practice
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};