import React, { useState, useEffect, useMemo } from 'react';
import { CustomAudioPlayer } from './CustomAudioPlayer'; 

// --- Reusable Back Button ---
const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

// --- Premium 2.5px Line-Art SVGs (Unified with Practice Hub) ---
const IconDoc = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const IconReading = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>);
const IconWriting = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>);
const IconListening = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>);
const IconGrammar = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>);
const IconVocab = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>);
const IconDownloadSmall = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconChevronDown = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const IconChevronUp = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>);

// Valid category names (must match the `name` values in `categories` below).
const CATEGORY_NAMES = ['General', 'Reading', 'Writing', 'Listening', 'Grammar', 'Vocabulary'];

// Reads ?cat=... from the address bar (e.g. /resources?cat=Grammar) and matches
// it to a category, case-insensitively and forgivingly. Returns null if absent.
const readCategoryFromUrl = (): string | null => {
  try {
    const raw = new URLSearchParams(window.location.search).get('cat');
    if (!raw) return null;
    const q = raw.trim().toLowerCase();
    return (
      CATEGORY_NAMES.find(c => c.toLowerCase() === q) ||
      CATEGORY_NAMES.find(c => c.toLowerCase().startsWith(q)) ||
      null
    );
  } catch {
    return null;
  }
};

export const ResourceLibrary = ({ resources }: { resources: any[] }) => {
  // If the page was opened with ?cat=Grammar, start right in that category.
  const [activeFilter, setActiveFilter] = useState<string | null>(readCategoryFromUrl);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Unified Soft Pastel Color Palette
  const categories = [
    { name: 'General', icon: <IconDoc />, bg: '#F1F5F9', color: '#64748B', desc: 'Syllabi and overviews.' },
    { name: 'Reading', icon: <IconReading />, bg: '#ECFDF5', color: '#10B981', desc: 'Comprehension texts.' },
    { name: 'Writing', icon: <IconWriting />, bg: '#F3E8FF', color: '#A855F7', desc: 'Essay structures.' },
    { name: 'Listening', icon: <IconListening />, bg: '#EFF6FF', color: '#3B82F6', desc: 'Audio tracks.' },
    { name: 'Grammar', icon: <IconGrammar />, bg: '#FEE2E2', color: '#EF4444', desc: 'Rule guides.' },
    { name: 'Vocabulary', icon: <IconVocab />, bg: '#FEF3C7', color: '#F59E0B', desc: 'Word lists.' }
  ];

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      if (!activeFilter) return false;
      if (activeFilter === 'General') return res.isGeneral;
      return !res.isGeneral && res.category === activeFilter;
    });
  }, [resources, activeFilter]);

  const groupedResources = useMemo(() => {
    return filteredResources.reduce((acc, res) => {
      const key = res.isGeneral ? 'General Guides' : `Unit ${res.unit || 'Unknown'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(res);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredResources]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedResources).sort((a, b) => {
      if (a === 'General Guides') return -1;
      if (b === 'General Guides') return 1;
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [groupedResources]);

  // When the student switches category, start with every unit CLOSED.
  // They open and close whichever units they like, as many as they want.
  useEffect(() => {
    setExpandedGroups({});
  }, [activeFilter]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <div>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .accordion-content { animation: slideDown 0.3s ease-out; }

        @media (max-width: 768px) {
          .syllabus-card {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 20px !important;
            gap: 16px !important;
          }
          .syllabus-info {
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .syllabus-number {
            width: 40px !important;
            height: 40px !important;
            font-size: 1.1rem !important;
          }
          .syllabus-info h4 {
            font-size: 1.15rem !important;
          }
          .syllabus-actions {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .syllabus-actions > a, .syllabus-actions > div, .syllabus-actions > span {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
          }
        }
      `}</style>

      {!activeFilter ? (
        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            {categories.map(cat => (
              <button 
                key={cat.name}
                onClick={() => setActiveFilter(cat.name)}
                className="soft-card"
                style={{ padding: '40px 30px', backgroundColor: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', transition: 'all 0.3s', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)' }}
              >
                <div style={{ background: cat.bg, color: cat.color, width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cat.icon}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#0F172A', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>{cat.name}</h3>
                  <p style={{ color: '#64748B', margin: 0, fontSize: '1.05rem' }}>{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (

        <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <BackButton onClick={() => setActiveFilter(null)} text="Back to Categories" />
            <h3 style={{ fontSize: '2.5rem', color: '#0F172A', margin: '24px 0 4px 0', letterSpacing: '-1px', fontWeight: '700' }}>{activeFilter}</h3>
            <span style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '600' }}>Syllabus & Downloads</span>
          </div>

          {sortedGroupKeys.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sortedGroupKeys.map(groupKey => {
                const isExpanded = expandedGroups[groupKey];
                
                const resourcesInGroup = groupedResources[groupKey].sort((a, b) => {
                  const orderA = a.lessonOrder !== undefined ? a.lessonOrder : 999;
                  const orderB = b.lessonOrder !== undefined ? b.lessonOrder : 999;
                  return orderA - orderB;
                });

                return (
                  <div key={groupKey} style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: isExpanded ? '0 15px 35px rgba(15,23,42,0.04)' : '0 4px 10px rgba(15,23,42,0.02)', overflow: 'hidden', transition: 'all 0.3s' }}>
                    
                    <button 
                      onClick={() => toggleGroup(groupKey)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', backgroundColor: '#ffffff', border: 'none', borderBottom: isExpanded ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <h3 style={{ fontSize: '1.6rem', color: '#0F172A', margin: 0, fontWeight: '700' }}>
                        {groupKey}
                      </h3>
                      <div style={{ color: isExpanded ? '#ffffff' : '#64748B', background: isExpanded ? '#4F46E5' : '#F8FAFC', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                        {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="accordion-content" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#F8FAFC' }}>
                        {resourcesInGroup.map((res, index) => {
                          const cleanTitle = res.title.replace(/^lesson\s*[0-9oO]+\s*[:-]?\s*/i, '');
                          const displayIndex = res.lessonOrder !== undefined ? res.lessonOrder : index + 1;

                          return (
                            <div key={res._id} className="soft-card syllabus-card" style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                              
                              <div className="syllabus-info" style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 min-content' }}>
                                <div className="syllabus-number" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F8FAFC', color: '#4F46E5', border: '2px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem', flexShrink: 0 }}>
                                  {displayIndex}
                                </div>
                                <div>
                                  <h4 style={{ margin: '0 0 6px 0', color: '#0F172A', fontSize: '1.3rem', fontWeight: '600', lineHeight: '1.3' }}>{cleanTitle}</h4>
                                  <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {res.isGeneral ? 'General Guide' : `${res.level}`}
                                  </div>
                                </div>
                              </div>

                              <div className="syllabus-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                {res.audioUrl && (
                                  <div style={{ minWidth: '250px' }}>
                                    <CustomAudioPlayer src={res.audioUrl} title="" />
                                  </div>
                                )}
                                
                                {res.fileUrl ? (
                                  <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ background: '#EEF2FF', color: '#4F46E5', padding: '12px 24px', borderRadius: '9999px', fontWeight: '700', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <IconDownloadSmall /> {res.audioUrl ? 'Worksheet' : 'Download PDF'}
                                  </a>
                                ) : res.audioUrl ? (
                                  <a href={res.audioUrl} target="_blank" rel="noreferrer" style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '12px 24px', borderRadius: '9999px', fontWeight: '700', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <IconDownloadSmall /> Save Audio
                                  </a>
                                ) : (
                                  <span style={{ padding: '12px 24px', color: '#94A3B8', fontSize: '0.95rem', fontStyle: 'italic', background: '#F8FAFC', borderRadius: '9999px' }}>File pending...</span>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '80px', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0', color: '#94A3B8' }}>
               <div style={{ marginBottom: '20px', color: '#CBD5E1', display: 'flex', justifyContent: 'center' }}>
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"></path><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
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