// src/components/gradingPolicy.ts
// ─────────────────────────────────────────────────────────────────────────────
// ONE source of truth for how much each test counts.
//
// The school changed its policy from Fall 2026:
//   Before : First Test 10% · Midterm 30% · Third Test 10% · Final Test 50%
//   Now    : First Test  0% · Midterm 50% · Third Test  0% · Final Test 50%
// The First and Third Tests are formative: marked out of 50 or 100 for
// feedback, but they carry no weight in the term grade.
//
// The weight is decided by the TERM a record belongs to, never by the number
// stored inside the record. That keeps Summer 2026 and earlier on the old
// weights, and corrects any Fall 2026 record saved before this change.
// ─────────────────────────────────────────────────────────────────────────────

export const CANON_TESTS = ['First Test', 'Midterm', 'Third Test', 'Final Test'] as const;

const OLD_WEIGHTS: Record<string, number> = { 'First Test': 10, 'Midterm': 30, 'Third Test': 10, 'Final Test': 50 };
const NEW_WEIGHTS: Record<string, number> = { 'First Test': 0,  'Midterm': 50, 'Third Test': 0,  'Final Test': 50 };

// Terms are labelled "Winter 2026", "Summer 2026", "Fall 2026" (in that order
// within a year). The new policy starts with Fall 2026.
const SEASON_ORDER: Record<string, number> = { Winter: 0, Summer: 1, Fall: 2 };
const NEW_POLICY_FROM = 2026 * 3 + SEASON_ORDER.Fall;

export const usesNewPolicy = (term?: string | null): boolean => {
  const m = String(term || '').trim().match(/^(Winter|Summer|Fall)\s+(\d{4})$/);
  if (!m) return true; // no recognisable term: assume the current policy
  return Number(m[2]) * 3 + SEASON_ORDER[m[1]] >= NEW_POLICY_FROM;
};

/** The % of the term grade a test is worth, for the term it belongs to. */
export const weightFor = (term: string | null | undefined, assessmentName: string): number => {
  const table = usesNewPolicy(term) ? NEW_WEIGHTS : OLD_WEIGHTS;
  return table[assessmentName] ?? 0;
};

/** A formative test is marked for feedback but carries no weight. */
export const isFormative = (term: string | null | undefined, assessmentName: string): boolean =>
  (CANON_TESTS as readonly string[]).includes(assessmentName) && weightFor(term, assessmentName) === 0;

/** Weighted contribution of a mark, worked out from the policy (not the stored value). */
export const earnedFor = (weight: number, totalPoints: number, maxPoints: number, isAbsent = false): number =>
  isAbsent || !maxPoints || !weight ? 0 : (totalPoints / maxPoints) * weight;