import React from 'react';
import { urlFor } from '../sanityClient';

/*
  RecentReviews — homepage "Recently reviewed" strip.

  A standalone, presentational lift of the swipe carousel already living inside
  BookReviews.tsx, so it looks identical to the Book Reviews page it links to.
  It receives the same `reviews` array and `onSelectBook` handler that App.tsx
  already passes to <BookReviews />, plus an optional `onViewAll` for the header
  link. Drop it into the homepage between the course shelf and the footer:

    <RecentReviews
      reviews={reviews}
      onSelectBook={handleSelectBook}
      onViewAll={() => setView('bookReviews')}
    />
*/

// CEFR level -> badge colors. Copied verbatim from BookReviews.tsx so the two
// stay in lockstep: A = green (starter), B = amber (intermediate), C = coral
// (advanced), anything non-CEFR falls back to indigo.
const levelStyle = (level: any) => {
  const L = (level == null ? '' : String(level)).trim().toUpperCase();
  if (L.startsWith('A')) return { bg: '#ECFDF5', color: '#047857' };
  if (L.startsWith('B')) return { bg: '#FEF3C7', color: '#B45309' };
  if (L.startsWith('C')) return { bg: '#FEF2F2', color: '#DC2626' };
  return { bg: '#EEF2FF', color: '#4F46E5' };
};

interface RecentReviewsProps {
  reviews: any[];
  onSelectBook: (book: any) => void;
  onViewAll?: () => void;
  // How many covers to show in the strip. Defaults to 6 for a homepage teaser
  // (the Book Reviews page itself shows 8).
  limit?: number;
}

export const RecentReviews = ({
  reviews,
  onSelectBook,
  onViewAll,
  limit = 6,
}: RecentReviewsProps) => {

  // Most recent reviews across everything, newest first (Sanity's _createdAt).
  const recentReviews = [...(reviews || [])]
    .sort((a, b) => {
      const da = a && a._createdAt ? new Date(a._createdAt).getTime() : 0;
      const db = b && b._createdAt ? new Date(b._createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);

  // Nothing published yet -> render nothing, so the homepage never shows an
  // empty shelf. (The course section above already carries the page.)
  if (recentReviews.length === 0) return null;

  // Locked 3:4 portrait cover box: image is absolutely positioned inside a
  // padding-percentage box so every cover is the same height regardless of the
  // source proportions. Falls back to the title on a tinted panel (same as
  // BookReviews.tsx).
  const Cover = ({ book }: { book: any }) => (
    <div style={{ position: 'relative', width: '100%', paddingTop: '133.333%', borderRadius: '11px', overflow: 'hidden', background: '#F1F5F9' }}>
      {book.coverImage
        ? <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8px', color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{book.title}</span>}
    </div>
  );

  const LevelBadge = ({ level }: { level: any }) => {
    const s = levelStyle(level);
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '7px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>{level}</span>;
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto 36px' }}>
      <style>{`
        .rr-scroll::-webkit-scrollbar { display: none; }
        .rr-scroll { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; }
        .rr-cov { scroll-snap-align: start; flex: 0 0 156px; min-width: 0; }
        .rr-label { font-size: 1.05rem; font-weight: 600; color: #475569; }
        .rr-viewall { font-size: 0.85rem; font-weight: 600; color: #4F46E5; background: none; border: none; cursor: pointer; font-family: "Fredoka", sans-serif; display: inline-flex; align-items: center; gap: 4px; padding: 0; }
        @media (min-width: 720px) {
          .rr-cov { flex: 0 0 190px; }
          .rr-label { font-size: 1.2rem; }
        }
      `}</style>

      {/* Warm-toned band: the "literary" half of the page, distinct from the
          cooler Recently-added band. Bleeds by its padding so the content lines
          up with the sections above. */}
      <div style={{ background: '#F2F0EA', borderRadius: '24px', padding: '22px 24px', margin: '0 -24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="rr-label">Recently reviewed</span>
          {onViewAll
            ? <button onClick={onViewAll} className="rr-viewall">All reviews &rarr;</button>
            : <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94A3B8' }}>swipe &rarr;</span>}
        </div>

        <div className="rr-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px 2px 8px' }}>
          {recentReviews.map(book => (
            <button
              key={book._id}
              onClick={() => onSelectBook(book)}
              className="soft-card rr-cov"
              style={{ background: '#ffffff', border: '1px solid #ECEEF3', borderRadius: '18px', padding: '10px', boxShadow: '0 12px 28px -18px rgba(15,23,42,0.22)', cursor: 'pointer', textAlign: 'left', fontFamily: '"Fredoka", sans-serif', transition: 'all 0.3s' }}
            >
              <Cover book={book} />
              <div style={{ padding: '10px 5px 4px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.2, height: '2.4em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</div>
                <div style={{ fontSize: '0.76rem', color: '#94A3B8', height: '1.2em', margin: '3px 0 9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author || '\u00A0'}</div>
                <div style={{ minHeight: '24px' }}>{book.level && <LevelBadge level={book.level} />}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};