import React, { useState } from 'react';
import { CustomAudioPlayer } from './CustomAudioPlayer'; // <-- IMPORTING THE PREMIUM PLAYER!

// --- Reusable Back Button ---
const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '2px solid #EEF2FF', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.05)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

// --- Premium SVG Icons ---
const IconDoc = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const IconReading = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconWriting = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>);
const IconListening = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>);
const IconGrammar = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>);
const IconVocab = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>);

export const ResourceLibrary = ({ resources }: { resources: any[] }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const categories = [
    { name: 'General', icon: <IconDoc />, bg: '#F1F5F9', color: '#475569', desc: 'Syllabi and overviews.' },
    { name: 'Reading', icon: <IconReading />, bg: '#D1FAE5', color: '#10B981', desc: 'Comprehension texts.' },
    { name: 'Writing', icon: <IconWriting />, bg: '#EDE9FE', color: '#8B5CF6', desc: 'Essay structures.' },
    { name: 'Listening', icon: <IconListening />, bg: '#DBEAFE', color: '#3B82F6', desc: 'Audio tracks.' },
    { name: 'Grammar', icon: <IconGrammar />, bg: '#FEE2E2', color: '#EF4444', desc: 'Rule guides.' },
    { name: 'Vocabulary', icon: <IconVocab />, bg: '#FEF3C7', color: '#D97706', desc: 'Word lists.' }
  ];

  const filteredResources = resources.filter(res => {
    if (!activeFilter) return false;
    if (activeFilter === 'General') return res.isGeneral;
    return !res.isGeneral && res.category === activeFilter;
  });

  const getIcon = (cat: string, isGeneral: boolean, audioUrl: string) => {
    if (isGeneral) return <IconDoc />;
    if (audioUrl && cat === 'Listening') return <IconListening />;
    if (cat === 'Grammar') return <IconGrammar />;
    if (cat === 'Vocabulary') return <IconVocab />;
    if (cat === 'Reading') return <IconReading />;
    if (cat === 'Writing') return <IconWriting />;
    if (cat === 'Listening') return <IconListening />;
    return <IconDoc />;
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
                <div style={{ background: cat.bg, color: cat.color, padding: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  
                  {/* SVG ICON INSTEAD OF EMOJI */}
                  <div style={{ marginBottom: '20px', color: '#94A3B8' }}>{getIcon(res.category, res.isGeneral, res.audioUrl)}</div>
                  
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
                  
                  {/* INJECTED CUSTOM AUDIO PLAYER */}
                  {res.audioUrl && ( 
                    <div style={{ width: '100%', marginBottom: '24px' }}>
                      <CustomAudioPlayer src={res.audioUrl} title="Preview Audio" />
                    </div> 
                  )}
                  
                  <div style={{ marginTop: 'auto', width: '100%' }}>
                    {res.fileUrl ? (
                      <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ background: '#4F46E5', color: '#ffffff', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none', width: '100%', display: 'inline-block', boxSizing: 'border-box' }}>
                        {res.audioUrl ? 'Download Worksheet' : 'Download PDF'}
                      </a>
                    ) : res.audioUrl ? (
                      <a href={res.audioUrl} target="_blank" rel="noreferrer" style={{ background: '#EEF2FF', color: '#4F46E5', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none', width: '100%', display: 'inline-block', boxSizing: 'border-box' }}>
                        Download Audio File
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
               <div style={{ marginBottom: '20px', color: '#CBD5E1', display: 'flex', justifyContent: 'center' }}>
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"></path><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
               </div>
               <h3 style={{ fontSize: '1.8rem', fontWeight: '600', margin: 0, color: '#0F172A' }}>No resources found</h3>
               <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>We don't have any {activeFilter.toLowerCase()} materials published just yet.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};