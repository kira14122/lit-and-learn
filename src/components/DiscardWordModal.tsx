import React from 'react';

// Functional specification for a professional modal architect
interface DiscardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  wordToDiscard: string;
}

export function DiscardWordModal({ isOpen, onClose, onConfirm, wordToDiscard }: DiscardModalProps) {
  // If the state says 'closed', do not draw anything
  if (!isOpen) return null;

  return (
    // Background overlay for focus and backdrop blur
    <div 
      onClick={onClose} // Clicking the background also closes it (safe design)
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* The centered Modal Card */}
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent clicking the card from closing it
        style={{
          width: '90%', maxWidth: '420px', backgroundColor: '#ffffff',
          borderRadius: '32px', padding: '40px', textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(15,23,42,0.15)',
          border: '1px solid #E2E8F0', animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Warning Icon/Iconography */}
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>⚠️</div>
        
        {/* Clear Title with bold product terminology */}
        <h2 style={{ fontSize: '2rem', color: '#0F172A', margin: '0 0 16px 0', lineHeight: '1.2', fontWeight: 'bold' }}>
          Discard Word?
        </h2>
        
        {/* Explanatory text with consistent product voice */}
        <p style={{ fontSize: '1.15rem', color: '#64748B', lineHeight: '1.6', margin: '0 0 40px 0' }}>
          Are you sure you want to discard "<strong style={{ color: '#0F172A' }}>{wordToDiscard}</strong>"? This action will erase your entire mastery history for this word.
        </p>

        {/* The Action Buttons (Now integrated) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
          
          <button 
            onClick={onClose} 
            style={{ padding: '16px 32px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
          >
            Cancel
          </button>
          
          <button 
            onClick={onConfirm} 
            style={{ padding: '16px 32px', backgroundColor: '#EF4444', color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', outline: 'none', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.2)' }}
          >
            Discard Word
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}