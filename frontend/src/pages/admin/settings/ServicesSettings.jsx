import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function ServicesSettings() {
  const { form, set } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <L10nInput
        label="Page title"
        value={form.servicesHeroTitle}
        onChange={val => set('servicesHeroTitle', val)}
        placeholder="Police & Public Services"
      />
      <L10nInput
        isQuill
        label="Intro paragraph"
        value={form.servicesHeroLead}
        onChange={val => set('servicesHeroLead', val)}
        placeholder="Access online police reports, clearance certificates, traffic permits, and lost property services..."
      />
    </div>
  );
}
