import React, { useState, useRef } from 'react';

export default function PronunciationBlock({ block }: { block: any }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!block || !block.pronunciationWords || block.pronunciationWords.length === 0) return null;

  // Helper to extract Sanity file URL if it exists
  const getAudioUrl = (audioField: any) => {
    if (audioField?.asset?.url) return audioField.asset.url;
    if (typeof audioField === 'string') return audioField; // In case it's just a raw URL string
    return null;
  };

  // The brilliant fallback: Web Speech API for testing without MP3s!
  const speakText = (text: string, accent: 'en-US' | 'en-GB', id: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop anything currently playing
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent;
      utterance.rate = 0.85; // Slightly slower for language learners
      
      utterance.onstart = () => setPlayingId(id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlay = (word: string, audioField: any, accent: 'en-US' | 'en-GB', id: string) => {
    const audioUrl = getAudioUrl(audioField);
    
    if (audioUrl) {
      // Play the real MP3 file
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setPlayingId(id);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        // If the MP3 fails to load, fall back to the robot voice
        speakText(word, accent, id);
      };
      
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      // No MP3 uploaded? Use the built-in browser voice!
      speakText(word, accent, id);
    }
  };

  return (
    <div className="soft-card" style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', marginBottom: '30px' }}>
      
      {/* HEADER (Matching the Lit & Learn Indigo Theme) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '20px' }}>
        <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '16px', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: '600', margin: 0 }}>
          {block.title || "Pronunciation Clinic"}
        </h2>
      </div>

      {block.instruction && (
        <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '40px', lineHeight: '1.6' }}>
          {block.instruction}
        </p>
      )}

      {/* THE WORDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {block.pronunciationWords.map((item: any, i: number) => (
          <div key={i} style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            
            {/* Word & Definition */}
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', color: '#0F172A', fontWeight: '700' }}>
                {item.word}
              </h3>
              {item.definition && (
                <p style={{ margin: 0, fontSize: '1rem', color: '#64748B', lineHeight: '1.5' }}>
                  {item.definition}
                </p>
              )}
            </div>

            <div style={{ height: '1px', backgroundColor: '#E2E8F0', width: '100%', margin: '8px 0' }}></div>

            {/* Audio Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* AMERICAN ENGLISH ROW */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' }}>🇺🇸 American</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#4F46E5', fontWeight: '500' }}>
                    {item.ipaAmerican || '/IPA/'}
                  </span>
                </div>
                <button 
                  onClick={() => handlePlay(item.word, item.audioAmerican, 'en-US', `us-${i}`)}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: playingId === `us-${i}` ? '#4F46E5' : '#EEF2FF', color: playingId === `us-${i}` ? 'white' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {playingId === `us-${i}` ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  )}
                </button>
              </div>

              {/* BRITISH ENGLISH ROW */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' }}>🇬🇧 British</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#E11D48', fontWeight: '500' }}>
                    {item.ipaBritish || '/IPA/'}
                  </span>
                </div>
                <button 
                  onClick={() => handlePlay(item.word, item.audioBritish, 'en-GB', `uk-${i}`)}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: playingId === `uk-${i}` ? '#E11D48' : '#FFF1F2', color: playingId === `uk-${i}` ? 'white' : '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {playingId === `uk-${i}` ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  )}
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}