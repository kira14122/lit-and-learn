import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import WarmUpQuiz from './WarmUpQuiz';
import GrammarDiscovery from './GrammarDiscovery';
import GrammarPracticeBlock from './GrammarPracticeBlock';
import TextHighlighter from './TextHighlighter';
import ComprehensionBlock from './ComprehensionBlock';
import VocabBlock from './VocabBlock';
import PronunciationBlock from './PronunciationBlock';
import { CustomAudioPlayer } from './CustomAudioPlayer';

// --- PREMIUM SVGs ---
const IconBrain = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>);
const IconAward = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>);
const IconBook = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconLock = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconSearch = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);

export function InteractiveLesson({ lessonData, onClose, savedWords, toggleSaveWord, onComplete, dictionary }: any) {
  const warmUpBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'warmUpBlock');
  const readingBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'readingBlock');
  const lessonId = lessonData?._id || 'default';

  // 1. STATE (Upgraded with Lesson-Specific Memory)
  const [showReading, setShowReading] = useState(() => {
    const saved = localStorage.getItem(`ll_showReading_${lessonId}`);
    return saved !== null ? saved === 'true' : !warmUpBlock;
  });
  
  const [isReadingFinished, setIsReadingFinished] = useState(() => {
    return localStorage.getItem(`ll_readFin_${lessonId}`) === 'true';
  });
  
  const [isGrammarUnlocked, setIsGrammarUnlocked] = useState(() => {
    return localStorage.getItem(`ll_gramUnl_${lessonId}`) === 'true';
  });
  
  const [activeRightTab, setActiveRightTab] = useState<'activities' | 'grammar'>(() => {
    return (localStorage.getItem(`ll_rTab_${lessonId}`) as 'activities' | 'grammar') || 'activities';
  });
  
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);

  const activitiesRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // --- SYNCHRONIZE MEMORY WHENEVER STATE CHANGES ---
  useEffect(() => {
    localStorage.setItem(`ll_showReading_${lessonId}`, String(showReading));
    localStorage.setItem(`ll_readFin_${lessonId}`, String(isReadingFinished));
    localStorage.setItem(`ll_gramUnl_${lessonId}`, String(isGrammarUnlocked));
    localStorage.setItem(`ll_rTab_${lessonId}`, activeRightTab);
  }, [showReading, isReadingFinished, isGrammarUnlocked, activeRightTab, lessonId]);

  // 2. MEMOIZATION: Only calculate the text once!
  const rawText = useMemo(() => {
    if (!readingBlock) return "";
    if (typeof readingBlock.content === 'string') return readingBlock.content;
    if (Array.isArray(readingBlock.content)) {
      return readingBlock.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n');
    }
    return "";
  }, [readingBlock]);

  // 3. MEMOIZATION: Pre-sort blocks so we don't do it on every render
  const { activityBlocks, grammarBlocks } = useMemo(() => {
    const activities = lessonData?.lessonBlocks?.filter((b: any) => ['comprehensionBlock', 'vocabBlock', 'pronunciationBlock'].includes(b._type)) || [];
    const grammar = lessonData?.lessonBlocks?.filter((b: any) => ['grammarBlock', 'inductiveGrammarBlock', 'grammarPracticeBlock'].includes(b._type)) || [];
    return { activityBlocks: activities, grammarBlocks: grammar };
  }, [lessonData]);

  // 4. HANDLERS
  const handleStartReading = useCallback(() => {
    setShowReading(true);
    document.getElementById('interactive-lesson-container')?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const handleFinishReading = useCallback(() => {
    setIsReadingFinished(true);
    setActiveRightTab('activities');
    setTimeout(() => { activitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }, []);

  const handleUnlockGrammar = useCallback(() => {
    setIsGrammarUnlocked(true);
    setActiveRightTab('grammar');
    setTimeout(() => { rightColumnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }, []);

  if (!lessonData) return <div style={{ padding: '50px', textAlign: 'center' }}>No lesson data found.</div>;

  // Helper to render the specific blocks
  const renderBlocks = (blocks: any[], isGrammar: boolean) => {
    if (blocks.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '2px dashed #CBD5E1', color: '#94A3B8' }}>
          No {isGrammar ? 'grammar modules' : 'activities'} have been added to this lesson yet.
        </div>
      );
    }

    return (
      <div>
        {blocks.map((block: any, idx: number) => {
          const isLastBlock = idx === blocks.length - 1;
          return (
            <React.Fragment key={block._key || idx}>
              {block._type === 'comprehensionBlock' && <ComprehensionBlock block={block} />}
              {block._type === 'vocabBlock' && <VocabBlock block={block} />}
              {block._type === 'pronunciationBlock' && <PronunciationBlock block={block} />}
              {(block._type === 'grammarBlock' || block._type === 'inductiveGrammarBlock') && <GrammarDiscovery block={block} />}
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

        {!isGrammar && !isGrammarUnlocked && blocks.length > 0 && (
          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px dashed #E2E8F0', paddingTop: '40px', paddingBottom: '20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><IconBrain /></div>
            <h3 style={{ color: '#0F172A', fontSize: '1.6rem', marginBottom: '8px' }}>Activities Completed?</h3>
            <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '30px' }}>Once you truly understand the meaning of the text, you are ready to analyze its form.</p>
            <button onClick={handleUnlockGrammar} style={{ padding: '18px 40px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Unlock Grammar Lab
            </button>
          </div>
        )}

        {isGrammar && blocks.length > 0 && (
          <div style={{ marginTop: '50px', textAlign: 'center', borderTop: '2px dashed #E2E8F0', paddingTop: '40px', paddingBottom: '20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><IconAward /></div>
            <h3 style={{ color: '#0F172A', fontSize: '1.8rem', marginBottom: '8px' }}>Lesson Complete!</h3>
            <p style={{ color: '#64748B', fontSize: '1.15rem', marginBottom: '30px' }}>You have mastered the meaning and the form. Ready for the next challenge?</p>
            <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={{ padding: '18px 40px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }}>
              Proceed to Next Lesson ➡️
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="interactive-lesson-container" style={{ backgroundColor: '#F3F6F8', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      
      {/* Header (Unchanged) */}
      <div className="lesson-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 1000 }}>
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

      <div className="lesson-wrapper" style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px 20px 120px 20px' }}>
        
        {!showReading && warmUpBlock ? (
          <WarmUpQuiz block={warmUpBlock} onComplete={handleStartReading} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
            
            {/* Reading Pane */}
            <div className={`responsive-card reading-container ${isReadingFinished ? 'hide-reading-on-mobile' : ''}`} style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '50px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)' }}>
              <h1 style={{ fontSize: '2.5rem', color: '#0F172A', marginBottom: '16px', lineHeight: '1.2' }}>{lessonData.title}</h1>
              <div style={{ height: '4px', width: '60px', backgroundColor: '#4F46E5', borderRadius: '2px', marginBottom: '40px' }} />
              
              {readingBlock?.audioUrl && (
                <div style={{ marginBottom: '32px' }}>
                   <CustomAudioPlayer src={readingBlock.audioUrl} title="Listen to the Passage" />
                </div>
              )}

              <div style={{ fontSize: '1.25rem', lineHeight: '2.2', color: '#334155' }}>
                <TextHighlighter text={rawText} dictionary={dictionary} onSaveWord={toggleSaveWord} savedWords={savedWords} />
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

            {/* Activities Pane - CONDITIONAL RENDER INSTEAD OF DISPLAY:NONE */}
            {isReadingFinished && (
              <div ref={activitiesRef} style={{ scrollMarginTop: '100px' }}>
                
                <div ref={rightColumnRef} style={{ display: 'flex', gap: '12px', marginBottom: '20px', backgroundColor: '#ffffff', padding: '10px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', scrollMarginTop: '100px' }}>
                  <button onClick={() => setActiveRightTab('activities')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeRightTab === 'activities' ? '#EEF2FF' : 'transparent', color: activeRightTab === 'activities' ? '#4F46E5' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Activities
                  </button>
                  <button onClick={() => { if (isGrammarUnlocked) setActiveRightTab('grammar'); }} title={isGrammarUnlocked ? "Go to Grammar Lab" : "Finish Activities first to unlock!"} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: isGrammarUnlocked ? 'pointer' : 'not-allowed', transition: 'all 0.2s', backgroundColor: activeRightTab === 'grammar' ? '#EEF2FF' : 'transparent', color: activeRightTab === 'grammar' ? '#4F46E5' : (isGrammarUnlocked ? '#64748B' : '#94A3B8'), opacity: isGrammarUnlocked ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isGrammarUnlocked ? <IconSearch /> : <IconLock />} Grammar Lab
                  </button>
                </div>

                <button className="mobile-only-btn" onClick={() => setIsTextModalOpen(true)} style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 900, width: '90%', maxWidth: '350px', padding: '18px', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)' }}>
                  <IconBook /> Peek at Reading Text
                </button>

                <div>
                  {activeRightTab === 'activities' ? renderBlocks(activityBlocks, false) : renderBlocks(grammarBlocks, true)}
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* Modal (Unchanged) */}
      {isTextModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }} onClick={() => setIsTextModalOpen(false)}>
           <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '800px', height: '85vh', borderRadius: '32px 32px 0 0', padding: '40px 30px', overflowY: 'auto', position: 'relative', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsTextModalOpen(false)} style={{ position: 'sticky', top: '0', left: '100%', background: '#F1F5F9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', float: 'right', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <h2 style={{ fontSize: '2rem', marginTop: 0, color: '#0F172A', paddingRight: '40px' }}>{lessonData.title}</h2>
              <div style={{ height: '4px', width: '40px', backgroundColor: '#4F46E5', borderRadius: '2px', marginBottom: '30px' }} />
              {readingBlock?.audioUrl && (
                <div style={{ marginBottom: '24px' }}><CustomAudioPlayer src={readingBlock.audioUrl} title="Listen to the Passage" /></div>
              )}
              <div style={{ fontSize: '1.15rem', lineHeight: '2.2', color: '#334155' }}>
                 <TextHighlighter text={rawText} dictionary={dictionary} onSaveWord={toggleSaveWord} savedWords={savedWords} />
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
        @media (min-width: 1025px) { .mobile-only-btn { display: none !important; } }
        @media (max-width: 768px) {
          .lesson-wrapper { padding: 20px 16px 120px 16px !important; }
          .lesson-header { padding: 16px !important; }
          .reading-container { padding: 24px !important; border-radius: 24px !important; }
        }
      `}</style>
    </div>
  );
}