import React, { useState, useEffect, useMemo } from 'react';
import { client } from '../sanityClient';

// --- Premium Line-Art SVGs ---
const IconSearch = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconCheckCircle = () => (<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconAlert = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconArrowRight = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>);

// Small line-art icons for the redesigned card
const IconQuestions = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>);
const IconChevronRight = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>);

// --- Unified Master Theme (Matches ResourceLibrary exactly) ---
const getCategoryTheme = (category: string) => {
  const cat = (category || '').toLowerCase();
  
  if (cat.includes('grammar')) return { 
    bg: '#FEE2E2', color: '#EF4444', tagText: '#B91C1C',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg> 
  };
  
  if (cat.includes('vocabulary')) return { 
    bg: '#FEF3C7', color: '#F59E0B', tagText: '#B45309',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> 
  };
  
  if (cat.includes('pronunciation')) return { 
    bg: '#F3E8FF', color: '#A855F7', tagText: '#7E22CE',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3" ry="3"></rect><path d="M5 10v2a7 7 0 0 0 14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg> 
  };
  
  return { 
    bg: '#F1F5F9', color: '#64748B', tagText: '#475569',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> 
  };
};

// Counts the real, unique, valid questions inside a bulkData blob.
// Mirrors the parse logic in handleStartTopic exactly so the number on the
// card always matches what the student actually receives.
const countQuestions = (bulkData: string): number => {
  if (!bulkData) return 0;
  const rows = bulkData.replace(/\r/g, '').split('\n').filter((row) => row.trim() !== '');
  const seen = new Set<string>();
  let count = 0;
  for (const row of rows) {
    const cols = row.split('\t').map((c) => c.trim());
    if (cols.length >= 5 && cols[0] !== '' && cols[0].toLowerCase() !== 'question') {
      const cleanQ = cols[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(cleanQ)) { seen.add(cleanQ); count++; }
    }
  }
  return count;
};

export const PracticeHub = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTopic, setActiveTopic] = useState<any | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [selectedLevel, setSelectedLevel] = useState<string>('Any Level');
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);

  useEffect(() => {
    client.fetch('*[_type == "practiceBank"] | order(level asc)').then(setTopics);
  }, []);

  const availableCategories = useMemo(() => {
    const cats = new Set(topics.map(t => t.category).filter(Boolean));
    return ['All', ...Array.from(cats)].sort();
  }, [topics]);

  const availableLevels = useMemo(() => {
    const levels = new Set(topics.map(t => t.level).filter(Boolean));
    return ['Any Level', ...Array.from(levels)].sort();
  }, [topics]);

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchesSearch = topic.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const matchesCategory = selectedCategory === 'All' || topic.category === selectedCategory;
      const matchesLevel = selectedLevel === 'Any Level' || topic.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [topics, searchQuery, selectedCategory, selectedLevel]);

  const handleStartTopic = (topic: any) => {
    if (!topic.bulkData) return;
    
    const rows = topic.bulkData.replace(/\r/g, '').split('\n').filter((row: string) => row.trim() !== '');
    const rawQuestions = rows.map((row: string) => {
      const cols = row.split('\t').map((c: string) => c.trim());
      if (cols.length >= 5 && cols[0] !== '' && cols[0].toLowerCase() !== 'question') {
        return { question: cols[0], options: { A: cols[1], B: cols[2], C: cols[3] }, correct: cols[4].toUpperCase().replace(/[^ABC]/g, ''), explanation: cols[5] || "No explanation provided." };
      }
      return null;
    }).filter(Boolean); 

    const uniqueQuestions = [];
    const seen = new Set();
    for (const q of rawQuestions) {
      const cleanQ = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(cleanQ)) { seen.add(cleanQ); uniqueQuestions.push(q); }
    }

    if (uniqueQuestions.length === 0) {
      alert("Oops! Couldn't read the questions. Check your Sanity text box.");
      return;
    }

    const shuffled = [...uniqueQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    
    setParsedQuestions(shuffled);
    setActiveTopic(topic);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsComplete(false);
    setScore(0);
  };

  const handleAnswerClick = (key: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(key);
    if (key === parsedQuestions[currentIndex].correct) setScore(prev => prev + 1);
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    if (currentIndex + 1 < parsedQuestions.length) setCurrentIndex(prev => prev + 1);
    else setIsComplete(true);
  };

  return (
    <>
      <style>{`
        .hub-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }
        .hub-search-row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .hub-search-input {
          flex: 1;
          width: 100%;
          padding: 16px 20px 16px 52px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 16px !important; 
          outline: none;
          color: #0F172A;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        .hub-search-input:focus {
          border-color: #4F46E5;
          box-shadow: 0 4px 20px rgba(79,70,229,0.1);
        }
        
        .custom-dropdown-btn {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 16px !important;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          color: #0F172A;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }
        .custom-dropdown-btn:hover {
          border-color: #CBD5E1;
        }
        
        .custom-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          z-index: 50;
          overflow: hidden;
        }
        .custom-dropdown-item {
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #F1F5F9;
        }
        .custom-dropdown-item:last-child {
          border-bottom: none;
        }
        .custom-dropdown-item:hover {
          background: #F8FAFC;
        }

        .scrollable-pills {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollable-pills::-webkit-scrollbar {
          display: none;
        }
        .pill-btn {
          padding: 12px 28px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 15px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        /* THIS FIXES THE BLACK PILL -> BRAND PURPLE */
        .pill-active {
          background: #4F46E5;
          color: #ffffff;
          border: 1px solid #4F46E5;
          box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25);
        }
        
        .pill-inactive {
          background: #ffffff;
          color: #64748B;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .pill-inactive:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }
        .grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        /* Redesigned card: tighter, horizontal, full-card tap target */
        .practice-card {
          background-color: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 18px 20px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          box-shadow: 0 6px 20px -12px rgba(0,0,0,0.06);
          width: 100%;
        }
        .practice-card:hover {
          border-color: #C7D2FE;
          box-shadow: 0 12px 28px -14px rgba(79,70,229,0.18);
          transform: translateY(-2px);
        }
        .practice-card:hover .practice-chevron {
          color: #4F46E5;
          transform: translateX(2px);
        }
        
        @media (min-width: 768px) {
          .hub-controls { flex-direction: row; justify-content: space-between; align-items: center; }
          .hub-search-row { flex-direction: row; width: auto; max-width: 600px; gap: 16px; }
          .hub-dropdown-container { width: 200px; }
          .grid-container { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        }
      `}</style>

      {isLevelMenuOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
          onClick={() => setIsLevelMenuOpen(false)}
        />
      )}

      <div style={{ animation: 'fadeInDown 0.4s ease-out', maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
        
        {!activeTopic ? (
          <div>
            <div className="hub-controls">
              
              <div className="scrollable-pills" style={{ flex: 1 }}>
                {availableCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pill-btn ${selectedCategory === cat ? 'pill-active' : 'pill-inactive'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="hub-search-row">
                
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                    <IconSearch />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search exercises..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="hub-search-input"
                  />
                </div>

                <div className="hub-dropdown-container" style={{ position: 'relative', zIndex: 50 }}>
                   <button 
                      onClick={() => setIsLevelMenuOpen(!isLevelMenuOpen)}
                      className="custom-dropdown-btn"
                    >
                      {selectedLevel}
                      <span style={{ color: '#64748B', fontSize: '12px', transition: 'transform 0.2s', transform: isLevelMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    
                    {isLevelMenuOpen && (
                      <div className="custom-dropdown-menu">
                        {availableLevels.map(level => (
                          <div 
                            key={level} 
                            onClick={() => { setSelectedLevel(level); setIsLevelMenuOpen(false); }}
                            className="custom-dropdown-item"
                            style={{ 
                              color: selectedLevel === level ? '#4F46E5' : '#0F172A',
                              background: selectedLevel === level ? '#EEF2FF' : 'transparent'
                            }}
                          >
                            {level}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

              </div>
            </div>

            <div style={{ marginBottom: '24px', color: '#94A3B8', fontWeight: '600', fontSize: '15px' }}>
              Showing {filteredTopics.length} exercise{filteredTopics.length !== 1 ? 's' : ''}
            </div>

            <div className="grid-container">
              {filteredTopics.map(topic => {
                const theme = getCategoryTheme(topic.category);
                const qCount = countQuestions(topic.bulkData);
                
                return (
                  <button 
                    key={topic._id} 
                    onClick={() => handleStartTopic(topic)}
                    className="practice-card soft-card" 
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {theme.icon}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '7px', background: theme.bg, color: theme.tagText, lineHeight: '1.2' }}>
                            {topic.category}
                          </span>
                          {topic.level && (
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '7px', background: '#F1F5F9', color: '#64748B', lineHeight: '1.2' }}>
                              {topic.level}
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A', fontWeight: '700', lineHeight: '1.3', letterSpacing: '-0.2px' }}>
                          {topic.title}
                        </h3>
                      </div>
                      
                      <span className="practice-chevron" style={{ color: '#CBD5E1', flexShrink: 0, display: 'flex', transition: 'all 0.2s' }}>
                        <IconChevronRight />
                      </span>
                    </div>
                    
                    {qCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                        <span style={{ display: 'flex', color: '#94A3B8' }}><IconQuestions /></span>
                        {qCount} question{qCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                );
              })}
              
              {filteredTopics.length === 0 && topics.length > 0 && (
                 <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                   <div style={{ display: 'inline-flex', marginBottom: '16px', opacity: 0.5 }}><IconSearch /></div>
                   <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '24px', fontWeight: '600' }}>No matching exercises</h3>
                   <p style={{ margin: 0, fontSize: '16px' }}>Try adjusting your search or filters.</p>
                 </div>
              )}
            </div>
          </div>
        ) : isComplete ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ background: '#ECFDF5', padding: '24px', borderRadius: '50%' }}>
                <IconCheckCircle />
              </div>
            </div>
            <h2 style={{ fontSize: '32px', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>Practice Complete!</h2>
            <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '40px' }}>
              You scored <strong style={{ color: '#10B981', fontSize: '22px' }}>{score}</strong> out of <strong>{parsedQuestions.length}</strong>.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setActiveTopic(null)}
                style={{ padding: '16px 32px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '9999px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Back to Topics
              </button>
              <button 
                onClick={() => handleStartTopic(activeTopic)}
                style={{ padding: '16px 32px', background: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '9999px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.3)' }}
              >
                Restart Practice
              </button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <button onClick={() => setShowExitModal(true)} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '9999px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Exit Practice
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', color: '#0F172A', padding: '10px 20px', borderRadius: '9999px', fontWeight: '700', border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', fontSize: '15px' }}>
                Score: <span style={{ color: '#4F46E5' }}>{score}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>{activeTopic.title}</span>
              
              <div style={{ color: '#94A3B8', fontSize: '15px', fontWeight: '600', marginTop: '8px' }}>
                Question {currentIndex + 1} of {parsedQuestions.length}
              </div>

              <h3 style={{ fontSize: '32px', color: '#0F172A', margin: '20px 0 0', lineHeight: '1.3', letterSpacing: '-0.5px' }}>
                {parsedQuestions[currentIndex].question}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['A', 'B', 'C'].map((key) => {
                const optionText = parsedQuestions[currentIndex].options[key as 'A' | 'B' | 'C'];
                const isCorrect = key === parsedQuestions[currentIndex].correct;
                const isSelected = selectedAnswer === key;
                
                let bgColor = '#ffffff';
                let borderColor = '#F1F5F9';
                let textColor = '#0F172A';

                if (selectedAnswer) {
                  if (isCorrect) {
                    bgColor = '#ECFDF5'; borderColor = '#10B981'; textColor = '#065F46'; 
                  } else if (isSelected) {
                    bgColor = '#FEF2F2'; borderColor = '#EF4444'; textColor = '#991B1B'; 
                  } else {
                    bgColor = '#F8FAFC'; textColor = '#94A3B8'; borderColor = '#E2E8F0';
                  }
                }

                return (
                  <button
                    key={key}
                    disabled={!!selectedAnswer}
                    onClick={() => handleAnswerClick(key)}
                    style={{ width: '100%', padding: '24px', background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '24px', fontSize: '18px', fontWeight: '500', color: textColor, textAlign: 'left', cursor: selectedAnswer ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: selectedAnswer ? 'none' : '0 4px 15px rgba(0,0,0,0.03)' }}
                  >
                    <span style={{ background: selectedAnswer ? 'transparent' : '#F8FAFC', color: selectedAnswer ? textColor : '#64748B', border: selectedAnswer ? 'none' : '1px solid #E2E8F0', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>{key}</span>
                    {optionText}
                  </button>
                );
              })}
            </div>

            {selectedAnswer && (
              <div style={{ animation: 'fadeInDown 0.3s ease-out', marginTop: '32px', background: selectedAnswer === parsedQuestions[currentIndex].correct ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${selectedAnswer === parsedQuestions[currentIndex].correct ? '#A7F3D0' : '#FECACA'}`, padding: '32px', borderRadius: '28px' }}>
                <h4 style={{ margin: '0 0 12px', color: selectedAnswer === parsedQuestions[currentIndex].correct ? '#059669' : '#DC2626', fontSize: '20px', fontWeight: '700' }}>
                  {selectedAnswer === parsedQuestions[currentIndex].correct ? 'Spot on!' : 'Not quite.'}
                </h4>
                <p style={{ margin: '0 0 32px', color: '#334155', fontSize: '18px', lineHeight: '1.7' }}>
                  {parsedQuestions[currentIndex].explanation}
                </p>
                <button 
                  onClick={nextQuestion}
                  style={{ width: '100%', padding: '20px', background: selectedAnswer === parsedQuestions[currentIndex].correct ? '#10B981' : '#EF4444', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedAnswer === parsedQuestions[currentIndex].correct ? '0 10px 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                >
                  {currentIndex + 1 < parsedQuestions.length ? 'Next Question' : 'Finish Practice'} <span style={{display: 'inline-flex', verticalAlign: 'middle', marginLeft: '8px'}}><IconArrowRight /></span>
                </button>
              </div>
            )}

            {showExitModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowExitModal(false)}>
                <div className="responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '450px', padding: '40px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25)', textAlign: 'center', animation: 'fadeInDown 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                  <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                    <IconAlert />
                  </div>
                  <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#0F172A', fontWeight: '700', letterSpacing: '-0.5px' }}>Exit Practice?</h2>
                  <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '32px', lineHeight: '1.6' }}>Are you sure you want to leave? Your current score and progress will be lost.</p>
                  <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                    <button 
                      onClick={() => setShowExitModal(false)} 
                      style={{ background: '#F8FAFC', color: '#475569', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '18px', width: '100%', transition: 'all 0.2s' }}
                    >
                      Resume Practice
                    </button>
                    <button 
                      onClick={() => { setShowExitModal(false); setActiveTopic(null); }} 
                      style={{ background: '#EF4444', color: '#ffffff', padding: '16px 32px', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '18px', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)' }}
                    >
                      Yes, Exit Practice
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
};