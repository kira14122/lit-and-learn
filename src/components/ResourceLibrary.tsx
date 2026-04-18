import React, { useState } from 'react';

// --- Reusable Back Button (Identical to App.tsx) ---
const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.05)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

export const ResourceLibrary = ({ resources }: { resources: any[] }) => {
  // Starts empty so the user sees the main category grid first
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Your original categories, upgraded with visual data for the big cards
  const categories = [
    { name: 'General', icon: '📄', bg: '#F1F5F9', color: '#475569', desc: 'Syllabi and overviews.' },
    { name: 'Reading', icon: '📖', bg: '#D1FAE5', color: '#10B981', desc: 'Comprehension texts.' },
    { name: 'Writing', icon: '✍️', bg: '#EDE9FE', color: '#8B5CF6', desc: 'Essay structures.' },
    { name: 'Listening', icon: '🎧', bg: '#DBEAFE', color: '#3B82F6', desc: 'Audio tracks.' },
    { name: 'Grammar', icon: '📝', bg: '#FEE2E2', color: '#EF4444', desc: 'Rule guides.' },
    { name: 'Vocabulary', icon: '🔤', bg: '#FEF3C7', color: '#D97706', desc: 'Word lists.' }
  ];

  // Your original filtering logic
  const filteredResources = resources.filter(res => {
    if (!activeFilter) return false;
    if (activeFilter === 'General') return res.isGeneral;
    return !res.isGeneral && res.category === activeFilter;
  });

  const getIcon = (cat: string, isGeneral: boolean, audioUrl: string) => {
    if (isGeneral) return '📄';
    if (audioUrl && cat === 'Listening') return '🎧';
    if (cat === 'Grammar') return '📝';
    if (cat === 'Vocabulary') return '🔤';
    if (cat === 'Reading') return '📖';
    if (cat === 'Writing') return '✍️';
    if (cat === 'Listening') return '🎧';
    return '📚';
  };

  return (
    <div>
      {/* STEP 1: Display the 6 big category cards */}
      {!activeFilter ? (
        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            {categories.map(cat => (
              <button 
                key={cat.name}
                onClick={() => setActiveFilter(cat.name)}
                className="soft-card"
                style={{ padding: '40px 30px', backgroundColor: '#ffffff', border: '2px solid #E2E8F0', borderRadius: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', transition: 'all 0.3s' }}
              >
                <div style={{ background: cat.bg, color: cat.color, padding: '20px', borderRadius: '50%', display: 'flex', fontSize: '2.5rem' }}>
                  {cat.icon}
                </div>
                <h3 style={{ fontSize: '1.8rem', color: '#0F172A', margin: 0 }}>{cat.name}</h3>
                <p style={{ color: '#64748B', margin: 0, fontSize: '1.05rem' }}>{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (

        /* STEP 2: Show the resources for the clicked category */
        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ marginBottom: '30px' }}>
            <BackButton onClick={() => setActiveFilter(null)} text="Back to Categories" />
            <h3 style={{ fontSize: '2.2rem', color: '#0F172A', margin: '16px 0 4px 0' }}>{activeFilter}</h3>
            <span style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '500' }}>Resource Library</span>
          </div>

          {filteredResources.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
              {filteredResources.map(res => (
                <div key={res._id} className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', padding: '30px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>{getIcon(res.category, res.isGeneral, res.audioUrl)}</div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                      {res.isGeneral ? 'General Guide' : res.category}
                    </span>
                    {!res.isGeneral && res.level && (
                      <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        {res.level} • Unit {res.unit}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 24px', fontWeight: '600', color: '#0F172A', fontSize: '1.4rem', lineHeight: '1.4' }}>{res.title}</h3>
                  
                  {res.audioUrl && ( 
                    <div style={{ width: '100%', marginBottom: '20px', padding: '8px', background: '#F8FAFC', borderRadius: '9999px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <audio controls style={{ width: '100%', height: '40px', outline: 'none' }}><source src={res.audioUrl} type="audio/mpeg" /></audio>
                    </div> 
                  )}
                  
                  <div style={{ marginTop: 'auto', width: '100%' }}>
                    {res.fileUrl ? (
                      <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none', width: '100%', display: 'inline-block', boxSizing: 'border-box' }}>
                        {res.audioUrl ? 'Download Worksheet' : 'Download PDF'}
                      </a>
                    ) : res.audioUrl ? (
                      <a href={res.audioUrl} target="_blank" rel="noreferrer" style={{ background: '#EEF2FF', color: '#4F46E5', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none', width: '100%', display: 'inline-block', boxSizing: 'border-box' }}>
                        Download Audio
                      </a>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '12px', color: '#94A3B8', fontSize: '1rem', fontStyle: 'italic', background: '#F8FAFC', borderRadius: '16px', width: '100%' }}>File pending...</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '80px', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0', color: '#94A3B8' }}>
               <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
               <h3 style={{ fontSize: '1.8rem', fontWeight: '600', margin: 0, color: '#0F172A' }}>No resources found</h3>
               <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>We don't have any {activeFilter.toLowerCase()} materials published just yet.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};