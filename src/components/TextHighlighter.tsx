import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';

export default function TextHighlighter({ 
  text, 
  dictionary,
  onSaveWord, 
  savedWords = [] 
}: { 
  text: string, 
  dictionary?: Record<string, any>,
  onSaveWord: (word: string, info: any) => void, 
  savedWords?: any[] 
}) {
  const [dictionaryArray, setDictionaryArray] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  
  // State to hold dynamic container-aware positioning
  const [tooltipStyles, setTooltipStyles] = useState({ 
    left: '50%', 
    transform: 'translateX(-50%)', 
    bottom: '120%',
    top: 'auto',
    arrowLeft: '50%',
    arrowTop: '100%',
    arrowBorder: '#0F172A transparent transparent transparent'
  });

  useEffect(() => {
    if (!dictionary) {
      client.fetch(`*[_type == "dictionaryWord"]`).then(setDictionaryArray).catch(console.error);
    }
  }, [dictionary]);

  if (!text || typeof text !== 'string') return <>{text}</>;
  
  const dictWords = dictionary 
    ? Object.keys(dictionary) 
    : dictionaryArray.map(item => item.word || item.title || item.term).filter(Boolean);

  if (dictWords.length === 0) return <>{text}</>;

  const escapedWords = dictWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${escapedWords})\\b`, 'gi');
  const parts = text.split(regex);

  // UPGRADED: Container-Aware Edge Detection
  const handleWordClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (activeTooltip === index) {
      setActiveTooltip(null);
      return;
    }

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Find the nearest scrolling container (the modal) or fallback to the window document
    const container = target.closest('.responsive-card') || document.documentElement;
    const containerRect = container.getBoundingClientRect();

    let left = '50%';
    let transform = 'translateX(-50%)';
    let arrowLeft = '50%';
    
    let bottom = '120%';
    let top = 'auto';
    let arrowTop = '100%';
    let arrowBorder = '#0F172A transparent transparent transparent';

    // 1. Horizontal Detection (Is it hitting the left or right wall of the modal?)
    if (rect.left - containerRect.left < 160) {
      left = '0';
      transform = 'translateX(-10px)'; // Add a tiny 10px buffer from the wall
      arrowLeft = '20px';
    } else if (containerRect.right - rect.right < 160) {
      left = '100%';
      transform = 'translateX(calc(-100% + 10px))';
      arrowLeft = 'calc(100% - 20px)';
    }

    // 2. Vertical Detection (Is it hitting the top ceiling of the modal?)
    if (rect.top - containerRect.top < 180) {
      bottom = 'auto';
      top = '120%';
      arrowTop = '-20px'; // Shift arrow to point upwards
      arrowBorder = 'transparent transparent #0F172A transparent';
    }

    setTooltipStyles({ left, transform, bottom, top, arrowLeft, arrowTop, arrowBorder });
    setActiveTooltip(index);
  };

  return (
    <div style={{ whiteSpace: 'pre-wrap' }} onClick={() => setActiveTooltip(null)}>
      
      <style>{`
        .vocab-tooltip {
          position: absolute;
          background-color: #0F172A;
          color: #ffffff;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
          width: 320px;
          z-index: 9999;
          cursor: default;
          white-space: normal;
          font-family: "Fredoka", sans-serif;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .vocab-triangle {
          position: absolute;
          border-width: 10px;
          border-style: solid;
          transform: translateX(-50%);
        }

        /* MOBILE OVERRIDE: Forces the tooltip into a bottom sheet, ignoring all inline JS styles */
        @media (max-width: 768px) {
          .vocab-tooltip {
            position: fixed !important;
            bottom: 24px !important;
            top: auto !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100vw - 40px) !important;
            max-width: 400px !important;
            z-index: 999999 !important;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.4) !important;
          }
          .vocab-triangle {
            display: none !important;
          }
        }
      `}</style>

      {parts.map((part, i) => {
        let vocabWord = '';
        let vocabDef = '';
        let vocabPos = '';
        let vocabLevel = '';
        let isMatch = false;

        if (dictionary && dictionary[part.toLowerCase()]) {
          const info = dictionary[part.toLowerCase()];
          vocabWord = part;
          vocabDef = info.def;
          vocabPos = info.pos;
          vocabLevel = info.level;
          isMatch = true;
        } else if (!dictionary && dictionaryArray.length > 0) {
          const matchInfo = dictionaryArray.find(w => (w.word || w.title || w.term)?.toLowerCase() === part.toLowerCase());
          if (matchInfo) {
            vocabWord = (matchInfo.word || matchInfo.title || matchInfo.term).trim();
            vocabDef = matchInfo.definition || matchInfo.description || matchInfo.meaning;
            vocabPos = matchInfo.pos || matchInfo.partOfSpeech;
            vocabLevel = matchInfo.level;
            isMatch = true;
          }
        }
        
        if (isMatch) {
          const isSaved = savedWords.some(w => w?.word?.trim().toLowerCase() === vocabWord.toLowerCase());

          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <span 
                style={{ color: '#9333ea', fontWeight: 'bold', cursor: 'pointer', borderBottom: '2px solid #e9d5ff', transition: 'all 0.2s' }} 
                onClick={(e) => handleWordClick(e, i)}
              >
                {part}
              </span>

              {activeTooltip === i && (
                <div 
                  className="vocab-tooltip" 
                  style={{ 
                    left: tooltipStyles.left, 
                    transform: tooltipStyles.transform,
                    bottom: tooltipStyles.bottom,
                    top: tooltipStyles.top
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="vocab-triangle" 
                    style={{ 
                      left: tooltipStyles.arrowLeft,
                      top: tooltipStyles.arrowTop,
                      borderColor: tooltipStyles.arrowBorder
                    }} 
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', color: '#F8FAFC', textTransform: 'capitalize' }}>{vocabWord}</h4>
                      
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