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

const SEVERITY_LEVELS = [
  { id: 'critical', label: 'Critical Alert (Imminent Danger / Red)', color: '#dc2626' },
  { id: 'high', label: 'High Alert (Major Advisory / Amber-Red)', color: '#b21e2b' },
  { id: 'medium', label: 'Medium Alert (Caution / Yellow)', color: '#d97706' },
  { id: 'low', label: 'Low Alert (General Guidance / Green)', color: '#16a34a' }
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

function EmptyState({ icon = '⚠️', text = 'No alerts found.', action }) {
  return (
    <div className="adEmpty">
      <span className="adEmptyIcon">{icon}</span>
      <p>{text}</p>
      {action && <button className="adBtn" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

export default function AlertsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: { en: '', am: '', om: '' },
    message: { en: '', am: '', om: '' },
    category: 'road_safety',
    level: 'high',
    corridors: 'Meskel Square · Bole Road · Ring Road Interchange',
    hotline: '991 / 011 552 4433',
    isActive: true
  });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const formRef = useRef();

  const load = useCallback(() => {
    api('/admin/alerts')
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(e => setToast({ message: e.message, type: 'error' }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Find active Road Safety Alert
  const roadSafetyAlert = items.find(a => 
    a.category === 'road_safety' || 
    (typeof a.title === 'object' && a.title?.en?.toLowerCase().includes('traffic')) || 
    (typeof a.title === 'string' && a.title?.toLowerCase().includes('traffic'))
  );

  const resetForm = () => {
    setForm({
      title: { en: '', am: '', om: '' },
      message: { en: '', am: '', om: '' },
      category: 'general',
      level: 'medium',
      corridors: '',
      hotline: '',
      isActive: true
    });
    setEditing(null);
  };

  const editItem = item => {
    const isRoadSafety = item.category === 'road_safety' || 
      (typeof item.title === 'object' && item.title?.en?.toLowerCase().includes('traffic')) || 
      (typeof item.title === 'string' && item.title?.toLowerCase().includes('traffic'));

    setForm({
      title: typeof item.title === 'object' ? { en: item.title?.en || '', am: item.title?.am || '', om: item.title?.om || '' } : { en: String(item.title || ''), am: '', om: '' },
      message: typeof item.message === 'object' ? { en: item.message?.en || '', am: item.message?.am || '', om: item.message?.om || '' } : { en: String(item.message || ''), am: '', om: '' },
      category: isRoadSafety ? 'road_safety' : (item.category || 'general'),
      level: item.level || 'medium',
      corridors: item.corridors || (isRoadSafety ? 'Meskel Square · Bole Road · Ring Road Interchange' : ''),
      hotline: item.hotline || (isRoadSafety ? '991 / 011 552 4433' : ''),
      isActive: item.isActive !== false
    });
    setEditing(item._id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEditRoadSafetyClick = () => {
    if (roadSafetyAlert) {
      editItem(roadSafetyAlert);
    } else {
      setForm({
        title: {
          en: 'Corridor Traffic Regulation & Road Safety Enforcement',
          am: 'የኮሪደር ትራፊክ ቁጥጥር እና የመንገድ ደህንነት ማስከበር',
          om: "To'annoo Tiraafikaa fi Nageenya Daandii"
        },
        message: {
          en: 'Active traffic safety advisory across Addis Ababa corridors. Strict enforcement of 50 km/h speed limits, mandatory yielding at pedestrian crossings, and vehicle spacing in rainy weather are in effect. Follow lane markings and heed officer directions.',
          am: 'በአዲስ አበባ ከተማ ዋና ዋና ኮሪደሮች ላይ የትራፊክ ደህንነት ማስከበር ስራ እየተከናወነ ይገኛል። የ50 ኪ.ሜ/ሰ ፍጥነት ገደብ ማክበር፣ ለእግረኞች ቅድሚያ መስጠት እና የዝናብ ወቅት ጥንቃቄ ማድረግ ግዴታ ነው።',
          om: "Daandilee Finfinnee irratti to'annoon tiraafikaa cimee itti fufeera. Ariitii 50 km/h eeguu fi deemtoota faanaaf dursa kennuun dirqama."
        },
        category: 'road_safety',
        level: 'high',
        corridors: 'Meskel Square · Bole Road · Ring Road Interchange',
        hotline: '991 / 011 552 4433',
        isActive: true
      });
      setEditing(null);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const deleteItem = async id => {
    try {
      await api(`/admin/alerts/${id}`, { method: 'DELETE' });
      setToast({ message: 'Alert deleted successfully.' });
      if (editing === id) resetForm();
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
    setConfirm(null);
  };

  const toggleActive = async item => {
    try {
      await api(`/admin/alerts/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !item.isActive })
      });
      setToast({ message: `Alert ${item.isActive ? 'deactivated' : 'activated'}.` });
      load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const save = async e => {
    e.preventDefault();
    if (!form.title?.en?.trim()) {
      setToast({ message: 'English alert title is required.', type: 'error' });
      return;
    }
    if (!form.message?.en?.trim()) {
      setToast({ message: 'English alert message is required.', type: 'error' });
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title,
      message: form.message,
      category: form.category,
      level: form.level || 'medium',
      corridors: form.category === 'road_safety' ? form.corridors?.trim() : undefined,
      hotline: form.category === 'road_safety' ? form.hotline?.trim() : undefined,
      isActive: form.isActive !== false
    };

    try {
      if (editing) {
        await api(`/admin/alerts/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'Alert updated successfully.' });
      } else {
        await api('/admin/alerts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'New alert published successfully.' });
      }
      resetForm();
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const filtered = items.filter(a => {
    const titleStr = typeof a.title === 'object' ? `${a.title?.en || ''} ${a.title?.am || ''} ${a.title?.om || ''}`.toLowerCase() : String(a.title || '').toLowerCase();
    const msgStr = typeof a.message === 'object' ? `${a.message?.en || ''} ${a.message?.am || ''} ${a.message?.om || ''}`.toLowerCase() : String(a.message || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q || titleStr.includes(q) || msgStr.includes(q);

    const isRoadSafety = a.category === 'road_safety' || 
      (typeof a.title === 'object' && a.title?.en?.toLowerCase().includes('traffic')) || 
      (typeof a.title === 'string' && a.title?.toLowerCase().includes('traffic'));

    const matchesCategory = categoryFilter === 'all' || 
      (categoryFilter === 'road_safety' && isRoadSafety) || 
      (categoryFilter === 'general' && !isRoadSafety);

    return matchesSearch && matchesCategory;
  });

  const titleOf = a => a?.title?.en || a?.title?.am || a?.title?.om || (typeof a?.title === 'string' ? a.title : 'Untitled Alert');

  const levelVariant = lvl => {
    if (lvl === 'critical') return 'critical';
    if (lvl === 'high') return 'danger';
    if (lvl === 'medium') return 'warning';
    return 'info';
  };

  return (
    <div className="adPanel" ref={formRef}>
      <div className="adPanelHead">
        <div>
          <h2>Public Alerts &amp; Road Safety Management</h2>
          <p>Update live traffic advisories, road safety alerts, and emergency city notices displayed across the portal and Safety &amp; Alerts page.</p>
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <Confirm {...confirm} />}

      {/* Featured Road Safety Alert Live Status Card */}
      <div
        className="adCard"
        style={{
          borderLeft: '5px solid #b21e2b',
          background: '#fff8f7',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 2px 10px rgba(178, 30, 43, 0.06)'
        }}
      >
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🚗</span>
            <small style={{ color: '#b21e2b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
              FEATURED ROAD SAFETY ALERT (DISPLAYED ON /SAFETY PAGE)
            </small>
            {roadSafetyAlert ? (
              <Badge label={roadSafetyAlert.isActive ? 'LIVE ON SITE' : 'INACTIVE'} variant={roadSafetyAlert.isActive ? 'success' : 'muted'} />
            ) : (
              <Badge label="DEFAULT NOTICE ACTIVE" variant="warning" />
            )}
            {roadSafetyAlert && (
              <Badge label={`${roadSafetyAlert.level?.toUpperCase() || 'HIGH'} SEVERITY`} variant={levelVariant(roadSafetyAlert.level)} />
            )}
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#0f172a' }}>
            {roadSafetyAlert ? titleOf(roadSafetyAlert) : 'Corridor Traffic Regulation & Road Safety Enforcement'}
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
            {roadSafetyAlert ? (roadSafetyAlert.message?.en || roadSafetyAlert.message?.am || 'Active traffic safety enforcement advisory.') : 'Active traffic safety advisory across Addis Ababa corridors. Strict enforcement of 50 km/h speed limits, mandatory yielding at pedestrian crossings, and vehicle spacing in rainy weather.'}
          </p>
          <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>📍 <b>Corridors:</b> {roadSafetyAlert?.corridors || 'Meskel Square · Bole Road · Ring Road Interchange'}</span>
            <span>🚨 <b>Hotline:</b> {roadSafetyAlert?.hotline || '991 / 011 552 4433'}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="adBtn"
            onClick={handleEditRoadSafetyClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>✏️</span>
            <span>{roadSafetyAlert ? 'Update Road Safety Alert' : 'Create Custom Road Safety Alert'}</span>
          </button>
        </div>
      </div>

      <div className="adSplit">
        {/* Form (Left side) */}
        <form className="adForm" onSubmit={save}>
          <div className="adFormHead">
            <h3>{editing ? 'Edit Alert Information' : 'New Public / Road Alert'}</h3>
            {editing && (
              <button type="button" className="adBtnGhost" onClick={resetForm}>
                ✕ Cancel Edit
              </button>
            )}
          </div>

          <div className="adFormRow">
            <label>
              Alert Category *
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="road_safety">🚗 Road Safety Alert (Featured on /safety page)</option>
                <option value="general">🔔 General Public Safety Alert</option>
              </select>
            </label>

            <label>
              Severity Level *
              <select
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              >
                {SEVERITY_LEVELS.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                ))}
              </select>
            </label>
          </div>

          <L10nInput
            label="Alert Title / Headline *"
            value={form.title}
            onChange={val => setForm(f => ({ ...f, title: val }))}
            placeholder={form.category === 'road_safety' ? 'e.g. Corridor Traffic Regulation & Road Safety Enforcement' : 'e.g. Urgent Public Security Notice'}
          />

          <L10nInput
            label="Advisory Message / Description *"
            value={form.message}
            onChange={val => setForm(f => ({ ...f, message: val }))}
            placeholder="Detailed instructions, safety rules, warnings, and citizen precautions..."
          />

          {form.category === 'road_safety' && (
            <>
              <div style={{ margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#b21e2b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🚗 Road Safety Specific Information
                </h4>
              </div>

              <label>
                Target Road Corridors &amp; Locations
                <input
                  type="text"
                  value={form.corridors}
                  onChange={e => setForm(f => ({ ...f, corridors: e.target.value }))}
                  placeholder="e.g. Meskel Square · Bole Road · Ring Road Interchange · Piassa"
                />
                <span className="adFieldHint">Displayed on the Road Safety card on the website</span>
              </label>

              <label>
                Traffic Operations Hotline
                <input
                  type="text"
                  value={form.hotline}
                  onChange={e => setForm(f => ({ ...f, hotline: e.target.value }))}
                  placeholder="e.g. 991 / 011 552 4433"
                />
              </label>
            </>
          )}

          <div style={{ marginTop: '12px' }}>
            <ToggleSwitch
              checked={form.isActive !== false}
              onChange={v => setForm(f => ({ ...f, isActive: v }))}
              label="Active Alert (Visible to Citizens)"
            />
          </div>

          <button className="adBtn adBtnFull" disabled={saving} style={{ marginTop: '16px' }}>
            {saving ? 'Saving…' : editing ? (form.category === 'road_safety' ? 'Update Road Safety Alert' : 'Update Alert') : (form.category === 'road_safety' ? 'Publish Road Safety Alert' : 'Publish Alert')}
          </button>
        </form>

        {/* Alerts List (Right side) */}
        <div className="adCard adListCard">
          <div className="adListHead">
            <div>
              <h3>All Alerts <span className="adCount">{filtered.length}</span></h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              >
                <option value="all">All Alerts</option>
                <option value="road_safety">Road Safety Alerts</option>
                <option value="general">General Alerts</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '0 0 12px 0' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter alerts by title or message…" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🔔"
              text={search || categoryFilter !== 'all' ? 'No alerts match your filter.' : 'No alerts registered yet. Create one using the form.'}
              action={search || categoryFilter !== 'all' ? { label: 'Reset Filter', onClick: () => { setSearch(''); setCategoryFilter('all'); } } : undefined}
            />
          ) : (
            filtered.map(item => {
              const isRoad = item.category === 'road_safety' || 
                (typeof item.title === 'object' && item.title?.en?.toLowerCase().includes('traffic')) || 
                (typeof item.title === 'string' && item.title?.toLowerCase().includes('traffic'));

              return (
                <article className="adListItem" key={item._id}>
                  <div className="adListItemInfo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{isRoad ? '🚗' : '🔔'}</span>
                      <b>{titleOf(item)}</b>
                      <Badge label={isRoad ? 'ROAD SAFETY' : 'GENERAL'} variant={isRoad ? 'danger' : 'info'} />
                      <Badge label={item.level?.toUpperCase() || 'MEDIUM'} variant={levelVariant(item.level)} />
                    </div>
                    <p style={{ margin: '3px 0 6px', fontSize: '13px', color: '#64748b' }}>
                      {item.message?.en || item.message?.am || 'No message content.'}
                    </p>
                    <div className="adListItemMeta" style={{ flexWrap: 'wrap', gap: '8px' }}>
                      <Badge label={item.isActive !== false ? 'Active' : 'Inactive'} variant={item.isActive !== false ? 'success' : 'muted'} />
                      {item.corridors && (
                        <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          📍 {item.corridors}
                        </span>
                      )}
                      {item.hotline && (
                        <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          🚨 {item.hotline}
                        </span>
                      )}
                      <small>Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</small>
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
                      title="Edit Alert"
                      onClick={() => editItem(item)}
                    >
                      ✎
                    </button>
                    <button
                      className="adBtnIcon adBtnIconDel"
                      title="Delete Alert"
                      onClick={() => setConfirm({
                        title: 'Delete Alert',
                        message: `Permanently delete "${titleOf(item)}"?`,
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
                  {previewItem.category === 'road_safety' ? 'TRAFFIC & ROAD SAFETY ALERT PREVIEW' : 'PUBLIC SAFETY ALERT PREVIEW'}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.3rem', color: '#0f172a' }}>
                  {titleOf(previewItem)}
                </h3>
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
              <span>⚠️ <b>Severity:</b> {previewItem.level?.toUpperCase() || 'MEDIUM'}</span>
              <span>🏷️ <b>Category:</b> {previewItem.category?.toUpperCase() || 'GENERAL'}</span>
              <span>📅 <b>Updated:</b> {new Date(previewItem.updatedAt || previewItem.createdAt).toLocaleDateString()}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#0f172a' }}>📢 Alert Message</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
                {previewItem.message?.en || 'No message content.'}
              </p>
            </div>

            {previewItem.category === 'road_safety' && (
              <div style={{ padding: '12px', background: '#fff5f5', borderRadius: '6px', border: '1px solid #fed7d7', marginBottom: '16px', fontSize: '13px' }}>
                <p style={{ margin: '0 0 6px' }}>📍 <b>Corridors:</b> {previewItem.corridors || 'Meskel Square · Bole Road · Ring Road Interchange'}</p>
                <p style={{ margin: 0 }}>🚨 <b>Traffic Hotline:</b> {previewItem.hotline || '991 / 011 552 4433'}</p>
              </div>
            )}

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

