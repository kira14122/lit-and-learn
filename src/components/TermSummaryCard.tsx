import React from 'react';
import { C, S, R, T, NUM, card, cardHead, cardBody } from './portalTokens';

// Presentational card for the term-at-a-glance summary.
// Receives the computed `summary` object (see termSummary in TeacherDashboard):
//   { tests[], takenCount, assessedWeight, earnedSum, standing, allDone }
//
// Restyled onto portalTokens. No logic changed: the same fields are read, the
// same statuses are branched on, the same numbers are rendered.
//
// One deliberate change in how colour is used. Previously every graded test
// coloured its headline figure green, amber or red. That meant four coloured
// numbers on a healthy student — colour as decoration. Here a passing mark is
// simply ink, and tone appears only when a mark is *below* the line. The eye
// then goes straight to the one test that needs attention.
export function TermSummaryCard({ summary }: { summary: any }) {
  return (
    <div style={card}>
      <div style={cardHead}>
        <span style={T.title}>Term summary</span>
        <span style={{ ...T.meta, color: C.ink3 }}>
          <span style={NUM}>{summary.takenCount}</span> of 4 tests · <span style={NUM}>{summary.assessedWeight}%</span> of grade assessed
        </span>
      </div>

      <div style={cardBody}>
        <div style={{ display: 'flex', gap: S.sm, flexWrap: 'wrap' }}>
          {summary.tests.map((t: any) => {
            const graded  = t.status === 'graded';
            const pending = t.status === 'pending';
            const na      = t.status === 'na';
            const faded   = pending || na;

            // Colour marks the exception only. At or above the line: no colour.
            const tone =
              graded ? (t.mastery >= 70 ? C.ink : t.mastery >= 55 ? C.warn : C.bad)
              : t.status === 'absent' ? C.warn
              : C.ink3;

            const big =
              graded ? `${Math.round(t.mastery)}%`
              : t.status === 'absent' ? 'Absent'
              : na ? 'N/A'
              : '—';

            const sub =
              graded ? `earns ${(t.earnedWeight || 0).toFixed(1)} / ${t.weight}%`
              : t.status === 'absent' ? `0 / ${t.weight}%`
              : na ? 'excluded'
              : 'not taken yet';

            const label =
              t.name === 'Third Test' ? 'Third'
              : t.name === 'Final Test' ? 'Final'
              : t.name;

            return (
              <div
                key={t.name}
                style={{
                  flex: '1 1 110px', minWidth: 0,
                  border: `1px solid ${C.line}`,
                  borderStyle: faded ? 'dashed' : 'solid',
                  borderRadius: R.control,
                  padding: `${S.md} ${S.md}`,
                  display: 'flex', flexDirection: 'column', gap: S.xs,
                  opacity: faded ? 0.65 : 1,
                }}
              >
                <span style={T.micro}>{label}</span>
                <span style={{ ...T.title, ...NUM, fontWeight: 600, color: tone }}>{big}</span>
                <span style={{ ...T.micro, ...NUM, textTransform: 'none', letterSpacing: 0, color: C.ink3 }}>{sub}</span>
              </div>
            );
          })}
        </div>

        {summary.standing != null && (
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              gap: S.md, marginTop: S.xl, paddingTop: S.lg,
              borderTop: `1px solid ${C.lineSoft}`,
            }}
          >
            <div>
              <div style={{ ...T.micro, marginBottom: S.xs }}>
                {summary.allDone ? 'Final grade' : 'Grade so far'}
              </div>
              <div style={{ ...T.meta, color: C.ink3 }}>
                {summary.allDone ? 'All four tests recorded' : 'Of the tests taken to date'}
              </div>
            </div>
            <span style={{ ...T.displayLg, ...NUM, color: C.accent }}>
              {Math.round(summary.standing)}<span style={{ fontSize: '18px' }}>%</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}