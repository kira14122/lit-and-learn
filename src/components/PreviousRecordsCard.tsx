import React from 'react';
import { C, S, R, T, NUM, card, cardBody, pill, tintPill, btn, disclosure } from './portalTokens';
import { IconTrash, IconEdit, IconSend, IconCheck, IconChevronDown, IconChevronRight } from './portalIcons';

// Collapsible list of a student's saved grade records, with per-record
// send / edit / delete actions. All behavior is passed in as callbacks;
// this component holds no state of its own.
//
// Restyled onto portalTokens. No logic changed — the same status branching,
// the same callbacks, the same `formatScoreDisplay` contract.
//
// The local IconTrash / IconEdit definitions are gone; both now come from the
// shared set so stroke weight can't drift between files. The ✏️ and ✉ glyphs
// are replaced by real icons.
//
// Status badges follow the exception rule: "Emailed" is the expected outcome,
// so it reads quiet grey with a check rather than green. Amber is kept for the
// two states that actually want the teacher to do something — a record saved
// but never sent, and an absence.
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
    <div style={{ flexShrink: 0 }}>
      <button onClick={onToggle} style={disclosure}>
        <span style={{ display: 'flex', alignItems: 'center', gap: S.md }}>
          <span style={T.title}>Previous records</span>
          <span style={{ ...pill, ...NUM }}>{records.length}</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: C.ink3, fontSize: '13px', fontWeight: 500 }}>
          {show ? 'Hide' : 'Show'}
          {show ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </span>
      </button>

      {show && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.md, marginTop: S.md }}>
          {records.map(hist => (
            <div key={hist.id} style={card}>
              {editingRecordId === hist.id ? (
                <div style={{ ...cardBody, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: S.md }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: S.sm, fontSize: '15px', fontWeight: 500, color: C.accent }}>
                    <IconEdit /> Editing {hist.assessment_name} in the panel above
                  </span>
                  <button onClick={onCancelEdit} style={btn('default', { flexShrink: 0 })}>Cancel</button>
                </div>
              ) : (
                <div style={cardBody}>
                  {(() => {
                    let st: any = {};
                    try { st = JSON.parse(hist.score) || {}; } catch { /* keep defaults */ }
                    const isNA     = !!st.notApplicable;
                    const isAbs    = !!st.isAbsent;
                    const isUnsent = !isNA && st.emailed === false;

                    const badge = isNA
                      ? { t: 'Not applicable', fg: C.ink2, bg: C.lineSoft, icon: false }
                      : isUnsent
                      ? { t: 'Saved · not emailed', fg: C.warn, bg: C.warnTint, icon: false }
                      : isAbs
                      ? { t: 'Absent · 0%', fg: C.warn, bg: C.warnTint, icon: false }
                      : { t: 'Emailed', fg: C.ink2, bg: C.lineSoft, icon: true };

                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: S.md, marginBottom: S.lg, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: S.sm, marginBottom: S.xs, flexWrap: 'wrap' }}>
                            <span style={T.title}>{hist.assessment_name}</span>
                            <span style={{ ...tintPill(badge.fg, badge.bg), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {badge.icon && <IconCheck size={12} strokeWidth={2} />}
                              {badge.t}
                            </span>
                          </div>
                          <span style={{ ...T.meta, ...NUM, color: C.ink3 }}>
                            {new Date(hist.date_recorded).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: S.sm, flexShrink: 0 }}>
                          {isUnsent && (
                            <button
                              onClick={() => onSend(hist)}
                              disabled={isSubmitting}
                              style={btn('primary', { cursor: isSubmitting ? 'wait' : 'pointer' })}
                            >
                              <IconSend /> Send
                            </button>
                          )}
                          <button onClick={() => onEdit(hist)} style={btn('default')}>
                            <IconEdit /> Edit
                          </button>
                          <button onClick={() => onDelete(hist.id)} style={btn('danger')} aria-label="Delete record">
                            <IconTrash /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div
                    style={{
                      ...NUM,
                      background: C.sunken,
                      border: `1px solid ${C.lineSoft}`,
                      borderRadius: R.control,
                      padding: `${S.md} ${S.lg}`,
                      ...T.meta, lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {formatScoreDisplay(hist.score)}
                  </div>

                  {hist.feedback && (
                    <p
                      style={{
                        margin: `${S.lg} 0 0`,
                        paddingLeft: S.lg,
                        borderLeft: `2px solid ${C.line}`,
                        borderRadius: 0,
                        ...T.body, color: C.ink2, lineHeight: 1.7,
                        fontFamily: "'Fraunces', Georgia, serif",
                      }}
                    >
                      {hist.feedback}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}