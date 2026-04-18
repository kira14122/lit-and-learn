import React, { useState, useEffect, useMemo } from 'react';
import { DiscardWordModal } from './DiscardWordModal';

interface MasteryData {
  correctStreak: number;
  lastTested: number;
}

interface VaultProps {
  savedWords: any[];
  toggleSaveWord: (word: string, info: any) => void;
}

export function VocabVault({ savedWords, toggleSaveWord }: VaultProps) {
  const [masteryData, setMasteryData] = useState<Record<string, MasteryData>>({});
  const [isQuizMode, setIsQuizMode] = useState(false);
  
  // Quiz State
  const [quizQueue, setQuizQueue] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Modal State
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [wordToDiscard, setWordToDiscard] = useState<string>("");
  const [wordInfoToDiscard, setWordInfoToDiscard] = useState<any>(null);

  // Load Mastery history from local storage on mount
  useEffect(() => {
    const localMastery = localStorage.getItem('litAndLearnMastery');
    if (localMastery) {
      setMasteryData(JSON.parse(localMastery));
    }
  }, []);

  // Determine Mastery Levels for Organization
  const categorizedWords = useMemo(() => {
    const categories = { needsReview: [] as any[], inProgress: [] as any[], mastered: [] as any[] };
    savedWords.forEach(item => {
      const streak = masteryData[item.word.toLowerCase()]?.correctStreak || 0;
      if (streak >= 3) categories.mastered.push(item);
      else if (streak > 0) categories.inProgress.push(item);
      else categories.needsReview.push(item);
    });
    return categories;
  }, [savedWords, masteryData]);

  // Generate 4 random options (1 correct, 3 distractors from their own vault)
  const generateOptions = (correctWord: string) => {
    const distractors = savedWords
      .map(w => w.word)
      .filter(w => w.toLowerCase() !== correctWord.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Fallbacks if they don't have enough words saved
    const fallbacks = ["metaphor", "syntax", "nuance", "paradigm", "rhetoric", "allegory"];
    while (distractors.length < 3) {
      const fallback = fallbacks.pop()!;
      if (!distractors.includes(fallback) && fallback !== correctWord) distractors.push(fallback);
    }

    return [correctWord, ...distractors].sort(() => 0.5 - Math.random());
  };

  const startQuizSession = () => {
    const queue = [...savedWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    if (queue.length > 0) {
      setQuizQueue(queue);
      setCurrentQuestionIndex(0);
      setCurrentOptions(generateOptions(queue[0].word));
      setSelectedAnswer(null);
      setIsQuizMode(true);
    }
  };

  const handleAnswerClick = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);

    const currentItem = quizQueue[currentQuestionIndex];
    const isCorrect = answer === currentItem.word;
    const wordKey = currentItem.word.toLowerCase();
    
    const existingData = masteryData[wordKey] || { correctStreak: 0, lastTested: 0 };
    const newStreak = isCorrect ? existingData.correctStreak + 1 : 0; 

    const updatedData = {
      ...masteryData,
      [wordKey]: { correctStreak: newStreak, lastTested: Date.now() }
    };

    setMasteryData(updatedData);
    localStorage.setItem('litAndLearnMastery', JSON.stringify(updatedData));

    setTimeout(() => {
      if (currentQuestionIndex + 1 < quizQueue.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentOptions(generateOptions(quizQueue[currentQuestionIndex + 1].word));
        setSelectedAnswer(null);
      } else {
        setIsQuizMode(false);
      }
    }, 1500);
  };

  // Modal handlers
  const handleModalClose = () => {
    setIsDiscardModalOpen(false);
    setWordToDiscard("");
    setWordInfoToDiscard(null);
  };

  const handleModalConfirm = () => {
    if (wordToDiscard && wordInfoToDiscard) {
      toggleSaveWord(wordToDiscard, wordInfoToDiscard);
    }
    handleModalClose();
  };

  // --- RENDER EMPTY STATE ---
  if (!savedWords || savedWords.length === 0) {
    return (
      <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '60px 40px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
        <h2 style={{ fontSize: '2rem', color: '#0F172A', marginBottom: '16px' }}>Your Word Bank is Empty</h2>
        <p style={{ fontSize: '1.2rem', color: '#64748B', maxWidth: '500px', margin: '0 auto' }}>
          Highlight words while reading any text or listening to an audio lesson to save them here for active recall training.
        </p>
      </div>
    );
  }

  // --- RENDER QUIZ MODE ---
  if (isQuizMode && quizQueue.length > 0) {
    const currentItem = quizQueue[currentQuestionIndex];
    const progress = (currentQuestionIndex / quizQueue.length) * 100;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 'bold', marginBottom: '8px' }}>
            <span>Active Recall Quiz</span>
            <span>{currentQuestionIndex + 1} of {quizQueue.length}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#4F46E5', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.1)', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }}>
            Find the match for:
          </span>
          <p style={{ fontSize: '1.6rem', color: '#0F172A', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px auto', fontWeight: '500' }}>
            "{currentItem.def}"
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {currentOptions.map((opt, idx) => {
              let bg = '#F8FAFC'; let border = '2px solid #E2E8F0'; let color = '#334155';
              
              if (selectedAnswer) {
                if (opt === currentItem.word) { bg = '#D1FAE5'; border = '2px solid #10B981'; color = '#065F46'; }
                else if (opt === selectedAnswer) { bg = '#FEE2E2'; border = '2px solid #EF4444'; color = '#991B1B'; }
              }

              return (
                <button 
                  key={idx} 
                  onClick={() => handleAnswerClick(opt)}
                  disabled={!!selectedAnswer}
                  style={{ padding: '20px', borderRadius: '16px', border, backgroundColor: bg, color, fontSize: '1.2rem', fontWeight: 'bold', cursor: selectedAnswer ? 'default' : 'pointer', transition: 'all 0.2s', opacity: selectedAnswer && opt !== currentItem.word && opt !== selectedAnswer ? 0.5 : 1 }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER VAULT DASHBOARD ---
  const WordCard = ({ item }: { item: any }) => {
    const streak = masteryData[item.word.toLowerCase()]?.correctStreak || 0;
    
    const handleDiscardRequest = () => {
      setWordToDiscard(item.word);
      setWordInfoToDiscard(item);
      setIsDiscardModalOpen(true);
    };

    return (
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative' }}>
        <button 
          onClick={handleDiscardRequest}
          title="Discard word"
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#FEE2E2', color: '#EF4444', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
        >✕</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingRight: '30px', flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#0F172A' }}>{item.word}</h4>
          <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {item.pos || 'Vocab'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {[1, 2, 3].map(dot => (
            <div key={dot} style={{ width: '12px', height: '6px', borderRadius: '3px', backgroundColor: streak >= dot ? '#10B981' : '#E2E8F0' }} />
          ))}
        </div>
        <p style={{ margin: 0, color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>{item.def}</p>
      </div>
    );
  };

  return (
    <div>
      {/* RESPONSIVE HEADER FIX */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ flex: '1 1 250px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 2.8rem)', color: '#0F172A', margin: '0 0 8px 0', lineHeight: '1.1' }}>Word Bank</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '1.1rem' }}>
            You have {savedWords.length} word{savedWords.length !== 1 ? 's' : ''} saved.
          </p>
        </div>
        
        {/* NEW BUTTON WRAPPER */}
        <div style={{ flex: '1 1 250px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={startQuizSession} 
            disabled={savedWords.length < 4}
            style={{ 
              width: '100%', 
              maxWidth: '280px', /* Caps the width on desktop */
              padding: '16px 24px', 
              backgroundColor: savedWords.length >= 4 ? '#4F46E5' : '#CBD5E1', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '16px', 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              cursor: savedWords.length >= 4 ? 'pointer' : 'not-allowed', 
              boxShadow: savedWords.length >= 4 ? '0 10px 20px rgba(79,70,229,0.2)' : 'none', 
              whiteSpace: 'nowrap' 
            }}
          >
            {savedWords.length >= 4 ? 'Quiz Me ⚡' : 'Save 4 words to unlock Quizzes'}
          </button>
        </div>
      </div>

      {/* TIER 3: MASTERED */}
      {categorizedWords.mastered.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#10B981', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></span> Mastered
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {categorizedWords.mastered.map((item, idx) => <WordCard key={idx} item={item} />)}
          </div>
        </div>
      )}

      {/* TIER 2: IN PROGRESS */}
      {categorizedWords.inProgress.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#F59E0B', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span> In Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {categorizedWords.inProgress.map((item, idx) => <WordCard key={idx} item={item} />)}
          </div>
        </div>
      )}

      {/* TIER 1: NEEDS REVIEW */}
      {categorizedWords.needsReview.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#64748B', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748B' }}></span> Needs Review
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {categorizedWords.needsReview.map((item, idx) => <WordCard key={idx} item={item} />)}
          </div>
        </div>
      )}

      {/* RENDER THE MODAL */}
      <DiscardWordModal 
        isOpen={isDiscardModalOpen} 
        onClose={handleModalClose} 
        onConfirm={handleModalConfirm}
        wordToDiscard={wordToDiscard}
      />
    </div>
  );
}