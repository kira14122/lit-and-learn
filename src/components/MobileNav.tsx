import React, { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

// ============================================================================
// MobileNav — a self-contained, MOBILE-ONLY slide-in menu.
// It appears only at <=768px wide. On desktop it renders nothing visible and
// leaves the existing tab row completely untouched.
//
// Everything about how it looks lives in this one file — colours, sizes,
// animation, icons. Edit freely here; the main app is never affected.
// ============================================================================

type Tab = { name: string; path: string };

interface MobileNavProps {
  TABS: Tab[];
  currentPath: string;
  onNavigate: (path?: string) => void;
}

const PURPLE = '#4F46E5';

// A small icon per tab (matched by path). Add a case here if you add a tab.
const tabIcon = (path: string) => {
  const c = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (path) {
    case '/':          return (<svg {...c}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>);
    case '/practice':  return (<svg {...c}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>);
    case '/reviews':   return (<svg {...c}><polygon points="12 2 15 9 22 9.5 17 14 18.5 21 12 17 5.5 21 7 14 2 9.5 9 9" /></svg>);
    case '/resources': return (<svg {...c}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>);
    case '/progress':  return (<svg {...c}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>);
    case '/admin':     return (<svg {...c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
    case '/about':     return (<svg {...c}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);
    case '/contact':   return (<svg {...c}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
    default:           return (<svg {...c}><circle cx="12" cy="12" r="9" /></svg>);
  }
};

export function MobileNav({ TABS, currentPath, onNavigate }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Lock background scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => { onNavigate(path); setOpen(false); };

  return (
    <>
      <style>{`
        /* Hidden on desktop — the existing tab row stays exactly as-is there. */
        .ll-mnav-trigger { display: none; }

        @media (max-width: 768px) {
          /* Hide the existing horizontal scroll row on phones. */
          nav.mobile-nav-container { display: none !important; }

          /* Floating menu button, top-right. */
          .ll-mnav-trigger {
            display: flex; align-items: center; justify-content: center;
            position: fixed; top: 14px; right: 16px; z-index: 900;
            width: 46px; height: 46px; border-radius: 14px;
            background: #ffffff; border: 1px solid #E2E8F0; color: #334155;
            box-shadow: 0 6px 16px rgba(15,23,42,0.08); cursor: pointer;
          }
        }

        @media (min-width: 769px) {
          /* Belt and suspenders: never show the menu on desktop. */
          .ll-mnav-trigger, .ll-mnav-scrim { display: none !important; }
        }

        .ll-mnav-scrim {
          position: fixed; inset: 0; z-index: 2000; overflow: hidden;
          background: rgba(15,23,42,0); visibility: hidden;
          transition: background .3s ease, visibility .3s ease;
        }
        .ll-mnav-scrim.is-open { background: rgba(15,23,42,0.40); visibility: visible; }

        .ll-mnav-panel {
          position: absolute; top: 0; right: 0; height: 100%;
          width: 80%; max-width: 330px;
          background: #ffffff; box-shadow: -12px 0 30px rgba(15,23,42,0.12);
          transform: translateX(100%); transition: transform .3s ease;
          display: flex; flex-direction: column;
          font-family: 'Fredoka', sans-serif;
        }
        .ll-mnav-scrim.is-open .ll-mnav-panel { transform: translateX(0); }

        .ll-mnav-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 20px 16px; border-bottom: 1px solid #F1F5F9;
        }
        .ll-mnav-brand { font-size: 21px; font-weight: 700; color: #0F172A; }
        .ll-mnav-close {
          width: 42px; height: 42px; border-radius: 12px;
          background: #EEF2FF; color: #4F46E5; border: none;
          font-size: 19px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }

        /* ---- SIZE DIALS: nudge these to taste ----
           row height  -> .ll-mnav-item padding (first number = taller rows)
           text size   -> .ll-mnav-item font-size
           spacing     -> .ll-mnav-list gap
        */
        .ll-mnav-list {
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 12px; overflow-y: auto; flex: 1;
        }
        .ll-mnav-item {
          display: flex; align-items: center; gap: 15px; width: 100%;
          text-align: left; background: transparent; border: none; cursor: pointer;
          padding: 17px 16px; border-radius: 14px;
          font-family: inherit; font-size: 16.5px; font-weight: 500; color: #475569;
          border-bottom: 1px solid #F1F5F9;
        }
        .ll-mnav-item:last-child { border-bottom: none; }
        .ll-mnav-item .ll-mnav-ic { color: #64748B; display: flex; flex-shrink: 0; }
        .ll-mnav-item:active { background: #F1F5F9; }
        .ll-mnav-item.is-active { background: #EEF2FF; color: #4F46E5; font-weight: 600; }
        .ll-mnav-item.is-active .ll-mnav-ic { color: #4F46E5; }

        .ll-mnav-foot { padding: 16px 18px 22px; border-top: 1px solid #F1F5F9; }
        .ll-mnav-signin {
          width: 100%; background: #10B981; color: #ffffff; border: none;
          padding: 15px; border-radius: 9999px;
          font-family: inherit; font-size: 16px; font-weight: 600; cursor: pointer;
        }
        .ll-mnav-account { display: flex; align-items: center; gap: 12px; }
        .ll-mnav-account span { color: #475569; font-weight: 500; font-size: 16px; }
      `}</style>

      {/* Trigger (mobile only) */}
      <button className="ll-mnav-trigger" aria-label="Open menu" onClick={() => setOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
      </button>

      {/* Scrim + sliding panel */}
      <div className={`ll-mnav-scrim ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
        <aside className="ll-mnav-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
          <div className="ll-mnav-head">
            <span className="ll-mnav-brand">Lit <span style={{ color: PURPLE }}>&amp;</span> Learn</span>
            <button className="ll-mnav-close" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
          </div>

          <nav className="ll-mnav-list">
            {TABS.map(tab => (
              <button
                key={tab.path}
                className={`ll-mnav-item ${currentPath === tab.path ? 'is-active' : ''}`}
                onClick={() => go(tab.path)}
              >
                <span className="ll-mnav-ic">{tabIcon(tab.path)}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>

          <div className="ll-mnav-foot">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="ll-mnav-signin" onClick={() => setOpen(false)}>Sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="ll-mnav-account">
                <UserButton afterSignOutUrl="/" />
                <span>Your account</span>
              </div>
            </SignedIn>
          </div>
        </aside>
      </div>
    </>
  );
}