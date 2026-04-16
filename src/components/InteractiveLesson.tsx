import { useEffect, useState } from 'react';
import { client } from '../sanityClient';
import WarmUpQuiz from './WarmUpQuiz';
import GrammarDiscovery from './GrammarDiscovery';

export function InteractiveLesson() {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReading, setShowReading] = useState(false);

  useEffect(() => {
    // Fetches the first lesson found in Sanity
    client
      .fetch(`*[_type == "interactiveLesson"][0]`)
      .then((data) => {
        setLesson(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Preparing your Language Lab...</p>
      </div>
    );
  }

  if (!lesson) return <div style={{ padding: '50px' }}>No lesson data found. Check Sanity Studio!</div>;

  // Extract blocks for easier access
  const readingBlock = lesson.lessonBlocks?.find((b: any) => b._type === 'readingBlock');
  const warmUpBlock = lesson.lessonBlocks?.find((b: any) => b._type === 'warmUpBlock');

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
        <div style={{ fontWeight: '600', color: '#475569' }}>{lesson.title}</div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {lesson.level} • Unit {lesson.unit}
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        
        {!showReading ? (
          /* STAGE 1: THE HOOK (Centered Warm-Up) */
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '60px 20px',
            minHeight: 'calc(100vh - 70px)'
          }}>
            {warmUpBlock && (
              <WarmUpQuiz 
                block={warmUpBlock} 
                onComplete={() => setShowReading(true)} 
              />
            )}
          </div>
        ) : (
          /* STAGE 2: THE LAB (Split Screen) */
          <div style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            
            {/* LEFT: UNINTERRUPTED READING */}
            <div style={{ 
              width: '55%', 
              backgroundColor: 'white', 
              padding: '60px 80px', 
              overflowY: 'auto',
              borderRight: '1px solid #e2e8f0'
            }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#0f172a' }}>{lesson.title}</h1>
              <div style={{ height: '4px', width: '60px', backgroundColor: '#6366f1', marginBottom: '40px' }}></div>
              
              {readingBlock && (
                <article style={{ fontSize: '1.35rem', lineHeight: '2', color: '#334155' }}>
                  {/* We use whiteSpace pre-wrap to respect paragraphs from Sanity */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{readingBlock.text}</div>
                </article>
              )}
            </div>

            {/* RIGHT: INTERACTIVE WORKSPACE */}
            <div style={{ width: '45%', backgroundColor: '#f1f5f9', padding: '40px', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {lesson.lessonBlocks?.map((block: any, idx: number) => {
                  // We only render the Inductive Grammar blocks here now. 
                  // The Warm-Up has already served its purpose!
                  if (block._type === 'inductiveGrammarBlock') {
                    return <GrammarDiscovery key={idx} block={block} />;
                  }
                  
                  // You can add Vocab blocks or other interactive blocks here later
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