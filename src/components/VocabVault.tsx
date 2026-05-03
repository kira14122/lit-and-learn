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

  // --- SMART QUIZ STATE ---
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Generate the Balanced 3-Mode Smart Quiz
  useEffect(() => {
    if (isQuizMode && savedWords.length > 0 && quizQuestions.length === 0) {
      
      const MAX_QUESTIONS = 15;
      const numQuestions = Math.min(savedWords.length, MAX_QUESTIONS);

      // 1. Create a perfectly balanced pool of modes (0=Context, 1=Definition, 2=Grammar)
      let modePool: number[] = [];
      for (let i = 0; i < numQuestions; i++) {
        modePool.push(i % 3); 
      }
      // Shuffle the mode pool so the order is unpredictable
      modePool = modePool.sort(() => 0.5 - Math.random());

      // 2. Create a fresh, shuffled copy of the user's words
      let availableWords = [...savedWords].sort(() => 0.5 - Math.random());
      
      const generatedQuestions = [];
      const wordFallbacks = ["ambiguous", "resilient", "tenacious", "meticulous", "ephemeral"];
      const posFallbacks = ["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Preposition"];

      // 3. Build the questions based on our balanced mode pool
      for (let targetMode of modePool) {
        if (availableWords.length === 0) break;

        let selectedWordIndex = -1;
        let finalMode = targetMode;

        // If it wants a Context question, we MUST find a word that has an example sentence
        if (finalMode === 0) {
          selectedWordIndex = availableWords.findIndex(w => w.example && w.example.trim() !== '');
          
          if (selectedWordIndex === -1) {
            // No words with examples left! Fallback to Definition (1) or Grammar (2)
            finalMode = Math.random() > 0.5 ? 1 : 2;
          }
        }

        // If it's a Definition or Grammar question (or if Context fell back), just grab the first available word
        if (selectedWordIndex === -1) {
          selectedWordIndex = 0;
        }

        const wordObj = availableWords[selectedWordIndex];
        // Remove this word from the pool so it doesn't get asked twice
        availableWords.splice(selectedWordIndex, 1);

        let type = "";
        let prompt = "";
        let correctAnswer = "";
        let options: string[] = [];
        let originalSentence = "";
        let exactWordInSentence = wordObj.word; // Default to base word

        if (finalMode === 0) {
          // MODE 1: Contextual Fill-in-the-Blank
          type = 'fill-in-blank';
          correctAnswer = wordObj.word;
          originalSentence = wordObj.example;
          
          // FIX: Find the exact variation used in the sentence (handles -s, -d, -ed suffixes)
          const regex = new RegExp(`${wordObj.word}[a-z]*`, 'gi');
          const match = wordObj.example.match(regex);
          exactWordInSentence = match ? match[0] : wordObj.word;

          prompt = wordObj.example.replace(regex, '_________');

          let distractors = savedWords.filter(w => w.word !== wordObj.word).map(w => w.word);
          if (distractors.length < 3) distractors.push(...wordFallbacks);
          distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
          options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());

        } else if (finalMode === 1) {
          // MODE 2: Reverse Definition
          type = 'definition';
          correctAnswer = wordObj.word;
          prompt = wordObj.definition;

          let distractors = savedWords.filter(w => w.word !== wordObj.word).map(w => w.word);
          if (distractors.length < 3) distractors.push(...wordFallbacks);
          distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
          options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());

        } else {
          // MODE 3: Part of Speech Tagging
          type = 'pos';
          correctAnswer = wordObj.pos ? wordObj.pos.charAt(0).toUpperCase() + wordObj.pos.slice(1).toLowerCase() : 'Noun';
          prompt = wordObj.word;

          let distractors = posFallbacks.filter(p => p.toLowerCase() !== correctAnswer.toLowerCase());
          distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
          options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());
        }

        generatedQuestions.push({ 
          type, 
          prompt, 
          correctAnswer, 
          options, 
          originalSentence, 
          word: wordObj.word,
          exactWordInSentence // Store the exact variation to highlight it correctly later
        });
      }

      // 4. One final shuffle of the questions just to be perfectly random
      setQuizQuestions(generatedQuestions.sort(() => 0.5 - Math.random()));
      setQuizIndex(0);
      setScore(0);
      setShowQuizResults(false);
      setSelectedAnswer(null);
    }
  }, [isQuizMode, savedWords, quizQuestions.length]);

  const handleAnswerClick = (selectedOpt: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(selectedOpt);
    if (selectedOpt === quizQuestions[quizIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowQuizResults(true);
    }
  };

  const exitQuiz = () => {
    setIsQuizMode(false);
    setShowQuizResults(false);
    setQuizQuestions([]);
    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
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

  // --- RESPONSIVE CSS INJECTION ---
  const sharedStyles = (
    <style>{`
      /* Custom Scrollbar for the Vocab List */
      .vocab-scroll-container::-webkit-scrollbar { width: 8px; }
      .vocab-scroll-container::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
      .vocab-scroll-container::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      .vocab-scroll-container::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

      /* Mobile Overrides for Cards */
      @media (max-width: 768px) {
        .mobile-quiz-card { padding: 24px !important; border-radius: 24px !important; }
        .mobile-quiz-def { font-size: 1.3rem !important; margin-bottom: 24px !important; }
        .mobile-quiz-btn { padding: 16px !important; font-size: 1.1rem !important; }
        
        .mobile-flashcard { padding: 30px 20px !important; min-height: 250px !important; border-radius: 24px !important; }
        .mobile-flashcard-word { font-size: 2.5rem !important; }
      }
    `}</style>
  );

  if (!savedWords || savedWords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0', marginTop: '40px' }}>
        <h3 style={{ fontSize: '1.8rem', color: '#475569', margin: '0 0 8px 0' }}>Your Word Bank is empty</h3>
        <p style={{ color: '#94A3B8', fontSize: '1.1rem', margin: 0 }}>Read a book review or start a lesson to highlight and save vocabulary words.</p>
      </div>
    );
  }

  // --- THE SMART QUIZ UI ---
  if (isQuizMode && quizQuestions.length > 0) {
    if (showQuizResults) {
      const percentage = Math.round((score / quizQuestions.length) * 100);
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', animation: 'fadeInDown 0.3s ease-out' }}>
          {sharedStyles}
          <div className="soft-card mobile-quiz-card" style={{ backgroundColor: '#ffffff', borderRadius: '40px', padding: '60px', border: '2px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
            
            {renderResultIcon(percentage)}

            <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 16px 0' }}>Quiz Complete!</h2>
            <p style={{ color: '#64748B', fontSize: '1.3rem', marginBottom: '40px' }}>You scored <strong style={{ color: '#4F46E5' }}>{score}</strong> out of <strong style={{ color: '#0F172A' }}>{quizQuestions.length}</strong>.</p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={exitQuiz} style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' }}>Back to List</button>
              <button onClick={() => { setQuizQuestions([]); setQuizIndex(0); setScore(0); setShowQuizResults(false); }} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)', transition: 'all 0.2s' }}>Play Again</button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = quizQuestions[quizIndex];
    
    // Determine Badge Text based on Mode
    let badgeText = "Match the Definition";
    let badgeColor = { bg: '#EEF2FF', text: '#4F46E5' };
    if (currentQ.type === 'fill-in-blank') {
      badgeText = "Complete the Sentence";
      badgeColor = { bg: '#FEF3C7', text: '#D97706' };
    } else if (currentQ.type === 'pos') {
      badgeText = "Identify the Grammar";
      badgeColor = { bg: '#ECFDF5', text: '#059669' };
    }

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeInDown 0.3s ease-out' }}>
        {sharedStyles}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={exitQuiz} style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← End Quiz
          </button>
          <span style={{ color: '#64748B', fontWeight: '600', fontSize: '1.1rem' }}>
            Question {quizIndex + 1} of {quizQuestions.length}
          </span>
        </div>

        <div className="soft-card mobile-quiz-card" style={{ backgroundColor: '#ffffff', borderRadius: '40px', padding: '50px', border: '2px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
          <span style={{ display: 'inline-block', background: badgeColor.bg, color: badgeColor.text, padding: '6px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
            {badgeText}
          </span>
          
          <div style={{ marginBottom: '40px', minHeight: '80px', display: 'flex', alignItems: 'center' }}>
            {currentQ.type === 'fill-in-blank' && selectedAnswer ? (
              <p className="mobile-quiz-def" style={{ fontSize: '1.6rem', color: '#0F172A', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                {/* FIX: We now split by the exact word variation (e.g., 'displaced') so the whole word highlights correctly */}
                {currentQ.originalSentence.split(new RegExp(`(${currentQ.exactWordInSentence})`, 'gi')).map((part: string, i: number) => 
                   part.toLowerCase() === currentQ.exactWordInSentence.toLowerCase() ? 
                   <strong key={i} style={{ color: selectedAnswer === currentQ.correctAnswer ? '#10B981' : '#EF4444', borderBottom: `2px solid ${selectedAnswer === currentQ.correctAnswer ? '#10B981' : '#EF4444'}` }}>{part}</strong> 
                   : part
                )}
              </p>
            ) : (
              <h3 className="mobile-quiz-def" style={{ fontSize: currentQ.type === 'pos' ? '2.5rem' : '1.6rem', color: '#0F172A', margin: 0, lineHeight: '1.5', fontWeight: '500', fontStyle: currentQ.type === 'definition' ? 'italic' : 'normal' }}>
                {currentQ.type === 'definition' ? `"${currentQ.prompt}"` : currentQ.prompt}
              </h3>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: currentQ.type === 'pos' ? '1fr 1fr' : '1fr', gap: '16px' }}>
            {currentQ.options.map((opt: string, i: number) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === currentQ.correctAnswer;
              
              let bgColor = '#F8FAFC';
              let borderColor = '#E2E8F0';
              let textColor = '#0F172A';

              if (selectedAnswer) {
                if (isCorrect) {
                  bgColor = '#D1FAE5'; borderColor = '#10B981'; textColor = '#065F46'; 
                } else if (isSelected && !isCorrect) {
                  bgColor = '#FEE2E2'; borderColor = '#EF4444'; textColor = '#991B1B'; 
                } else {
                  bgColor = '#ffffff'; borderColor = '#F1F5F9'; textColor = '#CBD5E1';
                }
              }

              return (
                <button 
                  key={i}
                  disabled={!!selectedAnswer}
                  className="mobile-quiz-btn"
                  onClick={() => handleAnswerClick(opt)}
                  style={{ width: '100%', padding: '20px', borderRadius: '20px', background: bgColor, border: `2px solid ${borderColor}`, color: textColor, fontSize: '1.2rem', fontWeight: '600', textAlign: currentQ.type === 'pos' ? 'center' : 'left', cursor: selectedAnswer ? 'default' : 'pointer', transition: 'all 0.2s', textTransform: currentQ.type === 'pos' ? 'capitalize' : 'lowercase' }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <div style={{ marginTop: '30px', textAlign: 'right', animation: 'fadeInDown 0.2s ease-out' }}>
              <button onClick={handleNextQuestion} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '16px 40px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                {quizIndex + 1 < quizQuestions.length ? 'Next Question →' : 'See Results →'}
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
        {sharedStyles}
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
          className="soft-card mobile-flashcard" 
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
              <h2 className="mobile-flashcard-word" style={{ fontSize: '3.5rem', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-1px', textAlign: 'center' }}>{currentWord.word}</h2>
              <p style={{ color: '#94A3B8', fontSize: '1.1rem', margin: 0 }}>Click to reveal definition</p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {currentWord.pos || 'Vocabulary'}
                </span>
                {currentWord.level && (
                  <span style={{ display: 'inline-block', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '5px 16px', borderRadius: '9999px', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {currentWord.level}
                  </span>
                )}
              </div>
              
              <h3 className="mobile-quiz-def" style={{ fontSize: '1.8rem', color: '#0F172A', textAlign: 'center', margin: '0 0 24px 0', lineHeight: '1.4', fontWeight: '500' }}>
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
    <>
      {sharedStyles}
      <div style={{ animation: 'fadeInDown 0.3s ease-out', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '0 0 8px 0', fontWeight: '600', letterSpacing: '-1px' }}>Word List</h2>
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

        {/* --- INTERNALLY SCROLLING CONTAINER --- */}
        <div 
          className="vocab-scroll-container" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px', 
            maxHeight: '450px', 
            overflowY: 'auto', 
            paddingRight: '12px',
            paddingBottom: '16px',
            alignContent: 'start',
            flexGrow: 1
          }}
        >
          {savedWords.map((item, index) => (
            <div key={index} className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', position: 'relative', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
              <button 
                onClick={() => setWordToDelete(item)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#FEF2F2', border: 'none', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                title="Remove Word"
              >
                ✕
              </button>
              
              <div style={{ marginBottom: '16px', paddingRight: '40px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#0F172A', wordBreak: 'break-word', lineHeight: '1.2' }}>{item.word}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '9999px', fontWeight: '700', textTransform: 'uppercase' }}>
                    {item.pos || 'Word'}
                  </span>
                  {item.level && (
                    <span style={{ fontSize: '0.8rem', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '3px 10px', borderRadius: '9999px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {item.level}
                    </span>
                  )}
                </div>
              </div>
              
              <p style={{ margin: 0, color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>{item.definition}</p>
            </div>
          ))}
        </div>
        {/* --- END SCROLLING CONTAINER --- */}

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
                Are you sure you want to delete <strong style={{ color: '#0F172A' }}>"{wordToDelete.word}"</strong> from your Word List?
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
    </>
  );
};