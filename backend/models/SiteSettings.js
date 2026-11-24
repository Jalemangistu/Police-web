import mongoose from 'mongoose';

const L10n = (defaultEn = '') => ({ type: Object, default: { en: defaultEn, am: '', om: '' } });

const SiteSettingsSchema = new mongoose.Schema({
  _key: { type: String, default: 'singleton', unique: true },

  /* ── Branding ── */
  siteName: L10n('Addis Ababa Police'),
  logo: { type: String, default: '' },
  themeColor: { type: String, default: '#0a2b5a' },
  themePrimary: { type: String, default: '#0a2b5a' },
  themeSecondary: { type: String, default: '#c9a64a' },
  tagline: L10n('Serve • Protect • Build Trust'),
  footerCopy: L10n('© 2026 Addis Ababa Police. All rights reserved.'),
  socialLinks: [{ platform: String, url: String }],

  /* ── Emergency numbers ── */
  emergencyPolice: { type: String, default: '991' },
  emergencyAmbulance: { type: String, default: '939' },
  emergencyFire: { type: String, default: '945' },
  emergencyContacts: [{ label: String, number: String }],

  /* ── Home hero slides ── */
  heroSlides: [{
    tag: { type: Object, default: { en: '', am: '', om: '' } },
    headline: { type: Object, default: { en: '', am: '', om: '' } },
    body: { type: Object, default: { en: '', am: '', om: '' } },
    image: String,
    link: String,
    linkText: { type: Object, default: { en: '', am: '', om: '' } },
  }],

  /* ── Home city band ── */
  cityBandActive: { type: Boolean, default: true },
  cityBandBgColor: { type: String, default: '#102d49' },
  cityBandTag: L10n('CITY INFORMATION'),
  cityBandTitle: L10n('Stay prepared on the move'),
  cityBandText: L10n('Official advisories from the City of Addis Ababa and emergency services.'),
  cityBandLinkText: L10n('Safety advisories'),
  cityBandLinkUrl: { type: String, default: '/safety' },
  cityBandAdvisoriesActive: { type: Boolean, default: true },
  cityBandWeatherActive: { type: Boolean, default: true },
  cityBandWeatherCity: { type: String, default: 'Addis Ababa' },
  cityBandWeatherUnit: { type: String, enum: ['C', 'F'], default: 'C' },
  cityBandTrafficActive: { type: Boolean, default: true },
  cityBandTrafficTag: L10n('TRAFFIC NOTICE'),
  cityBandTrafficTitle: L10n('Plan your route'),
  cityBandTrafficText: L10n('Check local advisories before travelling.'),
  cityBandTrafficLinkText: L10n('View notices →'),
  cityBandTrafficLinkUrl: { type: String, default: '/safety' },
  cityBandCustomCards: [{
    active: { type: Boolean, default: true },
    icon: { type: String, default: '📌' },
    tag: { type: Object, default: { en: '', am: '', om: '' } },
    title: { type: Object, default: { en: '', am: '', om: '' } },
    text: { type: Object, default: { en: '', am: '', om: '' } },
    linkText: { type: Object, default: { en: '', am: '', om: '' } },
    linkUrl: { type: String, default: '' },
  }],

  /* ── About page ── */
  aboutHeroTitle: L10n('Committed to the safety and dignity of every resident'),
  aboutHeroLead: L10n('Addis Ababa Police works alongside the public to prevent crime, uphold the law, and build a peaceful city.'),
  aboutMission: L10n('Protect life and property, prevent crime, and deliver professional, responsive police services.'),
  aboutVision: L10n('A trusted, modern police service helping create a safe and inclusive Addis Ababa.'),
  aboutValues: L10n('Integrity, respect, accountability, service, courage, and partnership.'),
  commissionerPhoto: { type: String, default: '/commissioner.jpg' },
  commissionerName: { type: String, default: 'Demelash Gebremichael' },
  commissionerTitle: { type: String, default: 'Commissioner General' },
  commissionerMessage: L10n('"Public trust is earned through fairness, professionalism, and everyday service. We are committed to listening, responding, and working with every community."'),
  organizationalStructure: L10n('Commissioner\n↓\nDeputy Commissioners\n↓\nOperations • Investigations • Community Policing • Support Services\n↓\nSub-city & District Commands'),
  organizationChart: [{ id: String, name: String, title: String, label: String, parentId: String }],

  /* ── Services page ── */
  servicesHeroTitle: L10n('Police services, available when you need them'),
  servicesHeroLead: L10n('Access official police services. For crimes in progress and immediate danger, call 991.'),

  /* ── Safety page ── */
  safetyHeroTitle: L10n('Information that helps keep our city safe'),
  safetyHeroLead: L10n('Follow official safety notices. In an emergency, call 991 immediately.'),

  /* ── Community page ── */
  communityHeroTitle: L10n('Safer neighborhoods are built together'),
  communityHeroLead: L10n('Our community policing approach puts local relationships, listening, and shared responsibility at the centre of public safety.'),

  /* ── Contact page ── */
  contactHeroTitle: L10n('Get in touch with Addis Ababa Police'),
  contactHeroLead: L10n('Find the right channel for your request. For immediate threats to life or property, call 991.'),
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactAddress: L10n(''),

  /* ── News page ── */
  newsHeroTitle: L10n('Updates from Addis Ababa Police'),
  newsHeroLead: L10n('Official news, press releases, public notices, and media resources.'),

}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
export default SiteSettings;
