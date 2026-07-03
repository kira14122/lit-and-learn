import React from 'react';

// Presentational card for the term-at-a-glance summary.
// Receives the computed `summary` object (see termSummary in TeacherDashboard):
//   { tests[], takenCount, assessedWeight, earnedSum, standing, allDone }
export function TermSummaryCard({ summary }: { summary: any }) {
  return (
    <div style={{background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'20px',padding:'20px',boxShadow:'0 1px 2px rgba(16,24,40,0.04)',flexShrink:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:'10px',flexWrap:'wrap',marginBottom:'14px'}}>
        <span style={{fontSize:'1.05rem',fontWeight:'600',color:'#0F172A'}}>Term summary</span>
        <span style={{fontSize:'0.78rem',color:'#94A3B8'}}>{summary.takenCount} of 4 tests · {summary.assessedWeight}% of grade assessed</span>
      </div>
      <div style={{display:'flex',gap:'9px',flexWrap:'wrap',marginBottom:summary.standing!=null?'15px':0}}>
        {summary.tests.map((t:any)=>{
          const graded = t.status==='graded';
          const tone = graded ? (t.mastery>=70?'#047857':t.mastery>=55?'#B45309':'#DC2626') : t.status==='absent' ? '#B45309' : '#CBD5E1';
          const big = graded ? `${Math.round(t.mastery)}%` : t.status==='absent' ? 'Absent' : t.status==='na' ? 'N/A' : '—';
          const sub = graded ? `earns ${(t.earnedWeight||0).toFixed(1)} / ${t.weight}%` : t.status==='absent' ? `0 / ${t.weight}%` : t.status==='na' ? 'excluded' : 'not taken yet';
          const faded = t.status==='pending' || t.status==='na';
          const label = t.name==='Third Test' ? 'Third' : t.name==='Final Test' ? 'Final' : t.name;
          return (
            <div key={t.name} style={{flex:'1 1 110px',minWidth:0,border:`1px solid ${faded?'#EEF1F6':'#E8EBF2'}`,borderStyle:faded?'dashed':'solid',borderRadius:'12px',padding:'11px 13px',display:'flex',flexDirection:'column',gap:'3px',opacity:faded?0.6:1}}>
              <span style={{fontSize:'0.72rem',fontWeight:'600',color:'#64748B'}}>{label}</span>
              <span style={{fontSize:'1rem',fontWeight:'700',color:tone}}>{big}</span>
              <span style={{fontSize:'0.68rem',color:'#94A3B8'}}>{sub}</span>
            </div>
          );
        })}
      </div>
      {summary.standing!=null && (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F5F5FF',border:'1px solid #E5E4FB',borderRadius:'12px',padding:'13px 16px'}}>
          <span style={{fontSize:'0.85rem',color:'#475569',fontWeight:'500'}}>{summary.allDone?'Final grade':'Grade so far'} <span style={{color:'#94A3B8'}}>{summary.allDone?'':'(of tests taken)'}</span></span>
          <span style={{fontSize:'1.4rem',fontWeight:'800',color:'#4F46E5'}}>{Math.round(summary.standing)}%</span>
        </div>
      )}
    </div>
  );
}