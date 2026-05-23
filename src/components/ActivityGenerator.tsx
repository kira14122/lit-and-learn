import React, { useState, useRef } from 'react';
import { generateWorksheetActivity } from '../aiGenerator';

const IconWand = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path></svg>);
const IconDownload = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

type Question = { q: string; options?: string[]; answer?: string };

// Removed 'passage' from the individual block architecture
type ActivityBlock = { id: string; skill: string; type: string; title: string; instructions: string; questions: Question[] };

export const ActivityGenerator = () => {
  const [skill, setSkill] = useState<'Reading' | 'Grammar' | 'Vocabulary'>('Reading');
  const [level, setLevel] = useState('B1');
  const [inputMode, setInputMode] = useState<'topic' | 'customText'>('topic');
  const [topic, setTopic] = useState('');
  const [customText, setCustomText] = useState('');
  const [activityType, setActivityType] = useState('Multiple Choice');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheetTitle, setWorksheetTitle] = useState("Lit & Learn Mastery Worksheet");
  
  // New Global State for the singular worksheet passage
  const [worksheetPassage, setWorksheetPassage] = useState('');
  const [blocks, setBlocks] = useState<ActivityBlock[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleGenerate = async () => {
    const textPayload = inputMode === 'topic' ? topic : customText;
    
    if (!textPayload.trim()) {
      return alert(inputMode === 'topic' ? "Please enter a specific topic phrase." : "Please paste your custom source text content.");
    }
    
    setIsGenerating(true);
    
    // Only ask the AI for a passage if the worksheet doesn't already have one
    const needsPassage = worksheetPassage.trim() === '';
    
    const data = await generateWorksheetActivity(skill, level, textPayload, activityType, numQuestions, inputMode, needsPassage);
    
    if (data) {
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((q: Question) => { 
          if (q.options) q.options = shuffleArray([...q.options]); 
        });
      }
      
      // If the AI generated a passage, save it to the global state
      if (needsPassage && data.passage) {
        setWorksheetPassage(data.passage);
      }
      
      setBlocks(prev => [...prev, { 
        id: Date.now().toString(), 
        skill,
        type: activityType,
        title: data.title || `${skill} Analysis`, 
        instructions: data.instructions || "Answer the following questions based on your knowledge or the provided text.",
        questions: data.questions || [] 
      }]);
      
    } else { 
      alert("Failed to build material profile. Please try again."); 
    }
    setIsGenerating(false);
  };

  const removeBlock = (idToRemove: string) => {
    setBlocks(prev => prev.filter(b => b.id !== idToRemove));
  };

  const clearWorksheet = () => {
    if (window.confirm("Are you sure you want to clear the entire worksheet?")) {
      setBlocks([]);
      setWorksheetPassage('');
    }
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const printWindow = window.open('', '', 'width=900,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Document</title>
            <style>
              @page { size: portrait; margin: 20mm; }
              body { font-family: 'Times New Roman', serif; color: #0F172A; line-height: 1.6; background: #ffffff; margin: 0; padding: 0; }
              h1 { text-align: center; font-size: 26px; margin-bottom: 40px; font-weight: bold; }
              h2 { font-size: 18px; text-transform: uppercase; margin-top: 35px; margin-bottom: 5px; font-weight: bold; }
              .instructions { font-size: 15px; font-style: italic; color: #475569; margin-bottom: 20px; border-bottom: 1px dashed #E2E8F0; padding-bottom: 10px; }
              p { font-size: 16px; text-align: justify; margin-bottom: 25px; line-height: 1.8; }
              .question-unit { margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid; }
              .question-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
              .options-grid { padding-left: 20px; }
              .option-row { font-size: 16px; margin-bottom: 6px; }
              .page-break { page-break-before: always !important; break-before: page !important; }
              .answer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px; }
              .answer-item { font-size: 15px; padding: 6px; border-bottom: 1px solid #E2E8F0; }
              .no-print { display: none !important; }
            </style>
          </head>
          <body><div>${content}</div></body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
    }
  };

  const activityOptions = {
    Reading: ['Multiple Choice', 'True/False', 'Short Answer'],
    Grammar: ['Fill in the blanks', 'Correct the errors', 'Multiple Choice'],
    Vocabulary: ['Matching Definitions', 'Fill in the blanks', 'Synonyms']
  };

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      
      {/* LEFT SIDEBAR PANEL CONTROLS */}
      <div style={{ flex: '0 0 350px', background: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', position: 'sticky', top: '20px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconWand /> AI Content Studio
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>1. Target Skill</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Reading', 'Grammar', 'Vocabulary'].map(s => (
                <button key={s} onClick={() => { setSkill(s as any); setActivityType(activityOptions[s as 'Reading'][0]); }} style={{ flex: 1, padding: '10px 0', borderRadius: '12px', border: skill === s ? '2px solid #4F46E5' : '1px solid #E2E8F0', background: skill === s ? '#EEF2FF' : '#ffffff', color: skill === s ? '#4F46E5' : '#64748B', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '1rem', outline: 'none', background: '#ffffff', color: '#0F172A', fontWeight: '500' }}>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Questions</label>
              <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '1rem', outline: 'none', background: '#ffffff', color: '#0F172A', fontWeight: '500' }}>
                {[5, 10, 15, 20].map(num => <option key={num} value={num}>{num} items</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>2. Generation Source</label>
            <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
              <button onClick={() => setInputMode('topic')} style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', background: inputMode === 'topic' ? '#ffffff' : 'transparent', color: inputMode === 'topic' ? '#4F46E5' : '#64748B', boxShadow: inputMode === 'topic' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Topic</button>
              <button onClick={() => setInputMode('customText')} style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', background: inputMode === 'customText' ? '#ffffff' : 'transparent', color: inputMode === 'customText' ? '#4F46E5' : '#64748B', boxShadow: inputMode === 'customText' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Custom Text</button>
            </div>
          </div>

          <div>
            {inputMode === 'topic' ? (
              <>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>3. Topic or Theme</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Conditionals Type 3..." style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '1rem', outline: 'none', color: '#0F172A' }} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#475569' }}>3. Paste Source Text</label>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: customText.length > 3600 ? '#EF4444' : '#94A3B8' }}>{customText.length} / 4000 chars</span>
                </div>
                <textarea maxLength={4000} value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Paste any article or reading selection here (Max 800 words)..." rows={6} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '1rem', outline: 'none', color: '#0F172A', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' }} />
              </>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>4. Activity Type</label>
            <select value={activityType} onChange={(e) => setActivityType(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '1rem', outline: 'none', background: '#ffffff', color: '#0F172A', fontWeight: '500' }}>
              {activityOptions[skill].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} style={{ width: '100%', padding: '18px', marginTop: '10px', background: '#10B981', color: '#ffffff', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '1.1rem', cursor: isGenerating ? 'wait' : 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s' }}>
            {isGenerating ? 'Analyzing Material...' : '+ Add to Worksheet'}
          </button>
          
          {(blocks.length > 0 || worksheetPassage) && (
            <button onClick={clearWorksheet} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#EF4444', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
              Clear Entire Worksheet
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
           <button onClick={handlePrint} disabled={blocks.length === 0 && !worksheetPassage} style={{ background: '#4F46E5', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: (blocks.length > 0 || worksheetPassage) ? 'pointer' : 'not-allowed', opacity: (blocks.length > 0 || worksheetPassage) ? 1 : 0.5, boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)', transition: 'all 0.2s' }}>
             <IconDownload /> Export to PDF
           </button>
        </div>

        <div style={{ background: '#ffffff', padding: '60px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', minHeight: '842px', width: '100%', maxWidth: '850px', margin: '0 auto', color: '#0F172A' }}>
          
          {blocks.length === 0 && !worksheetPassage ? (
            <div style={{ display: 'flex', height: '600px', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: '"Fredoka", sans-serif', fontSize: '1.15rem', fontWeight: '500' }}>
              Select options and add blocks to construct your printed assessment worksheet materials.
            </div>
          ) : (
            <div ref={printRef}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '10px', marginBottom: '40px', fontFamily: '"Times New Roman", serif' }}>
                 <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Lit & Learn Learning Systems</div>
                 <div style={{ fontSize: '16px' }}>Name: ________________________</div>
              </div>

              <h1 contentEditable suppressContentEditableWarning style={{ fontSize: '28px', textAlign: 'center', marginBottom: '50px', outline: 'none', fontFamily: '"Times New Roman", serif', fontWeight: 'bold' }}>
                {worksheetTitle}
              </h1>

              {/* GLOBAL WORKSHEET PASSAGE RENDERED ONCE AT THE TOP */}
              {worksheetPassage && (
                <div style={{ position: 'relative', marginBottom: '50px' }}>
                  <button className="no-print" onClick={() => setWorksheetPassage('')} style={{ position: 'absolute', right: '-45px', top: '0', background: '#FEF2F2', border: 'none', color: '#EF4444', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Remove passage">
                    <IconTrash />
                  </button>
                  <p className="avoid-break" contentEditable suppressContentEditableWarning style={{ fontSize: '16px', lineHeight: '1.8', outline: 'none', textAlign: 'justify', fontFamily: '"Times New Roman", serif' }}>
                    {worksheetPassage}
                  </p>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontFamily: '"Times New Roman", serif' }}>
                {blocks.map((block, blockIndex) => (
                  <div key={block.id} style={{ position: 'relative' }}>
                    
                    <button className="no-print" onClick={() => removeBlock(block.id)} style={{ position: 'absolute', right: '-45px', top: '0', background: '#FEF2F2', border: 'none', color: '#EF4444', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Remove this block">
                      <IconTrash />
                    </button>

                    <h2 contentEditable suppressContentEditableWarning style={{ fontSize: '18px', marginBottom: '5px', outline: 'none', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      Part {blockIndex + 1}: {block.title}
                    </h2>
                    
                    <div className="instructions" contentEditable suppressContentEditableWarning style={{ fontSize: '15px', fontStyle: 'italic', color: '#475569', marginBottom: '20px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '10px', outline: 'none' }}>
                      Instructions: {block.instructions}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {block.questions.map((q: Question, i: number) => (
                        <div key={i} className="question-unit">
                          <div className="question-title" contentEditable suppressContentEditableWarning style={{ outline: 'none', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {i + 1}. {q.q}
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="options-grid" style={{ paddingLeft: '20px' }}>
                              {q.options.map((opt: string, j: number) => (
                                <div key={j} className="option-row" style={{ fontSize: '16px', marginBottom: '6px' }}>
                                  {String.fromCharCode(97 + j)}) <span contentEditable suppressContentEditableWarning style={{ outline: 'none' }}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AUTOMATED ANSWER KEY PAGE */}
              {blocks.length > 0 && (
                <div className="page-break" style={{ marginTop: '60px', paddingTop: '30px', borderTop: '3px double #000000', fontFamily: '"Times New Roman", serif' }}>
                  <h2 style={{ fontSize: '22px', textAlign: 'center', marginBottom: '25px', fontWeight: 'bold', borderBottom: 'none' }}>Teacher Answer Key</h2>
                  
                  {blocks.map((block, blockIndex) => (
                    <div key={`ans-block-${block.id}`} style={{ marginBottom: '25px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', marginBottom: '10px' }}>
                        Part {blockIndex + 1}: {block.title}
                      </h3>
                      <div className="answer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                        {block.questions.map((q, i) => {
                          const correctIdx = q.options?.indexOf(q.answer || '');
                          const chosenLetter = correctIdx !== undefined && correctIdx > -1 ? String.fromCharCode(97 + correctIdx) : '';
                          return (
                            <div key={i} className="answer-item" style={{ fontSize: '15px', padding: '6px', borderBottom: '1px solid #E2E8F0' }}>
                              <strong>{i + 1}.</strong> {chosenLetter ? `${chosenLetter.toUpperCase()}) ` : ''}{q.answer}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

    </div>
  );
};