import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="adToggle" title={label}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="adToggleTrack"><span className="adToggleDot" /></span>
      {label && <span className="adToggleLabel">{label}</span>}
    </label>
  );
}

export function L10nInput({ label, value, onChange, placeholder, isQuill = false }) {
  const [lang, setLang] = React.useState('en');
  const safeVal = typeof value === 'object' && value !== null
    ? value
    : { en: typeof value === 'string' && value !== '[object Object]' ? value : '', am: '', om: '' };

  const update = (newVal) => onChange({ ...safeVal, [lang]: newVal });

  return (
    <div className="adL10nField" style={{ marginBottom: '16px' }}>
      <div className="adL10nHead" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ margin: 0 }}>{label}</label>
        <div className="adL10nTabs" style={{ display: 'flex', gap: '4px' }}>
          {['en', 'am', 'om'].map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              style={{
                padding: '2px 8px',
                fontSize: '12px',
                background: lang === l ? 'var(--aap-primary, #0a2b5a)' : '#eee',
                color: lang === l ? '#fff' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {isQuill ? (
        <ReactQuill theme="snow" value={safeVal[lang] || ''} onChange={update} placeholder={placeholder} />
      ) : (
        <input
          type="text"
          value={safeVal[lang] || ''}
          onChange={e => update(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      )}
    </div>
  );
}
