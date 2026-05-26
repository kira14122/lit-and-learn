import React, { useState, useRef, useEffect } from 'react';
import { generateWorksheetActivity } from '../aiGenerator';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconWand     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>;
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconWord     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconUp       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const IconDown     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IconSpinner  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 0.9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconCopy     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconRefresh  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconSave     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconText     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
const IconTemplate = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconBreak    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>;

// ─── Types ────────────────────────────────────────────────────────────────────
type Question      = { q: string; options?: string[]; answer?: string };
type GenParams     = { skill: string; level: string; numQ: number; aType: string; mode: 'topic'|'customText'; text: string; passageWords: number };
// passage is now embedded PER BLOCK — no more global passage state
type ActivityBlock = { id: string; skill: string; type: string; title: string; instructions: string; questions: Question[]; matchingOrder?: number[]; level: string; pageBreakBefore: boolean; isCustomBlock?: boolean; generationParams?: GenParams; passage?: string };
type Template      = { id: string; name: string; skill: 'Reading'|'Grammar'|'Vocabulary'; level: string; numQ: number; aType: string; mode: 'topic'|'customText'; topic: string };
type SavedWs       = { id: string; name: string; savedAt: string; title: string; blocks: ActivityBlock[]; showClass: boolean; showScore: boolean };

// ─── Constants ────────────────────────────────────────────────────────────────
const ACT: Record<string,string[]> = {
  Reading:    ['Multiple Choice','True/False','Short Answer'],
  Grammar:    ['Fill in the Blanks','Correct the Errors','Multiple Choice'],
  Vocabulary: ['Matching Definitions','Fill in the Blanks','Synonyms (MC)'],
};
const SC: Record<string,{bg:string;text:string;border:string}> = {
  Reading:    {bg:'#EEF2FF',text:'#4F46E5',border:'#4F46E5'},
  Grammar:    {bg:'#F0FDF4',text:'#16A34A',border:'#16A34A'},
  Vocabulary: {bg:'#FFF7ED',text:'#EA580C',border:'#EA580C'},
};
const lbl: React.CSSProperties = {display:'block',fontSize:'0.72rem',fontWeight:'700',color:'#64748B',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.05em'};
const inp: React.CSSProperties = {width:'100%',padding:'9px 11px',borderRadius:'9px',border:'1.5px solid #E2E8F0',fontSize:'0.88rem',outline:'none',color:'#0F172A',fontFamily:'inherit',background:'#FAFAFA'};
const sel: React.CSSProperties = {...inp,cursor:'pointer'};
const btn: React.CSSProperties = {padding:'5px 8px',border:'1px solid #E2E8F0',background:'#fff',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'0.73rem',fontWeight:'600',color:'#475569',gap:'4px'};

// ─── Print CSS ────────────────────────────────────────────────────────────────
const PCSS = `
  @page { size: A4 portrait; margin: 18mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; color: #000; line-height: 1.6; background: #fff; margin: 0; padding: 0; font-size: 14px; }
  .ws-fields { display: flex; gap: 32px; font-size: 13px; margin-bottom: 8px; }
  .ws-divider { border: none; border-top: 1.5px solid #000; margin-bottom: 24px; }
  h1 { text-align: center; font-size: 20px; font-weight: bold; margin: 0 0 28px; }
  h2 { font-size: 14px; text-transform: uppercase; font-weight: bold; margin: 0 0 4px; letter-spacing: 0.03em; }
  .instr { font-size: 13px; font-style: italic; color: #333; margin-bottom: 18px; padding-bottom: 8px; border-bottom: 1px solid #ccc; }

  /* Blocks flow naturally across pages — no more page-break gaps */
  .blk { margin-bottom: 36px; }

  /* Individual question units stay together */
  .q-block { page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px; }

  /* MC */
  .q-stem { font-size: 14px; font-weight: bold; margin-bottom: 7px; }
  .q-option { font-size: 14px; margin-bottom: 5px; padding-left: 20px; }

  /* True/False */
  .tf-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; gap: 12px; page-break-inside: avoid; break-inside: avoid; }
  .tf-stem { font-size: 14px; flex: 1; }
  .tf-boxes { font-size: 13px; white-space: nowrap; display: flex; gap: 18px; }

  /* Short Answer */
  .sa-q { font-weight: bold; font-size: 14px; margin-bottom: 8px; }
  .sa-line { border-bottom: 1px solid #666; height: 30px; margin-top: 4px; }

  /* Fill in the Blanks — inline blank spans */
  .fib-row { font-size: 14px; line-height: 2.6; page-break-inside: avoid; break-inside: avoid; }
  .fib-blank { display: inline-block; border-bottom: 1px solid #333; width: 90px; margin: 0 3px; vertical-align: bottom; }

  /* Correct Errors */
  .ce-q { font-size: 14px; margin-bottom: 5px; }
  .ce-label { font-size: 12px; color: #555; font-style: italic; }
  .ce-line { border-bottom: 1px solid #666; height: 26px; margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid; }

  /* Matching */
  .match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .match-col-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #444; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .match-row { display: flex; align-items: center; gap: 8px; margin-bottom: 11px; font-size: 14px; page-break-inside: avoid; break-inside: avoid; }
  .match-blank { border-bottom: 1px solid #666; min-width: 28px; display: inline-block; }

  /* Passage — embedded with its Reading block */
  .passage-wrap { margin-bottom: 20px; }
  .passage-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #444; margin-bottom: 8px; }
  .passage-text { font-size: 14px; line-height: 1.85; text-align: justify; }
  .passage-divider { border: none; border-top: 1px solid #bbb; margin: 16px 0 20px; }

  /* Answer Key */
  .pg-break { page-break-before: always; break-before: page; }
  .ak-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 6px; margin-top: 6px; }
  .ak-col { display: flex; flex-direction: column; gap: 5px; }
  .ak-item { font-size: 13px; padding: 4px 3px; border-bottom: 1px solid #ddd; }

  /* Utils */
  .no-print { display: none !important; }
  .pbefore { page-break-before: always; break-before: page; }
`;

// ─── Blank renderer — replaces ___ sequences with styled underline spans ──────
const WithBlanks = ({text}: {text: string}) => {
  const parts = text.split(/_{2,}/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="fib-blank" style={{display:'inline-block',borderBottom:'1px solid #333',width:'90px',margin:'0 3px',verticalAlign:'bottom'}}>&nbsp;</span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

// ─── Question Renderers ───────────────────────────────────────────────────────
const RenderMC = ({qs}:{qs:Question[]}) => (
  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
    {qs.map((q,i) => (
      <div key={i} className="q-block" style={{pageBreakInside:'avoid',breakInside:'avoid'}}>
        <div className="q-stem" contentEditable suppressContentEditableWarning style={{fontWeight:'bold',fontSize:'14.5px',marginBottom:'7px',outline:'none'}}>{i+1}.&nbsp;{q.q}</div>
        <div style={{paddingLeft:'20px',display:'flex',flexDirection:'column',gap:'4px'}}>
          {q.options?.map((o,j) => <div key={j} contentEditable suppressContentEditableWarning style={{fontSize:'14px',outline:'none'}}>{String.fromCharCode(97+j)})&nbsp;{o}</div>)}
        </div>
      </div>
    ))}
  </div>
);

const RenderTF = ({qs}:{qs:Question[]}) => (
  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
    {qs.map((q,i) => (
      <div key={i} className="tf-row" style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:'12px',pageBreakInside:'avoid',breakInside:'avoid'}}>
        <div className="tf-stem" contentEditable suppressContentEditableWarning style={{flex:1,fontSize:'14.5px',outline:'none'}}>{i+1}.&nbsp;{q.q}</div>
        <div className="tf-boxes" style={{display:'flex',gap:'20px',flexShrink:0,fontSize:'14px',whiteSpace:'nowrap'}}>
          <span>True&nbsp;☐</span><span>False&nbsp;☐</span>
        </div>
      </div>
    ))}
  </div>
);

const RenderSA = ({qs}:{qs:Question[]}) => (
  <div style={{display:'flex',flexDirection:'column',gap:'22px'}}>
    {qs.map((q,i) => (
      <div key={i} style={{pageBreakInside:'avoid',breakInside:'avoid'}}>
        <div className="sa-q" contentEditable suppressContentEditableWarning style={{fontWeight:'bold',fontSize:'14.5px',marginBottom:'10px',outline:'none'}}>{i+1}.&nbsp;{q.q}</div>
        {[0,1,2].map(l => <div key={l} className="sa-line" style={{borderBottom:'1px solid #888',height:'30px',marginTop:'4px'}}/>)}
      </div>
    ))}
  </div>
);

// Fill in Blanks — inline blank spans, high line-height = natural writing space
const RenderFill = ({qs}:{qs:Question[]}) => (
  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
    {qs.map((q,i) => (
      <div key={i} className="fib-row" style={{fontSize:'14.5px',lineHeight:'2.6',pageBreakInside:'avoid',breakInside:'avoid'}}>
        <span contentEditable suppressContentEditableWarning style={{outline:'none'}}>
          {i+1}.&nbsp;<WithBlanks text={q.q}/>
        </span>
      </div>
    ))}
  </div>
);

const RenderErrors = ({qs}:{qs:Question[]}) => (
  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
    {qs.map((q,i) => (
      <div key={i} style={{pageBreakInside:'avoid',breakInside:'avoid'}}>
        <div className="ce-q" contentEditable suppressContentEditableWarning style={{fontSize:'14.5px',outline:'none',marginBottom:'5px'}}>{i+1}.&nbsp;{q.q}</div>
        <div className="ce-label" style={{fontSize:'12px',color:'#555',fontStyle:'italic',marginBottom:'3px'}}>Correction:</div>
        <div className="ce-line" style={{borderBottom:'1px solid #888',height:'26px'}}/>
      </div>
    ))}
  </div>
);

const RenderMatching = ({qs,order}:{qs:Question[];order:number[]}) => (
  <div className="match-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px'}}>
    <div>
      <div className="match-col-title" style={{fontSize:'12px',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.05em',color:'#444',marginBottom:'10px',borderBottom:'1px solid #ccc',paddingBottom:'4px'}}>Column A</div>
      {qs.map((q,i) => (
        <div key={i} className="match-row" style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'11px',fontSize:'14.5px',pageBreakInside:'avoid',breakInside:'avoid'}}>
          <span style={{fontWeight:'bold',minWidth:'22px',flexShrink:0}}>{i+1}.</span>
          <span className="match-blank" style={{borderBottom:'1px solid #666',minWidth:'28px',display:'inline-block'}}>&nbsp;&nbsp;</span>
          <span contentEditable suppressContentEditableWarning style={{outline:'none'}}>{q.q}</span>
        </div>
      ))}
    </div>
    <div>
      <div className="match-col-title" style={{fontSize:'12px',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.05em',color:'#444',marginBottom:'10px',borderBottom:'1px solid #ccc',paddingBottom:'4px'}}>Column B</div>
      {order.map((origIdx,di) => (
        <div key={di} className="match-row" style={{display:'flex',gap:'8px',marginBottom:'11px',fontSize:'14px',pageBreakInside:'avoid',breakInside:'avoid'}}>
          <span style={{fontWeight:'bold',flexShrink:0}}>{String.fromCharCode(65+di)}.</span>
          <span contentEditable suppressContentEditableWarning style={{outline:'none'}}>{qs[origIdx]?.answer}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Answer Key ───────────────────────────────────────────────────────────────
const renderAK = (block:ActivityBlock, idx:number) => {
  const it:React.CSSProperties = {fontSize:'13px',padding:'4px 3px',borderBottom:'1px solid #ddd'};
  let ans:React.ReactNode;
  if (block.type==='Matching Definitions'&&block.matchingOrder) {
    ans = <div className="ak-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>{block.questions.map((_,i)=>{const di=block.matchingOrder!.indexOf(i);return <div key={i} style={it}><strong>{i+1}.</strong>&nbsp;{String.fromCharCode(65+di)}</div>;})}</div>;
  } else if (block.type==='True/False') {
    ans = <div className="ak-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>{block.questions.map((q,i)=><div key={i} style={it}><strong>{i+1}.</strong>&nbsp;{q.answer}</div>)}</div>;
  } else if (['Multiple Choice','Synonyms (MC)'].includes(block.type)) {
    ans = <div className="ak-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>{block.questions.map((q,i)=>{const ci=q.options?.indexOf(q.answer||'')??-1;return <div key={i} style={it}><strong>{i+1}.</strong>&nbsp;{ci>-1?String.fromCharCode(65+ci):'—'}</div>;})}</div>;
  } else {
    ans = <div className="ak-col" style={{display:'flex',flexDirection:'column',gap:'5px'}}>{block.questions.map((q,i)=><div key={i} style={it}><strong>{i+1}.</strong>&nbsp;{q.answer}</div>)}</div>;
  }
  return (
    <div key={`ak-${block.id}`} style={{marginBottom:'22px',pageBreakInside:'avoid'}}>
      <div style={{fontSize:'12px',fontWeight:'700',textTransform:'uppercase',color:'#555',marginBottom:'8px'}}>Part {idx+1}: {block.title}</div>
      {ans}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ActivityGenerator = () => {
  const [tab, setTab]             = useState<'generate'|'settings'>('generate');
  const [skill, setSkill]         = useState<'Reading'|'Grammar'|'Vocabulary'>('Reading');
  const [level, setLevel]         = useState('B1');
  const [mode, setMode]           = useState<'topic'|'customText'>('topic');
  const [topic, setTopic]         = useState('');
  const [custom, setCustom]       = useState('');
  const [aType, setAType]         = useState('Multiple Choice');
  const [numQ, setNumQ]           = useState(5);
  const [passageWords, setPassageWords] = useState(150); // word count for Reading passages
  const [wsTitle, setWsTitle]     = useState('English Practice Worksheet');
  const [showClass, setShowClass] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [blocks, setBlocks]       = useState<ActivityBlock[]>([]);
  const [genning, setGenning]     = useState(false);
  const [regenId, setRegenId]     = useState<string|null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tName, setTName]         = useState('');
  const [showTSave, setShowTSave] = useState(false);
  const [saved, setSaved]         = useState<SavedWs[]>([]);
  const [wsName, setWsName]       = useState('');
  const [showWsSave, setShowWsSave] = useState(false);
  const [restore, setRestore]     = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const as = localStorage.getItem('ll_autosave');
      if (as) { const d=JSON.parse(as); if(d.blocks?.length>0) setRestore(d); }
      const tm = localStorage.getItem('ll_templates'); if (tm) setTemplates(JSON.parse(tm));
      const sv = localStorage.getItem('ll_saved');    if (sv) setSaved(JSON.parse(sv));
    } catch {}
  }, []);

  useEffect(() => {
    if (blocks.length>0) {
      try { localStorage.setItem('ll_autosave', JSON.stringify({title:wsTitle,blocks,showClass,showScore})); } catch {}
    }
  }, [blocks,wsTitle,showClass,showScore]);

  const shuffle = <T,>(a:T[]):T[] => { const r=[...a]; for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];} return r; };

  const buildBlock = (data:any, s:string, l:string, t:string, p:GenParams, blockPassage:string): ActivityBlock => {
    if (['Multiple Choice','Synonyms (MC)'].includes(t)) data.questions.forEach((q:Question)=>{if(q.options) q.options=shuffle([...q.options]);});
    const mo = t==='Matching Definitions' ? shuffle(data.questions.map((_:Question,i:number)=>i)) : undefined;
    return { id:Date.now().toString()+Math.random(), skill:s, type:t, level:l, title:data.title||`${s} Activity`, instructions:data.instructions||'Complete the following activity.', questions:data.questions, matchingOrder:mo, pageBreakBefore:false, generationParams:p, passage:blockPassage };
  };

  const total   = blocks.filter(b=>!b.isCustomBlock).reduce((s,b)=>s+b.questions.length,0);
  const hasCont = blocks.length > 0;

  // ── Generate ───────────────────────────────────────────────────────────────
  const generate = async () => {
    const txt = mode==='topic'?topic:custom;
    if (!txt.trim()) return alert(mode==='topic'?'Please enter a topic.':'Please paste your source text.');
    setGenning(true);

    const isReading = skill === 'Reading';
    // Always generate a passage for Reading+Topic; for CustomText, user's text IS the passage
    const needsPassage = isReading && mode === 'topic';
    const params: GenParams = {skill, level, numQ, aType, mode, text:txt, passageWords};

    const data = await generateWorksheetActivity(skill, level, txt, aType, numQ, mode, needsPassage, passageWords);

    if (data?.questions) {
      // Passage source: AI-generated (topic) or user's pasted text (customText)
      const blockPassage = isReading
        ? (mode === 'customText' ? txt : (data.passage || ''))
        : '';
      setBlocks(prev=>[...prev, buildBlock(data, skill, level, aType, params, blockPassage)]);
    } else { alert('Generation failed. Please try again.'); }
    setGenning(false);
  };

  // ── Regenerate single block ────────────────────────────────────────────────
  const regenerate = async (id:string) => {
    const b=blocks.find(x=>x.id===id); if(!b?.generationParams)return;
    const {skill:s,level:l,numQ:n,aType:a,mode:m,text:t,passageWords:pw}=b.generationParams;
    setRegenId(id);
    const data = await generateWorksheetActivity(s,l,t,a,n,m,s==='Reading'&&m==='topic',pw||150);
    if (data?.questions) {
      const blockPassage = s==='Reading' ? (m==='customText'?t:(data.passage||'')) : '';
      setBlocks(prev=>prev.map(x=>x.id===id?{...buildBlock(data,s,l,a,b.generationParams!,blockPassage),id,pageBreakBefore:x.pageBreakBefore}:x));
    } else alert('Regeneration failed. Please try again.');
    setRegenId(null);
  };

  // ── Block controls ─────────────────────────────────────────────────────────
  const removeBlock    = (id:string) => setBlocks(p=>p.filter(b=>b.id!==id));
  const duplicate      = (id:string) => { const i=blocks.findIndex(b=>b.id===id); if(i<0)return; setBlocks(p=>[...p.slice(0,i+1),{...p[i],id:Date.now().toString()+Math.random()},...p.slice(i+1)]); };
  const togglePB       = (id:string) => setBlocks(p=>p.map(b=>b.id===id?{...b,pageBreakBefore:!b.pageBreakBefore}:b));
  const moveBlock      = (id:string,dir:'up'|'down') => setBlocks(prev=>{ const i=prev.findIndex(b=>b.id===id); if((dir==='up'&&i===0)||(dir==='down'&&i===prev.length-1))return prev; const n=[...prev];const sw=dir==='up'?i-1:i+1;[n[i],n[sw]]=[n[sw],n[i]];return n; });
  const addCustomBlock = () => setBlocks(p=>[...p,{id:Date.now().toString(),skill:'',type:'custom',level:'',title:'',instructions:'',questions:[],pageBreakBefore:false,isCustomBlock:true}]);
  const clearAll       = () => { if(window.confirm('Clear the entire worksheet?')){setBlocks([]);localStorage.removeItem('ll_autosave');} };

  // ── Templates ──────────────────────────────────────────────────────────────
  const saveTemplate = () => {
    if(!tName.trim())return alert('Please enter a name.');
    const t:Template={id:Date.now().toString(),name:tName,skill,level,numQ,aType,mode,topic};
    const u=[t,...templates].slice(0,8); setTemplates(u); localStorage.setItem('ll_templates',JSON.stringify(u));
    setTName(''); setShowTSave(false);
  };
  const loadTemplate = (t:Template) => { setSkill(t.skill);setLevel(t.level);setNumQ(t.numQ);setAType(t.aType);setMode(t.mode);setTopic(t.topic);setTab('generate'); };
  const delTemplate  = (id:string)  => { const u=templates.filter(t=>t.id!==id); setTemplates(u); localStorage.setItem('ll_templates',JSON.stringify(u)); };

  // ── Save / Load ────────────────────────────────────────────────────────────
  const saveWs = () => {
    if(!wsName.trim())return alert('Please enter a name.');
    const w:SavedWs={id:Date.now().toString(),name:wsName,savedAt:new Date().toLocaleDateString(),title:wsTitle,blocks,showClass,showScore};
    const u=[w,...saved].slice(0,5); setSaved(u); localStorage.setItem('ll_saved',JSON.stringify(u));
    setWsName(''); setShowWsSave(false); alert('Saved! ✅');
  };
  const loadWs = (w:SavedWs) => { if(!window.confirm(`Load "${w.name}"? Current worksheet will be replaced.`))return; setWsTitle(w.title);setBlocks(w.blocks);setShowClass(w.showClass);setShowScore(w.showScore); };
  const delWs  = (id:string) => { const u=saved.filter(w=>w.id!==id); setSaved(u); localStorage.setItem('ll_saved',JSON.stringify(u)); };
  const doRestore = () => { if(!restore)return; setWsTitle(restore.title||'English Practice Worksheet');setBlocks(restore.blocks||[]);setShowClass(restore.showClass||false);setShowScore(restore.showScore||false);setRestore(null); };

  // ── Question renderer ──────────────────────────────────────────────────────
  const renderQs = (block:ActivityBlock) => {
    if(block.isCustomBlock) return (
      <div contentEditable suppressContentEditableWarning style={{fontSize:'14.5px',lineHeight:'1.7',outline:'none',padding:'10px',border:'1px dashed #E2E8F0',borderRadius:'6px',minHeight:'60px',fontFamily:'"Times New Roman",serif',color:'#0F172A'}}>
        Click here to type custom instructions, rubric, or notes...
      </div>
    );
    switch(block.type) {
      case 'True/False':           return <RenderTF qs={block.questions}/>;
      case 'Short Answer':         return <RenderSA qs={block.questions}/>;
      case 'Fill in the Blanks':   return <RenderFill qs={block.questions}/>;
      case 'Correct the Errors':   return <RenderErrors qs={block.questions}/>;
      case 'Matching Definitions': return <RenderMatching qs={block.questions} order={block.matchingOrder??block.questions.map((_,i)=>i)}/>;
      default:                     return <RenderMC qs={block.questions}/>;
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const cleanHTML = () => { const c=printRef.current?.cloneNode(true) as HTMLElement; if(!c)return''; c.querySelectorAll('.no-print').forEach(e=>e.remove()); return c.innerHTML; };
  const doPrint   = () => { const pw=window.open('','','width=960,height=1080'); if(!pw)return; pw.document.write(`<html><head><title>Worksheet</title><style>${PCSS}</style></head><body>${cleanHTML()}</body></html>`); pw.document.close(); setTimeout(()=>{pw.print();pw.close();},700); };
  const doWord    = () => { const html=`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><style>${PCSS} body{margin:2cm 2.5cm}</style></head><body>${cleanHTML()}</body></html>`; const b=new Blob(['\ufeff',html],{type:'application/msword'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='worksheet.doc'; document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',gap:'28px',alignItems:'flex-start'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <div style={{flex:'0 0 310px',background:'#fff',borderRadius:'26px',padding:'22px',border:'1px solid #E2E8F0',boxShadow:'0 8px 24px rgba(0,0,0,0.04)',position:'sticky',top:'20px',maxHeight:'calc(100vh - 40px)',overflowY:'auto'}}>
        <div style={{display:'flex',gap:'4px',background:'#F1F5F9',padding:'4px',borderRadius:'12px',marginBottom:'18px'}}>
          {(['generate','settings'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'7px',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'0.74rem',cursor:'pointer',background:tab===t?'#fff':'transparent',color:tab===t?'#0F172A':'#64748B',boxShadow:tab===t?'0 1px 4px rgba(0,0,0,0.08)':'none'}}>
              {t==='generate'?'⚡ Generate':'⚙️ Worksheet'}
            </button>
          ))}
        </div>

        {tab==='generate' && (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {templates.length>0 && (
              <div>
                <label style={lbl}><IconTemplate/>&nbsp;Quick Templates</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                  {templates.map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'3px',background:'#F1F5F9',borderRadius:'8px',padding:'3px 8px'}}>
                      <button onClick={()=>loadTemplate(t)} style={{border:'none',background:'transparent',cursor:'pointer',fontSize:'0.73rem',fontWeight:'600',color:'#475569',padding:0}}>{t.name}</button>
                      <button onClick={()=>delTemplate(t.id)} style={{border:'none',background:'transparent',cursor:'pointer',color:'#94A3B8',padding:0,fontSize:'0.7rem'}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={lbl}>1. Target Skill</label>
              <div style={{display:'flex',gap:'5px'}}>
                {(['Reading','Grammar','Vocabulary'] as const).map(s=>{const c=SC[s];const a=skill===s;return(
                  <button key={s} onClick={()=>{setSkill(s);setAType(ACT[s][0]);}} style={{flex:1,padding:'7px 0',borderRadius:'9px',border:a?`2px solid ${c.border}`:'1.5px solid #E2E8F0',background:a?c.bg:'#fff',color:a?c.text:'#64748B',fontWeight:'700',cursor:'pointer',fontSize:'0.72rem'}}>{s}</button>
                );})}
              </div>
            </div>

            <div style={{display:'flex',gap:'8px'}}>
              <div style={{flex:1}}><label style={lbl}>Level</label><select value={level} onChange={e=>setLevel(e.target.value)} style={sel}>{['A1','A2','B1','B2','C1','C2'].map(l=><option key={l}>{l}</option>)}</select></div>
              <div style={{flex:1}}><label style={lbl}>Questions</label><select value={numQ} onChange={e=>setNumQ(Number(e.target.value))} style={sel}>{[5,10,15,20].map(n=><option key={n} value={n}>{n} items</option>)}</select></div>
            </div>

            {/* Passage word count — only shown for Reading */}
            {skill==='Reading' && (
              <div>
                <label style={lbl}>Passage Length</label>
                <select value={passageWords} onChange={e=>setPassageWords(Number(e.target.value))} style={sel}>
                  {[100,150,200,250,300].map(w=><option key={w} value={w}>{w} words</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={lbl}>2. Source</label>
              <div style={{display:'flex',gap:'4px',background:'#F1F5F9',padding:'4px',borderRadius:'10px'}}>
                {(['topic','customText'] as const).map(m=>(
                  <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:'6px',border:'none',borderRadius:'7px',fontSize:'0.73rem',fontWeight:'600',cursor:'pointer',background:mode===m?'#fff':'transparent',color:mode===m?'#4F46E5':'#64748B',boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.08)':'none'}}>
                    {m==='topic'?'Topic':'Custom Text'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {mode==='topic'?(
                <><label style={lbl}>3. Topic or Theme</label><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g., Third Conditional..." style={inp}/></>
              ):(
                <><div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}><label style={lbl}>3. Paste Source Text</label><span style={{fontSize:'0.68rem',color:custom.length>3600?'#EF4444':'#94A3B8',fontWeight:'600'}}>{custom.length}/4000</span></div><textarea maxLength={4000} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Paste any article here..." rows={5} style={{...inp,resize:'vertical',lineHeight:'1.4'}}/></>
              )}
            </div>

            <div><label style={lbl}>4. Activity Type</label><select value={aType} onChange={e=>setAType(e.target.value)} style={sel}>{ACT[skill].map(o=><option key={o}>{o}</option>)}</select></div>

            {showTSave?(
              <div style={{display:'flex',gap:'5px'}}>
                <input value={tName} onChange={e=>setTName(e.target.value)} placeholder="Template name..." style={{...inp,flex:1}}/>
                <button onClick={saveTemplate} style={{...btn,background:'#4F46E5',color:'#fff',border:'none',padding:'8px 11px',borderRadius:'9px'}}>Save</button>
                <button onClick={()=>setShowTSave(false)} style={btn}>✕</button>
              </div>
            ):(
              <button onClick={()=>setShowTSave(true)} style={{...btn,width:'100%',justifyContent:'center',padding:'7px'}}><IconTemplate/>&nbsp;Save settings as template</button>
            )}

            <button onClick={generate} disabled={genning} style={{width:'100%',padding:'13px',background:genning?'#6EE7B7':'#10B981',color:'#fff',border:'none',borderRadius:'12px',fontWeight:'700',fontSize:'0.9rem',cursor:genning?'wait':'pointer',boxShadow:'0 6px 16px rgba(16,185,129,0.18)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              {genning?<><IconSpinner/> Generating…</>:'+ Add Activity Block'}
            </button>
            <button onClick={addCustomBlock} style={{...btn,width:'100%',justifyContent:'center',padding:'8px'}}><IconText/>&nbsp;Add Custom Text Block</button>
            {hasCont&&<button onClick={clearAll} style={{width:'100%',padding:'7px',background:'transparent',color:'#EF4444',border:'none',fontWeight:'600',cursor:'pointer',fontSize:'0.78rem'}}>✕ Clear Entire Worksheet</button>}
          </div>
        )}

        {tab==='settings' && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div><label style={lbl}>Worksheet Title</label><input value={wsTitle} onChange={e=>setWsTitle(e.target.value)} style={inp}/></div>
            <div>
              <label style={lbl}>Optional Header Fields</label>
              {[{k:'class',l:'Show Class field',v:showClass,s:setShowClass},{k:'score',l:'Show Score / 100',v:showScore,s:setShowScore}].map(({k,l,v,s})=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontSize:'0.83rem',color:'#475569',fontWeight:'500',marginBottom:'8px'}}>
                  <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{width:'15px',height:'15px',accentColor:'#4F46E5',cursor:'pointer'}}/>{l}
                </label>
              ))}
            </div>
            <div style={{borderTop:'1px solid #E2E8F0',paddingTop:'14px'}}>
              <label style={lbl}><IconSave/>&nbsp;Save Worksheet</label>
              {showWsSave?(
                <div style={{display:'flex',gap:'5px',marginTop:'6px'}}>
                  <input value={wsName} onChange={e=>setWsName(e.target.value)} placeholder="Worksheet name..." style={{...inp,flex:1}}/>
                  <button onClick={saveWs} style={{...btn,background:'#4F46E5',color:'#fff',border:'none',padding:'8px 11px',borderRadius:'9px'}}>Save</button>
                  <button onClick={()=>setShowWsSave(false)} style={btn}>✕</button>
                </div>
              ):(
                <button onClick={()=>setShowWsSave(true)} disabled={!hasCont} style={{...btn,width:'100%',justifyContent:'center',padding:'8px',marginTop:'6px',opacity:hasCont?1:0.5,cursor:hasCont?'pointer':'not-allowed'}}><IconSave/>&nbsp;Save current worksheet</button>
              )}
            </div>
            {saved.length>0&&(
              <div>
                <label style={lbl}>Saved Worksheets</label>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {saved.map(w=>(
                    <div key={w.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F8FAFC',borderRadius:'10px',padding:'8px 10px',border:'1px solid #E2E8F0'}}>
                      <div><div style={{fontSize:'0.8rem',fontWeight:'700',color:'#0F172A'}}>{w.name}</div><div style={{fontSize:'0.68rem',color:'#94A3B8'}}>{w.savedAt} · {w.blocks.length} block{w.blocks.length!==1?'s':''}</div></div>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button onClick={()=>loadWs(w)} style={{...btn,fontSize:'0.7rem',padding:'4px 8px',color:'#4F46E5'}}>Load</button>
                        <button onClick={()=>delWs(w.id)} style={{...btn,color:'#EF4444',border:'none',background:'#FEF2F2'}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PREVIEW ───────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:'12px',minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:'0.78rem',color:'#94A3B8',fontWeight:'600'}}>
            {blocks.length>0&&`${blocks.filter(b=>!b.isCustomBlock).length} block${blocks.length!==1?'s':''} · ${total} question${total!==1?'s':''}`}
          </div>
          <div style={{display:'flex',gap:'7px'}}>
            <button onClick={doWord} disabled={!hasCont} style={{background:'#2563EB',color:'#fff',border:'none',padding:'9px 16px',borderRadius:'9999px',fontWeight:'600',fontSize:'0.78rem',display:'flex',alignItems:'center',gap:'6px',cursor:hasCont?'pointer':'not-allowed',opacity:hasCont?1:0.45,boxShadow:'0 4px 12px rgba(37,99,235,0.18)'}}><IconWord/> Export to Word</button>
            <button onClick={doPrint} disabled={!hasCont} style={{background:'#4F46E5',color:'#fff',border:'none',padding:'9px 16px',borderRadius:'9999px',fontWeight:'600',fontSize:'0.78rem',display:'flex',alignItems:'center',gap:'6px',cursor:hasCont?'pointer':'not-allowed',opacity:hasCont?1:0.45,boxShadow:'0 4px 14px rgba(79,70,229,0.2)'}}><IconDownload/> Export to PDF</button>
          </div>
        </div>

        {restore&&!hasCont&&(
          <div style={{background:'#EEF2FF',border:'1px solid #C7D2FE',borderRadius:'12px',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'0.83rem',color:'#4338CA',fontWeight:'600'}}>📄 You have an unsaved session — restore it?</span>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={doRestore} style={{background:'#4F46E5',color:'#fff',border:'none',padding:'6px 14px',borderRadius:'8px',fontWeight:'600',fontSize:'0.78rem',cursor:'pointer'}}>Restore</button>
              <button onClick={()=>setRestore(null)} style={{background:'transparent',color:'#64748B',border:'none',fontWeight:'600',fontSize:'0.78rem',cursor:'pointer'}}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Paper */}
        <div style={{background:'#fff',padding:'44px 52px',borderRadius:'18px',border:'1px solid #E2E8F0',boxShadow:'0 16px 40px rgba(0,0,0,0.04)',minHeight:'842px',maxWidth:'860px',width:'100%',margin:'0 auto',color:'#0F172A',position:'relative'}}>

          {!hasCont&&!genning&&(
            <div style={{display:'flex',height:'560px',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',color:'#CBD5E1'}}>
              <IconWand/><span style={{fontSize:'0.9rem',fontWeight:'500'}}>Select options and add activity blocks to build your worksheet.</span>
            </div>
          )}
          {!hasCont&&genning&&(
            <div style={{display:'flex',height:'560px',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',color:'#4F46E5'}}>
              <IconSpinner/><span style={{fontSize:'0.9rem',fontWeight:'600'}}>Generating your activity…</span>
            </div>
          )}

          {hasCont&&(
            <>
              {genning&&<div className="no-print" style={{position:'absolute',bottom:'18px',right:'18px',background:'#4F46E5',color:'#fff',padding:'8px 14px',borderRadius:'9999px',fontSize:'0.75rem',fontWeight:'600',display:'flex',alignItems:'center',gap:'7px',boxShadow:'0 4px 14px rgba(79,70,229,0.3)'}}><IconSpinner/> Adding block…</div>}

              <div ref={printRef}>
                {/* Header */}
                <div className="ws-header" style={{marginBottom:'6px',fontFamily:'"Times New Roman",serif'}}>
                  <div className="ws-fields" style={{display:'flex',gap:'32px',fontSize:'13.5px',marginBottom:'8px'}}>
                    <span>Name:&nbsp;_______________________________</span>
                    <span>Date:&nbsp;_______________</span>
                    {showClass&&<span>Class:&nbsp;____________</span>}
                    {showScore&&<span>Score:&nbsp;___ / 100</span>}
                  </div>
                  <hr className="ws-divider" style={{border:'none',borderTop:'1.5px solid #000',margin:'0 0 24px'}}/>
                </div>

                {/* Title */}
                <h1 style={{fontSize:'20px',textAlign:'center',marginBottom:'28px',fontFamily:'"Times New Roman",serif',fontWeight:'bold'}}>{wsTitle}</h1>

                {/* Blocks — in exact generation order, each Reading block has its passage inline */}
                <div style={{display:'flex',flexDirection:'column',gap:'32px',fontFamily:'"Times New Roman",serif'}}>
                  {blocks.map((block,idx)=>{
                    const sc=block.isCustomBlock?{bg:'#F1F5F9',text:'#64748B',border:'#E2E8F0'}:(SC[block.skill]??SC.Reading);
                    const isRegen=regenId===block.id;
                    const partNum=blocks.slice(0,idx+1).filter(b=>!b.isCustomBlock).length;

                    return (
                      <div key={block.id} className={block.pageBreakBefore?'pbefore blk':'blk'} style={{position:'relative'}}>

                        {block.pageBreakBefore&&(
                          <div className="no-print" style={{borderTop:'2px dashed #818CF8',marginBottom:'12px',position:'relative'}}>
                            <span style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',background:'#EEF2FF',color:'#4F46E5',fontSize:'9px',fontWeight:'800',padding:'2px 8px',borderRadius:'10px',whiteSpace:'nowrap'}}>PAGE BREAK</span>
                          </div>
                        )}

                        {/* Screen-only control bar — no level badge */}
                        <div className="no-print" style={{display:'flex',gap:'4px',marginBottom:'8px',alignItems:'center',flexWrap:'wrap'}}>
                          {!block.isCustomBlock&&<>
                            <span style={{fontSize:'10px',fontWeight:'800',textTransform:'uppercase',padding:'2px 6px',borderRadius:'5px',background:sc.bg,color:sc.text}}>{block.skill}</span>
                            <span style={{fontSize:'10px',fontWeight:'600',color:'#64748B',background:'#F1F5F9',padding:'2px 6px',borderRadius:'5px'}}>{block.type}</span>
                            <span style={{fontSize:'10px',fontWeight:'600',color:'#94A3B8',background:'#F8FAFC',padding:'2px 6px',borderRadius:'5px'}}>{block.questions.length}Q</span>
                          </>}
                          {block.isCustomBlock&&<span style={{fontSize:'10px',fontWeight:'800',textTransform:'uppercase',padding:'2px 6px',borderRadius:'5px',background:'#F1F5F9',color:'#64748B'}}>Custom</span>}
                          <div style={{flex:1}}/>
                          <button onClick={()=>moveBlock(block.id,'up')} disabled={idx===0} style={{...btn,padding:'4px 6px',opacity:idx===0?0.3:1}}><IconUp/></button>
                          <button onClick={()=>moveBlock(block.id,'down')} disabled={idx===blocks.length-1} style={{...btn,padding:'4px 6px',opacity:idx===blocks.length-1?0.3:1}}><IconDown/></button>
                          <button onClick={()=>duplicate(block.id)} title="Duplicate" style={{...btn,padding:'4px 6px'}}><IconCopy/></button>
                          {!block.isCustomBlock&&block.generationParams&&<button onClick={()=>regenerate(block.id)} disabled={!!regenId} style={{...btn,padding:'4px 6px',color:isRegen?'#4F46E5':'#475569'}}>{isRegen?<IconSpinner/>:<IconRefresh/>}</button>}
                          <button onClick={()=>togglePB(block.id)} title={block.pageBreakBefore?'Remove page break':'Add page break before'} style={{...btn,padding:'4px 6px',background:block.pageBreakBefore?'#EEF2FF':'#fff',color:block.pageBreakBefore?'#4F46E5':'#94A3B8'}}><IconBreak/></button>
                          <button onClick={()=>removeBlock(block.id)} style={{...btn,padding:'4px 6px',background:'#FEF2F2',color:'#EF4444',border:'none'}}><IconTrash/></button>
                        </div>

                        {block.isCustomBlock?(
                          <div contentEditable suppressContentEditableWarning style={{fontSize:'14.5px',lineHeight:'1.7',outline:'none',padding:'10px',border:'1px dashed #E2E8F0',borderRadius:'6px',minHeight:'60px',fontFamily:'"Times New Roman",serif',color:'#0F172A'}}>
                            Click here to type custom instructions, rubric, or notes...
                          </div>
                        ):(
                          <>
                            {/* Reading passage — embedded inline with its block */}
                            {block.passage && (
                              <div className="passage-wrap" style={{marginBottom:'18px'}}>
                                <div className="passage-label" style={{fontSize:'11px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'0.07em',color:'#555',marginBottom:'8px'}}>Reading Passage</div>
                                <p contentEditable suppressContentEditableWarning className="passage-text" style={{fontSize:'14px',lineHeight:'1.85',outline:'none',textAlign:'justify',fontFamily:'"Times New Roman",serif',margin:0}}>
                                  {block.passage}
                                </p>
                                <hr className="passage-divider" style={{border:'none',borderTop:'1px solid #bbb',margin:'16px 0 20px'}}/>
                              </div>
                            )}

                            <h2 contentEditable suppressContentEditableWarning style={{fontSize:'14.5px',marginBottom:'4px',outline:'none',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.03em'}}>
                              Part {partNum}: {block.title}
                            </h2>
                            <div contentEditable suppressContentEditableWarning className="instr" style={{fontSize:'13px',fontStyle:'italic',color:'#475569',marginBottom:'16px',borderBottom:'1px solid #ccc',paddingBottom:'8px',outline:'none'}}>
                              Instructions: {block.instructions}
                            </div>
                            {isRegen?(
                              <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#4F46E5',padding:'20px 0',fontSize:'0.85rem',fontWeight:'600'}}><IconSpinner/> Regenerating…</div>
                            ):renderQs(block)}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answer Key */}
                {blocks.some(b=>!b.isCustomBlock)&&(
                  <div className="pg-break" style={{marginTop:'50px',paddingTop:'24px',borderTop:'2px solid #000',fontFamily:'"Times New Roman",serif'}}>
                    <div style={{textAlign:'center',fontSize:'17px',fontWeight:'bold',marginBottom:'24px'}}>Answer Key</div>
                    {blocks.filter(b=>!b.isCustomBlock).map((b,i)=>renderAK(b,i))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};