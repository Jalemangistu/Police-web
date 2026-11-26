import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './admin.css';
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext';
import SiteSettingsLayout from './pages/admin/settings/SiteSettingsLayout';
import { SITE_SETTINGS_SECTIONS } from './pages/admin/settings/siteSettingsConfig';
import { L10nInput } from './components/admin/AdminControls';
import SafetyDocumentsAdmin from './pages/admin/SafetyDocumentsAdmin';
import VacanciesAdmin from './pages/admin/VacanciesAdmin';
import AlertsAdmin from './pages/admin/AlertsAdmin';
import PasswordStrengthMeter, { checkPasswordCriteria } from './components/PasswordStrengthMeter';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = async (path, options = {}) => {
  let r;
  try {
    r = await fetch(`${API}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.adminToken || ''}`
      },
      ...options
    });
  } catch (err) {
    throw Error(`Unable to connect to server at ${API}. Please ensure backend is running.`);
  }

  if (r.status === 401) {
    sessionStorage.removeItem('adminToken');
    window.location.assign('/admin/login');
    throw Error('Authentication session expired. Please log in again.');
  }

  if (r.status === 204) {
    return null;
  }

  const contentType = r.headers.get('content-type') || '';
  let d = null;
  if (contentType.includes('application/json')) {
    try {
      d = await r.json();
    } catch {
      d = null;
    }
  } else {
    const text = await r.text().catch(() => '');
    d = { message: text && text.length < 250 ? text : `Server returned status ${r.status}` };
  }

  if (!r.ok) {
    throw Error(d?.message || `Request failed with status ${r.status}`);
  }
  return d;
};

const titleOf = x => x?.title?.en || x?.name?.en || x?.fileName || x?.slug || 'Untitled';
const ago = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

/* ═══════════════════════════════════════════════════
   REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════ */

function Toast({ message, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  return <div className={`adToast ${type}`}><span>{message}</span><button onClick={onDone}>✕</button></div>;
}

function Confirm({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="adModal" onClick={onCancel}>
      <div className="adModalBox" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="adModalActions">
          <button className="adBtnOutline" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'adBtnDanger' : 'adBtn'} onClick={onConfirm}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="adSearchWrap">
      <svg className="adSearchIcon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="2" fill="none" /><line x1="12.5" y1="12.5" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <input className="adSearchInput" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button className="adSearchClear" onClick={() => onChange('')}>✕</button>}
    </div>
  );
}

function Badge({ label, variant = 'default' }) {
  return <span className={`adBadge adBadge--${variant}`}>{label}</span>;
}

function StatusBadge({ item, type }) {
  if (type === 'alerts') {
    const map = { low: 'info', medium: 'warning', high: 'danger', critical: 'critical' };
    return <Badge label={item.level || 'medium'} variant={map[item.level] || 'warning'} />;
  }
  if (type === 'news' || type === 'pages') {
    const map = { draft: 'default', review: 'warning', published: 'success', archived: 'muted' };
    return <Badge label={item.status || 'draft'} variant={map[item.status] || 'default'} />;
  }
  if (type === 'services') {
    return <Badge label={item.isActive ? 'Active' : 'Inactive'} variant={item.isActive ? 'success' : 'muted'} />;
  }
  return null;
}

function EmptyState({ icon = '📋', text = 'No records yet.', action }) {
  return (
    <div className="adEmpty">
      <span className="adEmptyIcon">{icon}</span>
      <p>{text}</p>
      {action && <button className="adBtn" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="adToggle" title={label}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="adToggleTrack"><span className="adToggleDot" /></span>
      {label && <span className="adToggleLabel">{label}</span>}
    </label>
  );
}

/* ═══════════════════════════════════════════════════
   CONTENT CRUD (News, Services, Alerts)
   ═══════════════════════════════════════════════════ */

function Content({ type, name }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef();

  const load = useCallback(() => api(`/admin/${type}`).then(setItems).catch(e => setToast({ message: e.message, type: 'error' })), [type]);
  useEffect(() => { load(); setForm({}); setEditing(null); }, [type, load]);

  const editItem = item => {
    const f = {};
    if (type === 'news') {
      f.slug = item.slug; f.title = item.title?.en || ''; f.description = item.excerpt?.en || '';
      f.content = item.content?.en || ''; f.status = item.status || 'draft'; f.category = item.category || 'news'; f.featuredImage = item.featuredImage || '';
    } else if (type === 'services') {
      f.slug = item.slug; f.title = item.name?.en || ''; f.description = item.description?.en || '';
      f.externalUrl = item.externalUrl || ''; f.fee = item.feeAmount || 0;
      f.fields = (item.formSchema || []).map(x => x.label?.en || x.name).join('\n');
      f.isActive = item.isActive !== false;
    } else if (type === 'alerts') {
      f.title = item.title?.en || ''; f.description = item.message?.en || '';
      f.level = item.level || 'medium'; f.isActive = item.isActive !== false;
    }
    setForm(f);
    setEditing(item._id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => { setForm({}); setEditing(null); };

  const deleteItem = async id => {
    try {
      await api(`/admin/${type}/${id}`, { method: 'DELETE' });
      setToast({ message: `${name.slice(0, -1)} deleted.`, type: 'success' });
      if (editing === id) cancelEdit();
      load();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    setConfirm(null);
  };

  const toggleActive = async (item) => {
    try {
      await api(`/admin/${type}/${item._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !item.isActive }) });
      setToast({ message: `${titleOf(item)} ${item.isActive ? 'deactivated' : 'activated'}.` });
      load();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const fields = (form.fields || '').split('\n').map(x => x.trim()).filter(Boolean).map((label, i) => ({ name: `field_${i + 1}`, label: { en: label }, type: 'text', required: true }));
      const payload = type === 'services'
        ? { slug: form.slug, name: { en: form.title }, description: { en: form.description }, externalUrl: form.externalUrl || '', feeAmount: Number(form.fee || 0), formSchema: fields, isActive: form.isActive !== false }
        : type === 'alerts'
          ? { title: { en: form.title }, message: { en: form.description }, level: form.level || 'medium', isActive: form.isActive !== false }
          : { slug: form.slug, title: { en: form.title }, excerpt: { en: form.description }, content: { en: form.content || form.description }, status: form.status || 'draft', category: form.category || 'news', featuredImage: form.featuredImage || '' };

      if (editing) {
        await api(`/admin/${type}/${editing}`, { method: 'PUT', body: JSON.stringify(payload) });
        setToast({ message: `${name.slice(0, -1)} updated.` });
      } else {
        await api(`/admin/${type}`, { method: 'POST', body: JSON.stringify(payload) });
        setToast({ message: `${name.slice(0, -1)} created.` });
      }
      cancelEdit();
      load();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    setSaving(false);
  };

  const filtered = items.filter(x => titleOf(x).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="adPanel" ref={formRef}>
      <div className="adPanelHead">
        <div>
          <h2>{name}</h2>
          <p>{type === 'services' ? 'Create services and their required public form fields.' : 'Create drafts, submit for review, and publish approved content.'}</p>
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      <div className="adSplit">
        <form className="adForm" onSubmit={save}>
          <div className="adFormHead">
            <h3>{editing ? `Edit ${name.slice(0, -1)}` : `New ${name.slice(0, -1)}`}</h3>
            {editing && <button type="button" className="adBtnGhost" onClick={cancelEdit}>✕ Cancel</button>}
          </div>
          {type !== 'alerts' && <label>URL slug<input required value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. my-article-slug" /></label>}
          <label>Title<input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter a title" /></label>
          <label>{type === 'alerts' ? 'Message' : 'Summary'}<textarea required value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={type === 'alerts' ? 'Alert message content' : 'Brief summary or excerpt'} /></label>

          {type === 'news' && <>
            <label>Article body<textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full article content" /></label>
            <label>Featured Image / Video
              <input type="file" accept="image/*,video/mp4,video/webm" onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) return setToast({ message: 'File must be under 5MB.', type: 'error' });
                const reader = new FileReader();
                reader.onload = () => setForm({ ...form, featuredImage: reader.result });
                reader.readAsDataURL(file);
              }} />
            </label>
            {form.featuredImage && (
              <div className="adImagePreview">
                {form.featuredImage.startsWith('data:video') ? <video src={form.featuredImage} controls style={{ maxWidth: '100%' }} /> : <img src={form.featuredImage} alt="preview" style={{ maxWidth: '100%' }} />}
                <button type="button" className="adBtnGhost" onClick={() => setForm({ ...form, featuredImage: '' })}>Remove Media</button>
              </div>
            )}

            <div className="adFormRow">
              <label>Status<select value={form.status || 'draft'} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="review">Review</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
              <label>Category<select value={form.category || 'news'} onChange={e => setForm({ ...form, category: e.target.value })}><option value="news">News</option><option value="press_release">Press Release</option><option value="notice">Notice</option><option value="blog">Blog</option></select></label>
            </div>
          </>}
          {type === 'services' && <>
            <label>
              External link URL
              <input type="url" value={form.externalUrl || ''} onChange={e => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://external-system.gov.et/service" />
              <span className="adFieldHint">Leave blank if no external system. Public users will see a link button instead of the internal form.</span>
            </label>
            <label>Fee (ETB)<input type="number" min="0" value={form.fee || ''} onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="0" /></label>
            <label>Required form fields<textarea placeholder="One field label per line (only used when no external URL is set)" value={form.fields || ''} onChange={e => setForm({ ...form, fields: e.target.value })} /></label>
            <ToggleSwitch checked={form.isActive !== false} onChange={v => setForm({ ...form, isActive: v })} label="Active" />
          </>}
          {type === 'alerts' && <>
            <label>Priority<select value={form.level || 'medium'} onChange={e => setForm({ ...form, level: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
            <ToggleSwitch checked={form.isActive !== false} onChange={v => setForm({ ...form, isActive: v })} label="Active" />
          </>}
          <button className="adBtn adBtnFull" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Save'}</button>
        </form>

        <div className="adCard adListCard">
          <div className="adListHead">
            <h3>{name} <span className="adCount">{filtered.length}</span></h3>
            <SearchBar value={search} onChange={setSearch} placeholder={`Filter ${name.toLowerCase()}…`} />
          </div>
          {filtered.length === 0
            ? <EmptyState icon="📝" text={search ? 'No items match your search.' : `No ${name.toLowerCase()} yet. Create one to get started.`} />
            : filtered.map(item => (
              <article className="adListItem" key={item._id}>
                <div className="adListItemInfo">
                  <b>{titleOf(item)}</b>
                  <div className="adListItemMeta">
                    <StatusBadge item={item} type={type} />
                    <small>{ago(item.updatedAt || item.createdAt)}</small>
                  </div>
                </div>
                <div className="adActions">
                  {(type === 'services' || type === 'alerts') && <ToggleSwitch checked={item.isActive !== false} onChange={() => toggleActive(item)} />}
                  <button className="adBtnIcon adBtnIconEdit" title="Edit" onClick={() => editItem(item)}>✎</button>
                  <button className="adBtnIcon adBtnIconDel" title="Delete" onClick={() => setConfirm({ title: `Delete ${name.slice(0, -1)}`, message: `Are you sure you want to delete "${titleOf(item)}"? This action cannot be undone.`, onConfirm: () => deleteItem(item._id), onCancel: () => setConfirm(null) })}>✕</button>
                </div>
              </article>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MEDIA LIBRARY
   ═══════════════════════════════════════════════════ */

function Media() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ category: 'image' });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  const load = () => api('/admin/media').then(setItems).catch(e => setToast({ message: e.message, type: 'error' }));
  useEffect(() => { load(); }, []);

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return setToast({ message: 'Attached file must be under 12MB.', type: 'error' });
    }

    let cat = 'document';
    const type = file.type || '';
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) {
      cat = 'image';
    } else if (type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
      cat = 'video';
    } else if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
      cat = 'audio';
    } else {
      cat = 'document';
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        path: reader.result,
        fileName: prev.fileName?.trim() ? prev.fileName : file.name,
        mimeType: file.type || (cat === 'document' ? 'application/octet-stream' : `${cat}/*`),
        category: cat,
        size: file.size
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm(prev => ({
      ...prev,
      path: prev.path?.startsWith('data:') ? '' : prev.path,
      category: 'image',
      mimeType: '',
      size: undefined
    }));
  };

  const save = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api('/admin/media', { method: 'POST', body: JSON.stringify({ ...form, mimeType: form.mimeType || 'application/octet-stream', altText: { en: form.altText || '' } }) });
      setForm({ category: 'image' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setToast({ message: 'Media asset added.' });
      load();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    setSaving(false);
  };

  const deleteItem = async id => {
    try { await api(`/admin/media/${id}`, { method: 'DELETE' }); setToast({ message: 'Media asset deleted.' }); load(); }
    catch (e) { setToast({ message: e.message, type: 'error' }); }
    setConfirm(null);
  };

  const filtered = items.filter(x => (x.fileName || '').toLowerCase().includes(search.toLowerCase()));

  const categoryBadgeVariant = cat => {
    if (cat === 'video') return 'warning';
    if (cat === 'image') return 'info';
    if (cat === 'audio') return 'success';
    return 'default';
  };

  const categoryIcon = cat => {
    if (cat === 'video') return '🎬';
    if (cat === 'audio') return '🎵';
    if (cat === 'image') return '🖼';
    return '📄';
  };

  return (
    <div className="adPanel">
      <div className="adPanelHead"><div><h2>Media Library</h2><p>Register hosted files for use in portal content.</p></div></div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}
      <div className="adSplit">
        <form className="adForm" onSubmit={save}>
          <h3>Add media</h3>
          <label>
            File attachment (supports all file types)
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
            />
            <span className="adFieldHint">Attach any file: documents, PDFs, images, videos, audio, archives, etc. (max 12MB). Auto-detects name, category, and MIME type.</span>
          </label>
          {form.path && (
            <div className="adImagePreview" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                  {categoryIcon(form.category)} Attached preview ({form.category})
                </span>
                <button type="button" className="adBtnGhost" onClick={removeAttachment} style={{ padding: '2px 8px', fontSize: '12px' }}>
                  ✕ Remove Attachment
                </button>
              </div>
              {form.category === 'video' ? (
                <video src={form.path} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '6px', background: '#000' }} />
              ) : form.category === 'image' ? (
                <img src={form.path} alt="preview" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
              ) : form.category === 'audio' ? (
                <audio src={form.path} controls style={{ width: '100%' }} />
              ) : (
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  📄 <b>{form.fileName || 'Document'}</b> {form.size ? `(${Math.round(form.size / 1024)} KB)` : ''}
                </div>
              )}
            </div>
          )}
          <label>File name<input required value={form.fileName || ''} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="e.g. annual-report.pdf, video.mp4, logo.png" /></label>
          <label>File URL / path<input required value={form.path || ''} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="https://example.com/file.pdf (or attach file above)" /></label>
          <label>MIME type<input value={form.mimeType || ''} onChange={e => setForm({ ...form, mimeType: e.target.value })} placeholder="e.g. application/pdf, video/mp4, image/jpeg" /></label>
          <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['image', 'video', 'document', 'audio'].map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Alt text / description<input value={form.altText || ''} onChange={e => setForm({ ...form, altText: e.target.value })} placeholder="Description of the file" /></label>
          <button className="adBtn adBtnFull" disabled={saving}>{saving ? 'Adding…' : 'Add media'}</button>
        </form>
        <div className="adCard adListCard">
          <div className="adListHead"><h3>Assets <span className="adCount">{filtered.length}</span></h3><SearchBar value={search} onChange={setSearch} placeholder="Filter media…" /></div>
          {filtered.length === 0 ? <EmptyState icon="🖼" text={search ? 'No media match.' : 'No media assets yet.'} />
            : filtered.map(x => (
              <article className="adListItem" key={x._id} style={{ flexWrap: 'wrap' }}>
                <div className="adListItemInfo">
                  <b>{categoryIcon(x.category)} {x.fileName}</b>
                  <div className="adListItemMeta">
                    <Badge label={x.category} variant={categoryBadgeVariant(x.category)} />
                    <small title={x.path}>
                      {x.path?.startsWith('data:') ? `Attached ${x.category?.toUpperCase() || 'FILE'} (${x.mimeType || 'file'}${x.size ? ` · ${Math.round(x.size / 1024)} KB` : ''})` : x.path}
                    </small>
                  </div>
                </div>
                <div className="adActions">
                  {x.path && (
                    <button
                      type="button"
                      className="adBtnIcon"
                      title={previewItem === x._id ? 'Close preview' : 'Preview file'}
                      onClick={() => setPreviewItem(previewItem === x._id ? null : x._id)}
                    >
                      {previewItem === x._id ? '✕' : (x.category === 'video' || x.category === 'audio' ? '▶' : '👁')}
                    </button>
                  )}
                  {x.path && (
                    <a
                      href={x.path}
                      download={x.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adBtnIcon"
                      title="Download or open original"
                    >
                      ⤓
                    </a>
                  )}
                  <button className="adBtnIcon adBtnIconDel" title="Delete" onClick={() => setConfirm({ title: 'Delete media asset', message: `Delete "${x.fileName}"?`, onConfirm: () => deleteItem(x._id), onCancel: () => setConfirm(null) })}>✕</button>
                </div>
                {previewItem === x._id && (
                  <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    {x.category === 'video' ? (
                      <video src={x.path} controls autoPlay style={{ width: '100%', maxHeight: '220px', borderRadius: '6px', background: '#000' }} />
                    ) : x.category === 'audio' ? (
                      <audio src={x.path} controls autoPlay style={{ width: '100%' }} />
                    ) : x.category === 'image' ? (
                      <img src={x.path} alt={x.fileName} style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>📄 <b>{x.fileName}</b> ({x.mimeType || 'application/octet-stream'})</span>
                        <a href={x.path} download={x.fileName} target="_blank" rel="noopener noreferrer" className="adBtn adBtnSm">Open / Download</a>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGES / SEO (Full CRUD)
   ═══════════════════════════════════════════════════ */

// function Pages() {
//   const [items, setItems] = useState([]);
//   const [form, setForm] = useState({});
//   const [editing, setEditing] = useState(null);
//   const [search, setSearch] = useState('');
//   const [toast, setToast] = useState(null);
//   const [confirm, setConfirm] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const formRef = useRef();

//   const load = () => api('/admin/pages').then(setItems).catch(e => setToast({ message: e.message, type: 'error' }));
//   useEffect(() => { load(); }, []);

//   const editItem = item => {
//     setForm({ slug: item.slug || '', title: item.title?.en || '', summary: item.summary?.en || '', content: item.content?.en || '', status: item.status || 'draft', seoTitle: item.seo?.title || '', seoDescription: item.seo?.description || '', seoKeywords: (item.seo?.keywords || []).join(', ') });
//     setEditing(item._id);
//     formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//   };
//   const cancelEdit = () => { setForm({}); setEditing(null); };

//   const deleteItem = async id => {
//     try { await api(`/admin/pages/${id}`, { method: 'DELETE' }); setToast({ message: 'Page deleted.' }); if (editing === id) cancelEdit(); load(); }
//     catch (e) { setToast({ message: e.message, type: 'error' }); }
//     setConfirm(null);
//   };

//   const save = async e => {
//     e.preventDefault(); setSaving(true);
//     try {
//       const payload = { slug: form.slug, title: { en: form.title }, summary: { en: form.summary }, content: { en: form.content }, status: form.status || 'draft', seo: { title: form.seoTitle, description: form.seoDescription, keywords: (form.seoKeywords || '').split(',').map(x => x.trim()).filter(Boolean) } };
//       if (editing) { await api(`/admin/pages/${editing}`, { method: 'PUT', body: JSON.stringify(payload) }); setToast({ message: 'Page updated.' }); }
//       else { await api('/admin/pages', { method: 'POST', body: JSON.stringify(payload) }); setToast({ message: 'Page created.' }); }
//       cancelEdit(); load();
//     } catch (e) { setToast({ message: e.message, type: 'error' }); }
//     setSaving(false);
//   };

//   const filtered = items.filter(x => titleOf(x).toLowerCase().includes(search.toLowerCase()));

//   return (
//     <div className="adPanel" ref={formRef}>
//       <div className="adPanelHead"><div><h2>SEO &amp; Pages</h2><p>Create and manage custom pages with SEO metadata.</p></div></div>
//       {toast && <Toast {...toast} onDone={() => setToast(null)} />}
//       {confirm && <Confirm {...confirm} />}
//       <div className="adSplit">
//         <form className="adForm" onSubmit={save}>
//           <div className="adFormHead"><h3>{editing ? 'Edit page' : 'New page'}</h3>{editing && <button type="button" className="adBtnGhost" onClick={cancelEdit}>✕ Cancel</button>}</div>
//           <label>Slug<input required value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. about-us" /></label>
//           <label>Title<input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Page title" /></label>
//           <label>Summary<textarea value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Short summary" /></label>
//           <label>Content<textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full page content" /></label>
//           <label>Status<select value={form.status || 'draft'} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="review">Review</option><option value="published">Published</option></select></label>
//           <fieldset className="adFieldset"><legend>SEO metadata</legend>
//             <label>SEO title<input value={form.seoTitle || ''} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="Override browser title" /></label>
//             <label>Meta description<textarea value={form.seoDescription || ''} onChange={e => setForm({ ...form, seoDescription: e.target.value })} placeholder="Search engine description" /></label>
//             <label>Keywords<input value={form.seoKeywords || ''} onChange={e => setForm({ ...form, seoKeywords: e.target.value })} placeholder="Comma separated keywords" /></label>
//           </fieldset>
//           <button className="adBtn adBtnFull" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update page' : 'Create page'}</button>
//         </form>
//         <div className="adCard adListCard">
//           <div className="adListHead"><h3>Pages <span className="adCount">{filtered.length}</span></h3><SearchBar value={search} onChange={setSearch} placeholder="Filter pages…" /></div>
//           {filtered.length === 0 ? <EmptyState icon="📄" text={search ? 'No pages match.' : 'No pages yet.'} />
//             : filtered.map(item => (
//               <article className="adListItem" key={item._id}>
//                 <div className="adListItemInfo"><b>{titleOf(item)}</b><div className="adListItemMeta"><StatusBadge item={item} type="pages" /><small>/{item.slug}</small></div></div>
//                 <div className="adActions">
//                   <button className="adBtnIcon adBtnIconEdit" title="Edit" onClick={() => editItem(item)}>✎</button>
//                   <button className="adBtnIcon adBtnIconDel" title="Delete" onClick={() => setConfirm({ title: 'Delete page', message: `Delete "${titleOf(item)}"?`, onConfirm: () => deleteItem(item._id), onCancel: () => setConfirm(null) })}>✕</button>
//                 </div>
//               </article>
//             ))
//           }
//         </div>
//       </div>
//     </div>
//   );
// }

/* ═══════════════════════════════════════════════════
   USERS & ROLE MANAGEMENT
   ═══════════════════════════════════════════════════ */

const SYSTEM_ROLES = [
  { id: 'super_admin', label: 'Super Admin', icon: '⭐', badge: 'Executive', desc: 'Full unrestricted executive authority across all portal systems, users, and security settings.', perms: ['All Systems & Permissions (*)'] },
  { id: 'admin', label: 'Admin', icon: '🛡️', badge: 'Administrator', desc: 'System administrator managing content, hotlines, media, staff accounts, and portal settings.', perms: ['Content', 'Hotlines', 'Alerts', 'Submissions', 'Stations', 'Vacancies', 'Media', 'Users', 'Settings', 'Audit Logs'] },
  { id: 'dispatcher', label: 'Emergency Dispatcher', icon: '🚨', badge: 'Operations', desc: 'Dedicated emergency response officer managing dynamic hotlines and urgent safety alerts.', perms: ['Emergency Hotlines', 'Emergency Alerts', 'Citizen Inquiries', 'View Content'] },
  { id: 'communications', label: 'Communications / PR Officer', icon: '📢', badge: 'Press & Media', desc: 'Public relations officer publishing official news releases, safety campaigns, and media assets.', perms: ['Publish News', 'Manage Media Library', 'Broadcast Alerts', 'Edit Content'] },
  { id: 'station_commander', label: 'Station Commander', icon: '🏢', badge: 'Command', desc: 'District commander managing local police stations, personnel vacancies, and citizen requests.', perms: ['Manage Police Stations', 'Post Vacancies', 'Review Submissions', 'View Content'] },
  { id: 'investigator', label: 'Investigator / Legal Officer', icon: '⚖️', badge: 'Investigation', desc: 'Officer assigned to reviewing citizen crime reports, legal safety documents, and evidence.', perms: ['Citizen Crime Reports', 'Review Submissions', 'Legal Safety Documents'] },
  { id: 'editor', label: 'Editor', icon: '✍️', badge: 'Editorial', desc: 'Editorial staff with full rights to draft, edit, and publish news and procedural guidance.', perms: ['Draft & Publish News', 'Police Services Info', 'Safety Documents', 'Media Assets'] },
  { id: 'author', label: 'Author', icon: '📝', badge: 'Contributor', desc: 'Content creator drafting news and uploading media assets for editorial approval.', perms: ['Draft News Articles', 'Upload Media', 'View Content'] },
  { id: 'staff', label: 'Field Officer / Staff', icon: '👮', badge: 'Operations', desc: 'Field officer reviewing and responding to incoming public citizen inquiries and requests.', perms: ['Review Submissions', 'Citizen Inquiries', 'View Content'] },
  { id: 'user', label: 'Standard User', icon: '👤', badge: 'Standard', desc: 'Standard authenticated portal account with read-only operational visibility.', perms: ['View Portal Content'] }
];

const DEFAULT_PERMS_GROUPED = [
  {
    category: 'Content',
    items: [
      { id: 'content:read', name: 'View Content', desc: 'Read news, safety guides, and documents' },
      { id: 'content:write', name: 'Create & Edit Content', desc: 'Draft articles, services, and advisories' },
      { id: 'content:publish', name: 'Publish Content', desc: 'Publish official articles live to the portal' }
    ]
  },
  {
    category: 'Operations',
    items: [
      { id: 'hotlines:manage', name: 'Emergency Hotlines', desc: 'Manage dynamic telephone and emergency contacts' },
      { id: 'alerts:manage', name: 'Emergency Alerts', desc: 'Broadcast traffic advisories and safety warnings' },
      { id: 'submissions:manage', name: 'Citizen Inquiries', desc: 'Process and respond to incident reports' },
      { id: 'stations:manage', name: 'Station Directory', desc: 'Manage sub-city police stations and locations' },
      { id: 'vacancies:manage', name: 'Job Vacancies', desc: 'Post and manage career recruitments' }
    ]
  },
  {
    category: 'Users',
    items: [
      { id: 'users:manage', name: 'Manage Users', desc: 'Invite, update, and manage portal accounts' },
      { id: 'users:roles', name: 'Assign Roles', desc: 'Assign and change operational user roles' }
    ]
  },
  {
    category: 'Settings & Security',
    items: [
      { id: 'settings:manage', name: 'Portal Settings', desc: 'Configure site branding, themes, and content' },
      { id: 'media:manage', name: 'Media Library', desc: 'Upload, organize, and manage official photo assets' },
      { id: 'logs:read', name: 'Audit Logs', desc: 'Inspect platform security logs and activity records' },
      { id: 'backup:read', name: 'System Backups', desc: 'Export platform data and perform disaster recovery' }
    ]
  }
];

function Users({ currentUser }) {
  const [tab, setTab] = useState('users'); // 'users' or 'roles'
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState(SYSTEM_ROLES);
  const [permissions, setPermissions] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Search & Filter (Users Tab)
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination (Users Tab)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Add User Flow (Modal)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'user' });
  const [inviting, setInviting] = useState(false);

  // Edit User Flow (Side Panel / Drawer)
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'user', isActive: true });
  const [savingUser, setSavingUser] = useState(false);

  // Roles Tab - View / Edit Permissions Flow
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePerms, setRolePerms] = useState([]);
  const [savingRole, setSavingRole] = useState(false);

  // Roles Tab - Create Role Flow (Secondary)
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '', permissions: [] });
  const [creatingRole, setCreatingRole] = useState(false);

  // Roles Tab - Edit Role Meta Flow (Name & Description)
  const [editRoleModal, setEditRoleModal] = useState(null);
  const [savingRoleMeta, setSavingRoleMeta] = useState(false);

  // Roles Tab - Delete Role Flow
  const [deleteRoleDialog, setDeleteRoleDialog] = useState(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.role === 'super_admin' || currentUser?.permissions?.includes('*');

  const load = () => {
    api('/admin/users')
      .then(setItems)
      .catch(e => setToast({ message: e.message, type: 'error' }));

    api('/admin/permissions')
      .then(d => setPermissions(d?.permissions || []))
      .catch(() => { });

    api('/admin/roles')
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setRoles(d.map(r => ({
            ...r,
            id: r.slug || r.id,
            label: r.name || r.label,
            desc: r.description || r.desc,
            perms: r.permissions || r.perms || []
          })));
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    load();
  }, []);

  // Helper to get clean plain text role name (NO ICONS)
  const getRoleLabel = (roleId) => {
    const found = roles.find(r => (r.slug || r.id) === roleId) || SYSTEM_ROLES.find(r => r.id === roleId);
    return found?.name || found?.label || roleId || 'User';
  };

  // Filtered & Paginated Users
  const filteredUsers = items.filter(u => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Add User Flow
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setToast({ message: 'Full name and email are required.', type: 'error' });
      return;
    }
    setInviting(true);
    try {
      await api('/admin/users', {
        method: 'POST',
        body: JSON.stringify(addForm)
      });
      setToast({ message: `Invitation sent to ${addForm.email}.`, type: 'success' });
      setShowAddModal(false);
      setAddForm({ name: '', email: '', role: 'user' });
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setInviting(false);
  };

  // Open Edit User Drawer / Panel
  const openEditUser = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name || '',
      role: u.role || 'user',
      isActive: u.isActive !== false
    });
  };

  // Save User Changes
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setToast({ message: 'Name cannot be empty.', type: 'error' });
      return;
    }
    setSavingUser(true);
    try {
      await api(`/admin/users/${editUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setToast({ message: `Changes saved for ${editForm.name}.`, type: 'success' });
      setEditUser(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setSavingUser(false);
  };

  // Delete User
  const confirmDeleteUser = (u) => {
    setConfirm({
      title: 'Delete user',
      message: `Are you sure you want to remove ${u.name} (${u.email})?`,
      onConfirm: async () => {
        try {
          await api(`/admin/users/${u._id}`, { method: 'DELETE' });
          setToast({ message: 'User deleted.' });
          setEditUser(null);
          load();
        } catch (err) {
          setToast({ message: err.message, type: 'error' });
        }
        setConfirm(null);
      },
      onCancel: () => setConfirm(null)
    });
  };

  // Open Role Permissions Modal
  const openRolePermissions = (r) => {
    setSelectedRole(r);
    const existing = Array.isArray(r.permissions)
      ? [...r.permissions]
      : (Array.isArray(r.perms) ? [...r.perms] : []);
    setRolePerms(existing);
  };

  const togglePermission = (permKey) => {
    setRolePerms(prev =>
      prev.includes(permKey) ? prev.filter(k => k !== permKey) : [...prev, permKey]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    setSavingRole(true);
    try {
      if (selectedRole._id && !selectedRole._id.startsWith('sys_')) {
        await api(`/admin/roles/${selectedRole._id}`, {
          method: 'PUT',
          body: JSON.stringify({ permissions: rolePerms })
        });
      } else {
        // Built-in role: update or create custom role in DB
        await api('/admin/roles', {
          method: 'POST',
          body: JSON.stringify({
            name: selectedRole.name || selectedRole.label,
            slug: selectedRole.slug || selectedRole.id,
            description: selectedRole.description || selectedRole.desc || '',
            permissions: rolePerms
          })
        }).catch(async () => {
          const existing = roles.find(x => (x.slug || x.id) === (selectedRole.slug || selectedRole.id));
          if (existing?._id && !existing._id.startsWith('sys_')) {
            await api(`/admin/roles/${existing._id}`, {
              method: 'PUT',
              body: JSON.stringify({ permissions: rolePerms })
            });
          }
        });
      }
      setToast({ message: `Permissions updated for ${selectedRole.name || selectedRole.label}.`, type: 'success' });
      setSelectedRole(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setSavingRole(false);
  };

  // Create Role (Secondary)
  const openCreateRole = () => {
    setNewRoleForm({ name: '', description: '', permissions: [] });
    setShowCreateRole(true);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) {
      setToast({ message: 'Role name is required.', type: 'error' });
      return;
    }
    setCreatingRole(true);
    try {
      await api('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(newRoleForm)
      });
      setToast({ message: `Role "${newRoleForm.name}" created successfully.`, type: 'success' });
      setShowCreateRole(false);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setCreatingRole(false);
  };

  // Edit Role Meta (Name & Description)
  const openEditRole = (r) => {
    setEditRoleModal({
      id: r._id || ('sys_' + (r.slug || r.id)),
      slug: r.slug || r.id,
      name: r.name || r.label || '',
      description: r.description || r.desc || ''
    });
  };

  const handleSaveRoleMeta = async (e) => {
    e.preventDefault();
    if (!editRoleModal || !editRoleModal.name.trim()) {
      setToast({ message: 'Role name is required.', type: 'error' });
      return;
    }
    setSavingRoleMeta(true);
    try {
      const roleId = editRoleModal.id || editRoleModal.slug;
      await api(`/admin/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editRoleModal.name.trim(),
          description: editRoleModal.description.trim()
        })
      });
      setToast({ message: `Role "${editRoleModal.name}" updated successfully.`, type: 'success' });
      setEditRoleModal(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSavingRoleMeta(false);
    }
  };

  // Delete Role Flow
  const openDeleteRole = (r) => {
    const roleId = r.slug || r.id;
    const userCount = items.filter(u => u.role === roleId).length;
    const availableReplacement = roles.find(item => (item.slug || item.id) !== roleId && (item.slug || item.id) !== 'super_admin');
    const defaultReassign = availableReplacement?.slug || availableReplacement?.id || 'user';

    setDeleteRoleDialog({
      role: r,
      roleId,
      name: r.name || r.label || roleId,
      userCount,
      reassignTo: defaultReassign
    });
  };

  const handleConfirmDeleteRole = async () => {
    if (!deleteRoleDialog) return;
    setDeletingRole(true);
    try {
      const roleId = deleteRoleDialog.role._id || deleteRoleDialog.roleId;
      const query = deleteRoleDialog.userCount > 0 ? `?reassignTo=${encodeURIComponent(deleteRoleDialog.reassignTo)}` : '';
      await api(`/admin/roles/${roleId}${query}`, { method: 'DELETE' });
      setToast({
        message: deleteRoleDialog.userCount > 0
          ? `Role "${deleteRoleDialog.name}" deleted. ${deleteRoleDialog.userCount} user(s) reassigned to "${getRoleLabel(deleteRoleDialog.reassignTo)}".`
          : `Role "${deleteRoleDialog.name}" deleted successfully.`,
        type: 'success'
      });
      setDeleteRoleDialog(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeletingRole(false);
    }
  };

  // Grouped Permissions mapping (Content, Operations, Users, Settings & Security)
  const groupedPermissions = DEFAULT_PERMS_GROUPED.map(group => {
    const extra = permissions
      .filter(p => p.category?.toLowerCase() === group.category.toLowerCase() && !group.items.some(x => x.id === p.key))
      .map(p => ({ id: p.key, name: p.name, desc: p.description }));
    return {
      category: group.category,
      items: [...group.items, ...extra]
    };
  });

  return (
    <div className="urm-container">
      {/* ── Scoped Styling for Pure Minimalist Hierarchy ── */}
      <style>{`
        .urm-container {
          padding: 24px;
          max-width: 1180px;
          margin: 0 auto;
          color: #0f172a;
          font-family: inherit;
        }
        .urm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .urm-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .urm-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .urm-primary-btn {
          background: #0c1b33 !important;
          color: #ffffff !important;
          border: none !important;
          padding: 9px 18px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 0.875rem !important;
          cursor: pointer !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          transition: background 0.15s ease;
        }
        .urm-primary-btn:hover {
          background: #1e293b !important;
        }
        .urm-secondary-btn {
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          color: #334155 !important;
          padding: 8px 16px !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          border-radius: 6px !important;
          cursor: pointer;
        }
        .urm-secondary-btn:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        .urm-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
          margin-top: 24px;
          margin-bottom: 20px;
        }
        .urm-tab {
          padding: 10px 14px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          border: none;
          background: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .urm-tab:hover {
          color: #0f172a;
        }
        .urm-tab.active {
          color: #0c1b33;
          border-bottom-color: #0c1b33;
        }
        .urm-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .urm-search-wrap {
          flex: 1;
          min-width: 240px;
          position: relative;
        }
        .urm-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #94a3b8;
          pointer-events: none;
        }
        .urm-search-input {
          width: 100%;
          padding: 9px 32px 9px 36px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          background: #ffffff;
          outline: none;
          box-sizing: border-box;
        }
        .urm-search-input:focus {
          border-color: #0c1b33;
          box-shadow: 0 0 0 3px rgba(12, 27, 51, 0.08);
        }
        .urm-clear-search {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          color: #94a3b8;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 4px;
        }
        .urm-select {
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          background: #ffffff;
          min-width: 170px;
          cursor: pointer;
          outline: none;
        }
        .urm-select:focus {
          border-color: #0c1b33;
        }
        .urm-table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .urm-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .urm-table th {
          padding: 12px 18px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .urm-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .urm-row {
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .urm-row:hover {
          background: #f8fafc;
        }
        .urm-name-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .urm-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.95rem;
        }
        .urm-email {
          color: #64748b;
          font-size: 0.825rem;
        }
        .urm-badge-you {
          display: inline-block;
          font-size: 0.675rem;
          font-weight: 700;
          background: #fef3c7;
          color: #92400e;
          padding: 1px 6px;
          border-radius: 4px;
          margin-left: 6px;
          vertical-align: middle;
        }
        .urm-role-label {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .urm-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 12px;
          font-size: 0.775rem;
          font-weight: 600;
        }
        .urm-status-pill.active {
          background: #ecfdf5;
          color: #065f46;
        }
        .urm-status-pill.inactive {
          background: #f1f5f9;
          color: #64748b;
        }
        .urm-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .urm-action-btn {
          border: none;
          background: none;
          color: #0c1b33;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .urm-action-btn:hover {
          text-decoration: underline;
          background: #f1f5f9;
        }
        .urm-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
        }
        .urm-pagination-info {
          font-size: 0.825rem;
          color: #64748b;
        }
        .urm-pagination-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .urm-page-number {
          font-size: 0.825rem;
          color: #475569;
          font-weight: 600;
          padding: 0 4px;
        }
        .urm-empty {
          padding: 48px 24px;
          text-align: center;
          color: #64748b;
        }
        .urm-empty-icon {
          font-size: 2.2rem;
          margin-bottom: 8px;
        }
        .urm-empty h3 {
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        .urm-empty p {
          font-size: 0.875rem;
          margin: 0 0 16px 0;
        }
        .urm-roles-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .urm-section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .urm-section-desc {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
        .urm-roles-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .urm-role-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .urm-role-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          background: #fbfcfd;
        }
        .urm-role-header-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .urm-role-title {
          font-size: 0.975rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .urm-role-protected-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #92400e;
          background: #fef3c7;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .urm-role-custom-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #065f46;
          background: #ecfdf5;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .urm-role-desc {
          font-size: 0.825rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .urm-role-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: 16px;
          flex-shrink: 0;
        }
        .urm-user-count {
          font-size: 0.8rem;
          color: #475569;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 600;
        }
        .urm-chevron-link {
          color: #0c1b33;
          font-size: 0.825rem;
          font-weight: 600;
        }
        .urm-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 16px;
        }
        .urm-modal {
          background: #ffffff;
          border-radius: 10px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          padding: 24px;
          box-sizing: border-box;
        }
        .urm-modal-wide {
          max-width: 640px;
          max-height: 85vh;
          overflow-y: auto;
        }
        .urm-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .urm-modal-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .urm-modal-sub {
          font-size: 0.825rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .urm-close-btn {
          border: none;
          background: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
        }
        .urm-close-btn:hover {
          color: #0f172a;
        }
        .urm-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .urm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .urm-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: #334155;
        }
        .urm-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          box-sizing: border-box;
          outline: none;
        }
        .urm-input:focus {
          border-color: #0c1b33;
          box-shadow: 0 0 0 3px rgba(12, 27, 51, 0.08);
        }
        .urm-hint {
          font-size: 0.75rem;
          color: #64748b;
        }
        .urm-modal-foot {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }
        .urm-link-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 8px 12px;
        }
        .urm-link-btn:hover {
          color: #0f172a;
          text-decoration: underline;
        }
        .urm-danger-link {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 0.825rem;
          cursor: pointer;
          padding: 6px 0;
        }
        .urm-danger-link:hover {
          text-decoration: underline;
        }
        .urm-perms-checklist {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 8px;
        }
        .urm-perm-group {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          background: #fafbfc;
        }
        .urm-perm-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .urm-perm-group-title {
          font-size: 0.775rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .urm-group-actions {
          display: flex;
          gap: 8px;
        }
        .urm-small-link {
          border: none;
          background: none;
          color: #0c1b33;
          font-size: 0.725rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .urm-small-link:hover {
          text-decoration: underline;
        }
        .urm-perm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 8px;
        }
        .urm-perm-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        .urm-perm-item.checked {
          border-color: #93c5fd;
          background: #f0f7ff;
        }
        .urm-checkbox {
          margin-top: 3px;
          cursor: pointer;
        }
        .urm-perm-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .urm-perm-name {
          font-size: 0.825rem;
          font-weight: 600;
          color: #1e293b;
        }
        .urm-perm-desc {
          font-size: 0.725rem;
          color: #64748b;
          line-height: 1.3;
        }
        .urm-superadmin-notice {
          padding: 16px;
          background: #fef3c7;
          border-radius: 8px;
          color: #92400e;
          font-size: 0.875rem;
          margin: 12px 0;
          line-height: 1.45;
        }

        /* ── Responsive Mobile Rules: Stacking Cards ── */
        @media (max-width: 640px) {
          .urm-container {
            padding: 16px;
          }
          .urm-header {
            flex-direction: column;
            align-items: stretch;
          }
          .urm-primary-btn {
            width: 100%;
            text-align: center;
          }
          .urm-filter-bar {
            flex-direction: column;
          }
          .urm-select {
            width: 100%;
          }
          .urm-table thead {
            display: none;
          }
          .urm-table, .urm-table tbody, .urm-table tr, .urm-table td {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
          .urm-table tr {
            margin-bottom: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            background: #ffffff;
          }
          .urm-table td {
            padding: 6px 0;
            border: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .urm-table td::before {
            content: attr(data-label);
            font-weight: 600;
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
          }
          .urm-role-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .urm-role-meta {
            margin-left: 0;
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>

      {/* ── Page Header: Title & Single Primary Action ── */}
      <div className="urm-header">
        <div>
          <h1 className="urm-title">Users &amp; Roles</h1>
          <p className="urm-subtitle">Manage team access and role permissions across the portal.</p>
        </div>
        <button
          type="button"
          className="adBtn urm-primary-btn"
          onClick={() => setShowAddModal(true)}
        >
          Add user
        </button>
      </div>

      {/* ── Two Simple Tabs ── */}
      <div className="urm-tabs">
        <button
          type="button"
          className={`urm-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users ({items.length})
        </button>
        <button
          type="button"
          className={`urm-tab ${tab === 'roles' ? 'active' : ''}`}
          onClick={() => setTab('roles')}
        >
          Roles ({roles.length})
        </button>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div>
          {/* Search box and one filter dropdown */}
          <div className="urm-filter-bar">
            <div className="urm-search-wrap">
              <svg className="urm-search-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className="urm-search-input"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              {search && (
                <button type="button" className="urm-clear-search" onClick={() => setSearch('')}>✕</button>
              )}
            </div>

            <select
              className="urm-select"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All roles</option>
              {roles.map(r => (
                <option key={r.slug || r.id} value={r.slug || r.id}>
                  {r.name || r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clean Users Table */}
          <div className="urm-table-card">
            {filteredUsers.length === 0 ? (
              <div className="urm-empty">
                <div className="urm-empty-icon">👤</div>
                <h3>{items.length === 0 ? 'No users yet. Add your first user' : 'No users found'}</h3>
                <p>
                  {items.length === 0
                    ? 'Get started by adding your first team member.'
                    : 'No team members matched your search or role filter.'}
                </p>
                {items.length === 0 ? (
                  <button
                    type="button"
                    className="adBtn urm-primary-btn"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add user
                  </button>
                ) : (
                  <button
                    type="button"
                    className="urm-secondary-btn"
                    onClick={() => { setSearch(''); setRoleFilter('all'); }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <table className="urm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(u => {
                      const roleName = getRoleLabel(u.role);
                      const isSelf = currentUser?.id === u._id;
                      return (
                        <tr
                          key={u._id}
                          className="urm-row"
                          onClick={() => openEditUser(u)}
                        >
                          <td data-label="Name">
                            <div className="urm-name-cell">
                              <span className="urm-name">
                                {u.name}
                                {isSelf && <span className="urm-badge-you">You</span>}
                              </span>
                              <span className="urm-email">{u.email}</span>
                            </div>
                          </td>
                          <td data-label="Role">
                            <span className="urm-role-label">{roleName}</span>
                          </td>
                          <td data-label="Status">
                            <span className={`urm-status-pill ${u.isActive !== false ? 'active' : 'inactive'}`}>
                              <span className="urm-status-dot" />
                              {u.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td data-label="Action" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                className="urm-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditUser(u);
                                }}
                              >
                                Edit
                              </button>
                              {!isSelf && u.role !== 'super_admin' ? (
                                <button
                                  type="button"
                                  className="urm-danger-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteUser(u);
                                  }}
                                  title="Delete user"
                                >
                                  Delete
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="urm-danger-link"
                                  disabled
                                  style={{ opacity: 0.35, cursor: 'not-allowed' }}
                                  title={isSelf ? 'You cannot delete your own account' : 'Super Administrator accounts cannot be deleted'}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="urm-pagination">
                    <span className="urm-pagination-info">
                      Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                    </span>
                    <div className="urm-pagination-actions">
                      <button
                        type="button"
                        className="adBtnOutline adBtnSm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <span className="urm-page-number">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        className="adBtnOutline adBtnSm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div>
          <div className="urm-roles-head">
            <div>
              <h3 className="urm-section-title">Roles</h3>
              <p className="urm-section-desc">Click any role to view or adjust its assigned permissions.</p>
            </div>
            <button
              type="button"
              className="urm-secondary-btn"
              onClick={openCreateRole}
            >
              Create role
            </button>
          </div>

          <div className="urm-roles-list">
            {roles.map(r => {
              const roleId = r.slug || r.id;
              const userCount = items.filter(u => u.role === roleId).length;
              const isSuper = roleId === 'super_admin';
              const isDefault = r.isSystem || r.isProtected || SYSTEM_ROLES.some(sr => sr.id === roleId);
              const isCustom = !isDefault;

              return (
                <div
                  key={r._id || roleId}
                  className="urm-role-item"
                  onClick={() => openRolePermissions(r)}
                >
                  <div className="urm-role-info">
                    <div className="urm-role-header-line">
                      <h4 className="urm-role-title">{r.name || r.label}</h4>
                      {isSuper && <span className="urm-role-protected-tag">Protected</span>}
                      {isCustom && <span className="urm-role-custom-tag">Custom</span>}
                    </div>
                    <p className="urm-role-desc">
                      {r.description || r.desc || 'Operational role configured for portal members.'}
                    </p>
                  </div>

                  <div className="urm-role-meta">
                    <span className="urm-user-count">
                      {userCount} user{userCount === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      className="urm-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditRole(r);
                      }}
                      title="Edit role name & description"
                    >
                      Edit
                    </button>
                    {isCustom ? (
                      <button
                        type="button"
                        className="urm-danger-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteRole(r);
                        }}
                        title="Delete custom role"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="urm-danger-link"
                        disabled
                        style={{ opacity: 0.35, cursor: 'not-allowed' }}
                        title="Default system roles cannot be deleted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Delete
                      </button>
                    )}
                    <span className="urm-chevron-link">Permissions →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD USER MODAL (Short form with only essentials) ── */}
      {showAddModal && (
        <div className="urm-modal-backdrop" onClick={() => !inviting && setShowAddModal(false)}>
          <div className="urm-modal" onClick={e => e.stopPropagation()}>
            <div className="urm-modal-head">
              <div>
                <h3 className="urm-modal-title">Add user</h3>
                <p className="urm-modal-sub">Send an invite to a new portal team member.</p>
              </div>
              <button
                type="button"
                className="urm-close-btn"
                onClick={() => !inviting && setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="urm-form">
              <div className="urm-field">
                <label className="urm-label" htmlFor="add-name">Full name</label>
                <input
                  id="add-name"
                  required
                  type="text"
                  className="urm-input"
                  placeholder="e.g. Commander Demelash"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>

              <div className="urm-field">
                <label className="urm-label" htmlFor="add-email">Email</label>
                <input
                  id="add-email"
                  required
                  type="email"
                  className="urm-input"
                  placeholder="e.g. demelash@police.gov.et"
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>

              <div className="urm-field">
                <label className="urm-label" htmlFor="add-role">Role</label>
                <select
                  id="add-role"
                  className="urm-select"
                  style={{ width: '100%' }}
                  value={addForm.role}
                  onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                >
                  {roles.map(r => {
                    const rId = r.slug || r.id;
                    return (
                      <option
                        key={rId}
                        value={rId}
                        disabled={rId === 'super_admin' && !isSuperAdmin}
                      >
                        {r.name || r.label} {rId === 'super_admin' && !isSuperAdmin ? '(Super Admin only)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="urm-modal-foot">
                <button
                  type="button"
                  className="urm-link-btn"
                  disabled={inviting}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adBtn urm-primary-btn"
                  disabled={inviting}
                >
                  {inviting ? 'Sending invite…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL / SIDE PANEL ── */}
      {editUser && (
        <div className="urm-modal-backdrop" onClick={() => !savingUser && setEditUser(null)}>
          <div className="urm-modal" onClick={e => e.stopPropagation()}>
            <div className="urm-modal-head">
              <div>
                <h3 className="urm-modal-title">Edit user</h3>
                <p className="urm-modal-sub">{editUser.email}</p>
              </div>
              <button
                type="button"
                className="urm-close-btn"
                onClick={() => !savingUser && setEditUser(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="urm-form">
              <div className="urm-field">
                <label className="urm-label" htmlFor="edit-name">Full name</label>
                <input
                  id="edit-name"
                  required
                  type="text"
                  className="urm-input"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="urm-field">
                <label className="urm-label" htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  className="urm-select"
                  style={{ width: '100%' }}
                  value={editForm.role}
                  disabled={currentUser?.id === editUser._id}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {roles.map(r => {
                    const rId = r.slug || r.id;
                    return (
                      <option
                        key={rId}
                        value={rId}
                        disabled={rId === 'super_admin' && !isSuperAdmin}
                      >
                        {r.name || r.label}
                      </option>
                    );
                  })}
                </select>
                {currentUser?.id === editUser._id && (
                  <span className="urm-hint">You cannot modify your own role.</span>
                )}
              </div>

              <div className="urm-field">
                <label className="urm-label" htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  className="urm-select"
                  style={{ width: '100%' }}
                  value={editForm.isActive ? 'active' : 'inactive'}
                  disabled={currentUser?.id === editUser._id || editUser.role === 'super_admin'}
                  onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="urm-modal-foot" style={{ justifyContent: 'space-between' }}>
                <div>
                  {currentUser?.id !== editUser._id && editUser.role !== 'super_admin' && (
                    <button
                      type="button"
                      className="urm-danger-link"
                      onClick={() => confirmDeleteUser(editUser)}
                    >
                      Delete user
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="urm-link-btn"
                    disabled={savingUser}
                    onClick={() => setEditUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="adBtn urm-primary-btn"
                    disabled={savingUser}
                  >
                    {savingUser ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ROLE PERMISSIONS MODAL (Checklist grouped by clean categories) ── */}
      {selectedRole && (
        <div className="urm-modal-backdrop" onClick={() => !savingRole && setSelectedRole(null)}>
          <div className="urm-modal urm-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="urm-modal-head">
              <div>
                <h3 className="urm-modal-title">{selectedRole.name || selectedRole.label}</h3>
                <p className="urm-modal-sub">
                  {selectedRole.description || selectedRole.desc || 'Assigned permissions for this role.'}
                </p>
              </div>
              <button
                type="button"
                className="urm-close-btn"
                onClick={() => !savingRole && setSelectedRole(null)}
              >
                ✕
              </button>
            </div>

            {selectedRole.slug === 'super_admin' ? (
              <div className="urm-superadmin-notice">
                <strong>Full System Access (*):</strong> Super Administrators have unrestricted administrative rights across all modules, safety controls, and settings.
              </div>
            ) : (
              <div className="urm-perms-checklist">
                {groupedPermissions.map(group => (
                  <div key={group.category} className="urm-perm-group">
                    <div className="urm-perm-group-header">
                      <h4 className="urm-perm-group-title">{group.category}</h4>
                      <div className="urm-group-actions">
                        <button
                          type="button"
                          className="urm-small-link"
                          onClick={() => {
                            const keys = group.items.map(p => p.id);
                            setRolePerms(prev => Array.from(new Set([...prev, ...keys])));
                          }}
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          className="urm-small-link"
                          onClick={() => {
                            const keys = new Set(group.items.map(p => p.id));
                            setRolePerms(prev => prev.filter(k => !keys.has(k)));
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="urm-perm-grid">
                      {group.items.map(p => {
                        const isChecked = rolePerms.includes(p.id);
                        return (
                          <label key={p.id} className={`urm-perm-item ${isChecked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              className="urm-checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(p.id)}
                            />
                            <div className="urm-perm-text">
                              <span className="urm-perm-name">{p.name}</span>
                              {p.desc && <span className="urm-perm-desc">{p.desc}</span>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="urm-modal-foot">
              <button
                type="button"
                className="urm-link-btn"
                disabled={savingRole}
                onClick={() => setSelectedRole(null)}
              >
                Cancel
              </button>
              {selectedRole.slug !== 'super_admin' && (
                <button
                  type="button"
                  className="adBtn urm-primary-btn"
                  disabled={savingRole}
                  onClick={handleSaveRolePermissions}
                >
                  {savingRole ? 'Saving…' : 'Save permissions'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE ROLE MODAL (Secondary weight) ── */}
      {showCreateRole && (
        <div className="urm-modal-backdrop" onClick={() => !creatingRole && setShowCreateRole(false)}>
          <div className="urm-modal urm-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="urm-modal-head">
              <div>
                <h3 className="urm-modal-title">Create role</h3>
                <p className="urm-modal-sub">Define a new operational role and pick assigned permissions.</p>
              </div>
              <button
                type="button"
                className="urm-close-btn"
                onClick={() => !creatingRole && setShowCreateRole(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="urm-form">
              <div className="urm-field">
                <label className="urm-label" htmlFor="newrole-name">Role name</label>
                <input
                  id="newrole-name"
                  required
                  type="text"
                  className="urm-input"
                  placeholder="e.g. Traffic Coordinator, Media Lead"
                  value={newRoleForm.name}
                  onChange={e => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                />
              </div>

              <div className="urm-field">
                <label className="urm-label" htmlFor="newrole-desc">Description</label>
                <input
                  id="newrole-desc"
                  type="text"
                  className="urm-input"
                  placeholder="Brief summary of duties and responsibilities"
                  value={newRoleForm.description}
                  onChange={e => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                />
              </div>

              <div className="urm-field">
                <label className="urm-label">Permissions ({newRoleForm.permissions.length} selected)</label>
                <div className="urm-perms-checklist" style={{ maxHeight: '230px', overflowY: 'auto' }}>
                  {groupedPermissions.map(group => (
                    <div key={group.category} className="urm-perm-group">
                      <div className="urm-perm-group-header">
                        <h4 className="urm-perm-group-title">{group.category}</h4>
                        <div className="urm-group-actions">
                          <button
                            type="button"
                            className="urm-small-link"
                            onClick={() => {
                              const keys = group.items.map(p => p.id);
                              setNewRoleForm(prev => ({
                                ...prev,
                                permissions: Array.from(new Set([...prev.permissions, ...keys]))
                              }));
                            }}
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            className="urm-small-link"
                            onClick={() => {
                              const keys = new Set(group.items.map(p => p.id));
                              setNewRoleForm(prev => ({
                                ...prev,
                                permissions: prev.permissions.filter(k => !keys.has(k))
                              }));
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="urm-perm-grid">
                        {group.items.map(p => {
                          const isChecked = newRoleForm.permissions.includes(p.id);
                          return (
                            <label key={p.id} className={`urm-perm-item ${isChecked ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                className="urm-checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const updated = isChecked
                                    ? newRoleForm.permissions.filter(k => k !== p.id)
                                    : [...newRoleForm.permissions, p.id];
                                  setNewRoleForm(prev => ({ ...prev, permissions: updated }));
                                }}
                              />
                              <div className="urm-perm-text">
                                <span className="urm-perm-name">{p.name}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="urm-modal-foot">
                <button
                  type="button"
                  className="urm-link-btn"
                  disabled={creatingRole}
                  onClick={() => setShowCreateRole(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adBtn urm-primary-btn"
                  disabled={creatingRole}
                >
                  {creatingRole ? 'Creating…' : 'Create role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── EDIT ROLE MODAL ── */}
      {editRoleModal && (
        <div className="urm-modal-backdrop" onClick={() => !savingRoleMeta && setEditRoleModal(null)}>
          <div className="urm-modal" onClick={e => e.stopPropagation()}>
            <div className="urm-modal-head">
              <div>
                <h3 className="urm-modal-title">Edit role</h3>
                <p className="urm-modal-sub">Update the role display name and description.</p>
              </div>
              <button
                type="button"
                className="urm-close-btn"
                onClick={() => !savingRoleMeta && setEditRoleModal(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoleMeta}>
              <div className="urm-form-group">
                <label className="urm-label" htmlFor="edit-role-name">Role name</label>
                <input
                  id="edit-role-name"
                  type="text"
                  className="urm-input"
                  value={editRoleModal.name}
                  onChange={e => setEditRoleModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Compliance Manager"
                  required
                  autoFocus
                />
              </div>

              <div className="urm-form-group">
                <label className="urm-label" htmlFor="edit-role-desc">Description</label>
                <textarea
                  id="edit-role-desc"
                  className="urm-input"
                  rows={3}
                  value={editRoleModal.description}
                  onChange={e => setEditRoleModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description of this role's purpose..."
                />
              </div>

              <div className="urm-modal-foot">
                <button
                  type="button"
                  className="urm-link-btn"
                  disabled={savingRoleMeta}
                  onClick={() => setEditRoleModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adBtn urm-primary-btn"
                  disabled={savingRoleMeta}
                >
                  {savingRoleMeta ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE ROLE CONFIRMATION DIALOG ── */}
      {deleteRoleDialog && (
        <div className="urm-modal-backdrop" onClick={() => !deletingRole && setDeleteRoleDialog(null)}>
          <div className="urm-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="urm-modal-head">
              <div>
                <h3 className="urm-modal-title">Delete role</h3>
                <p className="urm-modal-sub">
                  {deleteRoleDialog.userCount > 0
                    ? `${deleteRoleDialog.userCount} user${deleteRoleDialog.userCount === 1 ? ' is' : 's are'} currently assigned to this role.`
                    : `Are you sure you want to delete "${deleteRoleDialog.name}"?`}
                </p>
              </div>
              <button
                type="button"
                className="urm-close-btn"
                onClick={() => !deletingRole && setDeleteRoleDialog(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deleteRoleDialog.userCount > 0 ? (
                <>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                    Select a replacement role to transfer assigned users to before deleting <strong>{deleteRoleDialog.name}</strong>:
                  </p>

                  <div className="urm-form-group" style={{ margin: 0 }}>
                    <label className="urm-label" htmlFor="replacement-role-select">Replacement role</label>
                    <select
                      id="replacement-role-select"
                      className="urm-input"
                      value={deleteRoleDialog.reassignTo}
                      onChange={e => setDeleteRoleDialog(prev => ({ ...prev, reassignTo: e.target.value }))}
                    >
                      {roles
                        .filter(r => (r.slug || r.id) !== deleteRoleDialog.roleId && (r.slug || r.id) !== 'super_admin')
                        .map(r => {
                          const rId = r.slug || r.id;
                          return (
                            <option key={rId} value={rId}>
                              {r.name || r.label || rId}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                  This action cannot be undone. Any custom permissions associated with this role will be unassigned.
                </p>
              )}
            </div>

            <div className="urm-modal-foot">
              <button
                type="button"
                className="urm-link-btn"
                disabled={deletingRole}
                onClick={() => setDeleteRoleDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adBtn urm-danger-btn"
                style={{ background: '#dc2626', color: '#ffffff', border: 'none' }}
                disabled={deletingRole}
                onClick={handleConfirmDeleteRole}
              >
                {deletingRole ? 'Deleting…' : (deleteRoleDialog.userCount > 0 ? 'Reassign & delete' : 'Delete role')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DYNAMIC PERMISSIONS MANAGEMENT (Permissions Tab)
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   PERMISSIONS MANAGEMENT
   Create, edit, delete, and assign permissions dynamically
   ═══════════════════════════════════════════════════ */

const DEFAULT_PERMISSIONS_LIST = [
  { id: 'content:read', key: 'content:read', name: 'View content', category: 'Content', desc: 'Read news articles, safety guides, and public documents', isSystem: true, roles: ['admin', 'dispatcher', 'communications', 'station_commander', 'investigator', 'editor', 'author', 'staff', 'user'] },
  { id: 'content:write', key: 'content:write', name: 'Create and edit content', category: 'Content', desc: 'Draft and edit news, services, and procedural updates', isSystem: true, roles: ['admin', 'communications', 'editor', 'author'] },
  { id: 'content:publish', key: 'content:publish', name: 'Publish content', category: 'Content', desc: 'Publish official articles live to the public portal', isSystem: true, roles: ['admin', 'communications', 'editor'] },
  { id: 'users:manage', key: 'users:manage', name: 'Manage users', category: 'Users', desc: 'Invite new users, update profiles, and deactivate accounts', isSystem: true, roles: ['admin'] },
  { id: 'users:roles', key: 'users:roles', name: 'Assign roles', category: 'Users', desc: 'Assign and change operational user roles', isSystem: true, roles: ['admin'] },
  { id: 'settings:manage', key: 'settings:manage', name: 'Portal settings', category: 'Settings', desc: 'Configure official site branding, themes, and page content', isSystem: true, roles: ['admin'] },
  { id: 'hotlines:manage', key: 'hotlines:manage', name: 'Emergency hotlines', category: 'Settings', desc: 'Add, update, reorder, and activate hotline contacts', isSystem: true, roles: ['admin', 'dispatcher'] },
  { id: 'alerts:manage', key: 'alerts:manage', name: 'Emergency alerts', category: 'Settings', desc: 'Broadcast urgent safety warnings and traffic advisories', isSystem: true, roles: ['admin', 'dispatcher', 'communications'] },
  { id: 'submissions:manage', key: 'submissions:manage', name: 'Citizen inquiries', category: 'Settings', desc: 'Review, process, and respond to citizen incident reports', isSystem: true, roles: ['admin', 'dispatcher', 'station_commander', 'investigator', 'staff'] },
  { id: 'stations:manage', key: 'stations:manage', name: 'Station directory', category: 'Settings', desc: 'Manage sub-city divisions and district police stations', isSystem: true, roles: ['admin', 'station_commander'] },
  { id: 'vacancies:manage', key: 'vacancies:manage', name: 'Job vacancies', category: 'Settings', desc: 'Post and manage career recruitments and employment notices', isSystem: true, roles: ['admin', 'station_commander'] },
  { id: 'media:manage', key: 'media:manage', name: 'Media library', category: 'Settings', desc: 'Upload, organize, and delete official photo assets', isSystem: true, roles: ['admin', 'communications', 'editor', 'author'] },
  { id: 'logs:read', key: 'logs:read', name: 'Audit logs', category: 'Settings', desc: 'Inspect platform security logs and officer activity records', isSystem: true, roles: ['admin'] },
  { id: 'backup:read', key: 'backup:read', name: 'System backups', category: 'Settings', desc: 'Export platform data and perform disaster recovery backups', isSystem: true, roles: ['admin'] },
  { id: 'analytics:read', key: 'analytics:read', name: 'Dashboard analytics', category: 'Settings', desc: 'View portal statistics and dashboard summaries', isSystem: true, roles: ['admin', 'dispatcher', 'communications', 'station_commander'] }
];

const DEFAULT_PERM_ROLES = [
  {
    id: 'super_admin',
    slug: 'super_admin',
    name: 'Super Admin',
    description: 'Full unrestricted executive authority across all portal systems, users, and security settings.',
    permissions: ['*'],
    isProtected: true,
    isSystem: true
  },
  {
    id: 'admin',
    slug: 'admin',
    name: 'Admin',
    description: 'System administrator managing content, hotlines, media, staff accounts, and portal settings.',
    permissions: [
      'content:read', 'content:write', 'content:publish', 'hotlines:manage',
      'alerts:manage', 'submissions:manage', 'stations:manage', 'vacancies:manage',
      'media:manage', 'users:manage', 'users:roles', 'settings:manage', 'logs:read', 'backup:read', 'analytics:read'
    ],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'dispatcher',
    slug: 'dispatcher',
    name: 'Emergency Dispatcher',
    description: 'Dedicated emergency response officer managing dynamic hotlines and urgent safety alerts.',
    permissions: ['content:read', 'hotlines:manage', 'alerts:manage', 'submissions:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'communications',
    slug: 'communications',
    name: 'Communications / PR Officer',
    description: 'Public relations officer publishing official news releases, safety campaigns, and media assets.',
    permissions: ['content:read', 'content:write', 'content:publish', 'media:manage', 'alerts:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'station_commander',
    slug: 'station_commander',
    name: 'Station Commander',
    description: 'District commander managing local police stations, personnel vacancies, and citizen requests.',
    permissions: ['content:read', 'stations:manage', 'vacancies:manage', 'submissions:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'investigator',
    slug: 'investigator',
    name: 'Investigator / Legal Officer',
    description: 'Officer assigned to reviewing citizen crime reports, legal safety documents, and evidence.',
    permissions: ['content:read', 'submissions:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'editor',
    slug: 'editor',
    name: 'Editor',
    description: 'Editorial staff with full rights to draft, edit, and publish news and procedural guidance.',
    permissions: ['content:read', 'content:write', 'content:publish', 'media:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'author',
    slug: 'author',
    name: 'Author',
    description: 'Content creator drafting news and uploading media assets for editorial approval.',
    permissions: ['content:read', 'content:write', 'media:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'staff',
    slug: 'staff',
    name: 'Field Officer / Staff',
    description: 'Field officer reviewing and responding to incoming public citizen inquiries and requests.',
    permissions: ['content:read', 'submissions:manage'],
    isProtected: false,
    isSystem: true
  },
  {
    id: 'user',
    slug: 'user',
    name: 'Standard User',
    description: 'Standard authenticated portal account with read-only operational visibility.',
    permissions: ['content:read'],
    isProtected: false,
    isSystem: true
  }
];

function PermissionsAdmin({ currentUser }) {
  const [permissionsList, setPermissionsList] = useState(DEFAULT_PERMISSIONS_LIST);
  const [roles, setRoles] = useState(DEFAULT_PERM_ROLES);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('admin');
  const [rolePerms, setRolePerms] = useState(
    DEFAULT_PERM_ROLES.find(r => r.slug === 'admin')?.permissions || []
  );
  const [originalPerms, setOriginalPerms] = useState(
    DEFAULT_PERM_ROLES.find(r => r.slug === 'admin')?.permissions || []
  );
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Add Permission Modal state
  const [addPermModal, setAddPermModal] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [newPermForm, setNewPermForm] = useState({
    name: '',
    key: '',
    category: 'Content',
    customCategory: '',
    description: '',
    roles: []
  });

  // Edit Permission Modal state
  const [editPermModal, setEditPermModal] = useState(null);

  // Delete Permission Dialog state
  const [deletePermDialog, setDeletePermDialog] = useState(null);
  const [deletingPerm, setDeletingPerm] = useState(false);

  // Edit Role Side Panel / Modal state
  const [editRoleModal, setEditRoleModal] = useState(null);
  const [savingRoleMeta, setSavingRoleMeta] = useState(false);

  // Delete Role Dialog state
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // Dynamic categories computed from loaded permissions
  const existingCategories = useMemo(() => {
    const set = new Set(['Content', 'Users', 'Settings', 'Operations']);
    permissionsList.forEach(p => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [permissionsList]);

  // Group permissions dynamically by category
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissionsList.forEach(p => {
      const cat = p.category ? p.category.trim() : 'Operations';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items
    }));
  }, [permissionsList]);

  const load = async () => {
    try {
      setLoading(true);

      // 1. Load users
      try {
        const usersData = await api('/admin/users');
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        }
      } catch (uErr) {
        console.warn('Could not load user accounts:', uErr);
      }

      // 2. Load dynamic permissions from backend
      try {
        const pData = await api('/admin/permissions');
        if (pData?.permissions && Array.isArray(pData.permissions) && pData.permissions.length > 0) {
          setPermissionsList(pData.permissions.map(p => ({
            _id: p._id,
            id: p.key,
            key: p.key,
            name: p.name,
            category: p.category || 'Operations',
            desc: p.description || p.desc || '',
            description: p.description || p.desc || '',
            roles: p.roles || [],
            isSystem: !!p.isSystem
          })));
        }
      } catch (pErr) {
        console.warn('Could not load permissions from API, using default list:', pErr);
      }

      // 3. Load roles from server
      let loadedRoles = DEFAULT_PERM_ROLES;
      try {
        const rolesData = await api('/admin/roles');
        if (Array.isArray(rolesData) && rolesData.length > 0) {
          loadedRoles = rolesData;
        }
      } catch (rErr) {
        console.warn('Roles API unavailable or backend server pending restart:', rErr);
        if (rErr.message && rErr.message.includes('API endpoint not found')) {
          setToast({
            message: 'Backend server is running an older instance. Please restart your backend server terminal (Ctrl+C then npm run dev or npm start) to activate dynamic role endpoints.',
            type: 'warning'
          });
        }
      }

      setRoles(loadedRoles);

      // Retain or select active role
      const currentExists = loadedRoles.some(r => (r.slug || r.id) === selectedRoleSlug);
      const activeSlug = currentExists ? selectedRoleSlug : (loadedRoles[0]?.slug || loadedRoles[0]?.id || 'admin');
      setSelectedRoleSlug(activeSlug);

      const activeRole = loadedRoles.find(r => (r.slug || r.id) === activeSlug);
      if (activeRole) {
        const perms = Array.isArray(activeRole.permissions)
          ? [...activeRole.permissions]
          : (Array.isArray(activeRole.perms) ? [...activeRole.perms] : []);
        setRolePerms(perms);
        setOriginalPerms(perms);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedRole = roles.find(r => (r.slug || r.id) === selectedRoleSlug) || roles[0];
  const isSuperAdminRole = selectedRole?.slug === 'super_admin' || selectedRole?.id === 'super_admin';
  const isDefaultRole = selectedRole?.isProtected || selectedRole?.isSystem || ['super_admin', 'admin', 'dispatcher', 'communications', 'station_commander', 'investigator', 'editor', 'author', 'staff', 'user'].includes(selectedRole?.slug || selectedRole?.id);

  // Switch active role
  const handleSelectRole = (slug) => {
    setSelectedRoleSlug(slug);
    const role = roles.find(r => (r.slug || r.id) === slug);
    if (role) {
      const perms = Array.isArray(role.permissions)
        ? [...role.permissions]
        : (Array.isArray(role.perms) ? [...role.perms] : []);
      setRolePerms(perms);
      setOriginalPerms(perms);
    }
  };

  // Toggle inline permission for current role
  const togglePermission = (permId) => {
    if (isSuperAdminRole) return;
    setRolePerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const selectCategory = (categoryItems) => {
    if (isSuperAdminRole) return;
    const ids = categoryItems.map(p => p.id || p.key);
    setRolePerms(prev => Array.from(new Set([...prev, ...ids])));
  };

  const clearCategory = (categoryItems) => {
    if (isSuperAdminRole) return;
    const ids = new Set(categoryItems.map(p => p.id || p.key));
    setRolePerms(prev => prev.filter(p => !ids.has(p)));
  };

  const hasUnsavedChanges = JSON.stringify([...rolePerms].sort()) !== JSON.stringify([...originalPerms].sort());

  const handleCancel = () => {
    setRolePerms([...originalPerms]);
  };

  // Save role permission changes
  const handleSaveRolePerms = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const roleId = selectedRole._id || ('sys_' + (selectedRole.slug || selectedRole.id));
      await api(`/admin/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: rolePerms })
      });
      setOriginalPerms([...rolePerms]);
      setToast({ message: `Permissions saved for ${selectedRole.name || selectedRole.label}.`, type: 'success' });
      setRoles(prev => prev.map(r => (r.slug || r.id) === selectedRoleSlug ? { ...r, permissions: rolePerms } : r));

      // Also update local permissionsList roles mapping
      setPermissionsList(prev => prev.map(p => {
        const hasIt = rolePerms.includes(p.key || p.id);
        const rolesSet = new Set(p.roles || []);
        if (hasIt) rolesSet.add(selectedRoleSlug);
        else rolesSet.delete(selectedRoleSlug);
        return { ...p, roles: Array.from(rolesSet) };
      }));
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── CREATE PERMISSION FLOW ──
  const handleCreatePermission = async (e) => {
    e.preventDefault();
    if (!newPermForm.name.trim()) {
      setToast({ message: 'Permission name is required.', type: 'error' });
      return;
    }

    const cleanKey = (newPermForm.key || newPermForm.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_:-]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!cleanKey) {
      setToast({ message: 'Valid permission key/code is required.', type: 'error' });
      return;
    }

    const resolvedCategory = newPermForm.category === '__new'
      ? (newPermForm.customCategory.trim() || 'Operations')
      : (newPermForm.category.trim() || 'Operations');

    setSavingPerm(true);
    try {
      const created = await api('/admin/permissions', {
        method: 'POST',
        body: JSON.stringify({
          name: newPermForm.name.trim(),
          key: cleanKey,
          category: resolvedCategory,
          description: newPermForm.description.trim(),
          roles: newPermForm.roles
        })
      });

      const normalized = {
        _id: created._id,
        id: created.key,
        key: created.key,
        name: created.name,
        category: created.category,
        desc: created.description || '',
        description: created.description || '',
        roles: created.roles || [],
        isSystem: false
      };

      setPermissionsList(prev => [...prev, normalized]);

      // If the currently active role was selected, check it right away
      if (newPermForm.roles.includes(selectedRoleSlug)) {
        setRolePerms(prev => Array.from(new Set([...prev, normalized.id])));
        setOriginalPerms(prev => Array.from(new Set([...prev, normalized.id])));
      }

      setToast({ message: `Permission "${normalized.name}" created successfully.`, type: 'success' });
      setAddPermModal(false);
      setNewPermForm({
        name: '',
        key: '',
        category: 'Content',
        customCategory: '',
        description: '',
        roles: []
      });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSavingPerm(false);
    }
  };

  // ── EDIT PERMISSION FLOW ──
  const openEditPerm = (perm, e) => {
    if (e) e.stopPropagation();
    setEditPermModal({
      _id: perm._id,
      id: perm.id || perm.key,
      key: perm.key || perm.id,
      name: perm.name,
      category: perm.category || 'Operations',
      customCategory: '',
      description: perm.description || perm.desc || '',
      roles: Array.isArray(perm.roles) ? [...perm.roles] : [],
      isSystem: !!perm.isSystem
    });
  };

  const handleSaveEditPerm = async (e) => {
    e.preventDefault();
    if (!editPermModal?.name?.trim()) {
      setToast({ message: 'Permission name is required.', type: 'error' });
      return;
    }

    const resolvedCategory = editPermModal.category === '__new'
      ? (editPermModal.customCategory.trim() || 'Operations')
      : (editPermModal.category.trim() || 'Operations');

    setSavingPerm(true);
    try {
      const permId = editPermModal._id || editPermModal.key;
      const payload = {
        name: editPermModal.name.trim(),
        category: resolvedCategory,
        description: editPermModal.description.trim(),
        roles: editPermModal.roles
      };
      if (!editPermModal.isSystem && editPermModal.key) {
        payload.key = editPermModal.key.toLowerCase().trim().replace(/[^a-z0-9_:-]+/g, '_');
      }

      const updated = await api(`/admin/permissions/${permId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const updatedItem = {
        ...editPermModal,
        _id: updated._id || editPermModal._id,
        name: updated.name || payload.name,
        key: updated.key || editPermModal.key,
        id: updated.key || editPermModal.key,
        category: updated.category || payload.category,
        description: updated.description || payload.description,
        desc: updated.description || payload.description,
        roles: updated.roles || payload.roles
      };

      setPermissionsList(prev => prev.map(p =>
        (p._id === editPermModal._id || p.key === editPermModal.key) ? updatedItem : p
      ));

      // Reflect in current role checkboxes if role was assigned or unassigned
      if (editPermModal.roles.includes(selectedRoleSlug)) {
        setRolePerms(prev => Array.from(new Set([...prev, updatedItem.id])));
      } else {
        setRolePerms(prev => prev.filter(p => p !== updatedItem.id));
      }

      setToast({ message: `Permission "${updatedItem.name}" updated successfully.`, type: 'success' });
      setEditPermModal(null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSavingPerm(false);
    }
  };

  // ── DELETE PERMISSION FLOW ──
  const openDeletePerm = (perm, e) => {
    if (e) e.stopPropagation();
    if (perm.isSystem) return;
    setDeletePermDialog(perm);
  };

  const handleConfirmDeletePerm = async () => {
    if (!deletePermDialog) return;
    setDeletingPerm(true);
    try {
      const permId = deletePermDialog._id || deletePermDialog.key;
      await api(`/admin/permissions/${permId}`, { method: 'DELETE' });

      setPermissionsList(prev => prev.filter(p =>
        p._id !== deletePermDialog._id && p.key !== deletePermDialog.key
      ));
      setRolePerms(prev => prev.filter(p =>
        p !== deletePermDialog.key && p !== deletePermDialog.id
      ));
      setOriginalPerms(prev => prev.filter(p =>
        p !== deletePermDialog.key && p !== deletePermDialog.id
      ));

      setToast({ message: `Permission "${deletePermDialog.name}" deleted successfully.`, type: 'success' });
      setDeletePermDialog(null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeletingPerm(false);
    }
  };

  // ── EDIT ROLE MODAL ──
  const openEditRole = (role) => {
    setEditRoleModal({
      role,
      name: role.name || role.label,
      description: role.description || role.desc || ''
    });
  };

  const handleSaveRoleMeta = async (e) => {
    e.preventDefault();
    if (!editRoleModal?.name?.trim()) {
      setToast({ message: 'Role name is required.', type: 'error' });
      return;
    }
    setSavingRoleMeta(true);
    try {
      const roleId = editRoleModal.role._id || ('sys_' + (editRoleModal.role.slug || editRoleModal.role.id));
      await api(`/admin/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editRoleModal.name.trim(),
          description: editRoleModal.description.trim()
        })
      });
      setToast({ message: 'Role updated successfully.', type: 'success' });
      setRoles(prev => prev.map(r => (r.slug || r.id) === (editRoleModal.role.slug || editRoleModal.role.id)
        ? { ...r, name: editRoleModal.name.trim(), description: editRoleModal.description.trim() }
        : r
      ));
      setEditRoleModal(null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSavingRoleMeta(false);
    }
  };

  // ── DELETE ROLE FLOW ──
  const openDeleteDialog = (role) => {
    const roleSlug = role.slug || role.id;
    const userCount = users.filter(u => u.role === roleSlug).length;
    const otherRoles = roles.filter(r => (r.slug || r.id) !== roleSlug);
    setDeleteDialog({
      role,
      userCount,
      replacementRole: otherRoles.find(r => (r.slug || r.id) === 'user') ? 'user' : (otherRoles[0]?.slug || otherRoles[0]?.id || '')
    });
  };

  const handleConfirmDeleteRole = async () => {
    if (!deleteDialog) return;
    setDeletingRole(true);
    try {
      const roleId = deleteDialog.role._id;
      const query = deleteDialog.userCount > 0 ? `?reassignTo=${deleteDialog.replacementRole}` : '';
      await api(`/admin/roles/${roleId}${query}`, { method: 'DELETE' });

      const replacementRoleObj = roles.find(r => (r.slug || r.id) === deleteDialog.replacementRole);
      const replacementName = replacementRoleObj?.name || replacementRoleObj?.label || deleteDialog.replacementRole;
      const msg = deleteDialog.userCount > 0
        ? `Role deleted and ${deleteDialog.userCount} user(s) reassigned to ${replacementName}.`
        : 'Role deleted successfully.';
      setToast({ message: msg, type: 'success' });
      setDeleteDialog(null);

      const remaining = roles.filter(r => r._id !== roleId && (r.slug || r.id) !== (deleteDialog.role.slug || deleteDialog.role.id));
      setRoles(remaining);
      if (remaining.length > 0) {
        handleSelectRole(remaining[0].slug || remaining[0].id);
      }
      api('/admin/users').then(setUsers).catch(() => { });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeletingRole(false);
    }
  };

  return (
    <div className="perm-page-container">
      {/* ── Scoped Styling for Pure Minimalist Hierarchy ── */}
      <style>{`
        .perm-page-container {
          padding: 24px;
          max-width: 1180px;
          margin: 0 auto;
          color: #0f172a;
          font-family: inherit;
        }
        .perm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }
        .perm-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .perm-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .perm-layout {
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 24px;
          align-items: start;
        }
        .perm-sidebar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .perm-sidebar-head {
          padding: 8px 12px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .perm-role-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }
        .perm-role-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          padding: 12px 14px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.12s ease;
        }
        .perm-role-btn:hover {
          background: #f8fafc;
        }
        .perm-role-btn.active {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .perm-role-btn-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .perm-role-name {
          font-size: 0.925rem;
          font-weight: 600;
          color: #0f172a;
        }
        .perm-role-badge-default {
          font-size: 0.675rem;
          font-weight: 600;
          color: #475569;
          background: #e2e8f0;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .perm-role-desc {
          font-size: 0.775rem;
          color: #64748b;
          margin: 3px 0 0 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .perm-role-users {
          font-size: 0.725rem;
          color: #94a3b8;
          margin-top: 4px;
        }
        .perm-mobile-selector {
          display: none;
          margin-bottom: 16px;
        }
        .perm-main-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .perm-main-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .perm-role-active-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .perm-role-active-desc {
          font-size: 0.875rem;
          color: #64748b;
          margin: 6px 0 0 0;
          line-height: 1.45;
        }
        .perm-secondary-btn {
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          color: #334155 !important;
          padding: 8px 14px !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          border-radius: 6px !important;
          cursor: pointer;
          white-space: nowrap;
        }
        .perm-secondary-btn:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        .perm-primary-btn {
          background: #0c1b33 !important;
          color: #ffffff !important;
          border: none !important;
          padding: 9px 18px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 0.875rem !important;
          cursor: pointer !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          transition: background 0.15s ease;
          white-space: nowrap;
        }
        .perm-primary-btn:hover:not(:disabled) {
          background: #1e293b !important;
        }
        .perm-primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
        }
        .perm-superadmin-alert {
          margin: 20px 0;
          padding: 16px;
          background: #fef3c7;
          border-radius: 6px;
          color: #92400e;
          font-size: 0.875rem;
          line-height: 1.45;
        }
        .perm-groups-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 20px;
        }
        .perm-group-box {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 18px 20px;
          background: #fafbfc;
        }
        .perm-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .perm-group-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .perm-group-actions {
          display: flex;
          gap: 12px;
        }
        .perm-action-link {
          background: none;
          border: none;
          color: #0c1b33;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .perm-action-link:hover {
          text-decoration: underline;
        }
        .perm-items-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .perm-row-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: all 0.1s ease;
        }
        .perm-row-item:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .perm-row-item.checked {
          border-color: #cbd5e1;
          background: #ffffff;
        }
        .perm-row-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
          cursor: pointer;
        }
        .perm-checkbox {
          margin-top: 3px;
          cursor: pointer;
          accent-color: #0c1b33;
          width: 16px;
          height: 16px;
        }
        .perm-item-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .perm-item-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .perm-item-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }
        .perm-item-key {
          font-family: monospace;
          font-size: 0.7rem;
          color: #475569;
          background: #f1f5f9;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .perm-item-desc {
          font-size: 0.775rem;
          color: #64748b;
          line-height: 1.35;
        }
        .perm-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
          white-space: nowrap;
        }
        .perm-btn-edit {
          background: none;
          border: none;
          color: #0c1b33;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 4px;
        }
        .perm-btn-edit:hover {
          background: #e2e8f0;
          text-decoration: underline;
        }
        .perm-btn-delete {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 4px;
        }
        .perm-btn-delete:hover:not(:disabled) {
          background: #fef2f2;
          text-decoration: underline;
        }
        .perm-btn-delete:disabled {
          color: #94a3b8;
          cursor: not-allowed;
          opacity: 0.5;
        }
        .perm-footer-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }
        .perm-delete-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 6px 0;
        }
        .perm-delete-btn:hover:not(:disabled) {
          text-decoration: underline;
        }
        .perm-delete-btn:disabled {
          color: #94a3b8;
          cursor: not-allowed;
          text-decoration: none;
        }
        .perm-delete-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .perm-delete-hint {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .perm-footer-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .perm-cancel-link {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 8px 4px;
        }
        .perm-cancel-link:hover {
          color: #0f172a;
          text-decoration: underline;
        }
        .perm-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 16px;
        }
        .perm-modal {
          background: #ffffff;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          padding: 24px;
          box-sizing: border-box;
        }
        .perm-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .perm-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .perm-modal-sub {
          font-size: 0.825rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .perm-close-btn {
          border: none;
          background: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
        }
        .perm-close-btn:hover {
          color: #0f172a;
        }
        .perm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .perm-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: #334155;
        }
        .perm-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          box-sizing: border-box;
          outline: none;
        }
        .perm-input:focus {
          border-color: #0c1b33;
          box-shadow: 0 0 0 3px rgba(12, 27, 51, 0.08);
        }
        .perm-textarea {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
          resize: vertical;
        }
        .perm-textarea:focus {
          border-color: #0c1b33;
          box-shadow: 0 0 0 3px rgba(12, 27, 51, 0.08);
        }
        .perm-select {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          background: #ffffff;
          box-sizing: border-box;
          outline: none;
        }
        .perm-roles-checkbox-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px 12px;
          max-height: 180px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 10px 14px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fafbfc;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .perm-roles-checkbox-grid::-webkit-scrollbar {
          width: 5px;
        }
        .perm-roles-checkbox-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .perm-roles-checkbox-grid::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .perm-roles-checkbox-grid::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .perm-role-checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: #334155;
          cursor: pointer;
          text-align: left;
          padding: 6px 8px;
          border-radius: 6px;
          min-height: 34px;
          box-sizing: border-box;
          transition: background-color 0.15s ease, color 0.15s ease;
          user-select: none;
          position: relative;
        }
        .perm-role-checkbox-item:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .perm-role-checkbox-item.is-checked {
          background: #f8fafc;
          color: #0c1b33;
          font-weight: 500;
        }
        .perm-role-checkbox-item:focus-within {
          outline: 2px solid #0c1b33;
          outline-offset: -1px;
        }
        .perm-role-checkbox-input {
          margin: 0;
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          accent-color: #0c1b33;
          cursor: pointer;
        }
        .perm-role-label-text {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          line-height: 1.3;
        }
        @media (max-width: 480px) {
          .perm-roles-checkbox-grid {
            grid-template-columns: 1fr;
          }
        }
        .perm-danger-btn {
          background: #dc2626 !important;
          color: #ffffff !important;
          border: none !important;
          padding: 9px 18px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 0.875rem !important;
          cursor: pointer !important;
        }
        .perm-danger-btn:hover {
          background: #b91c1c !important;
        }
        .perm-modal-foot {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        /* ── Responsive Mobile Rules: Stacking ── */
        @media (max-width: 768px) {
          .perm-page-container {
            padding: 16px;
          }
          .perm-header {
            flex-direction: column;
            align-items: stretch;
          }
          .perm-layout {
            grid-template-columns: 1fr;
          }
          .perm-sidebar {
            display: none;
          }
          .perm-mobile-selector {
            display: block;
          }
          .perm-footer-bar {
            flex-direction: column-reverse;
            gap: 16px;
            align-items: stretch;
          }
          .perm-footer-right {
            justify-content: space-between;
          }
          .perm-delete-wrapper {
            justify-content: center;
          }
        }
      `}</style>

      {/* ── Page Header with Add Permission Primary Action ── */}
      <div className="perm-header">
        <div>
          <h1 className="perm-title">Permissions</h1>
          <p className="perm-subtitle">Create, configure, and assign permissions across all platform modules.</p>
        </div>
        <button
          type="button"
          className="perm-primary-btn"
          onClick={() => {
            setNewPermForm({
              name: '',
              key: '',
              category: existingCategories[0] || 'Content',
              customCategory: '',
              description: '',
              roles: selectedRoleSlug && selectedRoleSlug !== 'super_admin' ? [selectedRoleSlug] : []
            });
            setAddPermModal(true);
          }}
        >
          + Add permission
        </button>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      {/* ── Mobile Role Selector Dropdown ── */}
      <div className="perm-mobile-selector">
        <label className="perm-label" htmlFor="perm-mobile-role">Select role</label>
        <select
          id="perm-mobile-role"
          className="perm-select"
          value={selectedRoleSlug}
          onChange={e => handleSelectRole(e.target.value)}
        >
          {roles.map(r => (
            <option key={r.slug || r.id} value={r.slug || r.id}>
              {r.name || r.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="perm-layout">
        {/* Left Column: Role Selector List */}
        <aside className="perm-sidebar">
          <div className="perm-sidebar-head">Roles ({roles.length})</div>
          <div className="perm-role-list">
            {roles.map(r => {
              const rSlug = r.slug || r.id;
              const isActive = rSlug === selectedRoleSlug;
              const userCount = users.filter(u => u.role === rSlug).length;
              const isDefault = r.isProtected || r.isSystem || ['super_admin', 'admin', 'dispatcher', 'communications', 'station_commander', 'investigator', 'editor', 'author', 'staff', 'user'].includes(rSlug);

              return (
                <button
                  type="button"
                  key={rSlug}
                  className={`perm-role-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectRole(rSlug)}
                >
                  <div className="perm-role-btn-top">
                    <span className="perm-role-name">{r.name || r.label}</span>
                    {isDefault && <span className="perm-role-badge-default">Default</span>}
                  </div>
                  <p className="perm-role-desc">
                    {r.description || r.desc || 'Operational portal role.'}
                  </p>
                  <span className="perm-role-users">
                    {userCount} user{userCount === 1 ? '' : 's'} assigned
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Permissions Panel */}
        <main className="perm-main-card">
          {selectedRole ? (
            <>
              {/* Role Header & Edit Role Button */}
              <div className="perm-main-head">
                <div>
                  <h2 className="perm-role-active-title">{selectedRole.name || selectedRole.label}</h2>
                  <p className="perm-role-active-desc">
                    {selectedRole.description || selectedRole.desc || 'Configure permission toggles below.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="perm-secondary-btn"
                  onClick={() => openEditRole(selectedRole)}
                >
                  Edit role
                </button>
              </div>

              {/* Super Admin Notice if applicable */}
              {isSuperAdminRole ? (
                <div className="perm-superadmin-alert">
                  <strong>Full System Access (*):</strong> The Super Admin role possesses unrestricted authority across all portal modules, security logs, and user accounts. Permissions cannot be removed.
                </div>
              ) : null}

              {/* Dynamic Permissions Checklist Grouped by Category */}
              <div className="perm-groups-container">
                {groupedPermissions.map(group => {
                  return (
                    <div key={group.category} className="perm-group-box">
                      <div className="perm-group-header">
                        <h3 className="perm-group-name">{group.category} ({group.items.length})</h3>
                        {!isSuperAdminRole && (
                          <div className="perm-group-actions">
                            <button
                              type="button"
                              className="perm-action-link"
                              onClick={() => selectCategory(group.items)}
                            >
                              Select all
                            </button>
                            <button
                              type="button"
                              className="perm-action-link"
                              onClick={() => clearCategory(group.items)}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="perm-items-grid">
                        {group.items.map(item => {
                          const itemKey = item.key || item.id;
                          const isChecked = isSuperAdminRole || rolePerms.includes(itemKey);
                          return (
                            <div
                              key={itemKey}
                              className={`perm-row-item ${isChecked ? 'checked' : ''}`}
                            >
                              <label className="perm-row-left">
                                <input
                                  type="checkbox"
                                  className="perm-checkbox"
                                  checked={isChecked}
                                  disabled={isSuperAdminRole}
                                  onChange={() => togglePermission(itemKey)}
                                />
                                <div className="perm-item-text">
                                  <div className="perm-item-title-row">
                                    <span className="perm-item-name">{item.name}</span>
                                    <span className="perm-item-key">{itemKey}</span>
                                    {item.isSystem && (
                                      <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>• Default</span>
                                    )}
                                  </div>
                                  <span className="perm-item-desc">{item.description || item.desc}</span>
                                </div>
                              </label>

                              {/* Permission Edit / Delete Action Links */}
                              <div className="perm-row-actions">
                                <button
                                  type="button"
                                  className="perm-btn-edit"
                                  onClick={(e) => openEditPerm(item, e)}
                                  title="Edit permission details and role assignments"
                                >
                                  Edit
                                </button>
                                {item.isSystem ? (
                                  <button
                                    type="button"
                                    className="perm-btn-delete"
                                    disabled
                                    title="Core system permissions cannot be deleted"
                                  >
                                    Delete
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="perm-btn-delete"
                                    onClick={(e) => openDeletePerm(item, e)}
                                    title="Delete custom permission"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions Bar */}
              <div className="perm-footer-bar">
                {/* Delete Role Text Button (Secondary, placed away from Save) */}
                <div className="perm-delete-wrapper">
                  {isDefaultRole ? (
                    <button
                      type="button"
                      className="perm-delete-btn"
                      disabled
                      title="Default roles like Admin cannot be deleted."
                    >
                      Delete role
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="perm-delete-btn"
                      onClick={() => openDeleteDialog(selectedRole)}
                    >
                      Delete role
                    </button>
                  )}
                  {isDefaultRole && (
                    <span className="perm-delete-hint">(Default roles cannot be deleted)</span>
                  )}
                </div>

                {/* Right side: Cancel link & One primary button: Save changes */}
                <div className="perm-footer-right">
                  {hasUnsavedChanges && (
                    <button
                      type="button"
                      className="perm-cancel-link"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    className="perm-primary-btn"
                    disabled={saving || isSuperAdminRole || !hasUnsavedChanges}
                    onClick={handleSaveRolePerms}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
              <h3>No roles available</h3>
              <p>Please create a role in Role Management first.</p>
            </div>
          )}
        </main>
      </div>

      {/* ── 1. ADD PERMISSION MODAL ── */}
      {addPermModal && (
        <div className="perm-modal-backdrop" onClick={() => !savingPerm && setAddPermModal(false)}>
          <div className="perm-modal" onClick={e => e.stopPropagation()}>
            <div className="perm-modal-head">
              <div>
                <h3 className="perm-modal-title">Add new permission</h3>
                <p className="perm-modal-sub">Create a new access privilege and configure role assignments.</p>
              </div>
              <button
                type="button"
                className="perm-close-btn"
                onClick={() => !savingPerm && setAddPermModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePermission}>
              <div className="perm-field">
                <label className="perm-label" htmlFor="new-perm-name">Permission name</label>
                <input
                  id="new-perm-name"
                  required
                  type="text"
                  className="perm-input"
                  placeholder="e.g. Export incident reports"
                  value={newPermForm.name}
                  onChange={e => {
                    const nameVal = e.target.value;
                    const autoKey = nameVal.toLowerCase().trim().replace(/[^a-z0-9_:-]+/g, '_');
                    setNewPermForm(prev => ({
                      ...prev,
                      name: nameVal,
                      key: prev.key === '' || prev.key === prev.name.toLowerCase().trim().replace(/[^a-z0-9_:-]+/g, '_') ? autoKey : prev.key
                    }));
                  }}
                />
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="new-perm-key">Permission code / key</label>
                <input
                  id="new-perm-key"
                  required
                  type="text"
                  className="perm-input"
                  placeholder="e.g. submissions:export or reports:view"
                  value={newPermForm.key}
                  onChange={e => setNewPermForm({ ...newPermForm, key: e.target.value })}
                />
                <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  Used by routes and API permissions (format: module:action or module.action).
                </span>
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="new-perm-cat">Category</label>
                <select
                  id="new-perm-cat"
                  className="perm-select"
                  value={newPermForm.category}
                  onChange={e => setNewPermForm({ ...newPermForm, category: e.target.value })}
                >
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new">+ Create new category…</option>
                </select>
                {newPermForm.category === '__new' && (
                  <input
                    type="text"
                    required
                    className="perm-input"
                    style={{ marginTop: '6px' }}
                    placeholder="Enter category name (e.g. Investigations)"
                    value={newPermForm.customCategory}
                    onChange={e => setNewPermForm({ ...newPermForm, customCategory: e.target.value })}
                  />
                )}
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="new-perm-desc">Description</label>
                <textarea
                  id="new-perm-desc"
                  rows={2}
                  className="perm-textarea"
                  placeholder="Short description of what access this grant provides..."
                  value={newPermForm.description}
                  onChange={e => setNewPermForm({ ...newPermForm, description: e.target.value })}
                />
              </div>

              <div className="perm-field">
                <label className="perm-label">Assign to roles</label>
                <div className="perm-roles-checkbox-grid">
                  {roles
                    .filter(r => (r.slug || r.id) !== 'super_admin')
                    .map(r => {
                      const rSlug = r.slug || r.id;
                      const isAssigned = newPermForm.roles.includes(rSlug);
                      const roleName = r.name || r.label || rSlug;
                      return (
                        <label
                          key={rSlug}
                          className={`perm-role-checkbox-item ${isAssigned ? 'is-checked' : ''}`}
                          title={roleName}
                        >
                          <input
                            type="checkbox"
                            className="perm-role-checkbox-input"
                            checked={isAssigned}
                            onChange={() => {
                              setNewPermForm(prev => ({
                                ...prev,
                                roles: isAssigned
                                  ? prev.roles.filter(s => s !== rSlug)
                                  : [...prev.roles, rSlug]
                              }));
                            }}
                          />
                          <span className="perm-role-label-text">{roleName}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="perm-modal-foot">
                <button
                  type="button"
                  className="perm-cancel-link"
                  disabled={savingPerm}
                  onClick={() => setAddPermModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="perm-primary-btn"
                  disabled={savingPerm}
                >
                  {savingPerm ? 'Creating…' : 'Create permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. EDIT PERMISSION MODAL ── */}
      {editPermModal && (
        <div className="perm-modal-backdrop" onClick={() => !savingPerm && setEditPermModal(null)}>
          <div className="perm-modal" onClick={e => e.stopPropagation()}>
            <div className="perm-modal-head">
              <div>
                <h3 className="perm-modal-title">Edit permission</h3>
                <p className="perm-modal-sub">
                  Update permission details and manage role assignments.
                </p>
              </div>
              <button
                type="button"
                className="perm-close-btn"
                onClick={() => !savingPerm && setEditPermModal(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPerm}>
              <div className="perm-field">
                <label className="perm-label" htmlFor="edit-perm-name">Permission name</label>
                <input
                  id="edit-perm-name"
                  required
                  type="text"
                  className="perm-input"
                  value={editPermModal.name}
                  onChange={e => setEditPermModal({ ...editPermModal, name: e.target.value })}
                />
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="edit-perm-key">Permission code / key</label>
                <input
                  id="edit-perm-key"
                  type="text"
                  className="perm-input"
                  value={editPermModal.key}
                  disabled={editPermModal.isSystem}
                  onChange={e => setEditPermModal({ ...editPermModal, key: e.target.value })}
                />
                {editPermModal.isSystem && (
                  <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                    Core system permission codes cannot be modified.
                  </span>
                )}
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="edit-perm-cat">Category</label>
                <select
                  id="edit-perm-cat"
                  className="perm-select"
                  value={editPermModal.category}
                  onChange={e => setEditPermModal({ ...editPermModal, category: e.target.value })}
                >
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new">+ Create new category…</option>
                </select>
                {editPermModal.category === '__new' && (
                  <input
                    type="text"
                    required
                    className="perm-input"
                    style={{ marginTop: '6px' }}
                    placeholder="Enter category name"
                    value={editPermModal.customCategory}
                    onChange={e => setEditPermModal({ ...editPermModal, customCategory: e.target.value })}
                  />
                )}
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="edit-perm-desc">Description</label>
                <textarea
                  id="edit-perm-desc"
                  rows={2}
                  className="perm-textarea"
                  value={editPermModal.description}
                  onChange={e => setEditPermModal({ ...editPermModal, description: e.target.value })}
                />
              </div>

              <div className="perm-field">
                <label className="perm-label">Assigned roles</label>
                <div className="perm-roles-checkbox-grid">
                  {roles
                    .filter(r => (r.slug || r.id) !== 'super_admin')
                    .map(r => {
                      const rSlug = r.slug || r.id;
                      const isAssigned = editPermModal.roles.includes(rSlug);
                      const roleName = r.name || r.label || rSlug;
                      return (
                        <label
                          key={rSlug}
                          className={`perm-role-checkbox-item ${isAssigned ? 'is-checked' : ''}`}
                          title={roleName}
                        >
                          <input
                            type="checkbox"
                            className="perm-role-checkbox-input"
                            checked={isAssigned}
                            onChange={() => {
                              setEditPermModal(prev => ({
                                ...prev,
                                roles: isAssigned
                                  ? prev.roles.filter(s => s !== rSlug)
                                  : [...prev.roles, rSlug]
                              }));
                            }}
                          />
                          <span className="perm-role-label-text">{roleName}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="perm-modal-foot">
                <button
                  type="button"
                  className="perm-cancel-link"
                  disabled={savingPerm}
                  onClick={() => setEditPermModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="perm-primary-btn"
                  disabled={savingPerm}
                >
                  {savingPerm ? 'Saving…' : 'Save permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. DELETE PERMISSION CONFIRMATION DIALOG ── */}
      {deletePermDialog && (
        <div className="perm-modal-backdrop" onClick={() => !deletingPerm && setDeletePermDialog(null)}>
          <div className="perm-modal" onClick={e => e.stopPropagation()}>
            <div className="perm-modal-head">
              <div>
                <h3 className="perm-modal-title">Delete permission</h3>
                <p className="perm-modal-sub">
                  Are you sure you want to delete the "{deletePermDialog.name}" ({deletePermDialog.key}) permission?
                </p>
              </div>
              <button
                type="button"
                className="perm-close-btn"
                onClick={() => !deletingPerm && setDeletePermDialog(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '14px 0' }}>
              This will permanently delete the permission and remove it from all assigned roles. This action cannot be undone.
            </p>

            <div className="perm-modal-foot">
              <button
                type="button"
                className="perm-cancel-link"
                disabled={deletingPerm}
                onClick={() => setDeletePermDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="perm-danger-btn"
                disabled={deletingPerm}
                onClick={handleConfirmDeletePerm}
              >
                {deletingPerm ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. EDIT ROLE MODAL ── */}
      {editRoleModal && (
        <div className="perm-modal-backdrop" onClick={() => !savingRoleMeta && setEditRoleModal(null)}>
          <div className="perm-modal" onClick={e => e.stopPropagation()}>
            <div className="perm-modal-head">
              <div>
                <h3 className="perm-modal-title">Edit role</h3>
                <p className="perm-modal-sub">Update the role name and description.</p>
              </div>
              <button
                type="button"
                className="perm-close-btn"
                onClick={() => !savingRoleMeta && setEditRoleModal(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoleMeta}>
              <div className="perm-field">
                <label className="perm-label" htmlFor="edit-role-name">Role name</label>
                <input
                  id="edit-role-name"
                  required
                  type="text"
                  className="perm-input"
                  value={editRoleModal.name}
                  disabled={editRoleModal.role.slug === 'super_admin'}
                  onChange={e => setEditRoleModal({ ...editRoleModal, name: e.target.value })}
                />
                {editRoleModal.role.slug === 'super_admin' && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    The Super Admin role name cannot be modified.
                  </span>
                )}
              </div>

              <div className="perm-field">
                <label className="perm-label" htmlFor="edit-role-desc">Description</label>
                <textarea
                  id="edit-role-desc"
                  rows={3}
                  className="perm-textarea"
                  value={editRoleModal.description}
                  onChange={e => setEditRoleModal({ ...editRoleModal, description: e.target.value })}
                  placeholder="Short description of this role's purpose..."
                />
              </div>

              <div className="perm-modal-foot">
                <button
                  type="button"
                  className="perm-cancel-link"
                  disabled={savingRoleMeta}
                  onClick={() => setEditRoleModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="perm-primary-btn"
                  disabled={savingRoleMeta}
                >
                  {savingRoleMeta ? 'Saving…' : 'Save role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. DELETE ROLE CONFIRMATION DIALOG ── */}
      {deleteDialog && (
        <div className="perm-modal-backdrop" onClick={() => !deletingRole && setDeleteDialog(null)}>
          <div className="perm-modal" onClick={e => e.stopPropagation()}>
            <div className="perm-modal-head">
              <div>
                <h3 className="perm-modal-title">Delete role</h3>
                <p className="perm-modal-sub">
                  Delete this role? {deleteDialog.userCount} user{deleteDialog.userCount === 1 ? '' : 's'} are assigned to it.
                </p>
              </div>
              <button
                type="button"
                className="perm-close-btn"
                onClick={() => !deletingRole && setDeleteDialog(null)}
              >
                ✕
              </button>
            </div>

            {deleteDialog.userCount > 0 ? (
              <div style={{ margin: '14px 0' }}>
                <label className="perm-label" htmlFor="reassign-role-select">
                  Transfer assigned users to:
                </label>
                <select
                  id="reassign-role-select"
                  className="perm-select"
                  style={{ marginTop: '6px' }}
                  value={deleteDialog.replacementRole}
                  onChange={e => setDeleteDialog({ ...deleteDialog, replacementRole: e.target.value })}
                >
                  {roles
                    .filter(r => (r.slug || r.id) !== (deleteDialog.role.slug || deleteDialog.role.id))
                    .map(r => (
                      <option key={r.slug || r.id} value={r.slug || r.id}>
                        {r.name || r.label}
                      </option>
                    ))}
                </select>
                <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '6px 0 0 0' }}>
                  All {deleteDialog.userCount} user accounts will immediately have their role updated.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '14px 0' }}>
                Are you sure you want to delete the "{deleteDialog.role.name || deleteDialog.role.label}" role? This action cannot be undone.
              </p>
            )}

            <div className="perm-modal-foot">
              <button
                type="button"
                className="perm-cancel-link"
                disabled={deletingRole}
                onClick={() => setDeleteDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="perm-danger-btn"
                disabled={deletingRole || (deleteDialog.userCount > 0 && !deleteDialog.replacementRole)}
                onClick={handleConfirmDeleteRole}
              >
                {deletingRole ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DYNAMIC EMERGENCY HOTLINES MANAGEMENT
   ═══════════════════════════════════════════════════ */

const HOTLINE_ICON_OPTIONS = [
  { id: 'emergency', label: '🚨 Emergency (Police Car)' },
  { id: 'traffic', label: '🚗 Traffic Accidents' },
  { id: 'misconduct', label: '🛡️ Police Misconduct' },
  { id: 'corruption', label: '⚖️ Anti-Corruption' },
  { id: 'maritime', label: '⚓ Maritime Problems' },
  { id: 'license', label: '🪪 Driving Licence' },
  { id: 'fire', label: '🔥 Fire & Rescue' },
  { id: 'phone', label: '📞 Telephone Line' },
  { id: 'shield', label: '🛡️ General Protection' }
];

function HotlinesAdmin() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () =>
    api('/admin/hotlines')
      .then(setItems)
      .catch(e => setToast({ message: e.message, type: 'error' }));

  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault();
    if (!editing.number || !/^\+?[0-9\s\-()]{3,20}$/.test(editing.number)) {
      setToast({ message: 'Please enter a valid phone or emergency hotline number (3–20 digits).', type: 'error' });
      return;
    }
    const titleEn = typeof editing.title === 'object' ? editing.title.en : editing.title;
    if (!titleEn || !titleEn.trim()) {
      setToast({ message: 'English title is required.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editing._id) {
        await api(`/admin/hotlines/${editing._id}`, { method: 'PUT', body: JSON.stringify(editing) });
        setToast({ message: `Hotline "${titleEn}" updated.` });
      } else {
        await api('/admin/hotlines', { method: 'POST', body: JSON.stringify(editing) });
        setToast({ message: `Hotline "${titleEn}" created.` });
      }
      setEditing(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async id => {
    try {
      await api(`/admin/hotlines/${id}`, { method: 'DELETE' });
      setToast({ message: 'Hotline deleted.' });
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setConfirm(null);
  };

  const handleToggleActive = async item => {
    try {
      await api(`/admin/hotlines/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !item.isActive })
      });
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const moveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const payload = reordered.map((item, idx) => ({ id: item._id, sortOrder: idx + 1 }));
    setItems(reordered);

    try {
      await api('/admin/hotlines/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: payload })
      });
      setToast({ message: 'Hotline order updated.' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      load();
    }
  };

  const filtered = items.filter(h => {
    const titleStr = typeof h.title === 'object' ? `${h.title.en} ${h.title.am} ${h.title.om}` : String(h.title);
    return titleStr.toLowerCase().includes(search.toLowerCase()) || h.number?.includes(search);
  });

  return (
    <div className="adPanel">
      <div className="adPanelHead">
        <div>
          <h2>Dynamic Emergency Hotlines</h2>
          <p>Add, edit, reorder, and activate public hotline numbers displayed across the portal.</p>
        </div>
        <button
          className="adBtn"
          onClick={() =>
            setEditing({
              title: { en: '', am: '', om: '' },
              number: '',
              subtitle: { en: '', am: '', om: '' },
              icon: 'phone',
              isActive: true,
              sortOrder: items.length + 1
            })
          }
        >
          ＋ New Hotline
        </button>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      {editing && (
        <form className="adForm" onSubmit={handleSave}>
          <h3>{editing._id ? 'Edit Emergency Hotline' : 'Create Emergency Hotline'}</h3>

          <div className="adFormRow">
            <label style={{ flex: 1 }}>
              Phone / Hotline Number *
              <input
                required
                type="text"
                value={editing.number || ''}
                onChange={e => setEditing({ ...editing, number: e.target.value })}
                placeholder="e.g. 112, 991, 011-551-2222"
              />
              <small style={{ color: '#64748b' }}>Must be 3–20 digits/characters (standard format)</small>
            </label>

            <label style={{ flex: 1 }}>
              Service Icon
              <select
                value={editing.icon || 'phone'}
                onChange={e => setEditing({ ...editing, icon: e.target.value })}
              >
                {HOTLINE_ICON_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ fontWeight: 600 }}>Hotline Title</label>
            <div className="adFormRow">
              <label>
                English *
                <input
                  required
                  value={editing.title?.en || ''}
                  onChange={e => setEditing({ ...editing, title: { ...(editing.title || {}), en: e.target.value } })}
                  placeholder="e.g. Traffic Accidents"
                />
              </label>
              <label>
                Amharic
                <input
                  value={editing.title?.am || ''}
                  onChange={e => setEditing({ ...editing, title: { ...(editing.title || {}), am: e.target.value } })}
                  placeholder="e.g. የትራፊክ አደጋዎች"
                />
              </label>
              <label>
                Afaan Oromoo
                <input
                  value={editing.title?.om || ''}
                  onChange={e => setEditing({ ...editing, title: { ...(editing.title || {}), om: e.target.value } })}
                  placeholder="e.g. Balaa Tiraafikaa"
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ fontWeight: 600 }}>Subtitle / Short Description</label>
            <div className="adFormRow">
              <label>
                English
                <input
                  value={editing.subtitle?.en || ''}
                  onChange={e => setEditing({ ...editing, subtitle: { ...(editing.subtitle || {}), en: e.target.value } })}
                  placeholder="e.g. Road incident support"
                />
              </label>
              <label>
                Amharic
                <input
                  value={editing.subtitle?.am || ''}
                  onChange={e => setEditing({ ...editing, subtitle: { ...(editing.subtitle || {}), am: e.target.value } })}
                  placeholder="e.g. የመንገድ አደጋ ድጋፍ"
                />
              </label>
              <label>
                Afaan Oromoo
                <input
                  value={editing.subtitle?.om || ''}
                  onChange={e => setEditing({ ...editing, subtitle: { ...(editing.subtitle || {}), om: e.target.value } })}
                  placeholder="e.g. Deeggarsa balaa daandii"
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editing.isActive !== false}
                onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
              />
              <strong>Active (Displayed publicly on portal)</strong>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="adBtn" disabled={saving}>
              {saving ? 'Saving…' : 'Save Hotline'}
            </button>
            <button type="button" className="adBtnOutline" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="adTopBar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search hotlines by title or number…" />
      </div>

      <div className="adCard adListCard">
        <div className="adListHead">
          <h3>Emergency Hotlines <span className="adCount">{filtered.length}</span></h3>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="📞" text="No emergency hotlines configured. Click '＋ New Hotline' to create one." />
        ) : (
          filtered.map((item, idx) => {
            const titleEn = typeof item.title === 'object' ? item.title.en : item.title;
            const subEn = typeof item.subtitle === 'object' ? item.subtitle.en : item.subtitle;

            return (
              <article className="adListItem" key={item._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="adBtnIcon"
                    title="Move Up"
                    disabled={idx === 0}
                    onClick={() => moveOrder(idx, -1)}
                  >
                    ▲
                  </button>
                  <button
                    className="adBtnIcon"
                    title="Move Down"
                    disabled={idx === items.length - 1}
                    onClick={() => moveOrder(idx, 1)}
                  >
                    ▼
                  </button>
                  <span style={{ fontSize: '1.2rem', marginLeft: '4px' }}>
                    {HOTLINE_ICON_OPTIONS.find(o => o.id === item.icon)?.label?.slice(0, 2) || '📞'}
                  </span>
                </div>

                <div className="adListItemInfo">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <b style={{ fontSize: '1.05rem' }}>{titleEn}</b>
                    <Badge label={`Call ${item.number}`} variant="critical" />
                    {!item.isActive && <Badge label="Hidden" variant="default" />}
                  </div>
                  <div className="adListItemMeta">
                    <small style={{ color: '#64748b' }}>{subEn || 'Direct emergency dispatch'}</small>
                  </div>
                </div>

                <div className="adActions">
                  <button
                    className={item.isActive ? 'adBtnOutline adBtnSm' : 'adBtn adBtnSm'}
                    onClick={() => handleToggleActive(item)}
                  >
                    {item.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    className="adBtnOutline adBtnSm"
                    onClick={() => setEditing({ ...item })}
                  >
                    Edit
                  </button>
                  <button
                    className="adBtnIcon adBtnIconDel"
                    title="Delete hotline"
                    onClick={() =>
                      setConfirm({
                        title: 'Delete Hotline',
                        message: `Permanently remove hotline "${titleEn}" (${item.number})?`,
                        onConfirm: () => handleDelete(item._id),
                        onCancel: () => setConfirm(null)
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUBMISSIONS
   ═══════════════════════════════════════════════════ */

function Submissions() {
  const [data, setData] = useState({ contactMessages: [], recruitmentApplications: [], communityRegistrations: [] });
  const [subTab, setSubTab] = useState('community');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api('/admin/requests').then(d => setData({
    contactMessages: d.contactMessages || [],
    recruitmentApplications: d.recruitmentApplications || [],
    communityRegistrations: d.communityRegistrations || []
  })).catch(e => setToast({ message: e.message, type: 'error' }));

  useEffect(() => { load(); }, []);

  const deleteItem = async (type, id) => {
    try {
      await api(`/admin/requests/${type}/${id}`, { method: 'DELETE' });
      setToast({ message: 'Submission deleted.' });
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setConfirm(null);
  };

  const commList = data.communityRegistrations || [];
  const recruitList = data.recruitmentApplications || [];
  const contactList = data.contactMessages || [];

  const currentList = subTab === 'community'
    ? commList
    : subTab === 'recruitment'
      ? recruitList
      : contactList;

  const filtered = currentList.filter(x => {
    const q = search.toLowerCase();
    return (
      (x.fullName || '').toLowerCase().includes(q) ||
      (x.phone || '').toLowerCase().includes(q) ||
      (x.email || '').toLowerCase().includes(q) ||
      (x.subCity || '').toLowerCase().includes(q) ||
      (x.program || '').toLowerCase().includes(q) ||
      (x.position || '').toLowerCase().includes(q) ||
      (x.department || '').toLowerCase().includes(q) ||
      (x.subject || '').toLowerCase().includes(q) ||
      (x.message || '').toLowerCase().includes(q)
    );
  });

  const programLabels = {
    neighborhood_watch: 'Neighborhood Watch',
    volunteer: 'Volunteer Programme',
    youth_engagement: 'Youth Engagement',
    partnership: 'Partnership'
  };

  return (
    <div className="adPanel">
      <div className="adPanelHead">
        <div>
          <h2>Submissions &amp; Registrations</h2>
          <p>Community policing registrations, recruitment applications, and citizen contact messages.</p>
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--ad-border, #e2e8f0)', paddingBottom: '12px' }}>
        <button
          type="button"
          className={subTab === 'community' ? 'adBtn' : 'adBtnOutline'}
          onClick={() => { setSubTab('community'); setExpanded(null); }}
        >
          Community Registrations ({commList.length})
        </button>
        <button
          type="button"
          className={subTab === 'recruitment' ? 'adBtn' : 'adBtnOutline'}
          onClick={() => { setSubTab('recruitment'); setExpanded(null); }}
        >
          Recruitment Applications ({recruitList.length})
        </button>
        <button
          type="button"
          className={subTab === 'contact' ? 'adBtn' : 'adBtnOutline'}
          onClick={() => { setSubTab('contact'); setExpanded(null); }}
        >
          Contact Messages ({contactList.length})
        </button>
      </div>

      <div className="adTopBar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email, department, subject…" />
      </div>

      <div className="adCard adListCard">
        {filtered.length === 0 ? (
          <EmptyState icon="📬" text={search ? 'No matching submissions found.' : 'No records yet in this category.'} />
        ) : (
          filtered.map(x => (
            <article className={`adListItem adSubmission ${expanded === x._id ? 'expanded' : ''}`} key={x._id}>
              <div className="adSubHeader" onClick={() => setExpanded(expanded === x._id ? null : x._id)}>
                <div className="adListItemInfo">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <b>{x.fullName}</b>
                    {x.position && (
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe'
                      }}>
                        💼 {x.position}
                      </span>
                    )}
                    {x.program && (
                      <span style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {programLabels[x.program] || x.program}
                      </span>
                    )}
                    {x.department && (
                      <span style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #bbf7d0'
                      }}>
                        🏢 {x.department}
                      </span>
                    )}
                    {x.subject && (
                      <span style={{
                        background: '#f8fafc',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        ✉️ {x.subject}
                      </span>
                    )}
                  </div>
                  <div className="adListItemMeta">
                    <Badge label={x.status || 'new'} variant={x.status === 'resolved' ? 'success' : x.status === 'in_progress' ? 'warning' : 'default'} />
                    <small>{ago(x.createdAt)}</small>
                  </div>
                </div>
                <div className="adActions">
                  <span className="adExpandIcon">{expanded === x._id ? '▾' : '▸'}</span>
                  <button
                    className="adBtnIcon adBtnIconDel"
                    title="Delete"
                    onClick={e => {
                      e.stopPropagation();
                      const endpoint = subTab === 'community' ? 'community' : subTab === 'recruitment' ? 'recruitment' : 'contact';
                      setConfirm({
                        title: 'Delete submission',
                        message: `Permanently delete submission from "${x.fullName}"?`,
                        onConfirm: () => deleteItem(endpoint, x._id),
                        onCancel: () => setConfirm(null)
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {expanded === x._id && (
                <div className="adSubDetail">
                  <div className="adDetailGrid">
                    {x.department && <div><small>Department</small><b style={{ color: '#15803d' }}>{x.department}</b></div>}
                    {x.subject && <div><small>Subject</small><b style={{ color: '#0f172a' }}>{x.subject}</b></div>}
                    {x.position && <div><small>Position Applied</small><b style={{ color: '#1e3a8a' }}>{x.position}</b></div>}
                    <div><small>Phone</small><span>{x.phone || '—'}</span></div>
                    <div><small>Email</small><span>{x.email || '—'}</span></div>
                    {x.subCity && <div><small>Sub-City</small><span>{x.subCity}</span></div>}
                    {x.program && <div><small>Initiative</small><span>{programLabels[x.program] || x.program}</span></div>}
                    {x.nationalId && <div><small>National ID</small><span>{x.nationalId}</span></div>}
                    {x.educationLevel && <div><small>Education</small><span>{x.educationLevel}</span></div>}
                    {x.address && <div><small>Address</small><span>{x.address}</span></div>}
                  </div>

                  {x.message && (
                    <div className="adDetailBody">
                      <small>Message / Program Details</small>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{x.message}</p>
                    </div>
                  )}

                  {x.statement && (
                    <div className="adDetailBody">
                      <small>Statement</small>
                      <p>{x.statement}</p>
                    </div>
                  )}

                  {x.description && (
                    <div className="adDetailBody">
                      <small>Description</small>
                      <p>{x.description}</p>
                    </div>
                  )}

                  {x.formData && Object.keys(x.formData).length > 0 && (
                    <div className="adDetailBody">
                      <small>Form data</small>
                      {Object.entries(x.formData).map(([k, v]) => <p key={k}><strong>{k}:</strong> {String(v)}</p>)}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AUDIT LOG (Read-only)
   ═══════════════════════════════════════════════════ */

function AuditLog() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api('/admin/audit-logs').then(d => setItems(Array.isArray(d) ? d : [])).catch(e => setToast({ message: e.message, type: 'error' }));
  }, []);

  const filtered = items.filter(x => JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));
  const actionMeta = action => {
    const value = (action || 'activity').replace(/_/g, ' ').toUpperCase();
    if (action === 'login') return { label: 'LOGIN', text: 'USER LOGIN', tone: 'login', icon: '↪' };
    if (action === 'create') return { label: 'CREATE', text: `${value}`, tone: 'create', icon: '+' };
    if (action === 'delete') return { label: 'DELETE', text: 'DELETE RECORD', tone: 'delete', icon: '−' };
    if (action === 'update') return { label: 'UPDATE', text: 'UPDATE RECORD', tone: 'update', icon: '↻' };
    return { label: value, text: value, tone: 'info', icon: '•' };
  };
  const severity = action => action === 'delete' ? 'WARNING' : action === 'login' ? 'INFO' : 'INFO';
  const resource = type => (type || 'system').replace(/([A-Z])/g, ' $1').trim().toUpperCase();

  return (
    <div className="adPanel adAuditPanel">
      <div className="adPanelHead"><div><h2>System Audit Trail</h2><p>Track account access and changes made across the portal.</p></div></div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      <div className="adTopBar"><SearchBar value={search} onChange={setSearch} placeholder="Search logs…" /></div>
      <div className="adAuditTable" role="table" aria-label="System audit log">
        <div className="adAuditHead" role="row"><span>ACTION</span><span>USER</span><span>RESOURCE</span><span>SEVERITY</span><span>IP / TIME</span><span>DETAILS</span></div>
        {filtered.length === 0 ? <EmptyState icon="📋" text="No events yet." /> : filtered.map((x, i) => {
          const meta = actionMeta(x.action);
          return <article className="adAuditRow" role="row" key={x._id || i}>
            <div className="adAuditAction"><span className={`adAuditActionTag ${meta.tone}`}><b>{meta.icon}</b>{meta.label}</span><strong>{meta.text}</strong></div>
            <div className="adAuditUser"><span className="adAuditPerson">♙</span><div><strong>{x.actor?.name || 'System'}</strong><small>{x.actor?.email || 'Automated portal event'}</small></div></div>
            <div><span className="adAuditResource">▣ {resource(x.resourceType)}</span></div>
            <div><span className="adAuditSeverity">{severity(x.action)}</span></div>
            <div className="adAuditTime"><span>▤ {x.ipAddress || 'Not recorded'}</span><small>◷ {ago(x.createdAt)}</small></div>
            <div><button className="adAuditView" onClick={() => setSelected(x)}>VIEW</button></div>
          </article>;
        })}
      </div>
      {selected && <div className="adModal" onClick={() => setSelected(null)}><div className="adModalBox adAuditModal" onClick={e => e.stopPropagation()}><h3>Audit event details</h3><dl><dt>Action</dt><dd>{actionMeta(selected.action).text}</dd><dt>Resource</dt><dd>{resource(selected.resourceType)}</dd><dt>User</dt><dd>{selected.actor?.name || 'System'}{selected.actor?.email ? ` (${selected.actor.email})` : ''}</dd><dt>IP address</dt><dd>{selected.ipAddress || 'Not recorded'}</dd><dt>Time</dt><dd>{ago(selected.createdAt)}</dd>{selected.changes && <><dt>Changes</dt><dd><pre>{JSON.stringify(selected.changes, null, 2)}</pre></dd></>}</dl><div className="adModalActions"><button className="adBtnOutline" onClick={() => setSelected(null)}>Close</button></div></div></div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BACKUP
   ═══════════════════════════════════════════════════ */

function Backup({ restore }) {
  const [toast, setToast] = useState(null);
  const download = async () => {
    try { const d = await api('/admin/backup'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })); a.download = 'aap-backup.json'; a.click(); URL.revokeObjectURL(a.href); setToast({ message: 'Backup downloaded.' }); }
    catch (e) { setToast({ message: e.message, type: 'error' }); }
  };
  const upload = async e => {
    const file = e.target.files?.[0];
    if (!file || !window.confirm('Restore this backup? This will overwrite existing data.')) return;
    try { await api('/admin/restore', { method: 'POST', body: await file.text() }); setToast({ message: 'Backup restored successfully.' }); }
    catch (e) { setToast({ message: e.message, type: 'error' }); }
  };

  return (
    <div className="adPanel">
      <div className="adPanelHead"><div><h2>Backup &amp; Restore</h2><p>Export or import portal data for safekeeping.</p></div></div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      <div className="adMetricGrid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="adMetricCard">
          <div className="adMetricIconWrap" style={{ background: '#dbeafe' }}>
            <span style={{ color: '#2563eb' }}>💾</span>
          </div>
          <div className="adMetricBody"><span className="adMetricLabel">Export</span>
            <h4>Download backup</h4>
            <p>Full JSON backup of all content.</p>
            <button className="adBtn" onClick={download}>Download</button></div>
        </div>
        {restore && (
          <div className="adMetricCard">
            <div className="adMetricIconWrap" style={{ background: '#fce7f3' }}>
              <span style={{ color: '#db2777' }}>📥</span></div>
            <div className="adMetricBody"><span className="adMetricLabel">Restore</span>
              <h4>Upload backup</h4>
              <p>Overwrite with a previous export.</p>
              <input type="file" accept="application/json" onChange={upload} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DASHBOARD (reference-style metric cards)
   ═══════════════════════════════════════════════════ */

function Dashboard({ onOpen }) {
  const [data, setData] = useState();
  const [toast, setToast] = useState(null);
  const load = () => api('/admin/analytics').then(setData).catch(e => setToast({ message: e.message, type: 'error' }));
  useEffect(() => { load(); }, []);

  const cards = [
    { label: 'Contact Messages', value: data?.contactMessages, target: 'requests', icon: '✉️', color: '#dbeafe', iconColor: '#2563eb', tag: 'Citizen Messages' },
    { label: 'Recruitment', value: data?.recruitmentApplications, target: 'requests', icon: '👥', color: '#d1fae5', iconColor: '#059669', tag: 'Applications' },
    { label: 'Job Vacancies', value: data?.vacancies != null ? `${data.vacancies} Open` : 'Careers', target: 'vacancies', icon: '💼', color: '#e0f2fe', iconColor: '#0284c7', tag: 'Careers' },
    { label: 'Published News', value: data?.publishedNews, target: 'news', icon: '📰', color: '#fce7f3', iconColor: '#db2777', tag: 'Live Articles' },
    { label: 'Media Assets', value: data?.mediaAssets, target: 'media', icon: '🖼', color: '#ede9fe', iconColor: '#7c3aed', tag: 'Library' },
    { label: 'Active Services', value: data?.activeServices, target: 'services', icon: '🛡️', color: '#fef3c7', iconColor: '#d97706', tag: 'Public Services' },
    { label: 'Alerts & Road Safety', value: 'Live', target: 'alerts', icon: '🚗', color: '#fce4ec', iconColor: '#e53935', tag: 'Traffic & Safety' },
    { label: 'Safety Documents', value: '📑', target: 'documents', icon: '📄', color: '#e0e7ff', iconColor: '#4338ca', tag: 'Directives' },
  ];

  return (
    <div className="adPanel">
      <div className="adPanelHead">
        <div className="adDashTitle">
          <div className="adDashBadge">AAP</div>
          <div>
            <h2>Admin Dashboard</h2>
            <p className="adDashSub">Addis Ababa Police · Portal Management</p>
          </div>
          <Badge label="Live Data" variant="success" />
        </div>
        <div className="adDashRight">
          <span className="adDashDate">Updated: {new Date().toLocaleDateString()}</span>
          <button className="adBtnOutline" onClick={load}>↻ Refresh</button>
        </div>
      </div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <div className="adMetricGrid">
        {cards.map(c => (
          <div className="adMetricCard adMetricCard--info" key={c.label}>
            <div className="adMetricIconWrap" style={{ background: c.color }}>
              <span style={{ color: c.iconColor }}>{c.icon}</span>
            </div>
            <span className="adMetricTag">{c.tag}</span>
            <div className="adMetricBody">
              <span className="adMetricLabel">{c.label}</span>
              <b className="adMetricValue">{c.value ?? '—'}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SITE SETTINGS (Refactored into dedicated pages)
   ═══════════════════════════════════════════════════ */

const SUB_CITIES = [
  'Bole', 'Arada', 'Kirkos', 'Yeka', 'Lideta',
  'Kolfe Keranio', 'Gullele', 'Nefas Silk-Lafto',
  'Addis Ketema', 'Akaky Kaliti', 'Lemi Kura'
];

function Stations() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: { en: '', am: '', om: '' },
    subCity: 'Bole',
    district: '',
    address: { en: '', am: '', om: '' },
    phone: '',
    email: '',
    operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
    isActive: true
  });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef();

  const load = useCallback(() => {
    api('/admin/stations')
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(e => setToast({ message: e.message, type: 'error' }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({
      name: { en: '', am: '', om: '' },
      subCity: 'Bole',
      district: '',
      address: { en: '', am: '', om: '' },
      phone: '',
      email: '',
      operatingHours: { en: '24/7 (Emergency & Patrol)', am: '24 ሰዓት ክፍት', om: "Sa'aatii 24 banaa dha" },
      isActive: true
    });
    setEditing(null);
  };

  const editItem = (item) => {
    setForm({
      name: typeof item.name === 'object' ? item.name : { en: item.name || '', am: '', om: '' },
      subCity: item.subCity || 'Bole',
      district: item.district || '',
      address: typeof item.address === 'object' ? item.address : { en: item.address || '', am: '', om: '' },
      phone: Array.isArray(item.phone) ? item.phone.join(', ') : (item.phone || ''),
      email: item.email || '',
      operatingHours: typeof item.operatingHours === 'object' ? item.operatingHours : { en: item.operatingHours || '', am: '', om: '' },
      isActive: item.isActive !== false
    });
    setEditing(item._id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteItem = async (id) => {
    try {
      await api(`/admin/stations/${id}`, { method: 'DELETE' });
      setToast({ message: 'Station deleted successfully.' });
      if (editing === id) resetForm();
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setConfirm(null);
  };

  const toggleActive = async (item) => {
    try {
      await api(`/admin/stations/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !item.isActive })
      });
      setToast({ message: `${item.name?.en || 'Station'} ${item.isActive ? 'deactivated' : 'activated'}.` });
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name?.en?.trim()) {
      return setToast({ message: 'Station name in English is required.', type: 'error' });
    }
    if (!form.subCity?.trim()) {
      return setToast({ message: 'Sub-city is required.', type: 'error' });
    }
    setSaving(true);
    try {
      const phones = (form.phone || '')
        .split(/[,\n]/)
        .map(p => p.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        subCity: form.subCity.trim(),
        district: (form.district || '').trim(),
        address: form.address,
        phone: phones,
        email: (form.email || '').trim(),
        operatingHours: form.operatingHours,
        isActive: form.isActive !== false
      };

      if (editing) {
        await api(`/admin/stations/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'Station updated successfully.' });
      } else {
        await api('/admin/stations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'Station created successfully.' });
      }
      resetForm();
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setSaving(false);
  };

  const filtered = items.filter(x => {
    const q = search.toLowerCase();
    const nameStr = `${x.name?.en || ''} ${x.name?.am || ''} ${x.name?.om || ''}`.toLowerCase();
    const sub = (x.subCity || '').toLowerCase();
    const dist = (x.district || '').toLowerCase();
    const ph = (Array.isArray(x.phone) ? x.phone.join(' ') : '').toLowerCase();
    return nameStr.includes(q) || sub.includes(q) || dist.includes(q) || ph.includes(q);
  });

  return (
    <div className="adPanel" ref={formRef}>
      <div className="adPanelHead">
        <div>
          <h2>Police Stations</h2>
          <p>Manage city police divisions, district stations, emergency phone contacts, and operating hours.</p>
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      <div className="adSplit">
        {/* Form */}
        <form className="adForm" onSubmit={save}>
          <div className="adFormHead">
            <h3>{editing ? 'Edit Station' : 'New Station'}</h3>
            {editing && <button type="button" className="adBtnGhost" onClick={resetForm}>✕ Cancel</button>}
          </div>

          <L10nInput
            label="Station Name *"
            value={form.name}
            onChange={val => setForm(f => ({ ...f, name: val }))}
            placeholder="e.g. Bole Sub-city Police Division"
          />

          <div className="adFormRow">
            <label>
              Sub-City *
              <select
                value={form.subCity}
                onChange={e => setForm(f => ({ ...f, subCity: e.target.value }))}
                required
              >
                {SUB_CITIES.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </label>

            <label>
              District / Woreda
              <input
                type="text"
                value={form.district}
                onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                placeholder="e.g. Woreda 03"
              />
            </label>
          </div>

          <L10nInput
            label="Street Address / Location"
            value={form.address}
            onChange={val => setForm(f => ({ ...f, address: val }))}
            placeholder="e.g. Near Edna Mall, Cameroon Street"
          />

          <label>
            Phone Numbers (comma-separated)
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 011 662 0000, 011 661 1111"
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="e.g. bole.police@aap.gov.et"
            />
          </label>

          <L10nInput
            label="Operating Hours"
            value={form.operatingHours}
            onChange={val => setForm(f => ({ ...f, operatingHours: val }))}
            placeholder="e.g. 24/7 (Emergency & Patrol)"
          />

          <ToggleSwitch
            checked={form.isActive !== false}
            onChange={v => setForm(f => ({ ...f, isActive: v }))}
            label="Active Station"
          />

          <button className="adBtn adBtnFull" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update Station' : 'Save Station'}
          </button>
        </form>

        {/* List */}
        <div className="adCard adListCard">
          <div className="adListHead">
            <h3>Stations <span className="adCount">{filtered.length}</span></h3>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter by name, sub-city, district…" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🏢"
              text={search ? 'No stations match your filter.' : 'No stations registered yet.'}
            />
          ) : (
            filtered.map(st => (
              <article className="adListItem" key={st._id}>
                <div className="adListItemInfo">
                  <b>{st.name?.en || st.name?.am || 'Unnamed Station'}</b>
                  <div className="adListItemMeta">
                    <Badge label={st.subCity} variant="default" />
                    {st.district && <small>{st.district}</small>}
                    {Array.isArray(st.phone) && st.phone.length > 0 && (
                      <small>📞 {st.phone.join(', ')}</small>
                    )}
                  </div>
                  {st.address?.en && (
                    <small style={{ color: '#666', marginTop: '2px', display: 'block' }}>
                      📍 {st.address.en}
                    </small>
                  )}
                </div>

                <div className="adActions">
                  <ToggleSwitch
                    checked={st.isActive !== false}
                    onChange={() => toggleActive(st)}
                  />
                  <button
                    className="adBtnIcon adBtnIconEdit"
                    title="Edit station"
                    onClick={() => editItem(st)}
                  >
                    ✎
                  </button>
                  <button
                    className="adBtnIcon adBtnIconDel"
                    title="Delete station"
                    onClick={() => setConfirm({
                      title: 'Delete station',
                      message: `Permanently delete "${st.name?.en || 'this station'}"?`,
                      onConfirm: () => deleteItem(st._id),
                      onCancel: () => setConfirm(null)
                    })}
                  >
                    ✕
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   POLICE SERVICES INFORMATION ADMIN
   ═══════════════════════════════════════════════════ */

const SERVICE_ICON_OPTIONS = [
  { id: 'shield', label: '🛡️ Shield (Crime & Incident Reporting)', icon: '🛡️' },
  { id: 'clearance', label: '📑 Document (Police Clearance & Certificates)', icon: '📑' },
  { id: 'traffic', label: '🚗 Vehicle (Traffic & Road Safety)', icon: '🚗' },
  { id: 'community', label: '👥 Users (Community Policing)', icon: '👥' },
  { id: 'phone', label: '📞 Phone (Emergency & Hotlines)', icon: '📞' },
  { id: 'scales', label: '⚖️ Scales (Investigation & Legal)', icon: '⚖️' },
  { id: 'building', label: '🏢 Building (Commands & Stations)', icon: '🏢' },
  { id: 'info', label: 'ℹ️ Info (General Police Guidance)', icon: 'ℹ️' },
];

function ServicesAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: { en: '', am: '', om: '' },
    slug: '',
    icon: 'shield',
    description: { en: '', am: '', om: '' },
    overview: { en: '', am: '', om: '' },
    requirements: { en: '', am: '', om: '' },
    availability: { en: '', am: '', om: '' },
    feeAmount: 0,
    feeDescription: { en: '', am: '', om: '' },
    emergencyNotice: { en: '', am: '', om: '' },
    sortOrder: 1,
    isActive: true,
  });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const formRef = useRef();

  const load = useCallback(() => {
    api('/admin/services')
      .then(setItems)
      .catch(e => setToast({ message: e.message, type: 'error' }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      name: { en: '', am: '', om: '' },
      slug: '',
      icon: 'shield',
      description: { en: '', am: '', om: '' },
      overview: { en: '', am: '', om: '' },
      requirements: { en: '', am: '', om: '' },
      availability: { en: '', am: '', om: '' },
      feeAmount: 0,
      feeDescription: { en: '', am: '', om: '' },
      emergencyNotice: { en: '', am: '', om: '' },
      sortOrder: items.length + 1,
      isActive: true,
    });
    setEditing(null);
  };

  const editItem = item => {
    setForm({
      name: typeof item.name === 'object' ? { en: item.name?.en || '', am: item.name?.am || '', om: item.name?.om || '' } : { en: item.name || '', am: '', om: '' },
      slug: item.slug || '',
      icon: item.icon || 'shield',
      description: typeof item.description === 'object' ? { en: item.description?.en || '', am: item.description?.am || '', om: item.description?.om || '' } : { en: item.description || '', am: '', om: '' },
      overview: typeof item.overview === 'object' ? { en: item.overview?.en || '', am: item.overview?.am || '', om: item.overview?.om || '' } : { en: item.overview || '', am: '', om: '' },
      requirements: typeof item.requirements === 'object' ? { en: item.requirements?.en || '', am: item.requirements?.am || '', om: item.requirements?.om || '' } : { en: item.requirements || '', am: '', om: '' },
      availability: typeof item.availability === 'object' ? { en: item.availability?.en || '', am: item.availability?.am || '', om: item.availability?.om || '' } : { en: item.availability || '', am: '', om: '' },
      feeAmount: item.feeAmount || 0,
      feeDescription: typeof item.feeDescription === 'object' ? { en: item.feeDescription?.en || '', am: item.feeDescription?.am || '', om: item.feeDescription?.om || '' } : { en: item.feeDescription || '', am: '', om: '' },
      emergencyNotice: typeof item.emergencyNotice === 'object' ? { en: item.emergencyNotice?.en || '', am: item.emergencyNotice?.am || '', om: item.emergencyNotice?.om || '' } : { en: item.emergencyNotice || '', am: '', om: '' },
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    });
    setEditing(item._id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleActive = async item => {
    try {
      await api(`/admin/services/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !item.isActive })
      });
      setToast({ message: `"${titleOf(item)}" ${item.isActive ? 'deactivated' : 'activated'} on homepage.` });
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const deleteItem = async id => {
    try {
      await api(`/admin/services/${id}`, { method: 'DELETE' });
      setToast({ message: 'Service information deleted successfully.' });
      if (editing === id) resetForm();
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setConfirm(null);
  };

  const save = async e => {
    e.preventDefault();
    if (!form.name?.en?.trim()) {
      return setToast({ message: 'Service name in English is required.', type: 'error' });
    }

    let slug = form.slug?.trim();
    if (!slug) {
      slug = form.name.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    setSaving(true);
    try {
      const payload = {
        slug,
        name: form.name,
        icon: form.icon || 'shield',
        description: form.description,
        overview: form.overview,
        requirements: form.requirements,
        availability: form.availability,
        feeAmount: Number(form.feeAmount || 0),
        feeDescription: form.feeDescription,
        emergencyNotice: form.emergencyNotice,
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive !== false,
      };

      if (editing) {
        await api(`/admin/services/${editing}`, { method: 'PUT', body: JSON.stringify(payload) });
        setToast({ message: 'Police service information updated.' });
      } else {
        await api('/admin/services', { method: 'POST', body: JSON.stringify(payload) });
        setToast({ message: 'Police service information created.' });
      }
      resetForm();
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setSaving(false);
  };

  const filtered = items.filter(x =>
    titleOf(x).toLowerCase().includes(search.toLowerCase()) ||
    (x.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = items.filter(x => x.isActive !== false).length;

  const getIconEmoji = iconId => {
    const found = SERVICE_ICON_OPTIONS.find(o => o.id === iconId);
    return found ? found.icon : '🛡️';
  };

  return (
    <div className="adPanel" ref={formRef}>
      <div className="adPanelHead">
        <div>
          <h2>Police Services Information</h2>
          <p>Add and configure police services information, requirements, and operating hours displayed on the homepage.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge label={`${activeCount} Active on Homepage`} variant="success" />
          <Badge label={`${items.length} Total Services`} variant="default" />
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      <div className="adSplit">
        {/* Service Form */}
        <form className="adForm" onSubmit={save}>
          <div className="adFormHead">
            <h3>{editing ? 'Edit Police Service Info' : 'Add Police Service Info'}</h3>
            {editing && <button type="button" className="adBtnGhost" onClick={resetForm}>✕ Cancel</button>}
          </div>

          <L10nInput
            label="Service Title *"
            value={form.name}
            onChange={val => setForm(f => ({ ...f, name: val }))}
            placeholder="e.g. Non-Emergency Crime Reporting, Police Clearance Certificate"
          />

          <div className="adFormRow">
            <label>
              URL Slug *
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. crime-reporting"
                required
              />
              <span className="adFieldHint">Unique identifier for this service</span>
            </label>

            <label>
              Service Icon
              <select
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              >
                {SERVICE_ICON_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <L10nInput
            label="Card Summary (Brief text on homepage card) *"
            value={form.description}
            onChange={val => setForm(f => ({ ...f, description: val }))}
            placeholder="Brief 1-2 sentence description shown on the homepage card..."
          />

          <div style={{ margin: '14px 0 10px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: '#0a2b5a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ℹ️ Detailed Information (Shown in the Service Information View)
            </h4>
          </div>

          <L10nInput
            label="Service Overview"
            value={form.overview}
            onChange={val => setForm(f => ({ ...f, overview: val }))}
            placeholder="Comprehensive overview of what this police service covers and how it helps citizens..."
          />

          <L10nInput
            label="Key Requirements & Documents"
            value={form.requirements}
            onChange={val => setForm(f => ({ ...f, requirements: val }))}
            placeholder="e.g. Valid National ID, Kebele ID, passport photos, incident date/time/location..."
          />

          <L10nInput
            label="Availability, Locations & Operating Hours"
            value={form.availability}
            onChange={val => setForm(f => ({ ...f, availability: val }))}
            placeholder="e.g. 24/7 at all 11 Sub-City Divisions and Woreda police posts..."
          />

          <div className="adFormRow">
            <label style={{ maxWidth: '160px' }}>
              Fee Amount (ETB)
              <input
                type="number"
                min="0"
                value={form.feeAmount}
                onChange={e => setForm(f => ({ ...f, feeAmount: e.target.value }))}
                placeholder="0"
              />
            </label>

            <div style={{ flex: 1 }}>
              <L10nInput
                label="Official Fee Description"
                value={form.feeDescription}
                onChange={val => setForm(f => ({ ...f, feeDescription: val }))}
                placeholder="e.g. Free of charge (Official Public Service) or 150 ETB standard fee"
              />
            </div>
          </div>

          <L10nInput
            label="Emergency Notice / Advisory"
            value={form.emergencyNotice}
            onChange={val => setForm(f => ({ ...f, emergencyNotice: val }))}
            placeholder="e.g. For crimes in progress or life-threatening emergencies, call 991 immediately."
          />

          <div className="adFormRow" style={{ alignItems: 'center', marginTop: '6px' }}>
            <label style={{ maxWidth: '160px' }}>
              Sort Order
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                placeholder="1"
              />
            </label>

            <div style={{ paddingTop: '14px' }}>
              <ToggleSwitch
                checked={form.isActive !== false}
                onChange={v => setForm(f => ({ ...f, isActive: v }))}
                label="Active on Homepage"
              />
            </div>
          </div>

          <button className="adBtn adBtnFull" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update Service Information' : 'Add Service Information'}
          </button>
        </form>

        {/* Services List */}
        <div className="adCard adListCard">
          <div className="adListHead">
            <h3>Police Services <span className="adCount">{filtered.length}</span></h3>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter services by name or slug…" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🛡️"
              text={search ? 'No services match your search filter.' : 'No police services registered yet. Add one using the form.'}
              action={search ? { label: 'Clear Filter', onClick: () => setSearch('') } : undefined}
            />
          ) : (
            filtered.map(item => (
              <article className="adListItem" key={item._id} style={{ alignItems: 'flex-start' }}>
                <div style={{ fontSize: '26px', lineHeight: 1, padding: '4px 6px 0 0' }}>
                  {getIconEmoji(item.icon)}
                </div>
                <div className="adListItemInfo">
                  <b>{titleOf(item)}</b>
                  <p style={{ margin: '3px 0 6px', fontSize: '13px', color: '#64748b' }}>
                    {item.description?.en || item.overview?.en || item.slug}
                  </p>
                  <div className="adListItemMeta" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <Badge label={item.isActive !== false ? 'Active' : 'Inactive'} variant={item.isActive !== false ? 'success' : 'muted'} />
                    <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      Slug: {item.slug}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      Fee: {item.feeAmount ? `${item.feeAmount} ETB` : 'Free'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      Order: #{item.sortOrder ?? 0}
                    </span>
                  </div>
                </div>

                <div className="adActions" style={{ marginTop: '4px' }}>
                  <ToggleSwitch
                    checked={item.isActive !== false}
                    onChange={() => toggleActive(item)}
                    label={item.isActive !== false ? 'Active' : 'Inactive'}
                  />
                  <button
                    className="adBtnIcon"
                    title="Preview Citizen View"
                    onClick={() => setPreviewItem(item)}
                  >
                    👁
                  </button>
                  <button
                    className="adBtnIcon adBtnIconEdit"
                    title="Edit Service Info"
                    onClick={() => editItem(item)}
                  >
                    ✎
                  </button>
                  <button
                    className="adBtnIcon adBtnIconDel"
                    title="Delete Service"
                    onClick={() => setConfirm({
                      title: 'Delete Service Information',
                      message: `Permanently delete "${titleOf(item)}"? This will remove it from the homepage.`,
                      onConfirm: () => deleteItem(item._id),
                      onCancel: () => setConfirm(null)
                    })}
                  >
                    ✕
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Admin Preview Modal */}
      {previewItem && (
        <div className="aap-service-modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="aap-service-modal-box" onClick={e => e.stopPropagation()}>
            <div className="aap-service-modal-header">
              <div className="aap-service-modal-header-left">
                <div className="aap-service-modal-icon-box" style={{ fontSize: '24px' }}>
                  {getIconEmoji(previewItem.icon)}
                </div>
                <div>
                  <span className="aap-service-modal-tag">OFFICIAL SERVICE INFORMATION PREVIEW</span>
                  <h3 className="aap-service-modal-title">{titleOf(previewItem)}</h3>
                </div>
              </div>
              <button
                type="button"
                className="aap-service-modal-close"
                onClick={() => setPreviewItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="aap-service-modal-body">
              <div className="aap-service-info-row">
                <h4>📋 Service Overview</h4>
                <p>{previewItem.overview?.en || previewItem.description?.en || 'No overview provided.'}</p>
              </div>

              <div className="aap-service-info-row">
                <h4>📑 Key Requirements & Documents</h4>
                <p>{previewItem.requirements?.en || 'Standard identification required at division desk.'}</p>
              </div>

              <div className="aap-service-info-row">
                <h4>📍 Availability & Locations</h4>
                <p>{previewItem.availability?.en || 'Available across all Sub-City police divisions.'}</p>
              </div>

              <div className="aap-service-info-row">
                <h4>💳 Official Fee Status</h4>
                <p>{previewItem.feeDescription?.en || (previewItem.feeAmount ? `${previewItem.feeAmount} ETB` : 'Free of charge (Official Public Service)')}</p>
              </div>

              {previewItem.emergencyNotice?.en && (
                <div className="aap-service-emergency-box">
                  <span className="aap-service-emergency-icon" aria-hidden="true">🚨</span>
                  <div>
                    <h5>Emergency Notice</h5>
                    <p>{previewItem.emergencyNotice.en}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="aap-service-modal-footer">
              <button
                type="button"
                className="adBtn"
                onClick={() => setPreviewItem(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanelContent() {
  const [tab, setTab] = useState('overview');
  const [user, setUser] = useState();
  const [sideOpen, setSideOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isDirty } = useSiteSettings();

  const isInsideSettings = location.pathname.startsWith('/admin/site-settings');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(() => isInsideSettings);

  // Auto-expand submenu when the current route is inside Site Settings
  useEffect(() => {
    if (isInsideSettings) {
      setIsSettingsExpanded(true);
    }
  }, [isInsideSettings]);

  // Redirect /admin/site-settings to first child (Branding & Footer)
  useEffect(() => {
    if (location.pathname === '/admin/site-settings' || location.pathname === '/admin/site-settings/') {
      navigate('/admin/site-settings/branding', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => { api('/auth/me').then(setUser).catch(() => { }); }, []);

  const menuGroups = [
    {
      label: 'MENU',
      items: [
        { id: 'overview', name: 'Dashboard', icon: '◉' },
        { id: 'news', name: 'News', icon: '📰' },
        { id: 'services', name: 'Police Services Info', icon: '🛡️' },
        { id: 'hotlines', name: 'Emergency Hotlines', icon: '📞' },
        { id: 'vacancies', name: 'Job Vacancies', icon: '💼' },
        { id: 'alerts', name: 'Alerts & Road Safety', icon: '⚠' },
        { id: 'documents', name: 'Safety Documents', icon: '📄' },
        { id: 'stations', name: 'Police Stations', icon: '🏢' },
        { id: 'media', name: 'Media Library', icon: '🖼' },
        { id: 'requests', name: 'Submissions', icon: '📋' },
      ]
    },
    {
      label: 'ADMIN',
      items: [
        { id: 'settings', name: 'Site Settings', icon: '⚙' },
        // { id: 'seo', name: 'SEO & Pages', icon: '📄' },
        { id: 'users', name: 'Users & Roles', icon: '👤' },
        { id: 'permissions', name: 'Permissions', icon: '🔑' },
        { id: 'logs', name: 'Audit Logs', icon: '🔒' },
        { id: 'backups', name: 'Backups', icon: '💾' },
      ]
    }
  ];

  const visible = id => {
    if (!user) return false;
    if (user.isSuperAdmin || user.role === 'super_admin' || user.permissions?.includes('*')) return true;
    if (id === 'overview') return true;

    // Check granular permissions attached to the user session
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    if (perms.includes('*')) return true;

    const permMap = {
      news: ['news.view', 'news.create', 'news.edit', 'news.publish', 'content:read', 'content:write'],
      services: ['services.view', 'services.manage', 'content:read'],
      hotlines: ['hotlines.view', 'hotlines.create', 'hotlines.edit', 'hotlines:manage'],
      vacancies: ['vacancies.view', 'vacancies.manage', 'vacancies:manage'],
      alerts: ['alerts.view', 'alerts.create', 'alerts.edit', 'alerts:manage'],
      documents: ['documents.view', 'documents.manage', 'content:read'],
      stations: ['stations.view', 'stations.manage', 'stations:manage'],
      media: ['media.view', 'media.manage', 'media:manage'],
      requests: ['submissions.view', 'submissions.manage', 'submissions:manage'],
      settings: ['settings.manage', 'settings:manage'],
      users: ['users.view', 'users.create', 'users.assign_role', 'users:manage'],
      permissions: ['permissions:manage', 'users:manage'],
      logs: ['logs.view', 'logs:read'],
      backups: ['backups.manage', 'backup:read']
    };

    if (permMap[id] && permMap[id].some(p => perms.includes(p))) {
      return true;
    }

    const accessMap = {
      admin: ['news', 'services', 'hotlines', 'vacancies', 'alerts', 'documents', 'stations', 'media', 'requests', 'settings', 'users', 'permissions', 'logs', 'backups'],
      dispatcher: ['hotlines', 'alerts', 'requests'],
      communications: ['news', 'media', 'alerts', 'services'],
      station_commander: ['stations', 'vacancies', 'requests'],
      investigator: ['requests', 'documents'],
      editor: ['news', 'services', 'documents', 'media', 'alerts'],
      author: ['news', 'media'],
      staff: ['requests']
    };

    return (accessMap[user.role] || []).includes(id);
  };

  const handleSettingsToggle = () => {
    if (!isInsideSettings) {
      setIsSettingsExpanded(true);
      navigate('/admin/site-settings/branding');
    } else {
      setIsSettingsExpanded(prev => !prev);
    }
  };

  const handleSettingsKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSettingsToggle();
    } else if (e.key === 'ArrowRight' && !isSettingsExpanded) {
      e.preventDefault();
      setIsSettingsExpanded(true);
    } else if (e.key === 'ArrowLeft' && isSettingsExpanded) {
      e.preventDefault();
      setIsSettingsExpanded(false);
    }
  };

  const handleNavClick = (id) => {
    if (id === 'settings') {
      handleSettingsToggle();
      return;
    }

    if (isInsideSettings && isDirty) {
      setConfirmLeave({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes in Site Settings. Are you sure you want to navigate away? Unsaved changes will remain in this session, but will not be saved to the server until you return and click "Save all changes".',
        danger: false,
        onConfirm: () => {
          setConfirmLeave(null);
          setTab(id);
          navigate('/admin');
        },
        onCancel: () => setConfirmLeave(null)
      });
      return;
    }

    setTab(id);
    if (isInsideSettings) {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    if (isInsideSettings && isDirty) {
      setConfirmLeave({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes in Site Settings. Signing out will discard your unsaved changes. Are you sure you want to sign out?',
        danger: true,
        onConfirm: () => {
          sessionStorage.removeItem('adminToken');
          window.location.assign('/admin/login');
        },
        onCancel: () => setConfirmLeave(null)
      });
      return;
    }
    sessionStorage.removeItem('adminToken');
    window.location.assign('/admin/login');
  };

  const page = isInsideSettings ? (
    <SiteSettingsLayout />
  ) : tab === 'news' ? (
    <Content type="news" name="News" />
  ) : tab === 'services' ? (
    <ServicesAdmin />
  ) : tab === 'hotlines' ? (
    <HotlinesAdmin />
  ) : tab === 'vacancies' ? (
    <VacanciesAdmin />
  ) : tab === 'alerts' ? (
    <AlertsAdmin />
  ) : tab === 'documents' ? (
    <SafetyDocumentsAdmin />
  ) : tab === 'stations' ? (
    <Stations />
  ) : tab === 'media' ? (
    <Media />
  ) : tab === 'users' ? (
    <Users currentUser={user} onNavigatePermissions={() => setTab('permissions')} />
  ) : tab === 'permissions' ? (
    <PermissionsAdmin currentUser={user} />
  ) : tab === 'requests' ? (
    <Submissions />
  ) : tab === 'logs' ? (
    <AuditLog />
  ) : tab === 'seo' ? (
    <Pages />
  ) : tab === 'backups' ? (
    <Backup restore={user?.role === 'super_admin'} />
  ) : (
    <Dashboard onOpen={handleNavClick} />
  );

  return (
    <div className="adShell">
      {confirmLeave && <Confirm {...confirmLeave} />}

      {/* ── Sidebar ── */}
      <aside className={`adSidebar ${sideOpen ? '' : 'collapsed'}`}>
        <div className="adSidebarBrand">
          <div className="adBrandIcon">AAP</div>
          <div className="adBrandText">
            <strong>Addis Ababa Police</strong>
            <small>Portal Admin</small>
          </div>
        </div>

        <nav className="adSidebarNav">
          {menuGroups.map(group => (
            <div key={group.label}>
              <span className="adNavLabel">{group.label}</span>
              {group.items.filter(item => visible(item.id)).map(item => {
                if (item.id === 'settings') {
                  return (
                    <div key={item.id} className="adNavParentGroup">
                      <button
                        type="button"
                        className={`adNavItem ${isInsideSettings ? 'parentActive' : ''}`}
                        onClick={handleSettingsToggle}
                        onKeyDown={handleSettingsKeyDown}
                        aria-expanded={isSettingsExpanded}
                        aria-haspopup="true"
                        aria-controls="ad-site-settings-submenu"
                      >
                        <span className="adNavIcon">{item.icon}</span>
                        <span className="adNavText">{item.name}</span>
                        <span className={`adNavChevron ${isSettingsExpanded ? 'open' : ''}`} aria-hidden="true">
                          ▾
                        </span>
                      </button>

                      {/* Nested Submenu */}
                      <div
                        id="ad-site-settings-submenu"
                        className={`adSubmenu ${isSettingsExpanded ? 'expanded' : 'collapsed'}`}
                        role="region"
                        aria-label="Site Settings Submenu"
                      >
                        {SITE_SETTINGS_SECTIONS.map(child => {
                          const isChildActive = isInsideSettings && (
                            location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
                          );
                          return (
                            <button
                              key={child.id}
                              type="button"
                              className={`adSubmenuItem ${isChildActive ? 'active' : ''}`}
                              onClick={() => {
                                navigate(child.path);
                              }}
                              tabIndex={isSettingsExpanded ? 0 : -1}
                            >
                              <span className="adSubmenuIcon">{child.icon}</span>
                              <span className="adSubmenuText">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    className={`adNavItem ${!isInsideSettings && tab === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="adNavIcon">{item.icon}</span>
                    <span className="adNavText">{item.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adSidebarFooter">
          <div className="adUserChip">
            <div className="adAvatar">{(user?.name || '?')[0]}</div>
            <div><strong>{user?.name || 'Staff'}</strong><small>{user?.role || 'user'}
            </small>
            </div>
          </div>
          <button className="adLogout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="adMain">
        <header className="adTopbar">
          <button className="adHamburger" onClick={() => setSideOpen(!sideOpen)}>
            <span /><span /><span />
          </button>
          <div className="adGlobalSearch">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <line x1="12.5" y1="12.5" x2="17" y2="17" strokeLinecap="round" /></svg>
            <input placeholder="Search or type command…" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
            <kbd>⌘K</kbd>
          </div>
        </header>
        <div className="adBody">
          {page}
        </div>
      </div>
    </div>
  );
}

function AdminPanel() {
  return (
    <SiteSettingsProvider>
      <AdminPanelContent />
    </SiteSettingsProvider>
  );
}

export default AdminPanel;
