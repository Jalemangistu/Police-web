import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function ContactSettings() {
  const { form, set } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <L10nInput
        label="Page title"
        value={form.contactHeroTitle}
        onChange={val => set('contactHeroTitle', val)}
        placeholder="Contact Addis Ababa Police"
      />
      <L10nInput
        label="Intro paragraph"
        value={form.contactHeroLead}
        onChange={val => set('contactHeroLead', val)}
        placeholder="Reach out to headquarters, divisional bureaus, or our 24/7 public inquiry hotlines."
      />

      <div className="adFormRow">
        <label>
          Contact email
          <input
            type="email"
            value={form.contactEmail || ''}
            onChange={e => set('contactEmail', e.target.value)}
            placeholder="info@aap.gov.et"
          />
        </label>
        <label>
          Contact phone
          <input
            type="text"
            value={form.contactPhone || ''}
            onChange={e => set('contactPhone', e.target.value)}
            placeholder="+251 11 XXX XXXX"
          />
        </label>
      </div>

      <label style={{ display: 'block', margin: '14px 0' }}>
        Office address
        <input
          type="text"
          value={form.contactAddress || ''}
          onChange={e => set('contactAddress', e.target.value)}
          placeholder="Addis Ababa Police Headquarters, Churchill Avenue, Addis Ababa, Ethiopia"
        />
      </label>
    </div>
  );
}
