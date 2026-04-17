import React, { useState } from 'react';
import WarmUpQuiz from './WarmUpQuiz';
import GrammarDiscovery from './GrammarDiscovery';
import TextHighlighter from './TextHighlighter';
import ComprehensionBlock from './ComprehensionBlock';
import VocabBlock from './VocabBlock';
import PronunciationBlock from './PronunciationBlock';

export function InteractiveLesson({ lessonData, onClose, savedWords, toggleSaveWord }: any) {
  const readingBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'readingBlock');
  const warmUpBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'warmUpBlock');

  const [showReading, setShowReading] = useState(!warmUpBlock);
  const [isReadingFinished, setIsReadingFinished] = useState(false); 
  
  // Mobile uses 3 tabs to control the whole screen
  const [activeMobileTab, setActiveMobileTab] = useState<'reading' | 'activities' | 'grammar'>('reading');
  // Desktop uses this to toggle the right-hand panel
  const [activeRightTab, setActiveRightTab] = useState<'activities' | 'grammar'>('activities');

  if (!lessonData) return <div style={{ padding: '50px', textAlign: 'center' }}>No lesson data found.</div>;

  let rawText = "";
  if (readingBlock) {
    if (typeof readingBlock.content === 'string') rawText = readingBlock.content;
    else if (Array.isArray(readingBlock.content)) {
      rawText = readingBlock.content.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n');
    }
  }

  const handleFinishReading = () => {
    setIsReadingFinished(true);
    setActiveMobileTab('activities');
    setActiveRightTab('activities');
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // Helper function to render the correct blocks based on the active tab
  const renderBlocks = (type: 'activities' | 'grammar') => {
    const targetTypes = type === 'grammar' 
      ? ['inductiveGrammarBlock', 'grammarBlock'] 
      : ['comprehensionBlock', 'vocabBlock', 'pronunciationBlock'];

    const blocks = lessonData.lessonBlocks?.filter((b: any) => targetTypes.includes(b._type)) || [];

    if (blocks.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No {type} added to this lesson yet.</p>
        </div>
      );
    }

    return blocks.map((block: any, idx: number) => {
      if (block._type === 'inductiveGrammarBlock') return <GrammarDiscovery key={idx} block={block} />;
      // Placeholders for the components we will build next!
      if (block._type === 'comprehensionBlock') return <ComprehensionBlock key={idx} block={block} />;
      if (block._type === 'vocabBlock') return <VocabBlock key={idx} block={block} />;
      if (block._type === 'pronunciationBlock') return <PronunciationBlock key={idx} block={block} />;
      return null;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', paddingBottom: isReadingFinished ? '70px' : '0' }}>
      
      <style>{`
        .lesson-header { height: 70px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; background-color: white; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
        .header-title-group { display: flex; align-items: center; gap: 20px; }
        .lesson-workspace { display: flex; height: calc(100vh - 70px); overflow: hidden; }
        .panel-left { width: 55%; background-color: white; padding: 60px 80px; overflow-y: auto; border-right: 1px solid #e2e8f0; }
        .panel-right { width: 45%; background-color: #f1f5f9; padding: 40px; overflow-y: auto; }
        
        .mobile-only { display: none !important; }

        @media (max-width: 900px) {
          .lesson-header { height: auto; flex-direction: column; padding: 15px 20px; gap: 15px; text-align: center; }
          .header-title-group { flex-direction: column; gap: 10px; }
          .lesson-workspace { flex-direction: column; height: auto; overflow: visible; }
          
          .panel-left { width: 100%; padding: 30px 20px; border-right: none; overflow-y: visible; }
          .panel-right { width: 100%; padding: 30px 20px; overflow-y: visible; }
          
          .mobile-only { display: flex !important; }
          .hide-on-mobile { display: none !important; }
          .hide-on-mobile-flex { display: none !important; }

          /* THE 3-PILLAR BOTTOM BAR */
          .bottom-nav-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 70px;
            background-color: white;
            border-top: 1px solid #e2e8f0;
            display: flex;
            z-index: 1000;
            box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
          }
          
          .nav-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 4px;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: color 0.2s;
          }
          
          .nav-tab.active {
            color: #4F46E5;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="lesson-header">
        <div style={{ fontWeight: '900', fontSize: '1.5rem', color: '#0f172a' }}>Lit <span style={{ color: '#6366f1' }}>&</span> Learn</div>
        <div style={{ fontWeight: '600', color: '#475569', textAlign: 'center' }}>{lessonData.title}</div>
        <div className="header-title-group">
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{lessonData.level} • Unit {lessonData.unit}</div>
          <button onClick={onClose} style={{ background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer' }}>✕ Close</button>
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        {!showReading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px', minHeight: 'calc(100vh - 70px)' }}>
            {warmUpBlock && <WarmUpQuiz block={warmUpBlock} onComplete={() => setShowReading(true)} />}
          </div>
        ) : (
          <div className="lesson-workspace">
            
            {/* LEFT PANEL: READING TEXT */}
            <div className={`panel-left ${activeMobileTab !== 'reading' ? 'hide-on-mobile' : ''}`}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#0f172a' }}>{lessonData.title}</h1>
              <div style={{ height: '4px', width: '60px', backgroundColor: '#6366f1', marginBottom: '40px' }}></div>
              
              {readingBlock && (
                <article style={{ fontSize: '1.35rem', lineHeight: '2', color: '#334155' }}>
                  <TextHighlighter text={rawText} onSaveWord={toggleSaveWord} savedWords={savedWords} />
                </article>
              )}

              {/* MOBILE ONLY: The "Finished Reading" button */}
              {!isReadingFinished && (
                <div className="mobile-only" style={{ marginTop: '40px', justifyContent: 'center', width: '100%' }}>
                  <button 
                    onClick={handleFinishReading}
                    style={{ width: '100%', padding: '18px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  >
                    I have finished reading ✓
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: INTERACTIVE WORKSPACE */}
            <div className={`panel-right ${activeMobileTab === 'reading' ? 'hide-on-mobile' : ''}`}>
              {!isReadingFinished ? (
                /* DESKTOP FOCUS MODE (Phase 2) */
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#EEF2FF', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', color: '#4F46E5' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  </div>
                  <h3 style={{ fontSize: '1.8rem', color: '#0F172A', marginBottom: '16px' }}>Focus Mode Active</h3>
                  <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '400px', marginBottom: '40px', lineHeight: '1.6' }}>
                    Read the text carefully. Use your highlighter tool to save any words you don't know.
                  </p>
                  <button 
                    onClick={handleFinishReading}
                    style={{ padding: '16px 32px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(16,185,129,0.4)', transition: 'transform 0.2s' }}
                  >
                    I have finished reading ✓
                  </button>
                </div>
              ) : (
                /* DESKTOP / TABLET TOGGLE BAR (Phase 3) */
                <div>
                  {/* This Segmented Control hides on mobile, where the bottom bar takes over */}
                  <div className="hide-on-mobile-flex" style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: '6px', borderRadius: '16px', marginBottom: '30px' }}>
                    <button
                      onClick={() => { setActiveRightTab('activities'); setActiveMobileTab('activities'); }}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeRightTab === 'activities' ? 'white' : 'transparent', color: activeRightTab === 'activities' ? '#0F172A' : '#64748B', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: activeRightTab === 'activities' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      📝 Activities
                    </button>
                    <button
                      onClick={() => { setActiveRightTab('grammar'); setActiveMobileTab('grammar'); }}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeRightTab === 'grammar' ? 'white' : 'transparent', color: activeRightTab === 'grammar' ? '#0F172A' : '#64748B', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: activeRightTab === 'grammar' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      🧠 Grammar Lab
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {renderBlocks(activeRightTab)}
                  </div>

                  <footer style={{ marginTop: '50px', padding: '30px 0', borderTop: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Finished with this section?</p>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Back to Top</button>
                  </footer>
                </div>
              )}
            </div>

            {/* THE NEW NATIVE-FEELING 3-PILLAR BOTTOM TAB BAR (Mobile Only) */}
            {isReadingFinished && (
              <div className="mobile-only bottom-nav-bar">
                <button 
                  className={`nav-tab ${activeMobileTab === 'reading' ? 'active' : ''}`}
                  onClick={() => { setActiveMobileTab('reading'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  Text
                </button>
                
                <button 
                  className={`nav-tab ${activeMobileTab === 'activities' ? 'active' : ''}`}
                  onClick={() => { setActiveMobileTab('activities'); setActiveRightTab('activities'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  Activities
                </button>

                <button 
                  className={`nav-tab ${activeMobileTab === 'grammar' ? 'active' : ''}`}
                  onClick={() => { setActiveMobileTab('grammar'); setActiveRightTab('grammar'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                  Grammar
                </button>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}