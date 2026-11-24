import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function SafetySettings() {
  const { form, set } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <L10nInput
        label="Page title"
        value={form.safetyHeroTitle}
        onChange={val => set('safetyHeroTitle', val)}
        placeholder="Public Safety & Advisories"
      />
      <L10nInput
        label="Intro paragraph"
        value={form.safetyHeroLead}
        onChange={val => set('safetyHeroLead', val)}
        placeholder="Stay alert and informed with emergency guidelines, traffic bulletins, and crime prevention tips."
      />
    </div>
  );
}
