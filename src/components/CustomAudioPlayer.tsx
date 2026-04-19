import React, { useState, useRef, useEffect } from 'react';

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

export const CustomAudioPlayer = ({ src, title = "Listen to Audio" }: { src: string, title?: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress(duration ? (current / duration) * 100 : 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTo = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTo;
      setProgress(Number(e.target.value));
    }
  };

  const cycleSpeed = () => {
    if (audioRef.current) {
      // Cycles through speeds: Normal -> Slow -> Very Slow -> Normal
      const nextSpeed = speed === 1 ? 0.75 : speed === 0.75 ? 0.5 : 1;
      audioRef.current.playbackRate = nextSpeed;
      setSpeed(nextSpeed);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '2px solid #E2E8F0', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', width: '100%', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.02)' }}>
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={() => setIsPlaying(false)} 
      />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay} 
        style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#4F46E5', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)', transition: 'transform 0.1s' }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      
      {/* Scrub Bar & Title */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
         <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
           {title}
         </span>
         <input 
           type="range" 
           min="0" 
           max="100" 
           value={progress} 
           onChange={handleSeek} 
           style={{ width: '100%', cursor: 'pointer', accentColor: '#4F46E5', height: '6px' }} 
         />
      </div>

      {/* Scaffolding Speed Toggle */}
      <button 
        onClick={cycleSpeed} 
        style={{ background: speed === 1 ? '#F1F5F9' : '#EEF2FF', color: speed === 1 ? '#64748B' : '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', minWidth: '70px' }}
        title="Adjust playback speed"
      >
        {speed}x
      </button>
    </div>
  );
};