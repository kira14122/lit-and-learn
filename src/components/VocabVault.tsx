import React, { useState, useEffect } from 'react';

interface VocabVaultProps {
  savedWords: any[];
  toggleSaveWord: (word: string, info: any) => void;
}

export const VocabVault: React.FC<VocabVaultProps> = ({ savedWords, toggleSaveWord }) => {
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<any | null>(null);

  // --- MINI-QUIZ STATE ---
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizOptions, setQuizOptions] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Generates multiple choice options whenever the quiz index changes
  useEffect(() => {
    if (isQuizMode && !showQuizResults && savedWords.length > 0) {
      const correctWord = savedWords[quizIndex];
      const otherSavedWords = savedWords.filter(w => w.word !== correctWord.word);
      
      // Fallback distractors just in case the student has less than 4 words saved
      const fallbacks = [{word: "ambiguous"}, {word: "resilient"}, {word: "tenacious"}, {word: "meticulous"}, {word: "ephemeral"}];
      const availableDistractors = [...otherSavedWords, ...fallbacks];
      
      // Grab 3 random wrong answers and 1 right answer, then shuffle them
      const distractors = availableDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [correctWord, ...distractors].sort(() => 0.5 - Math.random());
      
      setQuizOptions(options);
      setSelectedAnswer(null);
    }
  }, [quizIndex, isQuizMode, showQuizResults, savedWords]);

  const handleAnswerClick = (selectedWord: string) => {
    if (selectedAnswer) return; // Prevent double-clicking
    setSelectedAnswer(selectedWord);
    if (selectedWord === savedWords[quizIndex].word) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 < savedWords.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setShowQuizResults(true);
    }
  };

  const exitQuiz = () => {
    setIsQuizMode(false);
    setShowQuizResults(false);
    setQuizIndex(0);
    setScore(0);
  };

  // --- SLEEK RESULT ICONS ---
  const renderResultIcon = (percentage: number) => {
    if (percentage >= 80) {
      return (
        <div style={{ width: '96px', height: '96px', background: '#FEF9C3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>
      );
    } else if (percentage >= 50) {
      return (
        <div style={{ width: '96px', height: '96px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
      );
    } else {
      return (
        <div style={{ width: '96px', height: '96px', background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
      );
    }
  };

  if (!savedWords || savedWords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0', marginTop: '40px' }}>
        <h3 style={{ fontSize: '1.8rem', color: '#475569', marginBottom: '8px' }}>Your Word Bank is empty</h3>
        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>Read a book review or start a lesson to highlight and save vocabulary words.</p>
      </div>
    );
  }

  // --- THE MINI-QUIZ UI ---
  if (isQuizMode) {
    if (showQuizResults) {
      const percentage = Math.round((score / savedWords.length) * 100);
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', animation: 'fadeInDown 0.3s ease-out' }}>
          <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '40px', padding: '60px', border: '2px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
            
            {renderResultIcon(percentage)}

            <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 16px 0' }}>Quiz Complete!</h2>
            <p style={{ color: '#64748B', fontSize: '1.3rem', marginBottom: '40px' }}>You scored <strong style={{ color: '#4F46E5' }}>{score}</strong> out of <strong style={{ color: '#0F172A' }}>{savedWords.length}</strong>.</p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={exitQuiz} style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' }}>Back to Vault</button>
              <button onClick={() => { setQuizIndex(0); setScore(0); setShowQuizResults(false); }} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)', transition: 'all 0.2s' }}>Try Again</button>
            </div>
          </div>
        </div>
      );
    }

    const currentQuizWord = savedWords[quizIndex];

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeInDown 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={exitQuiz} style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← End Quiz
          </button>
          <span style={{ color: '#64748B', fontWeight: '600', fontSize: '1.1rem' }}>
            Question {quizIndex + 1} of {savedWords.length}
          </span>
        </div>

        <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '40px', padding: '50px', border: '2px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
          <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
            Match the Definition
          </span>
          <h3 style={{ fontSize: '1.8rem', color: '#0F172A', margin: '0 0 40px 0', lineHeight: '1.4', fontWeight: '500' }}>
            "{currentQuizWord.definition}"
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {quizOptions.map((opt, i) => {
              const isSelected = selectedAnswer === opt.word;
              const isCorrect = opt.word === currentQuizWord.word;
              
              let bgColor = '#F8FAFC';
              let borderColor = '#E2E8F0';
              let textColor = '#0F172A';

              if (selectedAnswer) {
                if (isCorrect) {
                  bgColor = '#D1FAE5'; borderColor = '#10B981'; textColor = '#065F46'; 
                } else if (isSelected && !isCorrect) {
                  bgColor = '#FEE2E2'; borderColor = '#EF4444'; textColor = '#991B1B'; 
                }
              }

              return (
                <button 
                  key={i}
                  disabled={!!selectedAnswer}
                  onClick={() => handleAnswerClick(opt.word)}
                  style={{ width: '100%', padding: '20px', borderRadius: '20px', background: bgColor, border: `2px solid ${borderColor}`, color: textColor, fontSize: '1.3rem', fontWeight: '600', textAlign: 'left', cursor: selectedAnswer ? 'default' : 'pointer', transition: 'all 0.2s' }}
                >
                  {opt.word}
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <div style={{ marginTop: '30px', textAlign: 'right', animation: 'fadeInDown 0.2s ease-out' }}>
              <button onClick={handleNextQuestion} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '16px 40px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                {quizIndex + 1 < savedWords.length ? 'Next Question →' : 'See Results →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- THE FLASHCARD UI ---
  if (isStudyMode) {
    const currentWord = savedWords[currentIndex];

    const handleNext = () => {
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % savedWords.length);
    };

    const handlePrev = () => {
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev - 1 + savedWords.length) % savedWords.length);
    };

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeInDown 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button 
            onClick={() => { setIsStudyMode(false); setIsFlipped(false); setCurrentIndex(0); }} 
            style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ← Back to List
          </button>
          <span style={{ color: '#64748B', fontWeight: '600', fontSize: '1.1rem' }}>
            Card {currentIndex + 1} of {savedWords.length}
          </span>
        </div>

        <div 
          onClick={() => setIsFlipped(!isFlipped)} 
          className="soft-card" 
          style={{ 
            cursor: 'pointer', 
            minHeight: '350px', 
            maxHeight: '60vh', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#ffffff', 
            borderRadius: '40px', 
            padding: '50px', 
            border: '2px solid #E2E8F0', 
            transition: 'all 0.3s ease', 
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' 
          }}
        >
          {!isFlipped ? (
            <>
              <h2 style={{ fontSize: '3.5rem', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-1px', textAlign: 'center' }}>{currentWord.word}</h2>
              <p style={{ color: '#94A3B8', fontSize: '1.1rem', margin: 0 }}>Click to reveal definition</p>
            </>
          ) : (
            <>
              <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
                {currentWord.pos || 'Vocabulary'}
              </span>
              <h3 style={{ fontSize: '1.8rem', color: '#0F172A', textAlign: 'center', margin: '0 0 24px 0', lineHeight: '1.4', fontWeight: '500' }}>
                {currentWord.definition}
              </h3>
              
              {currentWord.example && (
                <div style={{ width: '100%', padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '24px', fontStyle: 'italic', color: '#475569', fontSize: '1.3rem', textAlign: 'center', borderLeft: '4px solid #4F46E5' }}>
                  "{currentWord.example}"
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          <button onClick={handlePrev} style={{ background: '#F1F5F9', border: 'none', color: '#475569', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer' }}>Previous</button>
          <button onClick={handleNext} style={{ background: '#4F46E5', border: 'none', color: '#ffffff', padding: '16px 40px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>Next Card</button>
        </div>
      </div>
    );
  }

  // --- THE LIST UI (DEFAULT) ---
  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 8px 0', fontWeight: '600', letterSpacing: '-1px' }}>Word Bank</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem' }}>You have {savedWords.length} word{savedWords.length !== 1 ? 's' : ''} saved.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setIsStudyMode(true)} 
            style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #4F46E5', padding: '12px 28px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="14" height="14" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            Study Flashcards
          </button>
          <button 
            onClick={() => setIsQuizMode(true)} 
            style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Quiz Me
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {savedWords.map((item, index) => (
          <div key={index} className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', position: 'relative', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setWordToDelete(item)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#FEF2F2', border: 'none', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
              title="Remove Word"
            >
              ✕
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0F172A' }}>{item.word}</h3>
              <span style={{ fontSize: '0.8rem', background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '9999px', fontWeight: '700', textTransform: 'uppercase' }}>
                {item.pos || 'Word'}
              </span>
            </div>
            <p style={{ margin: 0, color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>{item.definition}</p>
          </div>
        ))}
      </div>

      {/* --- SLEEK CUSTOM DELETE CONFIRMATION MODAL --- */}
      {wordToDelete && (
        <div 
          onClick={() => setWordToDelete(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', animation: 'fadeInDown 0.2s ease-out' }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)' }}
          >
            <div style={{ width: '72px', height: '72px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <h3 style={{ fontSize: '1.8rem', color: '#0F172A', margin: '0 0 12px 0', fontWeight: '600', letterSpacing: '-0.5px' }}>Remove Word?</h3>
            <p style={{ color: '#64748B', fontSize: '1.1rem', margin: '0 0 32px 0', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: '#0F172A' }}>"{wordToDelete.word}"</strong> from your Word Bank?
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setWordToDelete(null)} 
                style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toggleSaveWord(wordToDelete.word, wordToDelete);
                  setWordToDelete(null);
                }} 
                style={{ flex: 1, background: '#EF4444', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)', transition: 'all 0.2s' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};