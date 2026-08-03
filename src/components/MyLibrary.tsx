import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';

// ── Icons (match the dashboard's stroke style) ──────────────────────────────
const IconSearch   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const IconUpload   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
const IconDownload = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconDownloadSm = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconFile     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>);
const IconLock     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const IconTrash    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const IconTrashSm  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const IconEdit     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const IconClose    = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const IconCloud    = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16l-4-4-4 4"></path><path d="M12 12v9"></path><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>);
const IconCheckSm  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const IconDatabase = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>);

// ── Taxonomy ────────────────────────────────────────────────────────────────
const SKILLS = ['Reading', 'Grammar', 'Vocabulary', 'Listening', 'Writing'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TYPES  = ['Activity', 'Worksheet', 'Lesson', 'Lesson plan'];

const QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB free-tier ceiling — change to 500*1024*1024 if your project is on the 500 MB tier

const SKILL_TAG: Record<string, { bg: string; fg: string }> = {
  Reading:    { bg: '#E1F5EE', fg: '#0F6E56' },
  Grammar:    { bg: '#EEEDFE', fg: '#3C3489' },
  Writing:    { bg: '#E6F1FB', fg: '#0C447C' },
  Vocabulary: { bg: '#FAECE7', fg: '#993C1D' },
  Listening:  { bg: '#FAEEDA', fg: '#854F0B' },
};
const tagColor = (s: string) => SKILL_TAG[s] || { bg: '#F1F5F9', fg: '#475569' };

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtSize = (b: any): string => {
  const n = Number(b) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
const fmtDate = (d: any): string => {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
};
const parseTags = (s: string): string[] => s.split(',').map(t => t.trim()).filter(Boolean);
const stripExt  = (name: string): string => name.replace(/\.[^.]+$/, '');
const safeName  = (name: string): string => name.replace(/[^\w.\-]+/g, '_');
const unitLabel = (u: any): string => {
  const v = (u || '').toString().trim();
  if (!v) return '';
  return /^unit/i.test(v) ? v : `Unit ${v}`;
};

const MAX_MB = 50;

type EditorState =
  | { mode: 'upload'; file: File }
  | { mode: 'edit'; row: any }
  | null;

// Small selection checkbox
const CheckBox: React.FC<{ checked: boolean; onClick: () => void }> = ({ checked, onClick }) => (
  <span
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{ width: '20px', height: '20px', borderRadius: '6px', border: checked ? 'none' : '2px solid #CBD5E1', background: checked ? '#4F46E5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
  >
    {checked && <IconCheckSm />}
  </span>
);

export const MyLibrary: React.FC = () => {
  const { getToken, userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles]       = useState<any[]>([]);
  const [isLoading, setLoading] = useState(true);

  // Filters
  const [search, setSearch]           = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [unitFilter, setUnitFilter]   = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [sortBy, setSortBy]           = useState<'new' | 'old' | 'az' | 'large'>('new');

  // Editor (upload / edit) form
  const [editor, setEditor]   = useState<EditorState>(null);
  const [fTitle, setFTitle]   = useState('');
  const [fSkill, setFSkill]   = useState('');
  const [fLevel, setFLevel]   = useState('');
  const [fUnit, setFUnit]     = useState('');
  const [fType, setFType]     = useState('');
  const [fTags, setFTags]     = useState('');
  const [isSaving, setSaving] = useState(false);

  // Selection + delete + toast
  const [selected, setSelected]             = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget]     = useState<any | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [hoverId, setHoverId]               = useState<string | null>(null);
  const [toastMessage, setToastMessage]     = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const sb = async () => getSupabaseClient((await getToken({ template: 'supabase' })) || '');

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const supabase = await sb();
      const { data, error } = await supabase
        .from('library_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFiles(data || []);
    } catch (e) { console.error(e); showToast('Could not load your library.', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchFiles(); }, []);

  // ── Storage summary ─────────────────────────────────────────────────────────
  const usedBytes = useMemo(() => files.reduce((s, f) => s + (Number(f.file_size) || 0), 0), [files]);
  const usedPct   = (usedBytes / QUOTA_BYTES) * 100;
  const largest   = useMemo(() => files.reduce((m: any, f) => (Number(f.file_size) || 0) > (Number(m?.file_size) || 0) ? f : m, null), [files]);

  // Distinct units present, for the filter dropdown
  const unitOptions = useMemo(() => Array.from(new Set(files.map(f => f.unit).filter(Boolean))).sort(), [files]);

  // ── Filtering + sorting ─────────────────────────────────────────────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = files.filter(f => {
      if (q) {
        const hay = `${f.title || ''} ${(f.tags || []).join(' ')} ${f.file_name || ''} ${f.unit || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (skillFilter && f.skill !== skillFilter) return false;
      if (levelFilter && f.level !== levelFilter) return false;
      if (unitFilter && f.unit !== unitFilter) return false;
      if (typeFilter && f.type !== typeFilter) return false;
      return true;
    });
    if (sortBy === 'az') out = [...out].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sortBy === 'old') out = [...out].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'large') out = [...out].sort((a, b) => (Number(b.file_size) || 0) - (Number(a.file_size) || 0));
    else out = [...out].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return out;
  }, [files, search, skillFilter, levelFilter, unitFilter, typeFilter, sortBy]);

  const hasFilters = !!(search || skillFilter || levelFilter || unitFilter || typeFilter);

  // ── Selection (scoped to what's visible) ─────────────────────────────────────
  const visibleSelected = visible.filter(f => selected.has(f.id));
  const selCount = visibleSelected.length;
  const allVisibleSelected = visible.length > 0 && visible.every(f => selected.has(f.id));
  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const toggleSelectAll = () => setSelected(prev => {
    const n = new Set(prev);
    if (allVisibleSelected) visible.forEach(f => n.delete(f.id));
    else visible.forEach(f => n.add(f.id));
    return n;
  });
  const clearSelection = () => setSelected(new Set());

  // ── Open editor ─────────────────────────────────────────────────────────────
  const openUpload = (file: File) => {
    setFTitle(stripExt(file.name)); setFSkill(''); setFLevel(''); setFUnit(''); setFType('Activity'); setFTags('');
    setEditor({ mode: 'upload', file });
  };
  const openEdit = (row: any) => {
    setFTitle(row.title || ''); setFSkill(row.skill || ''); setFLevel(row.level || '');
    setFUnit(row.unit || ''); setFType(row.type || ''); setFTags((row.tags || []).join(', '));
    setEditor({ mode: 'edit', row });
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { showToast(`File too large. Limit ${MAX_MB}MB.`, 'error'); return; }
    openUpload(file);
  };

  // ── Save (upload or edit) ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editor) return;
    if (!fTitle.trim()) { showToast('Give it a title first.', 'error'); return; }
    setSaving(true);
    try {
      const supabase = await sb();
      if (editor.mode === 'upload') {
        const file = editor.file;
        const path = `${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from('library')
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from('library_files').insert([{
          title: fTitle.trim(),
          skill: fSkill || null,
          level: fLevel || null,
          unit: fUnit.trim() || null,
          type: fType || null,
          tags: parseTags(fTags),
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          owner_id: userId || null,
        }]);
        if (insErr) { await supabase.storage.from('library').remove([path]); throw insErr; }
        showToast('Added to library', 'success');
      } else {
        const { error } = await supabase.from('library_files').update({
          title: fTitle.trim(),
          skill: fSkill || null,
          level: fLevel || null,
          unit: fUnit.trim() || null,
          type: fType || null,
          tags: parseTags(fTags),
          updated_at: new Date().toISOString(),
        }).eq('id', editor.row.id);
        if (error) throw error;
        showToast('Saved', 'success');
      }
      setEditor(null);
      fetchFiles();
    } catch (e) { console.error(e); showToast('Something went wrong. Try again.', 'error'); }
    finally { setSaving(false); }
  };

  // ── Signed link + downloads ──────────────────────────────────────────────────
  const signedUrl = async (supabase: any, row: any): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('library')
      .createSignedUrl(row.storage_path, 60, { download: row.file_name || true });
    if (error || !data) throw error;
    return data.signedUrl;
  };
  const handleDownload = async (row: any) => {
    try { const supabase = await sb(); window.open(await signedUrl(supabase, row), '_blank'); }
    catch (e) { console.error(e); showToast('Could not open the file.', 'error'); }
  };
  const handleBulkDownload = async () => {
    if (!visibleSelected.length) return;
    try {
      const supabase = await sb();
      for (const row of visibleSelected) {
        const url = await signedUrl(supabase, row);
        const a = document.createElement('a');
        a.href = url; a.download = row.file_name || 'download';
        document.body.appendChild(a); a.click(); a.remove();
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (e) { console.error(e); showToast('Some files could not be downloaded.', 'error'); }
  };

  // ── Delete (single + bulk) ───────────────────────────────────────────────────
  const executeDelete = async () => {
    const row = deleteTarget;
    setDeleteTarget(null);
    if (!row) return;
    setFiles(prev => prev.filter(f => f.id !== row.id));
    try {
      const supabase = await sb();
      await supabase.storage.from('library').remove([row.storage_path]);
      await supabase.from('library_files').delete().eq('id', row.id);
      showToast('Deleted', 'success');
    } catch (e) { console.error(e); showToast('Failed to delete.', 'error'); fetchFiles(); }
  };
  const executeBulkDelete = async () => {
    const rows = visibleSelected;
    setBulkDeleteOpen(false);
    if (!rows.length) return;
    const ids = rows.map(r => r.id);
    const paths = rows.map(r => r.storage_path);
    setFiles(prev => prev.filter(f => !ids.includes(f.id)));
    clearSelection();
    try {
      const supabase = await sb();
      await supabase.storage.from('library').remove(paths);
      await supabase.from('library_files').delete().in('id', ids);
      showToast(`${rows.length} file${rows.length !== 1 ? 's' : ''} deleted`, 'success');
    } catch (e) { console.error(e); showToast('Failed to delete some files.', 'error'); fetchFiles(); }
  };

  const selectStyle: React.CSSProperties = {
    background: '#fff', border: '2px solid #E2E8F0', color: '#475569', padding: '10px 14px',
    borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', outline: 'none',
  };
  const linkBtn = (color: string): React.CSSProperties => ({
    background: 'transparent', border: 'none', color, fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444', color: '#fff', padding: '16px 32px', borderRadius: '9999px', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9998 }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '2rem', color: '#0F172A', fontWeight: 600, letterSpacing: '-0.5px' }}>My Library</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4F46E5', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px' }}><IconLock /> Private</span>
          </div>
          <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0 }}>
            Only visible to you · {files.length} file{files.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: '#4F46E5', border: 'none', color: '#fff', padding: '12px 22px', borderRadius: '12px', fontWeight: 600, fontSize: '0.98rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(79,70,229,0.2)' }}>
          <IconUpload /> Upload
        </button>
        <input ref={fileInputRef} type="file" onChange={onPickFile} style={{ display: 'none' }} />
      </div>

      {/* Storage meter */}
      {files.length > 0 && (
        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><IconDatabase /> Storage used</span>
            <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>{fmtSize(usedBytes)} <span style={{ color: '#94A3B8', fontWeight: 500 }}>of 1 GB · {usedPct < 1 ? '<1' : Math.round(usedPct)}%</span></span>
          </div>
          <div style={{ height: '8px', borderRadius: '9999px', background: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.max(usedPct, 1.5))}%`, background: usedPct > 85 ? '#EF4444' : '#4F46E5', borderRadius: '9999px', transition: 'width 0.3s' }} />
          </div>
          {largest && (
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '10px' }}>
              Largest: <span style={{ color: '#64748B' }}>{largest.title}</span> · {fmtSize(largest.file_size)}
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex' }}><IconSearch /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search your activities"
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 42px', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '0.98rem', color: '#0F172A', outline: 'none' }}
          />
        </div>
        <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)} style={selectStyle}>
          <option value="">All skills</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={selectStyle}>
          <option value="">All levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={selectStyle} disabled={unitOptions.length === 0}>
          <option value="">All units</option>
          {unitOptions.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...selectStyle, marginLeft: 'auto' }}>
          <option value="new">Newest</option>
          <option value="old">Oldest</option>
          <option value="az">Title A–Z</option>
          <option value="large">Largest first</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setSkillFilter(''); setLevelFilter(''); setUnitFilter(''); setTypeFilter(''); }} style={{ background: 'transparent', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Clear</button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading...</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', borderRadius: '20px', border: '2px dashed #E2E8F0' }}>
          <div style={{ color: '#CBD5E1', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><IconCloud /></div>
          <h3 style={{ margin: '0 0 6px', color: '#0F172A', fontSize: '1.25rem', fontWeight: 600 }}>Your library is empty</h3>
          <p style={{ color: '#64748B', margin: '0 0 20px' }}>Upload your first lesson or activity to get started.</p>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: '#4F46E5', border: 'none', color: '#fff', padding: '12px 22px', borderRadius: '12px', fontWeight: 600, fontSize: '0.98rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><IconUpload /> Upload a file</button>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94A3B8', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>Nothing matches those filters.</div>
      ) : (
        <>
          {/* Select-all / bulk-action strip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px', minHeight: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>
              <CheckBox checked={allVisibleSelected} onClick={toggleSelectAll} />
              {selCount > 0 ? `${selCount} selected` : 'Select all'}
            </label>
            {selCount > 0 && (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <button onClick={handleBulkDownload} style={linkBtn('#4F46E5')}><IconDownloadSm /> Download</button>
                <button onClick={() => setBulkDeleteOpen(true)} style={linkBtn('#EF4444')}><IconTrashSm /> Delete</button>
                <button onClick={clearSelection} style={linkBtn('#94A3B8')}>Clear</button>
              </div>
            )}
          </div>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden' }}>
            {visible.map((f, i) => {
              const c = tagColor(f.skill);
              const isSel = selected.has(f.id);
              const hovered = hoverId === f.id;
              const rest = [f.type, f.level, unitLabel(f.unit), fmtSize(f.file_size), fmtDate(f.created_at)].filter(Boolean);
              return (
                <div
                  key={f.id}
                  onMouseEnter={() => setHoverId(f.id)} onMouseLeave={() => setHoverId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: isSel ? '#EEF2FF' : hovered ? '#F8FAFC' : '#fff', borderTop: i === 0 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.15s' }}
                >
                  <CheckBox checked={isSel} onClick={() => toggleSelect(f.id)} />
                  <div style={{ flex: '0 0 auto', width: '42px', height: '42px', borderRadius: '12px', background: c.bg, color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFile /></div>
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <div style={{ fontSize: '1.02rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.skill && <span style={{ color: c.fg, fontWeight: 700 }}>{f.skill}</span>}
                      {f.skill && rest.length > 0 ? ' · ' : ''}
                      {rest.join(' · ')}
                    </div>
                  </div>
                  <button onClick={() => handleDownload(f)} title="Download" style={{ flex: '0 0 auto', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }}><IconDownload /></button>
                  <button onClick={() => openEdit(f)} title="Edit details" style={{ flex: '0 0 auto', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }}><IconEdit /></button>
                  <button onClick={() => setDeleteTarget(f)} title="Delete" style={{ flex: '0 0 auto', background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }}><IconTrash /></button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Editor modal (upload / edit) */}
      {editor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.35rem', fontWeight: 600 }}>{editor.mode === 'upload' ? 'Add to library' : 'Edit details'}</h3>
              <button onClick={() => setEditor(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}><IconClose /></button>
            </div>

            {/* File chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#4F46E5', display: 'flex' }}><IconFile /></span>
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {editor.mode === 'upload' ? editor.file.name : (editor.row.file_name || '—')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  {fmtSize(editor.mode === 'upload' ? editor.file.size : editor.row.file_size)}
                </div>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Title</label>
            <input value={fTitle} onChange={e => setFTitle(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '0.98rem', color: '#0F172A', outline: 'none', marginBottom: '16px' }} />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Skill</label>
                <select value={fSkill} onChange={e => setFSkill(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                  <option value="">—</option>
                  {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Level</label>
                <select value={fLevel} onChange={e => setFLevel(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                  <option value="">—</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Type</label>
                <select value={fType} onChange={e => setFType(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                  <option value="">—</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Unit <span style={{ color: '#CBD5E1', fontWeight: 500 }}>(optional)</span></label>
                <input value={fUnit} onChange={e => setFUnit(e.target.value)} placeholder="e.g. Unit 6" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '0.95rem', color: '#0F172A', outline: 'none' }} />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Tags <span style={{ color: '#CBD5E1', fontWeight: 500 }}>(optional)</span></label>
            <input value={fTags} onChange={e => setFTags(e.target.value)} placeholder="inference, fiction" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '0.95rem', color: '#0F172A', outline: 'none', marginBottom: '24px' }} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditor(null)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.98rem' }}>Cancel</button>
              <button onClick={handleSave} disabled={isSaving} style={{ flex: 1, padding: '12px', background: isSaving ? '#A5B4FC' : '#4F46E5', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: isSaving ? 'default' : 'pointer', fontSize: '0.98rem' }}>
                {isSaving ? (editor.mode === 'upload' ? 'Uploading…' : 'Saving…') : (editor.mode === 'upload' ? 'Save to library' : 'Save changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single delete confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconTrash /></div>
            <h3 style={{ margin: '0 0 12px', color: '#0F172A', fontSize: '1.4rem' }}>Delete this file?</h3>
            <p style={{ color: '#64748B', margin: '0 0 24px', lineHeight: 1.5 }}>“{deleteTarget.title}” will be permanently removed from your library. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeDelete} style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {bulkDeleteOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconTrash /></div>
            <h3 style={{ margin: '0 0 12px', color: '#0F172A', fontSize: '1.4rem' }}>Delete {selCount} file{selCount !== 1 ? 's' : ''}?</h3>
            <p style={{ color: '#64748B', margin: '0 0 24px', lineHeight: 1.5 }}>The selected file{selCount !== 1 ? 's' : ''} will be permanently removed from your library. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setBulkDeleteOpen(false)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeBulkDelete} style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};