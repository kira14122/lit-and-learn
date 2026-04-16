import React from 'react';
import { IconStar } from './SmartReader'; // We reuse the star icon from the reader!

export const VocabVault = ({ savedWords, toggleSaveWord }: { savedWords: any[], toggleSaveWord: any }) => {
  // We bring the specific styles the vault needs here so it is fully self-contained
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 400px))', justifyContent: 'center', gap: '40px' };
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column' as const };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', color: '#0F172A', fontWeight: '600' }}>Personal Vocabulary Vault</h2>
      {savedWords.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '1.2rem' }}>Your vault is empty. Tap the ⭐ on any word in a lesson to save it here!</p>
      ) : (
        <div style={gridStyle}>{savedWords.map((wordObj, i) => (
          <div key={i} className="soft-card" style={{ ...cardStyle, padding: '30px', borderTop: '6px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#4F46E5' }}>{wordObj.word}</h3>
              <button onClick={() => toggleSaveWord(wordObj.word, {})} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>{IconStar(true)}</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', marginRight: '8px' }}>{wordObj.level}</span>
              <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>{wordObj.pos}</span>
            </div>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#475569' }}>{wordObj.def}</p>
          </div>
        ))}</div>
      )}
    </div>
  );
};