import React, { useState } from 'react';

export const ResourceLibrary = ({ resources }: { resources: any[] }) => {
  // We changed the default starting tab to 'Reading' instead of 'All'
  const [activeFilter, setActiveFilter] = useState('Reading');

  // Removed 'All' from the button list
  const filters = ['Reading', 'Writing', 'Listening', 'Grammar', 'Vocabulary', 'General'];

  // Simplified the filtering logic since 'All' is gone
  const filteredResources = resources.filter(res => {
    if (activeFilter === 'General') return res.isGeneral;
    return res.category === activeFilter;
  });

  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: 'none', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column' as const, padding: '30px', alignItems: 'center', textAlign: 'center' as const };
  const actionButton = { background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none', width: '100%', display: 'inline-block', boxSizing: 'border-box' as const };
  const badgeButton = (isActive: boolean) => ({ fontFamily: '"Fredoka", sans-serif', padding: '10px 24px', borderRadius: '9999px', border: 'none', backgroundColor: isActive ? '#0F172A' : '#ffffff', color: isActive ? '#ffffff' : '#64748B', fontWeight: '600', cursor: 'pointer', fontSize: '1.05rem', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.04)', transition: 'all 0.2s ease' });

  const getIcon = (cat: string, isGeneral: boolean, audioUrl: string) => {
    if (isGeneral) return '📄';
    if (audioUrl) return '🎧';
    if (cat === 'Grammar') return '📝';
    if (cat === 'Vocabulary') return '🔤';
    if (cat === 'Reading') return '📖';
    if (cat === 'Writing') return '✍️';
    return '📚';
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '3rem', color: '#0F172A', fontWeight: '600', letterSpacing: '-1px', margin: '0 0 16px' }}>Resource Library</h2>
        <p style={{ color: '#64748B', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>Download worksheets, audio tracks, and study guides. Filter by specific skills below to find exactly what you need.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '50px', flexWrap: 'wrap' }}>
        {filters.map(filter => (
          <button key={filter} onClick={() => setActiveFilter(filter)} style={badgeButton(activeFilter === filter)}>
            {filter}
          </button>
        ))}
      </div>

      {filteredResources.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {filteredResources.map(res => (
            <div key={res._id} className="soft-card" style={cardStyle}>
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
                  <a href={res.fileUrl} target="_blank" rel="noreferrer" style={actionButton}>
                    {res.audioUrl ? 'Download Worksheet' : 'Download PDF'}
                  </a>
                ) : res.audioUrl ? (
                  <a href={res.audioUrl} target="_blank" rel="noreferrer" style={{...actionButton, background: '#EEF2FF', color: '#4F46E5'}}>
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
         <div style={{ textAlign: 'center', padding: '80px', background: '#ffffff', borderRadius: '32px', color: '#94A3B8', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
           <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
           <h3 style={{ fontSize: '1.8rem', fontWeight: '600', margin: 0, color: '#0F172A' }}>No resources found</h3>
           <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>We don't have any {activeFilter.toLowerCase()} materials published just yet.</p>
         </div>
      )}
    </div>
  );
};