import BrandingSettings from './BrandingSettings';
import EmergencySettings from './EmergencySettings';
import HeroSettings from './HeroSettings';
import AboutSettings from './AboutSettings';
import ServicesSettings from './ServicesSettings';
import SafetySettings from './SafetySettings';
import CommunitySettings from './CommunitySettings';
import ContactSettings from './ContactSettings';
import NewsSettings from './NewsSettings';

export const SITE_SETTINGS_SECTIONS = [
  {
    id: 'branding',
    path: '/admin/site-settings/branding',
    name: 'Branding & Footer',
    icon: '🏛',
    description: 'Manage website logo, colors, branding identity, footer copyright, and social links.',
    sectionKey: 'branding',
    deletable: true,
    component: BrandingSettings
  },
  {
    id: 'emergency-numbers',
    path: '/admin/site-settings/emergency-numbers',
    name: 'Emergency Numbers',
    icon: '🚨',
    description: 'Configure direct hotline numbers for police, ambulance, fire, and custom emergency contacts.',
    sectionKey: 'emergency',
    deletable: true,
    component: EmergencySettings
  },
  {
    id: 'home-hero-slides',
    path: '/admin/site-settings/home-hero-slides',
    name: 'Home — Hero Slides',
    icon: '🏠',
    description: 'Customise homepage hero carousel slides, headlines, supporting copy, and links.',
    sectionKey: 'hero',
    deletable: true,
    component: HeroSettings
  },
  {
    id: 'about',
    path: '/admin/site-settings/about',
    name: 'About Page',
    icon: 'ℹ',
    description: 'Update department mission, vision, core values, commissioner message, and organizational hierarchy.',
    sectionKey: 'about',
    deletable: true,
    component: AboutSettings
  },
  {
    id: 'services',
    path: '/admin/site-settings/services',
    name: 'Services Page',
    icon: '⚙',
    description: 'Configure public services directory header title and introductory copy.',
    sectionKey: null,
    deletable: false,
    component: ServicesSettings
  },
  {
    id: 'safety-alerts',
    path: '/admin/site-settings/safety-alerts',
    name: 'Safety & Alerts Page',
    icon: '⚠',
    description: 'Configure public crime prevention, community safety guides, and alert banner introduction.',
    sectionKey: null,
    deletable: false,
    component: SafetySettings
  },
  {
    id: 'community',
    path: '/admin/site-settings/community',
    name: 'Community Page',
    icon: '🤝',
    description: 'Manage community policing programs, youth outreach, and neighborhood partnership introduction.',
    sectionKey: null,
    deletable: false,
    component: CommunitySettings
  },
  {
    id: 'contact',
    path: '/admin/site-settings/contact',
    name: 'Contact Page',
    icon: '📞',
    description: 'Update official contact information, headquarters address, phone numbers, and public email.',
    sectionKey: null,
    deletable: false,
    component: ContactSettings
  },
  {
    id: 'news',
    path: '/admin/site-settings/news',
    name: 'News Page',
    icon: '📰',
    description: 'Configure public press releases and news center headline and intro paragraph.',
    sectionKey: null,
    deletable: false,
    component: NewsSettings
  }
];

export const DEFAULT_SETTINGS_SECTION = SITE_SETTINGS_SECTIONS[0];
