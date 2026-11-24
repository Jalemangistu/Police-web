import React, { useState, useEffect, useRef, useCallback } from 'react';
import { L10nInput, ToggleSwitch } from '../../components/admin/AdminControls';

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

// Safe API helper that tries /admin/vacancies first and falls back to /vacancies
const vacancyApi = async (path, options = {}) => {
  try {
    return await api(`/admin${path}`, options);
  } catch (err) {
    if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('Cannot'))) {
      return await api(path, options);
    }
    throw err;
  }
};

const DEPARTMENT_PRESETS = [
  'Criminal Investigation Division',
  'Traffic Management & Highway Patrol Directorate',
  'Digital Forensics & Cyber Investigation Unit',
  'Crime Prevention & Community Policing Directorate',
  'Command & Emergency Dispatch Directorate',
  'Forensic Science & Evidence Laboratory',
  'Special Operations & Tactical Response Unit',
  'Public Relations & Media Department',
  'Legal & Statutory Compliance Directorate',
  'Human Resources & Academy Training'
];

const EMPLOYMENT_TYPES = [
  'Full-time / Active Duty',
  'Civilian Professional',
  'Specialist / Technical',
  'Contract / Project-based',
  'Rotational Shift / Dispatch'
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

function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="adSearchWrap">
      <svg className="adSearchIcon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input className="adSearchInput" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button className="adSearchClear" onClick={() => onChange('')}>✕</button>}
    </div>
  );
}

function Badge({ label, variant = 'default' }) {
  return <span className={`adBadge adBadge--${variant}`}>{label}</span>;
}

function EmptyState({ icon = '💼', text = 'No vacancies found.', action }) {
  return (
    <div className="adEmpty">
      <span className="adEmptyIcon">{icon}</span>
      <p>{text}</p>
      {action && <button className="adBtn" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

export default function VacanciesAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: { en: '', am: '', om: '' },
    department: DEPARTMENT_PRESETS[0],
    customDepartment: '',
    location: 'Addis Ababa - Division HQ',
    deadline: '',
    employmentType: EMPLOYMENT_TYPES[0],
    status: 'open',
    description: { en: '', am: '', om: '' },
    requirements: { en: '', am: '', om: '' }
  });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const formRef = useRef();

  const load = useCallback(() => {
    vacancyApi('/vacancies')
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(e => setToast({ message: e.message, type: 'error' }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      title: { en: '', am: '', om: '' },
      department: DEPARTMENT_PRESETS[0],
      customDepartment: '',
      location: 'Addis Ababa - Division HQ',
      deadline: '',
      employmentType: EMPLOYMENT_TYPES[0],
      status: 'open',
      description: { en: '', am: '', om: '' },
      requirements: { en: '', am: '', om: '' }
    });
    setEditing(null);
  };

  const editItem = item => {
    const isCustomDept = item.department && !DEPARTMENT_PRESETS.includes(item.department);
    let deadlineDateStr = '';
    if (item.deadline) {
      try {
        const d = new Date(item.deadline);
        if (!isNaN(d.getTime())) {
          deadlineDateStr = d.toISOString().split('T')[0];
        }
      } catch {
        deadlineDateStr = '';
      }
    }

    setForm({
      title: typeof item.title === 'object' ? { en: item.title?.en || '', am: item.title?.am || '', om: item.title?.om || '' } : { en: String(item.title || ''), am: '', om: '' },
      department: isCustomDept ? 'Custom' : (item.department || DEPARTMENT_PRESETS[0]),
      customDepartment: isCustomDept ? item.department : '',
      location: item.location || 'Addis Ababa',
      deadline: deadlineDateStr,
      employmentType: item.employmentType || EMPLOYMENT_TYPES[0],
      status: item.status || 'open',
      description: typeof item.description === 'object' ? { en: item.description?.en || '', am: item.description?.am || '', om: item.description?.om || '' } : { en: String(item.description || ''), am: '', om: '' },
      requirements: typeof item.requirements === 'object' ? { en: item.requirements?.en || '', am: item.requirements?.am || '', om: item.requirements?.om || '' } : { en: String(item.requirements || ''), am: '', om: '' }
    });
    setEditing(item._id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteItem = async id => {
    try {
      await vacancyApi(`/vacancies/${id}`, { method: 'DELETE' });
      setToast({ message: 'Vacancy deleted successfully.' });
      if (editing === id) resetForm();
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setConfirm(null);
  };

  const toggleStatus = async item => {
    const nextStatus = item.status === 'open' ? 'closed' : 'open';
    try {
      await vacancyApi(`/vacancies/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      setToast({ message: `Position marked as ${nextStatus}.` });
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const save = async e => {
    e.preventDefault();
    if (!form.title?.en?.trim()) {
      setToast({ message: 'English position title is required.', type: 'error' });
      return;
    }

    setSaving(true);
    const resolvedDept = form.department === 'Custom' ? form.customDepartment.trim() : form.department;

    const payload = {
      title: form.title,
      department: resolvedDept || 'Addis Ababa Police',
      location: form.location?.trim() || 'Addis Ababa',
      deadline: form.deadline ? new Date(form.deadline) : null,
      employmentType: form.employmentType,
      status: form.status || 'open',
      description: form.description,
      requirements: form.requirements
    };

    try {
      if (editing) {
        await vacancyApi(`/vacancies/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'Vacancy information updated successfully.' });
      } else {
        await vacancyApi('/vacancies', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'New vacancy posted successfully.' });
      }
      resetForm();
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const filtered = items.filter(v => {
    const titleStr = typeof v.title === 'object' ? `${v.title?.en || ''} ${v.title?.am || ''} ${v.title?.om || ''}`.toLowerCase() : String(v.title || '').toLowerCase();
    const deptStr = String(v.department || '').toLowerCase();
    const locStr = String(v.location || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q || titleStr.includes(q) || deptStr.includes(q) || locStr.includes(q);
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const titleOf = v => v?.title?.en || v?.title?.am || v?.title?.om || (typeof v?.title === 'string' ? v.title : 'Untitled Position');

  const statusVariant = st => {
    if (st === 'open') return 'success';
    if (st === 'closed') return 'muted';
    return 'warning';
  };

  return (
    <div className="adPanel" ref={formRef}>
      <div className="adPanelHead">
        <div>
          <h2>Job Vacancies &amp; Recruitment</h2>
          <p>Create and update police officer recruitment openings, specialist vacancies, deadlines, and qualifications displayed on the public Careers page.</p>
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      <div className="adSplit">
        {/* Form (Left side) */}
        <form className="adForm" onSubmit={save}>
          <div className="adFormHead">
            <h3>{editing ? 'Edit Job Vacancy' : 'Post New Job Vacancy'}</h3>
            {editing && (
              <button type="button" className="adBtnGhost" onClick={resetForm}>
                ✕ Cancel Edit
              </button>
            )}
          </div>

          <L10nInput
            label="Position Title *"
            value={form.title}
            onChange={val => setForm(f => ({ ...f, title: val }))}
            placeholder="e.g. Cadet Police Officer, Forensic Investigator, Traffic Specialist"
          />

          <div className="adFormRow">
            <label>
              Department *
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              >
                {DEPARTMENT_PRESETS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="Custom">Other (Custom Department)…</option>
              </select>
            </label>

            {form.department === 'Custom' && (
              <label>
                Custom Department Name *
                <input
                  type="text"
                  value={form.customDepartment}
                  onChange={e => setForm(f => ({ ...f, customDepartment: e.target.value }))}
                  placeholder="Enter department name"
                  required
                />
              </label>
            )}
          </div>

          <div className="adFormRow">
            <label>
              Location *
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Addis Ababa - Sub-City Divisions or Police HQ"
                required
              />
            </label>

            <label>
              Application Deadline *
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                required
              />
            </label>
          </div>

          <div className="adFormRow">
            <label>
              Employment Type
              <select
                value={form.employmentType}
                onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}
              >
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Position Status
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="open">Open (Accepting Applications)</option>
                <option value="closed">Closed (Deadline Passed)</option>
                <option value="draft">Draft (Hidden from Public)</option>
              </select>
            </label>
          </div>

          <L10nInput
            label="Job Description &amp; Responsibilities *"
            value={form.description}
            onChange={val => setForm(f => ({ ...f, description: val }))}
            placeholder="Detailed overview of duties, patrol assignments, command structure..."
          />

          <L10nInput
            label="Key Qualifications &amp; Eligibility Requirements *"
            value={form.requirements}
            onChange={val => setForm(f => ({ ...f, requirements: val }))}
            placeholder="e.g. Educational background, citizenship, fitness standards, age limits, experience..."
          />

          <button className="adBtn adBtnFull" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update Vacancy Information' : 'Publish Job Vacancy'}
          </button>
        </form>

        {/* Vacancies List (Right side) */}
        <div className="adCard adListCard">
          <div className="adListHead">
            <div>
              <h3>Job Openings <span className="adCount">{filtered.length}</span></h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '0 0 12px 0' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter by title, department, or location…" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="💼"
              text={search || statusFilter !== 'all' ? 'No vacancies match your filter.' : 'No vacancies registered in database yet. Add one using the form.'}
              action={search || statusFilter !== 'all' ? { label: 'Reset Filter', onClick: () => { setSearch(''); setStatusFilter('all'); } } : undefined}
            />
          ) : (
            filtered.map(item => {
              const deadlineFormatted = item.deadline
                ? new Date(item.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'No deadline';

              return (
                <article className="adListItem" key={item._id}>
                  <div className="adListItemInfo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <b>{titleOf(item)}</b>
                      <Badge label={item.status ? item.status.toUpperCase() : 'OPEN'} variant={statusVariant(item.status)} />
                    </div>
                    <p style={{ margin: '3px 0 6px', fontSize: '13px', color: '#64748b' }}>
                      {item.description?.en || item.description?.am || 'No description provided.'}
                    </p>
                    <div className="adListItemMeta" style={{ flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        🛡️ {item.department || 'Addis Ababa Police'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        📍 {item.location || 'Addis Ababa'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#b21e2b', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        📅 Deadline: {deadlineFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="adActions" style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      className="adBtnOutline adBtnSm"
                      title="Toggle Open/Closed"
                      onClick={() => toggleStatus(item)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      {item.status === 'open' ? 'Mark Closed' : 'Mark Open'}
                    </button>
                    <button
                      className="adBtnIcon"
                      title="Preview Citizen View"
                      onClick={() => setPreviewItem(item)}
                    >
                      👁
                    </button>
                    <button
                      className="adBtnIcon adBtnIconEdit"
                      title="Edit Vacancy"
                      onClick={() => editItem(item)}
                    >
                      ✎
                    </button>
                    <button
                      className="adBtnIcon adBtnIconDel"
                      title="Delete Vacancy"
                      onClick={() => setConfirm({
                        title: 'Delete Job Vacancy',
                        message: `Permanently delete vacancy for "${titleOf(item)}"? Job seekers will no longer see this position.`,
                        onConfirm: () => deleteItem(item._id),
                        onCancel: () => setConfirm(null)
                      })}
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

      {/* Citizen View Preview Modal */}
      {previewItem && (
        <div className="adModal" onClick={() => setPreviewItem(null)}>
          <div className="adModalBox" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#b21e2b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  PUBLIC VACANCY PREVIEW
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.3rem', color: '#0f172a' }}>
                  {titleOf(previewItem)}
                </h3>
                <small style={{ color: '#64748b' }}>{previewItem.department}</small>
              </div>
              <button
                type="button"
                className="adBtnGhost"
                onClick={() => setPreviewItem(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
              <span>📍 <b>Location:</b> {previewItem.location || 'Addis Ababa'}</span>
              <span>📅 <b>Deadline:</b> {previewItem.deadline ? new Date(previewItem.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Open'}</span>
              <span>🏷️ <b>Status:</b> {previewItem.status?.toUpperCase() || 'OPEN'}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#0f172a' }}>📋 Job Description</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
                {previewItem.description?.en || 'No description provided.'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#0f172a' }}>📑 Key Qualifications &amp; Requirements</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
                {previewItem.requirements?.en || 'Standard qualifications apply.'}
              </p>
            </div>

            <div className="adModalActions">
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

