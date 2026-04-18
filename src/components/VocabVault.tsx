import React, { useState, useEffect, useMemo } from 'react';

// Simplified SuperMemo-2 Algorithm Interfaces
interface SRSData {
  interval: number;
  ease: number;
  nextReview: number;
}

interface VaultProps {
  savedWords: any[];
  toggleSaveWord: (word: string, info: any) => void;
}

export function VocabVault({ savedWords, toggleSaveWord }: VaultProps) {
  const [srsDatabase, setSrsDatabase] = useState<Record<string, SRSData>>({});
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  
  // THE FIX: We added a sessionQueue to "freeze" the words while studying
  const [sessionQueue, setSessionQueue] = useState<any[]>([]); 
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load SRS history from local storage on mount
  useEffect(() => {
    const localSRS = localStorage.getItem('litAndLearnSRS');
    if (localSRS) {
      setSrsDatabase(JSON.parse(localSRS));
    }
  }, []);

  // Determine which words are due for review today
  const reviewQueue = useMemo(() => {
    const now = Date.now();
    return savedWords.filter(item => {
      const wordData = srsDatabase[item.word.toLowerCase()];
      // If it's a new word (no data) or the nextReview timestamp has passed, it's due!
      if (!wordData) return true;
      return wordData.nextReview <= now;
    });
  }, [savedWords, srsDatabase]);

  // The Spaced Repetition Brain
  const handleRateCard = (rating: 'hard' | 'good' | 'easy') => {
    // We now use sessionQueue instead of reviewQueue so the array doesn't shrink mid-session
    const currentWord = sessionQueue[currentCardIndex].word.toLowerCase();
    const existingData = srsDatabase[currentWord] || { interval: 0, ease: 2.5, nextReview: 0 };
    
    let { interval, ease } = existingData;

    // SRS Math Logic
    if (rating === 'hard') {
      interval = 1; // Try again tomorrow
      ease = Math.max(1.3, ease - 0.2); // Decrease ease slightly
    } else if (rating === 'good') {
      interval = interval === 0 ? 1 : Math.round(interval * ease);
    } else if (rating === 'easy') {
      interval = interval === 0 ? 4 : Math.round(interval * ease * 1.3);
      ease += 0.15; // Increase ease so we see it less often
    }

    // Calculate next review date (interval in days converted to milliseconds)
    const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

    const updatedDatabase = {
      ...srsDatabase,
      [currentWord]: { interval, ease, nextReview }
    };

    setSrsDatabase(updatedDatabase);
    localStorage.setItem('litAndLearnSRS', JSON.stringify(updatedDatabase));

    // Move to next card or finish the session cleanly
    if (currentCardIndex + 1 < sessionQueue.length) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFlashcardMode(false);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setSessionQueue([]); // Empty the session queue when done
    }
  };

  const startReviewSession = () => {
    if (reviewQueue.length > 0) {
      setSessionQueue(reviewQueue); // FREEZE the queue right when they hit start
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setIsFlashcardMode(true);
    }
  };

  // --- RENDER EMPTY STATE ---
  if (!savedWords || savedWords.length === 0) {
    return (
      <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '60px 40px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
        <h2 style={{ fontSize: '2rem', color: '#0F172A', marginBottom: '16px' }}>Your Vault is Empty</h2>
        <p style={{ fontSize: '1.2rem', color: '#64748B', maxWidth: '500px', margin: '0 auto' }}>
          Highlight words while reading any text or listening to an audio lesson to save them here for active recall training.
        </p>
      </div>
    );
  }

  // --- RENDER FLASHCARD MODE ---
  if (isFlashcardMode && sessionQueue.length > 0) {
    const currentItem = sessionQueue[currentCardIndex];
    // Safety fallback just in case
    if (!currentItem) return null; 

    const progress = ((currentCardIndex) / sessionQueue.length) * 100;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 'bold', marginBottom: '8px' }}>
            <span>Reviewing...</span>
            <span>{currentCardIndex + 1} of {sessionQueue.length}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#4F46E5', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* The Flashcard */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ 
            backgroundColor: '#ffffff', minHeight: '400px', borderRadius: '32px', padding: '40px', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.1)', cursor: 'pointer', position: 'relative',
            border: isFlipped ? '2px solid #4F46E5' : '2px solid transparent', transition: 'all 0.3s ease'
          }}
        >
          {!isFlipped ? (
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.2rem', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>What does this mean?</span>
              <h1 style={{ fontSize: '4rem', color: '#0F172A', margin: 0 }}>{currentItem.word}</h1>
              <span style={{ display: 'inline-block', marginTop: '40px', padding: '10px 24px', backgroundColor: '#F1F5F9', color: '#64748B', borderRadius: '999px', fontWeight: '600' }}>Tap card to flip</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }}>
                {currentItem.pos || 'Vocabulary'}
              </span>
              <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginTop: 0, marginBottom: '20px' }}>{currentItem.word}</h2>
              <div style={{ height: '2px', width: '60px', backgroundColor: '#E2E8F0', margin: '0 auto 30px auto' }} />
              <p style={{ fontSize: '1.5rem', color: '#334155', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                {currentItem.def}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons (Only visible when flipped) */}
        {isFlipped && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '40px', animation: 'slideUp 0.3s ease-out' }}>
            <button onClick={(e) => { e.stopPropagation(); handleRateCard('hard'); }} style={{ flex: 1, padding: '20px', backgroundColor: '#FEF2F2', border: '2px solid #FCA5A5', color: '#DC2626', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}>
              Hard <span style={{ display: 'block', fontSize: '0.9rem', color: '#EF4444', marginTop: '4px', fontWeight: '500' }}>Review Tomorrow</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleRateCard('good'); }} style={{ flex: 1, padding: '20px', backgroundColor: '#EEF2FF', border: '2px solid #A5B4FC', color: '#4F46E5', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}>
              Good <span style={{ display: 'block', fontSize: '0.9rem', color: '#6366F1', marginTop: '4px', fontWeight: '500' }}>Perfect Pace</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleRateCard('easy'); }} style={{ flex: 1, padding: '20px', backgroundColor: '#ECFDF5', border: '2px solid #6EE7B7', color: '#059669', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}>
              Easy <span style={{ display: 'block', fontSize: '0.9rem', color: '#10B981', marginTop: '4px', fontWeight: '500' }}>Push Further Out</span>
            </button>
          </div>
        )}

        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div>
      {/* Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '50px' }}>
        
        <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#64748B', fontSize: '1.2rem', fontWeight: '600' }}>Total Saved</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0F172A', lineHeight: '1' }}>{savedWords.length}</div>
          </div>
          <div style={{ fontSize: '4rem', opacity: 0.8 }}>📚</div>
        </div>

        <div className="soft-card" style={{ backgroundColor: reviewQueue.length > 0 ? '#4F46E5' : '#10B981', color: 'white', padding: '40px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: reviewQueue.length > 0 ? '0 25px 50px -12px rgba(79,70,229,0.3)' : '0 25px 50px -12px rgba(16,185,129,0.3)' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', fontWeight: '600' }}>Due for Review</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{reviewQueue.length}</div>
          </div>
          {reviewQueue.length > 0 ? (
            <button onClick={startReviewSession} style={{ padding: '16px 32px', backgroundColor: '#ffffff', color: '#4F46E5', border: 'none', borderRadius: '999px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
              Start Session ⚡
            </button>
          ) : (
             <div style={{ fontSize: '4rem' }}>🎉</div>
          )}
        </div>

      </div>

      {/* Dictionary List */}
      <h3 style={{ fontSize: '1.5rem', color: '#0F172A', marginBottom: '24px', paddingLeft: '10px' }}>Full Dictionary List</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {savedWords.map((item, idx) => {
          const srsInfo = srsDatabase[item.word.toLowerCase()];
          const isDue = srsInfo ? srsInfo.nextReview <= Date.now() : true;

          return (
            <div key={idx} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative' }}>
              <button 
                onClick={() => toggleSaveWord(item.word, item)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#FEE2E2', color: '#EF4444', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                title="Remove from Vault"
              >✕</button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#0F172A' }}>{item.word}</h4>
                {isDue && <span style={{ width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '50%' }} title="Due for review" />}
              </div>
              <span style={{ display: 'inline-block', backgroundColor: '#F1F5F9', color: '#64748B', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px' }}>
                {item.pos || 'Vocab'}
              </span>
              <p style={{ margin: 0, color: '#475569', fontSize: '1.05rem', lineHeight: '1.5' }}>{item.def}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}