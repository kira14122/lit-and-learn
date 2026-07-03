import React from 'react';

const IconTrash = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const IconEdit = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);

// Collapsible list of a student's saved grade records, with per-record
// send / edit / delete actions. All behavior is passed in as callbacks;
// this component holds no state of its own.
export function PreviousRecordsCard({
  records, show, onToggle, editingRecordId, onCancelEdit,
  onSend, isSubmitting, onEdit, onDelete, formatScoreDisplay,
}: {
  records: any[]; show: boolean; onToggle: () => void;
  editingRecordId: any; onCancelEdit: () => void;
  onSend: (hist: any) => void; isSubmitting: boolean;
  onEdit: (hist: any) => void; onDelete: (id: any) => void;
  formatScoreDisplay: (score: any) => string;
}) {
  if (!records || records.length === 0) return null;
  return (
    <div style={{flexShrink:0}}>
      <button onClick={onToggle} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'16px',padding:'14px 18px',cursor:'pointer',boxShadow:'0 1px 2px rgba(16,24,40,0.04)',margin:'4px 0'}}>
        <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{color:'#0F172A',fontSize:'1.02rem',fontWeight:'600'}}>Previous records</span>
          <span style={{background:'#EEF2FF',color:'#4F46E5',fontSize:'0.72rem',fontWeight:'700',padding:'2px 9px',borderRadius:'999px'}}>{records.length}</span>
        </span>
        <span style={{color:'#94A3B8',fontSize:'0.85rem',fontWeight:'500'}}>{show?'Hide ▾':'Show ▸'}</span>
      </button>
      {show && (
      <div style={{display:'flex',flexDirection:'column',gap:'14px',marginTop:'14px'}}>
        {records.map(hist=>(
          <div key={hist.id} style={{background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'20px',padding:'22px',boxShadow:'0 1px 2px rgba(16,24,40,0.04), 0 10px 24px -14px rgba(16,24,40,0.16)'}}>
            {editingRecordId===hist.id ? (
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
                <span style={{fontWeight:'700',color:'#4F46E5',fontSize:'1rem'}}>✏️ Editing {hist.assessment_name} in the panel above…</span>
                <button onClick={onCancelEdit} style={{background:'#F1F5F9',color:'#475569',border:'none',padding:'8px 14px',borderRadius:'9px',fontWeight:'600',cursor:'pointer',fontSize:'0.82rem',flexShrink:0}}>Cancel</button>
              </div>
            ) : (
              <>
                {(()=>{ let _st:any={}; try{_st=JSON.parse(hist.score)||{};}catch{} const isNA=!!_st.notApplicable; const isAbs=!!_st.isAbsent; const isUnsent=!isNA && _st.emailed===false; const badge=isNA?{t:'Not applicable',c:'#475569',b:'#F1F5F9'}:isUnsent?{t:'Saved · not emailed',c:'#C2410C',b:'#FFF7ED'}:isAbs?{t:'Absent · 0%',c:'#C2410C',b:'#FFF7ED'}:{t:'✓ Emailed',c:'#047857',b:'#ECFDF5'}; return (
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'5px'}}><span style={{fontWeight:'600',color:'#0F172A',fontSize:'1.05rem'}}>{hist.assessment_name}</span><span style={{background:badge.b,color:badge.c,padding:'2px 9px',borderRadius:'7px',fontSize:'0.7rem',fontWeight:'500'}}>{badge.t}</span></div>
                    <span style={{color:'#94A3B8',fontSize:'0.75rem',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.5px'}}>{new Date(hist.date_recorded).toLocaleDateString()}</span>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    {isUnsent && <button onClick={()=>onSend(hist)} disabled={isSubmitting} style={{display:'flex',alignItems:'center',gap:'5px',background:'#10B981',color:'#fff',border:'none',padding:'7px 12px',borderRadius:'9px',cursor:isSubmitting?'wait':'pointer',fontWeight:'600',fontSize:'0.8rem'}}>✉ Send</button>}
                    <button onClick={()=>onEdit(hist)} style={{display:'flex',alignItems:'center',gap:'5px',background:'#F1F5F9',color:'#4F46E5',border:'none',padding:'7px 12px',borderRadius:'9px',cursor:'pointer',fontWeight:'500',fontSize:'0.8rem'}}><IconEdit/> Edit</button>
                    <button onClick={()=>onDelete(hist.id)} style={{display:'flex',alignItems:'center',gap:'5px',background:'#FEF2F2',color:'#EF4444',border:'none',padding:'7px 12px',borderRadius:'9px',cursor:'pointer',fontWeight:'500',fontSize:'0.8rem'}}><IconTrash/> Delete</button>
                  </div>
                </div>
                ); })()}
                <div style={{background:'#F7F8FB',padding:'15px',borderRadius:'13px',border:'1px solid #E7EAF1',color:'#4F46E5',fontWeight:'500',fontSize:'0.9rem',marginBottom:'14px',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{formatScoreDisplay(hist.score)}</div>
                {hist.feedback && <p style={{margin:0,color:'#475569',fontSize:'0.95rem',fontStyle:'italic',lineHeight:'1.65'}}>"{hist.feedback}"</p>}
              </>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}