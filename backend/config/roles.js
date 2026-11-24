/**
 * Centralized Role & Permission Definitions for Addis Ababa Police Portal
 * Simple, transparent, and easy to extend.
 */

export const ALL_PERMISSIONS = [
  { id: 'content:read', name: 'View Content', category: 'Content', desc: 'Read news, safety guides, and public documents.' },
  { id: 'content:write', name: 'Create/Edit Content', category: 'Content', desc: 'Draft and edit news, services, and safety alerts.' },
  { id: 'content:publish', name: 'Publish Content', category: 'Content', desc: 'Publish live articles directly to the public portal.' },
  { id: 'hotlines:manage', name: 'Emergency Hotlines', category: 'Operations', desc: 'Add, update, reorder, and activate hotline phone numbers.' },
  { id: 'alerts:manage', name: 'Emergency Alerts', category: 'Operations', desc: 'Broadcast emergency safety warnings and traffic alerts.' },
  { id: 'submissions:manage', name: 'Citizen Submissions', category: 'Operations', desc: 'Review, process, and respond to citizen incident reports.' },
  { id: 'stations:manage', name: 'Station Directory', category: 'Operations', desc: 'Manage sub-city divisions and district police stations.' },
  { id: 'vacancies:manage', name: 'Recruitment & Jobs', category: 'Operations', desc: 'Post and manage career vacancies and recruitments.' },
  { id: 'media:manage', name: 'Media Library', category: 'Media', desc: 'Upload, organize, and delete official photo and video assets.' },
  { id: 'users:manage', name: 'Manage Users', category: 'Administration', desc: 'Create, update, and deactivate portal user accounts.' },
  { id: 'users:roles', name: 'Assign Roles', category: 'Administration', desc: 'Assign and change user roles and operational permissions.' },
  { id: 'settings:manage', name: 'Portal Settings', category: 'Administration', desc: 'Configure official site branding, themes, and page content.' },
  { id: 'logs:read', name: 'Audit Logs', category: 'Security', desc: 'Inspect platform security logs and officer activity records.' },
  { id: 'backup:read', name: 'System Backups', category: 'Security', desc: 'Export platform data and perform disaster recovery backups.' },
  { id: 'analytics:read', name: 'Dashboard Analytics', category: 'Administration', desc: 'View aggregate dashboard metrics and summary counts.' }
];

export const ROLE_DEFINITIONS = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    badge: 'Executive',
    icon: '⭐',
    description: 'Full unrestricted executive authority across all portal systems, users, and security settings.',
    permissions: ['*']
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    badge: 'Administrator',
    icon: '🛡️',
    description: 'General system administrator managing content, hotlines, media, staff accounts, and portal settings.',
    permissions: [
      'content:read',
      'content:write',
      'content:publish',
      'hotlines:manage',
      'alerts:manage',
      'submissions:manage',
      'stations:manage',
      'vacancies:manage',
      'media:manage',
      'users:manage',
      'users:roles',
      'settings:manage',
      'logs:read',
      'backup:read',
      'analytics:read'
    ]
  },
  dispatcher: {
    id: 'dispatcher',
    name: 'Emergency Dispatcher',
    badge: 'Operations',
    icon: '🚨',
    description: 'Dedicated emergency response officer managing dynamic hotlines and urgent safety alerts.',
    permissions: [
      'content:read',
      'hotlines:manage',
      'alerts:manage',
      'submissions:manage'
    ]
  },
  communications: {
    id: 'communications',
    name: 'Communications / PR Officer',
    badge: 'Press & Media',
    icon: '📢',
    description: 'Public relations officer publishing official news releases, safety campaigns, and media assets.',
    permissions: [
      'content:read',
      'content:write',
      'content:publish',
      'media:manage',
      'alerts:manage'
    ]
  },
  station_commander: {
    id: 'station_commander',
    name: 'Station Commander',
    badge: 'Command',
    icon: '🏢',
    description: 'District commander managing local police stations, personnel vacancies, and citizen requests.',
    permissions: [
      'content:read',
      'stations:manage',
      'vacancies:manage',
      'submissions:manage'
    ]
  },
  investigator: {
    id: 'investigator',
    name: 'Investigator / Legal Officer',
    badge: 'Investigation',
    icon: '⚖️',
    description: 'Officer assigned to reviewing citizen crime reports, legal safety documents, and evidence.',
    permissions: [
      'content:read',
      'submissions:manage'
    ]
  },
  editor: {
    id: 'editor',
    name: 'Editor',
    badge: 'Editorial',
    icon: '✍️',
    description: 'Editorial staff with full rights to draft, edit, and publish news and procedural guidance.',
    permissions: [
      'content:read',
      'content:write',
      'content:publish',
      'media:manage'
    ]
  },
  author: {
    id: 'author',
    name: 'Author',
    badge: 'Contributor',
    icon: '📝',
    description: 'Content creator drafting news and uploading media assets for editorial approval.',
    permissions: [
      'content:read',
      'content:write',
      'media:manage'
    ]
  },
  staff: {
    id: 'staff',
    name: 'Field Officer / Staff',
    badge: 'Operations',
    icon: '👮',
    description: 'Field officer reviewing and responding to incoming public citizen inquiries and requests.',
    permissions: [
      'content:read',
      'submissions:manage'
    ]
  },
  user: {
    id: 'user',
    name: 'User',
    badge: 'Standard',
    icon: '👤',
    description: 'Standard authenticated portal account with read-only operational visibility.',
    permissions: [
      'content:read'
    ]
  }
};

export const AVAILABLE_ROLES = Object.keys(ROLE_DEFINITIONS);

/**
 * Check if a role possesses a given permission
 */
export const roleHasPermission = (role, permission) => {
  if (!role) return false;
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  if (def.permissions.includes('*')) return true;
  return def.permissions.includes(permission);
};
