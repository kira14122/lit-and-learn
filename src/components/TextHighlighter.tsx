import React, { useEffect, useState } from 'react';
import { client } from '../sanityClient';

export default function TextHighlighter({ 
  text, 
  onSaveWord, 
  savedWords = [] 
}: { 
  text: string, 
  onSaveWord: (word: string, info: any) => void, 
  savedWords?: any[] 
}) {
  const [dictionaryArray, setDictionaryArray] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  useEffect(() => {
    client.fetch(`*[_type == "dictionaryWord"]`).then(setDictionaryArray).catch(console.error);
  }, []);

  if (!text || typeof text !== 'string') return <>{text}</>;
  if (dictionaryArray.length === 0) return <>{text}</>;

  const dictWords = dictionaryArray.map(item => item.word || item.title || item.term).filter(Boolean);
  if (dictWords.length === 0) return <>{text}</>;

  const escapedWords = dictWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${escapedWords})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <div style={{ whiteSpace: 'pre-wrap' }} onClick={() => setActiveTooltip(null)}>
      
      {/* THE MOBILE RESPONSIVE STYLES */}
      <style>{`
        .vocab-tooltip {
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #0F172A;
          color: #ffffff;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
          width: 300px;
          z-index: 9999;
          cursor: default;
          white-space: normal;
          font-family: "Fredoka", sans-serif;
        }
        .vocab-triangle {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 10px;
          border-style: solid;
          border-color: #0F172A transparent transparent transparent;
        }

        /* On mobile, detach from the word and act like a bottom-sheet notification */
        @media (max-width: 768px) {
          .vocab-tooltip {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100vw - 40px);
            max-width: 400px;
            z-index: 999999;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.4);
          }
          .vocab-triangle {
            display: none; /* Hide the little pointer triangle on mobile */
          }
        }
      `}</style>

      {parts.map((part, i) => {
        const isMatch = dictionaryArray.find(w => (w.word || w.title || w.term)?.toLowerCase() === part.toLowerCase());
        
        if (isMatch) {
          const vocabWord = (isMatch.word || isMatch.title || isMatch.term).trim();
          const vocabDef = isMatch.definition || isMatch.description || isMatch.meaning;
          const vocabPos = isMatch.pos || isMatch.partOfSpeech;
          const vocabLevel = isMatch.level;

          const isSaved = savedWords.some(w => w?.word?.trim().toLowerCase() === vocabWord.toLowerCase());

          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <span 
                style={{ color: '#9333ea', fontWeight: 'bold', cursor: 'pointer', borderBottom: '2px solid #e9d5ff' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(activeTooltip === i ? null : i);
                }}
              >
                {part}
              </span>

              {activeTooltip === i && (
                <div className="vocab-tooltip" onClick={(e) => e.stopPropagation()}>
                  <div className="vocab-triangle" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', color: '#F8FAFC' }}>{vocabWord}</h4>
                      
                      {(vocabPos || vocabLevel) && (
                        <span style={{ display: 'inline-block', fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: '500' }}>
                          {vocabPos} {vocabPos && vocabLevel ? ' | ' : ''} {vocabLevel}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSaveWord(vocabWord, { def: vocabDef, pos: vocabPos, level: vocabLevel });
                      }}
                      style={{
                         all: 'unset',
                         cursor: 'pointer',
                         padding: '8px',
                         margin: '-8px',
                         display: 'inline-flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         backgroundColor: isSaved ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                         color: isSaved ? '#FCD34D' : '#64748B',
                         borderRadius: '50%',
                         transition: 'all 0.2s ease',
                         zIndex: 50
                      }}
                      title={isSaved ? "Remove from Vault" : "Save to Vault"}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isSaved ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ fontSize: '1.05rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                    {vocabDef || "No definition available."}
                  </div>
                </div>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}