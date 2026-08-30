import React from 'react';
import { C, S, R, T, NUM, card, cardBody, pill, disclosure } from './portalTokens';
import { IconChevronDown, IconChevronRight, IconTrendUp, IconTrendDown, IconTrendFlat } from './portalIcons';

// Presentational card for the per-student performance insights (collapsible).
// Props: the computed `insights` object (or null), the collapse state, and a toggle.
//
// Restyled onto portalTokens. No logic changed.
//
// Notable substitutions: the ↗ ↘ → arrows and the ▲ ▼ delta markers were text
// glyphs that render at a different weight on every platform; they are now
// stroke icons at the shared weight. The Hide ▾ / Show ▸ affordance is now the
// same chevron used by every other collapsible section in the portal.
export function PerformanceInsightsCard({
  insights, show, onToggle,
}: { insights: any; show: boolean; onToggle: () => void }) {
  if (!insights) return null;

  const dir = insights.direction as 'up' | 'down' | string;
  const dirColor = dir === 'down' ? C.bad : dir === 'up' ? C.good : C.ink2;
  const DirIcon = dir === 'up' ? IconTrendUp : dir === 'down' ? IconTrendDown : IconTrendFlat;

  return (
    <div style={{ flexShrink: 0 }}>
      <button onClick={onToggle} style={disclosure}>
        <span style={{ display: 'flex', alignItems: 'center', gap: S.md, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={T.title}>Performance insights</span>
          <span style={pill}>
            Across <span style={NUM}>{insights.count}</span> test{insights.count !== 1 ? 's' : ''}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: dirColor, fontSize: '13px', fontWeight: 500 }}>
            <DirIcon />
            <span style={NUM}>
              {insights.count > 1
                ? `${insights.overallPrev}% → ${insights.overallLast}%`
                : `${insights.overallLast}%`}
            </span>
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: C.ink3, fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {show ? 'Hide' : 'Show'}
          {show ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </span>
      </button>

      {show && (
        <div style={{ ...card, marginTop: S.md }}>
          <div style={cardBody}>

            <div
              style={{
                background: C.sunken,
                border: `1px solid ${C.lineSoft}`,
                borderRadius: R.control,
                padding: `${S.md} ${S.lg}`,
                marginBottom: S.lg,
                ...T.body, color: C.ink2,
              }}
            >
              {insights.count > 1 ? (
                <span>
                  <span style={{ color: C.ink, fontWeight: 500 }}>{insights.directionWord}</span> — overall{' '}
                  <span style={NUM}>{insights.overallPrev}%</span> → <span style={NUM}>{insights.overallLast}%</span> since the last test{' '}
                  <span style={{ color: C.ink3 }}>(first test: <span style={NUM}>{insights.overallFirst}%</span>)</span>. Recurring soft spot:{' '}
                  <span style={{ color: C.warn, fontWeight: 500 }}>{insights.weakest.label}</span>{' '}
                  <span style={{ ...NUM, color: C.ink3 }}>(avg {insights.weakest.avg}%)</span>. Consistent strength:{' '}
                  <span style={{ color: C.ink, fontWeight: 500 }}>{insights.strongest.label}</span>{' '}
                  <span style={{ ...NUM, color: C.ink3 }}>(avg {insights.strongest.avg}%)</span>.
                </span>
              ) : (
                <span>
                  <span style={{ color: C.ink, fontWeight: 500 }}>One test so far</span> — overall{' '}
                  <span style={NUM}>{insights.overallLast}%</span>. Strongest:{' '}
                  <span style={{ color: C.ink, fontWeight: 500 }}>{insights.strongest.label}</span>{' '}
                  <span style={{ ...NUM, color: C.ink3 }}>({insights.strongest.avg}%)</span>. Weakest:{' '}
                  <span style={{ color: C.warn, fontWeight: 500 }}>{insights.weakest.label}</span>{' '}
                  <span style={{ ...NUM, color: C.ink3 }}>({insights.weakest.avg}%)</span>.
                </span>
              )}
            </div>

            {insights.count > 1 && (
              <div style={{ ...T.micro, textTransform: 'none', letterSpacing: 0, marginBottom: S.sm }}>
                Bars: {insights.points.map((p: any) => p.name).join(' · ')} — latest highlighted
              </div>
            )}

            {insights.skills.map((s: any) => {
              const needsWork = s.tone === 'amber';
              const deltaColor = s.delta > 0 ? C.good : s.delta < 0 ? C.bad : C.ink3;
              const DeltaIcon = s.delta > 0 ? IconTrendUp : s.delta < 0 ? IconTrendDown : IconTrendFlat;

              return (
                <div
                  key={s.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,118px) 1fr 82px 104px',
                    alignItems: 'center', gap: S.md,
                    padding: `${S.md} 0`,
                    borderTop: `1px solid ${C.lineSoft}`,
                  }}
                >
                  <span style={{ ...T.meta, color: C.ink }}>{s.label}</span>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: S.xs, height: '32px' }}>
                    {s.series.map((p: number, i: number) => {
                      const isLast = i === s.series.length - 1;
                      const col = isLast ? (needsWork ? C.warn : C.accent) : C.line;
                      return (
                        <div
                          key={i}
                          style={{
                            width: '6px', borderRadius: R.pill, background: col,
                            height: `${Math.max(6, Math.round((p / 100) * 32))}px`,
                          }}
                        />
                      );
                    })}
                  </div>

                  <span style={{ ...NUM, fontSize: '15px', fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {s.latest}%
                    {insights.count > 1 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: deltaColor, fontSize: '11px', fontWeight: 500 }}>
                        <DeltaIcon size={12} />
                        {s.delta !== 0 ? Math.abs(s.delta) : ''}
                      </span>
                    )}
                  </span>

                  <span
                    style={{
                      ...pill,
                      textAlign: 'center',
                      background: needsWork ? C.warnTint : C.lineSoft,
                      color: needsWork ? C.warn : C.ink2,
                      borderRadius: R.pill,
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}