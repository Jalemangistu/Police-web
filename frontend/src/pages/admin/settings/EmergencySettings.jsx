import React from 'react';
import { useSiteSettings } from '../../../context/SiteSettingsContext';

export default function EmergencySettings() {
  const {
    form,
    set,
    addListItem,
    updateList,
    removeListItem
  } = useSiteSettings();

  return (
    <div className="adSettingsSection">
      <div className="adFormRow">
        <label>
          Police emergency
          <input
            type="text"
            value={form.emergencyPolice || ''}
            onChange={e => set('emergencyPolice', e.target.value)}
            placeholder="991"
          />
        </label>
        <label>
          Ambulance
          <input
            type="text"
            value={form.emergencyAmbulance || ''}
            onChange={e => set('emergencyAmbulance', e.target.value)}
            placeholder="907"
          />
        </label>
        <label>
          Fire &amp; Rescue
          <input
            type="text"
            value={form.emergencyFire || ''}
            onChange={e => set('emergencyFire', e.target.value)}
            placeholder="939"
          />
        </label>
      </div>

      <div className="adDynamicHead" style={{ marginTop: '28px' }}>
        <div>
          <b>Additional emergency contacts</b>
          <p className="adFieldHint">Direct contacts for specialized dispatch and regional hotlines.</p>
        </div>
        <button
          type="button"
          className="adBtnOutline"
          onClick={() => addListItem('emergencyContacts', { label: '', number: '' })}
        >
          + Add contact
        </button>
      </div>

      {(form.emergencyContacts || []).map((contact, i) => (
        <div className="adDynamicItem" key={i}>
          <div className="adFormRow">
            <label>
              Label
              <input
                type="text"
                value={contact.label || ''}
                onChange={e => updateList('emergencyContacts', i, 'label', e.target.value)}
                placeholder="Traffic Police Hotline"
              />
            </label>
            <label>
              Number
              <input
                type="text"
                value={contact.number || ''}
                onChange={e => updateList('emergencyContacts', i, 'number', e.target.value)}
                placeholder="011 662 0000"
              />
            </label>
          </div>
          <button
            type="button"
            className="adBtnGhost"
            style={{ marginTop: '6px' }}
            onClick={() => removeListItem('emergencyContacts', i, 'emergency contact')}
          >
            Delete contact
          </button>
        </div>
      ))}
    </div>
  );
}
