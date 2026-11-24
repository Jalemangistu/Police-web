import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function CommunitySettings() {
  const { form, set } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <L10nInput
        label="Page title"
        value={form.communityHeroTitle}
        onChange={val => set('communityHeroTitle', val)}
        placeholder="Community Policing & Partnerships"
      />
      <L10nInput
        label="Intro paragraph"
        value={form.communityHeroLead}
        onChange={val => set('communityHeroLead', val)}
        placeholder="Fostering mutual trust and cooperation between law enforcement and the residents of Addis Ababa."
      />
    </div>
  );
}
