import React from 'react';
import { urlFor } from '../sanityClient';

// --- Icons (local to Book Reviews) ---
const IconFiction = ({ size = 18 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>);
const IconNonFiction = ({ size = 18 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>);
const IconChevronRight = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>);

// --- Local BackButton (mirrors App's shared one; uses the global .back-btn hover styles) ---
const BackButton = ({ onClick, text }: { onClick: () => void, text: string }) => (
  <button onClick={onClick} className="back-btn" style={{ background: '#ffffff', color: '#4F46E5', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    {text}
  </button>
);

// --- Constants (local to Book Reviews) ---
const fictionCategories = ["British Literature", "American Literature", "Russian Literature", "French Literature", "Arabic Literature", "Other Literature"];
const nonFictionCategories = ["Informative & Educational", "Self Improvement", "Language Learning & Teaching"];

// --- Helpers ---
const safeLower = (val: any) => typeof val === 'string' ? val.toLowerCase().trim() : '';
const getMainCat = (rev: any) => safeLower(rev.mainCategory) || safeLower(rev.category) || 'fiction';
const getSubCat = (rev: any) => safeLower(rev.subCategory) || safeLower(rev.genre) || '';

// CEFR level -> badge colors. A=green (starter), B=amber (intermediate), C=coral (advanced).
// Anything that isn't a standard CEFR code falls back to the original indigo, so nothing breaks.
const levelStyle = (level: any) => {
  const L = (level == null ? '' : String(level)).trim().toUpperCase();
  if (L.startsWith('A')) return { bg: '#ECFDF5', color: '#047857' };
  if (L.startsWith('B')) return { bg: '#FEF3C7', color: '#B45309' };
  if (L.startsWith('C')) return { bg: '#FEF2F2', color: '#DC2626' };
  return { bg: '#EEF2FF', color: '#4F46E5' };
};

const styles: any = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },
  card: { backgroundColor: '#ffffff', borderRadius: '32px', overflow: 'visible', border: '1px solid #F1F5F9', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' },
  readMoreBtn: { fontFamily: '"Fredoka", sans-serif', background: '#F8FAFC', border: 'none', color: '#4F46E5', fontWeight: '600', fontSize: '1.05rem', padding: '12px 20px', borderRadius: '16px', marginTop: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', width: '100%' },
};

interface BookReviewsProps {
  reviews: any[];
  bookCategory: string | null;
  setBookCategory: (val: string | null) => void;
  activeSubCategory: string | null;
  setActiveSubCategory: (val: string | null) => void;
  onSelectBook: (book: any) => void;
}

export const BookReviews = ({
  reviews,
  bookCategory,
  setBookCategory,
  activeSubCategory,
  setActiveSubCategory,
  onSelectBook,
}: BookReviewsProps) => {

  // Most recent reviews across everything, newest first (uses Sanity's built-in _createdAt).
  const recentReviews = [...reviews]
    .sort((a, b) => {
      const da = a && a._createdAt ? new Date(a._createdAt).getTime() : 0;
      const db = b && b._createdAt ? new Date(b._createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 8);

  const fictionCount = reviews.filter(r => getMainCat(r) === 'fiction').length;
  const nonFictionCount = reviews.filter(r => getMainCat(r) === 'non-fiction').length;

  const genreCount = (cat: string) => {
    if (!bookCategory) return 0;
    return reviews.filter(r => getMainCat(r) === bookCategory.toLowerCase().trim() && getSubCat(r) === cat.toLowerCase().trim()).length;
  };

  const displayedReviews = reviews.filter(rev => {
    if (!bookCategory || !activeSubCategory) return false;
    return getMainCat(rev) === bookCategory.toLowerCase().trim() && getSubCat(rev) === activeSubCategory.toLowerCase().trim();
  });

  // Small reusable cover image / placeholder for the carousel.
  // Padding-percentage box (133.333% = a 3:4 portrait) with the image absolutely
  // positioned, so the image can NEVER stretch the box past the ratio. Every cover
  // is therefore exactly the same height regardless of the source image proportions.
  const Cover = ({ book }: { book: any }) => (
    <div style={{ position: 'relative', width: '100%', paddingTop: '133.333%', borderRadius: '11px', overflow: 'hidden', background: '#F1F5F9' }}>
      {book.coverImage
        ? <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8px', color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{book.title}</span>}
    </div>
  );

  const LevelBadge = ({ level, big = false }: { level: any, big?: boolean }) => {
    const s = levelStyle(level);
    return <span style={{ background: s.bg, color: s.color, padding: big ? '6px 12px' : '3px 10px', borderRadius: big ? '8px' : '7px', fontSize: big ? '0.85rem' : '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>{level}</span>;
  };

  return (
    <div>
      <style>{`
        .br-scroll::-webkit-scrollbar { display: none; }
        .br-scroll { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; }
        .br-cov { scroll-snap-align: start; flex: 0 0 156px; min-width: 0; }
        .br-cat-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .br-section { max-width: 1180px; margin: 0 auto; }
        .br-label { font-size: 1.05rem; font-weight: 600; color: #475569; }
        .br-cat-card { padding: 22px; }
        .br-cat-icon { width: 60px; height: 60px; }
        .br-cat-name { font-size: 1.4rem; }
        .br-genre { padding: 16px 18px; }
        .br-genre-icon { width: 42px; height: 42px; border-radius: 13px; }
        .br-genre-name { font-size: 1.1rem; }
        .br-genre-pill { padding: 4px 12px; font-size: 0.78rem; }
        @media (min-width: 720px) {
          .br-cat-grid { grid-template-columns: 1fr 1fr; gap: 22px; }
          .br-cov { flex: 0 0 194px; }
          .br-label { font-size: 1.2rem; }
          .br-cat-card { padding: 30px 28px; }
          .br-cat-icon { width: 68px; height: 68px; }
          .br-cat-name { font-size: 1.65rem; }
          .br-genre { padding: 22px 26px; }
          .br-genre-icon { width: 50px; height: 50px; border-radius: 15px; }
          .br-genre-name { font-size: 1.32rem; }
          .br-genre-pill { padding: 7px 16px; font-size: 0.88rem; }
        }
      `}</style>

      {!bookCategory ? (
        /* ================= LANDING ================= */
        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>

          {recentReviews.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="br-section" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="br-label">Recently reviewed</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94A3B8' }}>swipe &rarr;</span>
              </div>
              <div className="br-scroll br-section" style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px 2px 8px' }}>
                {recentReviews.map(book => (
                  <button
                    key={book._id}
                    onClick={() => onSelectBook(book)}
                    className="soft-card br-cov"
                    style={{ background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '18px', padding: '10px', boxShadow: '0 8px 22px -12px rgba(0,0,0,0.10)', cursor: 'pointer', textAlign: 'left', fontFamily: '"Fredoka", sans-serif', transition: 'all 0.3s' }}
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
          )}

          <div className="br-section">
            <div className="br-label" style={{ margin: '0 0 16px 0' }}>Browse by category</div>
            <div className="br-cat-grid">

              <button onClick={() => setBookCategory('Fiction')} className="soft-card br-cat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', fontFamily: '"Fredoka", sans-serif', boxShadow: '0 10px 36px -16px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>
                <div className="br-cat-icon" style={{ flex: '0 0 auto', background: '#EEF2FF', color: '#4F46E5', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFiction size={28} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="br-cat-name" style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.1 }}>Fiction</div>
                  <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginTop: '4px' }}>{fictionCount} review{fictionCount !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ flex: '0 0 auto', color: '#CBD5E1' }}><IconChevronRight size={22} /></div>
              </button>

              <button onClick={() => setBookCategory('Non-Fiction')} className="soft-card br-cat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', fontFamily: '"Fredoka", sans-serif', boxShadow: '0 10px 36px -16px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>
                <div className="br-cat-icon" style={{ flex: '0 0 auto', background: '#FEF2F2', color: '#EF4444', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconNonFiction size={28} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="br-cat-name" style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.1 }}>Non-Fiction</div>
                  <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginTop: '4px' }}>{nonFictionCount} review{nonFictionCount !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ flex: '0 0 auto', color: '#CBD5E1' }}><IconChevronRight size={22} /></div>
              </button>

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '22px 0 0 0', paddingTop: '16px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>Level colors:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#475569' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#ECFDF5', border: '1px solid #A7F3D0' }} />A1&ndash;A2</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#475569' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#FEF3C7', border: '1px solid #FCD34D' }} />B1&ndash;B2</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#475569' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#FEF2F2', border: '1px solid #FCA5A5' }} />C1&ndash;C2</span>
            </div>
          </div>

        </div>
      ) : !activeSubCategory ? (
        /* ================= GENRE SELECT ================= */
        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <BackButton onClick={() => setBookCategory(null)} text="Back to Library" />
            <h3 style={{ fontSize: '2.2rem', color: '#0F172A', margin: '18px 0 4px 0' }}>Select a Genre</h3>
            <p style={{ color: '#64748B', fontSize: '1.05rem', margin: '0 0 24px 0', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', width: '24px', height: '24px', borderRadius: '8px', background: bookCategory === 'Fiction' ? '#EEF2FF' : '#FEF2F2', color: bookCategory === 'Fiction' ? '#4F46E5' : '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                {bookCategory === 'Fiction' ? <IconFiction size={14} /> : <IconNonFiction size={14} />}
              </span>
              {bookCategory}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(bookCategory === 'Fiction' ? fictionCategories : nonFictionCategories).map(cat => {
                const count = genreCount(cat);
                const tintBg = bookCategory === 'Fiction' ? '#EEF2FF' : '#FEF2F2';
                const tintColor = bookCategory === 'Fiction' ? '#4F46E5' : '#EF4444';
                if (count === 0) {
                  return (
                    <div key={cat} className="br-genre" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: '20px', opacity: 0.6 }}>
                      <div className="br-genre-icon" style={{ flex: '0 0 auto', background: '#F1F5F9', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFiction size={20} /></div>
                      <div className="br-genre-name" style={{ flex: 1, minWidth: 0, fontWeight: 600, color: '#94A3B8', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</div>
                      <span style={{ flex: '0 0 auto', background: '#F1F5F9', color: '#94A3B8', padding: '5px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600 }}>Soon</span>
                    </div>
                  );
                }
                return (
                  <button key={cat} onClick={() => setActiveSubCategory(cat)} className="soft-card br-genre" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', fontFamily: '"Fredoka", sans-serif', boxShadow: '0 8px 24px -16px rgba(0,0,0,0.10)', transition: 'all 0.3s' }}>
                    <div className="br-genre-icon" style={{ flex: '0 0 auto', background: tintBg, color: tintColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFiction size={20} /></div>
                    <div className="br-genre-name" style={{ flex: 1, minWidth: 0, fontWeight: 600, color: '#0F172A', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</div>
                    <span className="br-genre-pill" style={{ flex: '0 0 auto', background: tintBg, color: tintColor, borderRadius: '9999px', fontWeight: 700 }}>{count} review{count !== 1 ? 's' : ''}</span>
                    <span style={{ flex: '0 0 auto', color: '#CBD5E1' }}><IconChevronRight size={22} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================= BOOK GRID ================= */
        <div style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          <div style={{ marginBottom: '30px' }}>
            <BackButton onClick={() => setActiveSubCategory(null)} text="Back to Genres" />
            <h3 style={{ fontSize: '2.2rem', color: '#0F172A', margin: '16px 0 4px 0' }}>{activeSubCategory}</h3>
            <span style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '500' }}>{bookCategory}</span>
          </div>
          <div style={styles.grid}>
            {displayedReviews.length > 0 ? displayedReviews.map(book => (
              <div key={book._id} className="soft-card" style={styles.card}>
                <div style={{ padding: '16px 16px 0 16px' }}>{book.coverImage ? ( <img src={urlFor(book.coverImage).url()} alt={book.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px' }} /> ) : ( <div style={{ width: '100%', aspectRatio: '3/4', background: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500' }}>No Cover Image</div> )}</div>
                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: '600', color: '#0F172A', textAlign: 'center', lineHeight: '1.2' }}>{book.title}</h3>
                  {book.author && <span style={{ color: '#64748B', fontSize: '1.05rem', marginBottom: '16px', textAlign: 'center' }}>{book.author}</span>}
                  <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                    {book.level && <span style={levelStyleInline(book.level)}>{book.level}</span>}
                    {book.content && ( <button style={styles.readMoreBtn} onClick={() => onSelectBook(book)}>Read Review</button> )}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94A3B8', background: '#ffffff', borderRadius: '32px', border: '2px dashed #E2E8F0' }}>
                <h3 style={{ fontWeight: '600', margin: 0, fontSize: '1.5rem', color: '#475569' }}>No books found</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem' }}>Reviews for this category haven't been published yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline badge style for the book-grid card (matches LevelBadge "big" sizing).
function levelStyleInline(level: any): any {
  const s = levelStyle(level);
  return { background: s.bg, color: s.color, padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' };
}