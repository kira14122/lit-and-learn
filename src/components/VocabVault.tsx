import React, { useState } from 'react';

interface VocabVaultProps {
  savedWords: any[];
  toggleSaveWord: (word: string, info: any) => void;
}

export const VocabVault: React.FC<VocabVaultProps> = ({ savedWords, toggleSaveWord }) => {
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // NEW STATE: Tracks which word the user is trying to delete to show the custom modal
  const [wordToDelete, setWordToDelete] = useState<any | null>(null);

  if (!savedWords || savedWords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0', marginTop: '40px' }}>
        <h3 style={{ fontSize: '1.8rem', color: '#475569', marginBottom: '8px' }}>Your Word Bank is empty</h3>
        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>Read a book review or start a lesson to highlight and save vocabulary words.</p>
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
          style={{ cursor: 'pointer', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '40px', padding: '50px', border: '2px solid #E2E8F0', transition: 'all 0.3s ease', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}
        >
          {!isFlipped ? (
            <>
              <h2 style={{ fontSize: '3.5rem', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-1px' }}>{currentWord.word}</h2>
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
            style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #4F46E5', padding: '12px 28px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Study Flashcards
          </button>
          <button 
            style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '16px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}
          >
            Quiz Me ⚡
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {savedWords.map((item, index) => (
          <div key={index} className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', position: 'relative', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            {/* UPDATED DELETE BUTTON: Triggers the sleek custom modal instead of browser alert */}
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