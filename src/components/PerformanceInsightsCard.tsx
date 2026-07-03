import React from 'react';

// Presentational card for the per-student performance insights (collapsible).
// Props: the computed `insights` object (or null), the collapse state, and a toggle.
export function PerformanceInsightsCard({ insights, show, onToggle }: { insights: any; show: boolean; onToggle: () => void }) {
  if (!insights) return null;
  return (
    <div style={{flexShrink:0}}>
      <button onClick={onToggle} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'16px',padding:'14px 18px',cursor:'pointer',boxShadow:'0 1px 2px rgba(16,24,40,0.04)',gap:'12px'}}>
        <span style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
          <span style={{color:'#0F172A',fontSize:'1.02rem',fontWeight:'600'}}>Performance insights</span>
          <span style={{background:'#EEF1F6',color:'#475569',fontSize:'0.72rem',fontWeight:'500',padding:'2px 9px',borderRadius:'999px'}}>Across {insights.count} test{insights.count!==1?'s':''}</span>
          <span style={{display:'flex',alignItems:'center',gap:'5px',color:insights.direction==='down'?'#DC2626':(insights.direction==='up'?'#047857':'#64748B'),fontWeight:'700',fontSize:'0.85rem'}}>{insights.direction==='up'?'↗':insights.direction==='down'?'↘':'→'} {insights.count>1?`${insights.overallFirst}% → ${insights.overallLast}%`:`${insights.overallLast}%`}</span>
        </span>
        <span style={{color:'#94A3B8',fontSize:'0.85rem',fontWeight:'500',whiteSpace:'nowrap'}}>{show?'Hide ▾':'Show ▸'}</span>
      </button>
      {show && (
      <div style={{background:'#fff',border:'1px solid rgba(15,23,42,0.06)',borderRadius:'22px',padding:'26px',boxShadow:'0 1px 2px rgba(16,24,40,0.04), 0 14px 30px -12px rgba(16,24,40,0.16)',marginTop:'14px'}}>
      <div style={{background:'#F5F5FF',border:'1px solid #E5E4FB',borderRadius:'14px',padding:'14px 16px',marginBottom:'14px',fontSize:'0.9rem',lineHeight:'1.6',color:'#334155'}}>
        {insights.count>1 ? (
          <span><strong style={{color:'#0F172A'}}>{insights.direction==='up'?'Trending up':insights.direction==='down'?'Trending down':'Holding steady'}</strong> — overall {insights.overallFirst}% → {insights.overallLast}% since the first test. Recurring soft spot: <strong style={{color:'#B45309'}}>{insights.weakest.label}</strong> (avg {insights.weakest.avg}%). Consistent strength: <strong style={{color:'#047857'}}>{insights.strongest.label}</strong> (avg {insights.strongest.avg}%).</span>
        ) : (
          <span><strong style={{color:'#0F172A'}}>One test so far</strong> — overall {insights.overallLast}%. Strongest: <strong style={{color:'#047857'}}>{insights.strongest.label}</strong> ({insights.strongest.avg}%). Weakest: <strong style={{color:'#B45309'}}>{insights.weakest.label}</strong> ({insights.weakest.avg}%).</span>
        )}
      </div>

      {insights.count>1 && <div style={{fontSize:'0.72rem',color:'#94A3B8',marginBottom:'2px',paddingLeft:'2px'}}>Bars: {insights.points.map((p:any)=>p.name).join(' · ')} — latest highlighted</div>}

      {insights.skills.map((s:any)=>{
        const pillBg = s.tone==='green'?'#ECFDF5':s.tone==='amber'?'#FFF7ED':'#F1F5F9';
        const pillFg = s.tone==='green'?'#047857':s.tone==='amber'?'#C2410C':'#475569';
        return (
          <div key={s.key} style={{display:'grid',gridTemplateColumns:'118px 1fr 74px 94px',alignItems:'center',gap:'12px',padding:'12px 0',borderTop:'1px solid #F1F3F8'}}>
            <span style={{fontWeight:'500',fontSize:'0.9rem',color:'#0F172A'}}>{s.label}</span>
            <div style={{display:'flex',alignItems:'flex-end',gap:'5px',height:'32px'}}>
              {s.series.map((p:number,i:number)=>{
                const isLast = i===s.series.length-1;
                const amber = s.tone==='amber';
                const col = isLast?(amber?'#EA9A3E':'#4F46E5'):(amber?'#FBD4A6':'#C7D2FE');
                return <div key={i} style={{width:'7px',borderRadius:'3px',background:col,height:`${Math.max(6,Math.round(p/100*32))}px`}}/>;
              })}
            </div>
            <span style={{fontSize:'0.9rem',fontWeight:'700',color:'#0F172A',whiteSpace:'nowrap'}}>{s.latest}%{insights.count>1 && <span style={{marginLeft:'5px',fontSize:'0.74rem',fontWeight:'600',color:s.delta>0?'#047857':s.delta<0?'#DC2626':'#94A3B8'}}>{s.delta>0?'▲':s.delta<0?'▼':'—'}{s.delta!==0?Math.abs(s.delta):''}</span>}</span>
            <span style={{fontSize:'0.72rem',fontWeight:'600',padding:'3px 10px',borderRadius:'999px',textAlign:'center',background:pillBg,color:pillFg}}>{s.status}</span>
          </div>
        );
      })}
      </div>
      )}
    </div>
  );
}