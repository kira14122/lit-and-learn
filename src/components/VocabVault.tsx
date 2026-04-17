import React from 'react';

export const VocabVault = ({ savedWords, toggleSaveWord }: { savedWords: any[], toggleSaveWord: (word: string, info: any) => void }) => {
  if (!savedWords || savedWords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '32px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌟</div>
        <h3 style={{ fontSize: '2rem', fontWeight: '600', margin: '0 0 16px 0', color: '#0F172A', letterSpacing: '-0.5px' }}>Personal Vocabulary Vault</h3>
        <p style={{ margin: 0, fontSize: '1.2rem', color: '#64748B', lineHeight: '1.6' }}>
          Your vault is currently empty. Whenever you read a lesson or review, tap the star on any purple word to save it here for later study!
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '3rem', color: '#0F172A', fontWeight: '600', letterSpacing: '-1px', margin: '0 0 16px' }}>My Vault</h2>
        <p style={{ color: '#64748B', fontSize: '1.2rem' }}>You have {savedWords.length} words saved.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {savedWords.map((item, index) => (
          <div key={index} style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            {/* THE RED DELETE BUTTON */}
            <button 
              onClick={() => toggleSaveWord(item.word, null)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
              title="Remove from Vault"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#4F46E5', margin: '0 0 8px 0' }}>{item.word}</h3>
            
            <div style={{ marginBottom: '20px' }}>
              {item.pos && <span style={{ display: 'inline-block', background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginRight: '8px' }}>{item.pos}</span>}
              {item.level && <span style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{item.level}</span>}
            </div>

            <p style={{ color: '#334155', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>{item.def || "No definition available."}</p>
          </div>
        ))}
      </div>
    </div>
  );
};