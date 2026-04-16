import React, { useState, useRef, useEffect } from 'react';

// 1. The Star Icon
export const IconStar = (a: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? "#F59E0B" : "none"} stroke={a ? "#F59E0B" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// 2. The Smart Word (Now with Edge-Detection!)
export const SmartWord = ({ word, dictInfo, onSave, isSaved }: { word: string, dictInfo: any, onSave: any, isSaved: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // EDGE DETECTION LOGIC: Prevents tooltip from clipping off the screen
  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      // Reset position first
      tooltipRef.current.style.left = '50%';
      tooltipRef.current.style.right = 'auto';
      tooltipRef.current.style.transform = 'translateX(-50%)';
      
      const rect = tooltipRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768; // Mobile handles itself via CSS fixed position

      if (!isMobile) {
        if (rect.left < 20) {
          // If too close to the left edge, flush it left
          tooltipRef.current.style.left = '0';
          tooltipRef.current.style.transform = 'translateX(0)';
        } else if (rect.right > window.innerWidth - 20) {
          // If too close to the right edge, flush it right
          tooltipRef.current.style.left = 'auto';
          tooltipRef.current.style.right = '0';
          tooltipRef.current.style.transform = 'translateX(0)';
        }
      }
    }
  }, [isOpen]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} style={{ color: '#4F46E5', fontWeight: '600', borderBottom: '2px dashed #A5B4FC', cursor: 'pointer', backgroundColor: isOpen ? '#EEF2FF' : 'transparent', padding: '2px 4px', borderRadius: '6px' }}>{word}</span>
      {isOpen && (
        <div ref={tooltipRef} className="dict-tooltip">
          <div className="dict-arrow" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#818CF8' }}>{word.toLowerCase()}</span>
            <button onClick={(e) => { e.stopPropagation(); onSave(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', padding: 0 }}>{IconStar(isSaved)}</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
             <span style={{ fontSize: '0.75rem', background: '#334155', padding: '4px 10px', borderRadius: '9999px', fontWeight: '700' }}>{dictInfo.level}</span>
             <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', paddingTop: '4px' }}>{dictInfo.pos}</span>
          </div>
          <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#F8FAFC', whiteSpace: 'normal', wordBreak: 'break-word' }}>{dictInfo.def}</div>
        </div>
      )}
    </span>
  );
}

// 3. The Text Parser (Now carries its own CSS backpack!)
export const SmartText = ({ text, dictionary, savedWords, onSaveWord }: { text: string, dictionary: Record<string, any>, savedWords: any[], onSaveWord: any }) => {
  const dictKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedKeys = dictKeys.map(escapeRegExp);
  const regexPattern = escapedKeys.length > 0 ? new RegExp(`(\\b(?:${escapedKeys.join('|')})\\b)`, 'gi') : null;
  const paragraphs = text.split(/\n+/);

  return (
    <>
      {/* CSS injected directly so it NEVER gets lost again */}
      <style>{`
        .dict-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background-color: #0F172A;
          color: #ffffff;
          padding: 24px;
          border-radius: 24px;
          width: max-content;
          max-width: 320px;
          min-width: 250px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          z-index: 99999;
          text-align: left;
        }
        .dict-arrow {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid #0F172A;
        }
        @media (max-width: 768px) {
          .dict-tooltip {
            position: fixed !important;
            bottom: 24px !important;
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            width: calc(100vw - 32px) !important;
            max-width: 450px !important;
            box-shadow: 0 0 50px rgba(0,0,0,0.5) !important;
          }
          .dict-arrow { display: none !important; }
        }
      `}</style>
      
      {paragraphs.map((paragraph, pIndex) => {
        const parts = regexPattern ? paragraph.split(regexPattern) : [paragraph];
        return (
          <p key={pIndex} style={{ marginBottom: '1.5em', marginTop: 0 }}>
            {parts.map((part, i) => {
              const lowerPart = part.toLowerCase();
              if (dictionary[lowerPart]) {
                return <SmartWord key={i} word={part} dictInfo={dictionary[lowerPart]} isSaved={savedWords.some(w => w.word.toLowerCase() === lowerPart)} onSave={() => onSaveWord(part, dictionary[lowerPart])} />;
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
};