import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { L10nInput } from '../../../components/admin/AdminControls';

export default function NewsSettings() {
  const { form, set } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <L10nInput
        label="Page title"
        value={form.newsHeroTitle}
        onChange={val => set('newsHeroTitle', val)}
        placeholder="Police News & Press Releases"
      />
      <L10nInput
        isQuill
        label="Intro paragraph"
        value={form.newsHeroLead}
        onChange={val => set('newsHeroLead', val)}
        placeholder="Official briefings, announcements, and updates from the Addis Ababa Police Commission."
      />
    </div>
  );
}
