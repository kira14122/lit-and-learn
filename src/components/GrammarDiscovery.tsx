import { useState } from 'react';

export default function GrammarDiscovery({ block }: { block: any }) {
  const [showRule, setShowRule] = useState(false);

  if (!block) return null;

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
        Grammar Focus: {block.title}
      </h2>

      {/* PHASE 1: Contextual Sentences */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>From the text:</h4>
        {block.noticingSentences?.map((s: string, i: number) => (
          <p key={i} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #6366f1', fontStyle: 'italic', marginBottom: '10px' }}>
            "{s}"
          </p>
        ))}
      </div>

      {/* PHASE 2: Noticing Questions */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Observe & Think:</h4>
        {block.noticingQuestions?.map((q: string, i: number) => (
          <p key={i} style={{ fontWeight: '500', color: '#334155', marginBottom: '8px' }}>• {q}</p>
        ))}
      </div>

      {/* PHASE 3: The Reveal */}
      {!showRule ? (
        <button 
          onClick={() => setShowRule(true)}
          style={{ width: '100%', padding: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Check the Rule
        </button>
      ) : (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ padding: '20px', backgroundColor: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4338ca' }}>The Rule:</h4>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#312e81' }}>{block.grammarRule}</p>
          </div>
          
          {/* We'll add Phase 4: Quick Check Quiz here later! */}
        </div>
      )}
    </div>
  );
}