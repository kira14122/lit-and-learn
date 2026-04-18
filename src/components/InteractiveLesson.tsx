import React, { useState, useRef } from 'react';
import WarmUpQuiz from './WarmUpQuiz';
import GrammarDiscovery from './GrammarDiscovery';
import GrammarPracticeBlock from './GrammarPracticeBlock'; // NEW IMPORT!
import TextHighlighter from './TextHighlighter';
import ComprehensionBlock from './ComprehensionBlock';
import VocabBlock from './VocabBlock';
import PronunciationBlock from './PronunciationBlock';

export function InteractiveLesson({ lessonData, onClose, savedWords, toggleSaveWord }: any) {
  const readingBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'readingBlock');
  const warmUpBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'warmUpBlock');

  const [showReading, setShowReading] = useState(!warmUpBlock);
  const [isReadingFinished, setIsReadingFinished] = useState(false);
  const [isGrammarUnlocked, setIsGrammarUnlocked] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'activities' | 'grammar'>('activities');

  const activitiesRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  if (!lessonData) return <div style={{ padding: '50px', textAlign: 'center' }}>No lesson data found.</div>;

  let rawText = "";
  if (readingBlock) {
    if (typeof readingBlock.content === 'string') rawText = readingBlock.content;
    else if (Array.isArray(readingBlock.content)) {
      rawText = readingBlock.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n');
    }
  }

  const handleStartReading = () => {
    setShowReading(true);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleFinishReading = () => {
    setIsReadingFinished(true);
    setActiveRightTab('activities');
    setTimeout(() => { activitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  const handleUnlockGrammar = () => {
    setIsGrammarUnlocked(true);
    setActiveRightTab('grammar');
    setTimeout(() => { rightColumnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  const renderBlocks = (tabFilter: 'activities' | 'grammar') => {
    const blocksToRender = lessonData.lessonBlocks?.filter((block: any) => {
      if (tabFilter === 'activities') {
        return ['comprehensionBlock', 'vocabBlock', 'pronunciationBlock'].includes(block._type);
      }
      if (tabFilter === 'grammar') {
        // ADDED grammarPracticeBlock here!
        return ['grammarBlock', 'inductiveGrammarBlock', 'grammarPracticeBlock'].includes(block._type);
      }
      return false;
    }) || [];

    if (blocksToRender.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '2px dashed #CBD5E1', color: '#94A3B8' }}>
          No {tabFilter === 'grammar' ? 'grammar modules' : 'activities'} have been added to this lesson yet.
        </div>
      );
    }

    return (
      <div>
        {blocksToRender.map((block: any, idx: number) => {
          const isLastBlock = idx === blocksToRender.length - 1;

          return (
            <React.Fragment key={block._key || idx}>
              {block._type === 'comprehensionBlock' && <ComprehensionBlock block={block} />}
              {block._type === 'vocabBlock' && <VocabBlock block={block} />}
              {block._type === 'pronunciationBlock' && <PronunciationBlock block={block} />}
              {(block._type === 'grammarBlock' || block._type === 'inductiveGrammarBlock') && <GrammarDiscovery block={block} />}
              
              {/* RENDER THE NEW PRACTICE BLOCK */}
              {block._type === 'grammarPracticeBlock' && <GrammarPracticeBlock block={block} />}

              {!isLastBlock && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0 40px 0', opacity: 0.5 }}>
                  <div style={{ height: '2px', width: '60px', background: '#CBD5E1', borderRadius: '2px' }} />
                  <div style={{ display: 'flex', gap: '8px', margin: '0 20px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                  </div>
                  <div style={{ height: '2px', width: '60px', background: '#CBD5E1', borderRadius: '2px' }} />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* SEQUENTIAL LOCK (Only on Activities Tab) */}
        {tabFilter === 'activities' && !isGrammarUnlocked && blocksToRender.length > 0 && (
          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px dashed #E2E8F0', paddingTop: '40px', paddingBottom: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🧠</div>
            <h3 style={{ color: '#0F172A', fontSize: '1.4rem', marginBottom: '8px' }}>Activities Completed?</h3>
            <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '24px' }}>Once you truly understand the meaning of the text, you are ready to analyze its form.</p>
            <button 
              onClick={handleUnlockGrammar} 
              style={{ padding: '18px 40px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }}
            >
              Unlock Grammar Lab 🔓
            </button>
          </div>
        )}

        {/* GRAND FINALE BUTTON (Only on Grammar Tab) */}
        {tabFilter === 'grammar' && blocksToRender.length > 0 && (
          <div style={{ marginTop: '50px', textAlign: 'center', borderTop: '2px dashed #E2E8F0', paddingTop: '40px', paddingBottom: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎓</div>
            <h3 style={{ color: '#0F172A', fontSize: '1.6rem', marginBottom: '8px' }}>Lesson Complete!</h3>
            <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '24px' }}>You have mastered the meaning and the form. Ready for the next challenge?</p>
            <button 
              onClick={onClose} 
              style={{ padding: '18px 40px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }}
            >
              Proceed to Next Lesson ➡️
            </button>
          </div>
        )}

      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#F3F6F8', minHeight: '100vh', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Lit <span style={{ color: '#4F46E5' }}>&</span> Learn
        </h2>
        <div style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: '500', display: 'none' }} className="desktop-only-title">
          {lessonData.title}
        </div>
        <button onClick={onClose} style={{ padding: '10px 24px', backgroundColor: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
          ✕ Close
        </button>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px 20px 120px 20px' }}>
        
        {!showReading && warmUpBlock ? (
          <WarmUpQuiz block={warmUpBlock} onComplete={handleStartReading} />
        ) : (
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
            
            <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '50px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }} className={`responsive-card reading-container ${isReadingFinished ? 'hide-reading-on-mobile' : ''}`}>
              <h1 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '16px', lineHeight: '1.2' }}>{lessonData.title}</h1>
              <div style={{ height: '4px', width: '60px', backgroundColor: '#4F46E5', borderRadius: '2px', marginBottom: '40px' }} />
              
              <div style={{ fontSize: '1.25rem', lineHeight: '2.2', color: '#334155' }}>
                <TextHighlighter text={rawText} onSaveWord={toggleSaveWord} savedWords={savedWords} />
              </div>

              {!isReadingFinished && (
                <div style={{ marginTop: '50px', textAlign: 'center', borderTop: '2px dashed #E2E8F0', paddingTop: '40px' }}>
                  <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '20px' }}>Finished reading? Let's check your understanding.</p>
                  <button onClick={handleFinishReading} style={{ padding: '18px 40px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79,70,229,0.3)' }}>
                    Start Activities ➡️
                  </button>
                </div>
              )}
            </div>

            <div ref={activitiesRef} style={{ display: isReadingFinished ? 'block' : 'none', scrollMarginTop: '100px' }}>
              
              <div ref={rightColumnRef} style={{ display: 'flex', gap: '12px', marginBottom: '20px', backgroundColor: '#ffffff', padding: '10px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', scrollMarginTop: '100px' }}>
                <button 
                  onClick={() => setActiveRightTab('activities')} 
                  style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeRightTab === 'activities' ? '#EEF2FF' : 'transparent', color: activeRightTab === 'activities' ? '#4F46E5' : '#64748B' }}
                >
                  📝 Activities
                </button>
                <button 
                  onClick={() => {
                    if (isGrammarUnlocked) setActiveRightTab('grammar');
                  }} 
                  style={{ 
                    flex: 1, padding: '16px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', 
                    cursor: isGrammarUnlocked ? 'pointer' : 'not-allowed', transition: 'all 0.2s', 
                    backgroundColor: activeRightTab === 'grammar' ? '#EEF2FF' : 'transparent', 
                    color: activeRightTab === 'grammar' ? '#4F46E5' : (isGrammarUnlocked ? '#64748B' : '#94A3B8'),
                    opacity: isGrammarUnlocked ? 1 : 0.6
                  }}
                  title={isGrammarUnlocked ? "Go to Grammar Lab" : "Finish Activities first to unlock!"}
                >
                  {isGrammarUnlocked ? '🔍 Grammar Lab' : '🔒 Grammar Lab'}
                </button>
              </div>

              {isReadingFinished && (
                <button 
                  className="mobile-only-btn" 
                  onClick={() => setIsTextModalOpen(true)} 
                  style={{ 
                    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 900,
                    width: '90%', maxWidth: '350px', padding: '18px', backgroundColor: '#4F46E5', color: '#ffffff', 
                    border: 'none', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)'
                  }}
                >
                  📖 Peek at Reading Text
                </button>
              )}

              <div>
                {renderBlocks(activeRightTab)}
              </div>

            </div>

          </div>
        )}
      </div>

      {isTextModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }} onClick={() => setIsTextModalOpen(false)}>
           <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '800px', height: '85vh', borderRadius: '32px 32px 0 0', padding: '40px 30px', overflowY: 'auto', position: 'relative', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsTextModalOpen(false)} style={{ position: 'sticky', top: '0', left: '100%', background: '#F1F5F9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', float: 'right', marginBottom: '20px' }}>✕</button>
              <h2 style={{ fontSize: '2rem', marginTop: 0, color: '#0F172A', paddingRight: '40px' }}>{lessonData.title}</h2>
              <div style={{ height: '4px', width: '40px', backgroundColor: '#4F46E5', borderRadius: '2px', marginBottom: '30px' }} />
              <div style={{ fontSize: '1.15rem', lineHeight: '2.2', color: '#334155' }}>
                 <TextHighlighter text={rawText} onSaveWord={toggleSaveWord} savedWords={savedWords} />
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 1024px) {
          .desktop-only-title { display: none !important; }
          .reading-container { padding: 30px !important; }
          .hide-reading-on-mobile { display: none !important; }
        }
        @media (min-width: 1025px) {
          .mobile-only-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}