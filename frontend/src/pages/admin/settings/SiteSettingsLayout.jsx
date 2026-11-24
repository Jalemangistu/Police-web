import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { SITE_SETTINGS_SECTIONS, DEFAULT_SETTINGS_SECTION } from './siteSettingsConfig';

function Toast({ message, type = 'success', onDone }) {
  React.useEffect(() => {
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

export default function SiteSettingsLayout() {
  const location = useLocation();
  const {
    loading,
    saving,
    toast,
    setToast,
    isDirty,
    save,
    deleteSection
  } = useSiteSettings();

  // Redirect /admin/site-settings directly to /admin/site-settings/branding
  if (location.pathname === '/admin/site-settings' || location.pathname === '/admin/site-settings/') {
    return <Navigate to="/admin/site-settings/branding" replace />;
  }

  // Find matching section config
  const currentSection = SITE_SETTINGS_SECTIONS.find(
    s => location.pathname === s.path || location.pathname.startsWith(`${s.path}/`)
  ) || DEFAULT_SETTINGS_SECTION;

  const Component = currentSection.component;

  if (loading) {
    return (
      <div className="adEmpty">
        <span className="adEmptyIcon">⚙</span>
        <p>Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="adPanel">
      {/* ── Section Header ── */}
      <div className="adPanelHead">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2>{currentSection.name}</h2>
            {isDirty && (
              <span className="adUnsavedBadge" title="You have edited settings that are not saved yet">
                <span className="adUnsavedDot" /> Unsaved changes
              </span>
            )}
          </div>
          <p>{currentSection.description}</p>
        </div>

        {currentSection.deletable && currentSection.sectionKey && (
          <button
            type="button"
            className="adBtnGhost"
            style={{ color: '#dc2626' }}
            onClick={() => deleteSection(currentSection.sectionKey)}
          >
            Clear section
          </button>
        )}
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      {/* ── Content Card (without accordion wrapper) ── */}
      <form onSubmit={save} className="adCard adSettingsCard">
        <Component />

        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" className="adBtn" disabled={saving}>
            {saving ? 'Saving…' : '💾 Save all changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
