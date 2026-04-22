import React, { useState, useEffect, useMemo } from 'react';
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

  // 🧠 THE SMART DICTIONARY MAP
  // This maps every single variation (e.g., "giving up") directly back to its root word ("give up")
  const lookupMap = useMemo(() => {
    const map = new Map<string, any>();

    if (dictionary) {
      Object.entries(dictionary).forEach(([key, info]) => {
        // Add the root word
        map.set(key.toLowerCase(), { rootWord: key, ...info });
        
        // Add all variations, pointing them to the root word's info
        if (info.variations && Array.isArray(info.variations)) {
          info.variations.forEach((v: string) => {
            if (v) map.set(v.trim().toLowerCase(), { rootWord: key, ...info });
          });
        }
      });
    } else if (dictionaryArray.length > 0) {
      dictionaryArray.forEach(item => {
        const root = item.word || item.title || item.term;
        if (!root) return;
        
        const info = { 
          rootWord: root, 
          def: item.definition || item.description || item.meaning, 
          pos: item.pos || item.partOfSpeech, 
          level: item.level, 
          example: item.example 
        };

        map.set(root.toLowerCase(), info);

        if (item.variations && Array.isArray(item.variations)) {
          item.variations.forEach((v: string) => {
            if (v) map.set(v.trim().toLowerCase(), info);
          });
        }
      });
    }
    return map;
  }, [dictionary, dictionaryArray]);

  if (!text || typeof text !== 'string') return <>{text}</>;
  if (lookupMap.size === 0) return <>{text}</>;

  // 🧠 THE PHRASAL VERB FIX
  // Sort all words by length (longest first) so "giving up" is highlighted before "give"
  const sortedTerms = Array.from(lookupMap.keys()).sort((a, b) => b.length - a.length);

  const escapedWords = sortedTerms.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${escapedWords})\\b`, 'gi');
  const parts = text.split(regex);

  const handleWordClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (activeTooltip === index) {
      setActiveTooltip(null);
      return;
    }

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const container = target.closest('.responsive-card') || document.documentElement;
    const containerRect = container.getBoundingClientRect();

    let left = '50%';
    let transform = 'translateX(-50%)';
    let arrowLeft = '50%';
    let bottom = '120%';
    let top = 'auto';
    let arrowTop = '100%';
    let arrowBorder = '#0F172A transparent transparent transparent';

    if (rect.left - containerRect.left < 160) {
      left = '0'; transform = 'translateX(-10px)'; arrowLeft = '20px';
    } else if (containerRect.right - rect.right < 160) {
      left = '100%'; transform = 'translateX(calc(-100% + 10px))'; arrowLeft = 'calc(100% - 20px)';
    }

    if (rect.top - containerRect.top < 180) {
      bottom = 'auto'; top = '120%'; arrowTop = '-20px'; arrowBorder = 'transparent transparent #0F172A transparent';
    }

    setTooltipStyles({ left, transform, bottom, top, arrowLeft, arrowTop, arrowBorder });
    setActiveTooltip(index);
  };

  return (
    <div style={{ whiteSpace: 'pre-wrap' }} onClick={() => setActiveTooltip(null)}>
      <style>{`
        .vocab-tooltip { position: absolute; background-color: #0F172A; color: #ffffff; padding: 20px; border-radius: 16px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); width: 320px; z-index: 9999; cursor: default; white-space: normal; font-family: "Fredoka", sans-serif; transition: opacity 0.2s ease, transform 0.2s ease; }
        .vocab-triangle { position: absolute; border-width: 10px; border-style: solid; transform: translateX(-50%); }
        @media (max-width: 768px) {
          .vocab-tooltip { position: fixed !important; bottom: 24px !important; top: auto !important; left: 50% !important; transform: translateX(-50%) !important; width: calc(100vw - 40px) !important; max-width: 400px !important; z-index: 999999 !important; box-shadow: 0 -10px 40px rgba(0,0,0,0.4) !important; }
          .vocab-triangle { display: none !important; }
        }
      `}</style>

      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        
        if (lookupMap.has(lowerPart)) {
          const info = lookupMap.get(lowerPart);
          const rootWord = info.rootWord; // E.g., "give up" (even if they clicked "giving up")
          const isSaved = savedWords.some(w => w?.word?.trim().toLowerCase() === rootWord.toLowerCase());

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
                  style={{ left: tooltipStyles.left, transform: tooltipStyles.transform, bottom: tooltipStyles.bottom, top: tooltipStyles.top }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="vocab-triangle" style={{ left: tooltipStyles.arrowLeft, top: tooltipStyles.arrowTop, borderColor: tooltipStyles.arrowBorder }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', color: '#F8FAFC', textTransform: 'capitalize' }}>
                        {rootWord} 
                      </h4>
                      
                      {(info.pos || info.level) && (
                        <span style={{ display: 'inline-block', fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: '500' }}>
                          {info.pos} {info.pos && info.level ? ' | ' : ''} {info.level}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSaveWord(rootWord, { def: info.def, pos: info.pos, level: info.level, example: info.example }); 
                      }}
                      style={{
                         all: 'unset', cursor: 'pointer', padding: '8px', margin: '-8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                         backgroundColor: isSaved ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                         color: isSaved ? '#FCD34D' : '#64748B', borderRadius: '50%', transition: 'all 0.2s ease', zIndex: 50
                      }}
                      title={isSaved ? "Remove from Vault" : "Save to Vault"}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isSaved ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ fontSize: '1.05rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                    {info.def || "No definition available."}
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