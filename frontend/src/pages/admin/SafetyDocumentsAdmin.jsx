import React, { useState, useEffect, useRef, useCallback } from 'react';
import { L10nInput, ToggleSwitch } from '../../components/admin/AdminControls';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = async (path, options = {}) => {
  const r = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.adminToken}` },
    ...options
  });
  const d = r.status === 204 ? null : await r.json();
  if (r.status === 401) {
    sessionStorage.removeItem('adminToken');
    window.location.assign('/admin/login');
  }
  if (!r.ok) throw Error(d.message || 'Request failed');
  return d;
};

const CATEGORY_OPTIONS = [
  { value: 'protect_home', label: 'Protect your home (Home Security)' },
  { value: 'safe_online', label: 'Stay safe online (Cybercrime)' },
  { value: 'road_safety', label: 'Road safety (Traffic & Pedestrians)' },
  { value: 'missing_persons', label: 'Missing persons alerts' },
  { value: 'most_wanted', label: 'Most wanted notices' },
  { value: 'safety_advisories', label: 'Safety advisories' },
  { value: 'general_guidance', label: 'General Guidance & Directives' },
];

function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`adToast ${type}`}>
      <span>{message}</span>
      <button onClick={onDone}>✕</button>
    </div>
  );
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

const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

export default function SafetyDocumentsAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    category: 'protect_home',
    documentNumber: '',
    slug: '',
    department: 'Addis Ababa Police Crime Prevention Directorate',
    title: { en: '', am: '', om: '' },
    summary: { en: '', am: '', om: '' },
    content: { en: '', am: '', om: '' },
    fileUrl: '',
    fileName: '',
    fileSize: '',
    featuredImage: '',
    status: 'published',
    isActive: true,
  });

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await api('/admin/documents');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      category: 'protect_home',
      documentNumber: '',
      slug: '',
      department: 'Addis Ababa Police Crime Prevention Directorate',
      title: { en: '', am: '', om: '' },
      summary: { en: '', am: '', om: '' },
      content: { en: '', am: '', om: '' },
      fileUrl: '',
      fileName: '',
      fileSize: '',
      featuredImage: '',
      status: 'published',
      isActive: true,
    });
    setEditing(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({
      category: item.category || 'protect_home',
      documentNumber: item.documentNumber || '',
      slug: item.slug || '',
      department: item.department || 'Addis Ababa Police Crime Prevention Directorate',
      title: item.title || { en: '', am: '', om: '' },
      summary: item.summary || { en: '', am: '', om: '' },
      content: item.content || { en: '', am: '', om: '' },
      fileUrl: item.fileUrl || '',
      fileName: item.fileName || '',
      fileSize: item.fileSize || '',
      featuredImage: item.featuredImage || '',
      status: item.status || 'published',
      isActive: item.isActive !== false,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = (id) => {
    setConfirm({
      title: 'Delete Safety Document',
      message: 'Are you sure you want to delete this official document? This action cannot be undone.',
      danger: true,
      onConfirm: async () => {
        try {
          await api(`/admin/documents/${id}`, { method: 'DELETE' });
          setToast({ message: 'Document deleted successfully.' });
          if (editing === id) resetForm();
          load();
        } catch (e) {
          setToast({ message: e.message, type: 'error' });
        }
        setConfirm(null);
      },
      onCancel: () => setConfirm(null),
    });
  };

  const handleToggleActive = async (item) => {
    try {
      await api(`/admin/documents/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      setToast({
        message: `Document "${item.title?.en || item.slug}" ${item.isActive ? 'deactivated' : 'activated'}.`,
      });
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setToast({ message: 'File exceeds 20MB limit.', type: 'error' });
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        fileUrl: reader.result,
        fileName: file.name,
        fileSize: sizeFormatted,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setForm((prev) => ({
      ...prev,
      fileUrl: '',
      fileName: '',
      fileSize: '',
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTitleChange = (val) => {
    setForm((prev) => {
      const next = { ...prev, title: val };
      if (!editing && val?.en && (!prev.slug || prev.slug === slugify(prev.title?.en || ''))) {
        next.slug = slugify(val.en);
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title?.en && !form.title?.am && !form.title?.om) {
      setToast({ message: 'Please provide at least an English title.', type: 'error' });
      return;
    }

    const slug = form.slug?.trim() || slugify(form.title?.en || form.documentNumber || Date.now().toString());

    setSaving(true);
    try {
      const payload = {
        category: form.category,
        documentNumber: form.documentNumber || `AAP-DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
        slug,
        department: form.department,
        title: form.title,
        summary: form.summary,
        content: form.content,
        fileUrl: form.fileUrl,
        fileName: form.fileName,
        fileSize: form.fileSize,
        featuredImage: form.featuredImage,
        status: form.status,
        isActive: form.isActive,
      };

      if (editing) {
        await api(`/admin/documents/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setToast({ message: 'Safety document updated successfully.' });
      } else {
        await api('/admin/documents', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setToast({ message: 'New safety document fed and published successfully.' });
      }

      resetForm();
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const filtered = items.filter((item) => {
    const matchesCat = filterCat === 'all' || item.category === filterCat;
    const title = (item.title?.en || item.title?.am || item.title?.om || '').toLowerCase();
    const docNum = (item.documentNumber || '').toLowerCase();
    const slug = (item.slug || '').toLowerCase();
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || title.includes(q) || docNum.includes(q) || slug.includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="adPanel" ref={formRef}>
      <div className="adPanelHead">
        <div>
          <h2>Safety Documents & Resources</h2>
          <p>Feed, publish, and manage official crime prevention directives, procedural guides, and downloadable resources for citizens.</p>
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      <div className="adSplit">
        {/* Editor Form */}
        <form className="adForm" onSubmit={handleSave}>
          <div className="adFormHead">
            <h3>{editing ? 'Edit Safety Document' : 'Feed New Document'}</h3>
            {editing && (
              <button type="button" className="adBtnGhost" onClick={resetForm}>
                ✕ Cancel Edit
              </button>
            )}
          </div>

          <label>
            Resource Topic / Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="adFieldHint">Determines which card category this document attaches to on the public Safety page.</span>
          </label>

          <L10nInput
            label="Document Title *"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="e.g. Residential Security & Burglary Prevention Directive"
          />

          <div className="adFormRow">
            <label>
              Official Document Ref
              <input
                value={form.documentNumber || ''}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                placeholder="e.g. AAP-DOC-2026-001"
              />
            </label>

            <label>
              URL Slug
              <input
                required
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="e.g. residential-security-directive"
              />
            </label>
          </div>

          <label>
            Issuing Police Department / Directorate
            <input
              value={form.department || ''}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Addis Ababa Police Crime Prevention Directorate"
            />
          </label>

          <L10nInput
            label="Executive Summary / Card Excerpt"
            value={form.summary}
            onChange={(val) => setForm({ ...form, summary: val })}
            placeholder="Brief executive summary displayed on cards and overview previews"
          />

          <L10nInput
            label="Document Content / Directives & Procedures"
            value={form.content}
            onChange={(val) => setForm({ ...form, content: val })}
            placeholder="Full document content, section headings (### 1. Perimeter Security), checklists, and instructions"
            isQuill={false}
          />

          {/* Attached Document File (PDF, DOCX) */}
          <div style={{ margin: '14px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#334155' }}>
              Attached Official Document (PDF / DOC)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
            />
            <span className="adFieldHint">
              Upload the official PDF or printable document (max 20MB). Citizens can download this file from the document view page.
            </span>

            {form.fileName && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', padding: '8px 12px', background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '13px', color: '#1e293b' }}>
                  📄 <strong>{form.fileName}</strong> {form.fileSize ? `(${form.fileSize})` : ''}
                </span>
                <button
                  type="button"
                  className="adBtnGhost"
                  onClick={removeFile}
                  style={{ color: '#ef4444', fontSize: '12px' }}
                >
                  ✕ Remove File
                </button>
              </div>
            )}
          </div>

          <div className="adFormRow">
            <label>
              Publication Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px' }}>
              <ToggleSwitch
                checked={form.isActive}
                onChange={(v) => setForm({ ...form, isActive: v })}
                label="Active on site"
              />
            </div>
          </div>

          <button className="adBtn adBtnFull" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update Document' : 'Publish Document'}
          </button>
        </form>

        {/* Documents Table / List */}
        <div className="adCard adListCard">
          <div className="adListHead">
            <div>
              <h3>
                Documents <span className="adCount">{filtered.length}</span>
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                className="adSearchInput"
                placeholder="Search documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: '180px' }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="adEmpty">
              <span className="adEmptyIcon">📑</span>
              <p>No safety documents found matching your filter.</p>
              {editing && (
                <button className="adBtn" onClick={resetForm}>
                  Add New Document
                </button>
              )}
            </div>
          ) : (
            <div className="adList">
              {filtered.map((item) => {
                const titleStr = item.title?.en || item.title?.am || item.title?.om || item.slug || 'Untitled Document';
                const catObj = CATEGORY_OPTIONS.find((c) => c.value === item.category);

                return (
                  <article className="adListItem" key={item._id} style={{ alignItems: 'flex-start' }}>
                    <div className="adListItemInfo" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#e0e7ff',
                            color: '#3730a3',
                          }}
                        >
                          {catObj ? catObj.label.split('(')[0].trim() : item.category}
                        </span>
                        {item.documentNumber && (
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            {item.documentNumber}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: item.status === 'published' ? '#dcfce7' : '#f1f5f9',
                            color: item.status === 'published' ? '#166534' : '#64748b',
                          }}
                        >
                          {item.status || 'draft'}
                        </span>
                      </div>

                      <b style={{ fontSize: '14.5px', color: '#0f172a' }}>{titleStr}</b>
                      {item.summary?.en && (
                        <p style={{ margin: '4px 0 6px 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
                          {item.summary.en.slice(0, 110)}…
                        </p>
                      )}

                      <div className="adListItemMeta" style={{ gap: '12px', fontSize: '12px' }}>
                        {item.fileName && <span>📎 {item.fileName}</span>}
                        {item.views > 0 && <span>👁 {item.views} reads</span>}
                        <span>
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    <div className="adActions" style={{ gap: '6px' }}>
                      <a
                        href={`/safety/resources/${item.slug || item._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="adBtnIcon"
                        title="View Public Document Page ↗"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                      >
                        ↗
                      </a>

                      <button
                        type="button"
                        className="adBtnIcon"
                        onClick={() => handleEdit(item)}
                        title="Edit document"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="adBtnIcon danger"
                        onClick={() => handleDelete(item._id)}
                        title="Delete document"
                      >
                        🗑
                      </button>

                      <ToggleSwitch
                        checked={item.isActive !== false}
                        onChange={() => handleToggleActive(item)}
                        label=""
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
