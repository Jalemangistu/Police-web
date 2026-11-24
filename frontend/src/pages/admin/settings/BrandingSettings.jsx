import React from 'react';
import ReactQuill from 'react-quill';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function BrandingSettings() {
  const {
    form,
    set,
    uploadLogo,
    addListItem,
    updateList,
    removeListItem
  } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <div className="adFormRow">
        <L10nInput
          label="Site name"
          value={form.siteName}
          onChange={val => set('siteName', val)}
          placeholder="Addis Ababa Police Commission"
        />
        <L10nInput
          label="Tagline"
          value={form.tagline}
          onChange={val => set('tagline', val)}
          placeholder="Service, Integrity, Protection"
        />
      </div>

      <div style={{ marginTop: '14px', marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
          Site logo
          <input
            type="file"
            accept="image/*"
            style={{ display: 'block', marginTop: '6px' }}
            onChange={e => uploadLogo(e.target.files?.[0])}
          />
        </label>
        {form.logo && (
          <div className="adImagePreview">
            <img src={form.logo} alt="Site logo preview" />
            <button
              type="button"
              className="adBtnGhost"
              onClick={() => window.confirm('Delete the current site logo?') && set('logo', '')}
            >
              Remove logo
            </button>
          </div>
        )}
        <p className="adFieldHint" style={{ marginTop: '6px' }}>
          Primary and secondary theme colors are automatically extracted from the uploaded logo.
        </p>
      </div>

      <L10nInput
        label="Footer copyright text"
        value={form.footerCopy}
        onChange={val => set('footerCopy', val)}
        placeholder="© 2026 Addis Ababa Police Commission. All rights reserved."
      />

      <div className="adDynamicHead" style={{ marginTop: '24px' }}>
        <div>
          <b>Social media links</b>
          <p className="adFieldHint">Add official social platforms and their target URLs.</p>
        </div>
        <button
          type="button"
          className="adBtnOutline"
          onClick={() => addListItem('socialLinks', { platform: '', url: '' })}
        >
          + Add link
        </button>
      </div>

      {(form.socialLinks || []).map((link, i) => (
        <div className="adDynamicItem" key={i}>
          <div className="adFormRow">
            <label>
              Platform
              <ReactQuill
                theme="snow"
                value={link.platform || ''}
                onChange={val => updateList('socialLinks', i, 'platform', val)}
                placeholder="Facebook, X (Twitter), Telegram, YouTube..."
              />
            </label>
            <label>
              URL
              <input
                type="text"
                value={link.url || ''}
                onChange={e => updateList('socialLinks', i, 'url', e.target.value)}
                placeholder="https://facebook.com/addispolice..."
              />
            </label>
          </div>
          <button
            type="button"
            className="adBtnGhost"
            style={{ marginTop: '8px' }}
            onClick={() => removeListItem('socialLinks', i, 'social link')}
          >
            Delete link
          </button>
        </div>
      ))}
    </div>
  );
}
