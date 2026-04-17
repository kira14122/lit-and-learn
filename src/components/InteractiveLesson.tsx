import React, { useState } from 'react';
import WarmUpQuiz from './WarmUpQuiz';
import GrammarDiscovery from './GrammarDiscovery';
import TextHighlighter from './TextHighlighter'; // <--- BRINGING IN THE ENGINE!

export function InteractiveLesson({
  lessonData,
  onClose,
  savedWords,
  toggleSaveWord
}: any) {
  // We use the data passed from App.tsx instead of fetching it here!
  const readingBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'readingBlock');
  const warmUpBlock = lessonData?.lessonBlocks?.find((b: any) => b._type === 'warmUpBlock');

  const [showReading, setShowReading] = useState(!warmUpBlock);

  if (!lessonData) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>No lesson data found.</div>;
  }

  // Sanity blocks can sometimes be strings and sometimes be arrays. 
  // This safely extracts the text so our Highlighter can read it perfectly.
  let rawText = "";
  if (readingBlock) {
    if (typeof readingBlock.text === 'string') {
      rawText = readingBlock.text;
    } else if (Array.isArray(readingBlock.text)) {
      rawText = readingBlock.text.map((block: any) => block.children?.map((child: any) => child.text).join('') || '').join('\n\n');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* GLOBAL HEADER */}
      <header style={{ 
        height: '70px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontWeight: '900', fontSize: '1.5rem', color: '#0f172a' }}>
          Lit <span style={{ color: '#6366f1' }}>&</span> Learn
        </div>
        <div style={{ fontWeight: '600', color: '#475569' }}>{lessonData.title}</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {lessonData.level} • Unit {lessonData.unit}
          </div>
          {/* Added a close button so students can exit the lesson! */}
          <button 
            onClick={onClose} 
            style={{ background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            ✕ Close Lesson
          </button>
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        
        {!showReading ? (
          /* STAGE 1: THE HOOK (Centered Warm-Up) */
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px', minHeight: 'calc(100vh - 70px)' }}>
            {warmUpBlock && (
              <WarmUpQuiz block={warmUpBlock} onComplete={() => setShowReading(true)} />
            )}
          </div>
        ) : (
          /* STAGE 2: THE LAB (Split Screen) */
          <div style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            
            {/* LEFT: UNINTERRUPTED READING */}
            <div style={{ width: '55%', backgroundColor: 'white', padding: '60px 80px', overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#0f172a' }}>{lessonData.title}</h1>
              <div style={{ height: '4px', width: '60px', backgroundColor: '#6366f1', marginBottom: '40px' }}></div>
              
              {readingBlock && (
                <article style={{ fontSize: '1.35rem', lineHeight: '2', color: '#334155' }}>
                  
                  {/* --- THE MAGIC HAPPENS HERE --- */}
                  <TextHighlighter 
                    text={rawText} 
                    onSaveWord={toggleSaveWord} 
                    savedWords={savedWords} 
                  />
                  {/* ------------------------------- */}

                </article>
              )}
            </div>

            {/* RIGHT: INTERACTIVE WORKSPACE */}
            <div style={{ width: '45%', backgroundColor: '#f1f5f9', padding: '40px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {lessonData.lessonBlocks?.map((block: any, idx: number) => {
                  if (block._type === 'inductiveGrammarBlock') {
                    return <GrammarDiscovery key={idx} block={block} />;
                  }
                  return null;
                })}
              </div>

              {/* FOOTER ACTION */}
              <footer style={{ marginTop: '50px', padding: '30px 0', borderTop: '1px solid #cbd5e1', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Finished with this section?
                </p>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Back to Top
                </button>
              </footer>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}