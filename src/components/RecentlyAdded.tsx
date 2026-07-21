import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';

/*
  RecentlyAdded — the homepage "pulse". A gently auto-scrolling strip of the
  newest teaching material, with a branded in-app viewer so readers never leave
  litnlearn.com to open a file.

  Behavior:
   - One card per topic. Lesson (resource) always wins over its matching practice.
   - Topics ordered by most recent activity, newest first.
   - Cards drift left continuously (marquee), pause on hover, and respect the
     user's "reduced motion" setting (those users get a normal scroll row).
   - Click a lesson -> opens its PDF/audio inside a branded modal (address bar
     stays on your domain). Click a practice -> opens that exact practice.
*/

const FEED_QUERY = `*[_type in ["resource", "practiceBank"]] | order(_createdAt desc)[0...$fetchLimit]{
  _id, _type, title, category, isGeneral, _createdAt,
  "fileUrl": file.asset->url,
  "audioUrl": audio.asset->url
}`;

const CAT: Record<string, { bg: string; color: string }> = {
  Grammar:       { bg: '#EEF2FF', color: '#4F46E5' },
  Vocabulary:    { bg: '#FEF3C7', color: '#B45309' },
  Reading:       { bg: '#ECFDF5', color: '#10B981' },
  Listening:     { bg: '#E0F2FE', color: '#0284C7' },
  Writing:       { bg: '#F5F3FF', color: '#7C3AED' },
  Pronunciation: { bg: '#FFE4E6', color: '#E11D48' },
  _default:      { bg: '#F1F5F9', color: '#64748B' },
};

// Gradient tiles, matching the course cards so both sections share one style.
const CAT_GRAD: Record<string, string> = {
  Grammar:       'linear-gradient(140deg, #6366F1, #4338CA)',
  Vocabulary:    'linear-gradient(140deg, #FBBF24, #D97706)',
  Reading:       'linear-gradient(140deg, #34D399, #059669)',
  Listening:     'linear-gradient(140deg, #38BDF8, #0284C7)',
  Writing:       'linear-gradient(140deg, #A78BFA, #7C3AED)',
  Pronunciation: 'linear-gradient(140deg, #FB7185, #E11D48)',
  _default:      'linear-gradient(140deg, #94A3B8, #64748B)',
};

const KindIcon = ({ kind, color }: { kind: string; color: string }) => {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'Practice': return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.5" fill={color}/></svg>;
    case 'Text':     return <svg {...p}><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>;
    case 'Audio':    return <svg {...p}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
    case 'Guide':    return <svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    default:         return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>;
  }
};

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

type FeedItem = {
  _id: string; _type: string; title?: string; category?: string;
  isGeneral?: boolean; _createdAt: string; fileUrl?: string; audioUrl?: string;
};

type Viewer = { title: string; url: string; isAudio: boolean } | null;

export const RecentlyAdded = ({
  onNavigate,
  limit = 8,
}: {
  onNavigate: (path?: string) => void;
  limit?: number;
}) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [viewer, setViewer] = useState<Viewer>(null);
  // Read the user's motion preference once; drives marquee vs. plain scroll.
  const [reduceMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    let alive = true;
    client
      .fetch(FEED_QUERY, { fetchLimit: limit * 3 })
      .then((res: FeedItem[]) => {
        if (!alive) return;
        type Group = { chosen: FeedItem; recency: number };
        const groups = new Map<string, Group>();
        for (const item of res || []) {
          const key = (item.title || '').trim().toLowerCase();
          if (!key) continue;
          const t = new Date(item._createdAt).getTime();
          const g = groups.get(key);
          if (!g) { groups.set(key, { chosen: item, recency: t }); continue; }
          g.recency = Math.max(g.recency, t);
          const chosenIsResource = g.chosen._type === 'resource';
          const chosenT = new Date(g.chosen._createdAt).getTime();
          if (item._type === 'resource') {
            if (!chosenIsResource || t > chosenT) g.chosen = item;
          } else if (!chosenIsResource && t > chosenT) {
            g.chosen = item;
          }
        }
        const list = Array.from(groups.values())
          .sort((a, b) => b.recency - a.recency)
          .slice(0, limit)
          .map((g) => g.chosen);
        setItems(list);
      })
      .catch(console.error);
    return () => { alive = false; };
  }, [limit]);

  // Lock background scroll while the viewer modal is open.
  useEffect(() => {
    if (!viewer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [viewer]);

  if (items.length === 0) return null;

  const resolve = (item: FeedItem) => {
    const isPractice = item._type === 'practiceBank';
    const isGuide = item._type === 'resource' && item.isGeneral;
    let kind = 'Lesson';
    if (isPractice) kind = 'Practice';
    else if (isGuide) kind = 'Guide';
    else if (item.category === 'Reading') kind = 'Text';
    else if (item.category === 'Listening') kind = 'Audio';
    const catName = item.category || 'Resource';
    const style = CAT[item.category || ''] || CAT._default;
    return { isPractice, kind, catName, style };
  };

  const openItem = (item: FeedItem) => {
    if (item._type === 'practiceBank') {
      onNavigate(`/practice?topic=${encodeURIComponent(item._id)}`);
      return;
    }
    const url = item.fileUrl || item.audioUrl;
    if (url) {
      setViewer({ title: item.title || 'Resource', url, isAudio: !item.fileUrl && !!item.audioUrl });
      return;
    }
    onNavigate(item.category ? `/resources?cat=${encodeURIComponent(item.category)}` : '/resources');
  };

  const Card = ({ item }: { item: FeedItem }) => {
    const { kind, catName, style } = resolve(item);
    const grad = CAT_GRAD[item.category || ''] || CAT_GRAD._default;
    return (
      <button
        onClick={() => openItem(item)}
        className="ll-ra-card"
        style={{
          flex: '0 0 auto', width: '290px', display: 'flex', alignItems: 'center', gap: '13px',
          background: '#ffffff', border: '1px solid #ECEEF3',
          borderRadius: '16px', padding: '14px 15px', textAlign: 'left', cursor: 'pointer',
          fontFamily: '"Fredoka", sans-serif', transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 12px 28px -20px rgba(15,23,42,0.25)',
        }}
      >
        <span style={{ flex: '0 0 auto', width: '42px', height: '42px', borderRadius: '13px', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 14px -7px ${style.color}99` }}>
          <KindIcon kind={kind} color="#ffffff" />
        </span>
        <span style={{ flex: '1 1 auto', minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.25 }}>{item.title || 'Untitled'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '5px' }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: style.color, background: style.bg, padding: '2px 7px', borderRadius: '9999px' }}>{catName}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{kind} · {timeAgo(item._createdAt)}</span>
          </span>
        </span>
      </button>
    );
  };

  // Duplicate the set for a seamless loop (motion only).
  const marqueeItems = reduceMotion ? items : [...items, ...items];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto 40px', fontFamily: '"Fredoka", sans-serif' }}>
      <style>{`
        @keyframes llRAmarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes llRApulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.8); } }
        .ll-ra-track { display: flex; gap: 14px; width: max-content; animation: llRAmarquee 55s linear infinite; }
        .ll-ra-wrap:hover .ll-ra-track { animation-play-state: paused; }
        .ll-ra-card:hover { transform: translateY(-2px); box-shadow: 0 12px 26px -14px rgba(0,0,0,0.18); }
        .ll-ra-dot { width: 8px; height: 8px; border-radius: 9999px; background: #10B981; animation: llRApulse 1.8s ease-in-out infinite; }
        .ll-ra-scroll { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 6px; -ms-overflow-style: none; scrollbar-width: none; }
        .ll-ra-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .ll-ra-track { animation: none; } }
      `}</style>

      <div style={{ background: '#E9EBF4', borderRadius: '24px', padding: '22px 24px', margin: '0 -24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 600, color: '#475569' }}>Recently added</span>
          <span className="ll-ra-dot" title="Updated live" />
        </span>
        <button onClick={() => onNavigate('/resources')} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Fredoka", sans-serif' }}>Browse all →</button>
      </div>

      {reduceMotion ? (
        <div className="ll-ra-scroll">
          {items.map((item) => <Card key={item._id} item={item} />)}
        </div>
      ) : (
        <div
          className="ll-ra-wrap"
          style={{
            overflow: 'hidden',
            WebkitMaskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
          }}
        >
          <div className="ll-ra-track">
            {marqueeItems.map((item, i) => <Card key={item._id + '-' + i} item={item} />)}
          </div>
        </div>
      )}
      </div>

      {/* Branded in-app viewer — keeps the reader on litnlearn.com */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '960px', height: viewer.isAudio ? 'auto' : '88vh', background: '#ffffff', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{viewer.title}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '0 0 auto' }}>
                <a href={viewer.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5', textDecoration: 'none' }}>Open ↗</a>
                <button onClick={() => setViewer(null)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.3rem', lineHeight: 1, padding: 0 }}>×</button>
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: '#F8FAFC' }}>
              {viewer.isAudio
                ? <div style={{ padding: '28px' }}><audio controls style={{ width: '100%' }} src={viewer.url} /></div>
                : <iframe title={viewer.title} src={viewer.url} style={{ width: '100%', height: '100%', border: 'none' }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};