import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function AboutSettings() {
  const {
    form,
    set,
    addOrgUnit,
    updateList,
    removeListItem,
    uploadCommissionerPhoto
  } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <L10nInput
        label="Page title"
        value={form.aboutHeroTitle}
        onChange={val => set('aboutHeroTitle', val)}
        placeholder="About Addis Ababa Police"
      />
      <L10nInput
        isQuill
        label="Intro paragraph"
        value={form.aboutHeroLead}
        onChange={val => set('aboutHeroLead', val)}
        placeholder="Dedicated to safeguarding our capital city through community-driven policing..."
      />

      <div className="adFormRow">
        <L10nInput
          isQuill
          label="Mission"
          value={form.aboutMission}
          onChange={val => set('aboutMission', val)}
        />
        <L10nInput
          isQuill
          label="Vision"
          value={form.aboutVision}
          onChange={val => set('aboutVision', val)}
        />
      </div>

      <L10nInput
        isQuill
        label="Values"
        value={form.aboutValues}
        onChange={val => set('aboutValues', val)}
      />

      {/* ── Commissioner section ── */}
      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <b style={{ fontSize: '14px', color: '#1e293b' }}>Commissioner</b>
        <p className="adFieldHint" style={{ marginTop: '4px', marginBottom: '16px' }}>
          The commissioner&rsquo;s photo, name, and title are shown on the public About page alongside their message.
        </p>

        {/* Photo upload + preview */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ flex: '0 0 auto' }}>
            {form.commissionerPhoto ? (
              <div className="adCommissionerPhotoWrap">
                <img
                  src={form.commissionerPhoto}
                  alt="Commissioner photo preview"
                  className="adCommissionerPhoto"
                />
                <button
                  type="button"
                  className="adBtnGhost"
                  style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#dc2626' }}
                  onClick={() => window.confirm('Remove the commissioner photo?') && set('commissionerPhoto', '')}
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <div className="adCommissionerPhotoPlaceholder">
                <span style={{ fontSize: '36px' }}>👤</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>No photo</span>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Upload photo file
              <input
                type="file"
                accept="image/*"
                style={{ display: 'block', marginTop: '6px' }}
                onChange={e => uploadCommissionerPhoto(e.target.files?.[0])}
              />
            </label>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginTop: '10px', marginBottom: '6px' }}>
              Or photo URL / path
              <input
                type="text"
                value={form.commissionerPhoto || ''}
                onChange={e => set('commissionerPhoto', e.target.value)}
                placeholder="/commissioner.jpg or https://example.com/photo.jpg"
                style={{ display: 'block', width: '100%', marginTop: '4px' }}
              />
            </label>
            <p className="adFieldHint" style={{ marginTop: '6px' }}>Upload an image file (JPG, PNG, WebP) or enter an image URL / hosted path.</p>
          </div>
        </div>

        {/* Name & Title */}
        <div className="adFormRow">
          <label>
            Commissioner&rsquo;s name
            <input
              type="text"
              value={form.commissionerName || ''}
              onChange={e => set('commissionerName', e.target.value)}
              placeholder="e.g. Kibrom Woldemariam"
            />
          </label>
          <label>
            Title / rank
            <input
              type="text"
              value={form.commissionerTitle || ''}
              onChange={e => set('commissionerTitle', e.target.value)}
              placeholder="e.g. Commissioner General"
            />
          </label>
        </div>

        <L10nInput
          isQuill
          label="Commissioner's message"
          value={form.commissionerMessage}
          onChange={val => set('commissionerMessage', val)}
        />
      </div>

      {/* ── Organizational structure ── */}
      <div className="adDynamicHead" style={{ marginTop: '28px' }}>
        <div>
          <b>Organizational structure</b>
          <p className="adFieldHint">
            Create department hierarchy by selecting a parent for each role. Leave Parent blank for top-level leadership.
          </p>
        </div>
        <button
          type="button"
          className="adBtnOutline"
          onClick={addOrgUnit}
        >
          + Add role or team
        </button>
      </div>

      {(form.organizationChart || []).map((unit, i) => (
        <div className="adDynamicItem" key={unit.id || i}>
          <div className="adFormRow">
            <label>
              Name
              <input
                type="text"
                value={unit.name || unit.label || ''}
                onChange={e => updateList('organizationChart', i, 'name', e.target.value)}
                placeholder="e.g. Crime Prevention Directorate"
              />
            </label>
            <label>
              Title / position
              <input
                type="text"
                value={unit.title || ''}
                onChange={e => updateList('organizationChart', i, 'title', e.target.value)}
                placeholder="e.g. Deputy Commissioner"
              />
            </label>
          </div>
          <label style={{ display: 'block', margin: '8px 0 10px' }}>
            Parent role
            <select
              value={unit.parentId || ''}
              onChange={e => updateList('organizationChart', i, 'parentId', e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '5px' }}
            >
              <option value="">Top-level role</option>
              {(form.organizationChart || [])
                .filter((other, otherIndex) => otherIndex !== i && other.id)
                .map(other => (
                  <option key={other.id} value={other.id}>
                    {other.title
                      ? `${other.name || other.label || 'Unnamed'} — ${other.title}`
                      : other.name || other.label || 'Unnamed'}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            className="adBtnGhost"
            onClick={() => removeListItem('organizationChart', i, 'organization role')}
          >
            Delete role
          </button>
        </div>
      ))}
    </div>
  );
}
