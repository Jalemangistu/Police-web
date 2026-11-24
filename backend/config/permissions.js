/**
 * Comprehensive System Permissions Grouped by Operational Module
 * Adding a new permission is as simple as adding an entry to this array.
 */

export const MODULE_PERMISSIONS = [
  {
    module: 'users',
    moduleName: 'User Management',
    description: 'Manage staff, officer accounts, and system access',
    permissions: [
      { id: 'users.view', name: 'View Users', desc: 'Browse and search registered user accounts' },
      { id: 'users.create', name: 'Create Users', desc: 'Add new user accounts to the portal' },
      { id: 'users.edit', name: 'Edit Users', desc: 'Update user profiles and active/disabled status' },
      { id: 'users.delete', name: 'Delete Users', desc: 'Permanently remove user accounts' },
      { id: 'users.assign_role', name: 'Assign Roles', desc: 'Assign and change operational roles for users' }
    ]
  },
  {
    module: 'roles',
    moduleName: 'Role & Permission Management',
    description: 'Configure dynamic roles and access rights',
    permissions: [
      { id: 'roles.view', name: 'View Roles', desc: 'Inspect system roles and their assigned permissions' },
      { id: 'roles.create', name: 'Create Roles', desc: 'Define new custom operational roles' },
      { id: 'roles.edit', name: 'Edit Roles', desc: 'Modify role details and permission assignments' },
      { id: 'roles.delete', name: 'Delete Roles', desc: 'Delete custom roles with no assigned users' }
    ]
  },
  {
    module: 'hotlines',
    moduleName: 'Emergency Hotlines',
    description: 'Manage dynamic telephone and emergency dispatch contacts',
    permissions: [
      { id: 'hotlines.view', name: 'View Hotlines', desc: 'View emergency hotline numbers' },
      { id: 'hotlines.create', name: 'Add Hotline', desc: 'Create new emergency hotline entries' },
      { id: 'hotlines.edit', name: 'Edit Hotlines', desc: 'Update details, active status, and reorder hotlines' },
      { id: 'hotlines.delete', name: 'Delete Hotline', desc: 'Remove emergency hotline records' }
    ]
  },
  {
    module: 'alerts',
    moduleName: 'Alerts & Road Safety',
    description: 'Broadcast urgent traffic and safety advisories',
    permissions: [
      { id: 'alerts.view', name: 'View Alerts', desc: 'Read active and archived safety alerts' },
      { id: 'alerts.create', name: 'Create Alert', desc: 'Publish urgent public safety announcements' },
      { id: 'alerts.edit', name: 'Edit Alert', desc: 'Update alert severity, content, and active state' },
      { id: 'alerts.delete', name: 'Delete Alert', desc: 'Remove alerts from the portal' }
    ]
  },
  {
    module: 'news',
    moduleName: 'News & Press Releases',
    description: 'Official police announcements and media articles',
    permissions: [
      { id: 'news.view', name: 'View News', desc: 'Read draft and published news articles' },
      { id: 'news.create', name: 'Draft News', desc: 'Create new draft news releases' },
      { id: 'news.edit', name: 'Edit News', desc: 'Update news content and localized versions' },
      { id: 'news.publish', name: 'Publish News', desc: 'Directly publish news articles live to the public' },
      { id: 'news.delete', name: 'Delete News', desc: 'Delete news articles' }
    ]
  },
  {
    module: 'services',
    moduleName: 'Police Services Info',
    description: 'Procedural guidance on citizen police services',
    permissions: [
      { id: 'services.view', name: 'View Services', desc: 'View police service descriptions and fees' },
      { id: 'services.manage', name: 'Manage Services', desc: 'Create, update, and toggle police service guides' }
    ]
  },
  {
    module: 'submissions',
    moduleName: 'Citizen Submissions',
    description: 'Public contact inquiries, crime reports, and feedback',
    permissions: [
      { id: 'submissions.view', name: 'View Submissions', desc: 'Access incoming public submissions and reports' },
      { id: 'submissions.manage', name: 'Manage Submissions', desc: 'Process, respond to, and delete submissions' }
    ]
  },
  {
    module: 'stations',
    moduleName: 'Stations Directory',
    description: 'Sub-city divisions and district station directory',
    permissions: [
      { id: 'stations.view', name: 'View Stations', desc: 'View station directory records' },
      { id: 'stations.manage', name: 'Manage Stations', desc: 'Add, edit, and remove police stations' }
    ]
  },
  {
    module: 'vacancies',
    moduleName: 'Job Vacancies',
    description: 'Police recruitments and employment postings',
    permissions: [
      { id: 'vacancies.view', name: 'View Vacancies', desc: 'View career postings' },
      { id: 'vacancies.manage', name: 'Manage Vacancies', desc: 'Create, update, and remove job vacancies' }
    ]
  },
  {
    module: 'documents',
    moduleName: 'Safety Documents',
    description: 'Public procedural manuals and downloadable forms',
    permissions: [
      { id: 'documents.view', name: 'View Documents', desc: 'Browse safety documents library' },
      { id: 'documents.manage', name: 'Manage Documents', desc: 'Upload, edit, and delete safety documents' }
    ]
  },
  {
    module: 'media',
    moduleName: 'Media Library',
    description: 'Official imagery and digital media assets',
    permissions: [
      { id: 'media.view', name: 'View Media', desc: 'Browse media asset library' },
      { id: 'media.manage', name: 'Manage Media', desc: 'Upload new media files and delete existing ones' }
    ]
  },
  {
    module: 'settings',
    moduleName: 'Site Settings & Branding',
    description: 'Portal branding, emergency banners, and home page settings',
    permissions: [
      { id: 'settings.manage', name: 'Manage Settings', desc: 'Update branding, themes, and page content' }
    ]
  },
  {
    module: 'security',
    moduleName: 'Security & Audit',
    description: 'Audit logs and disaster recovery backups',
    permissions: [
      { id: 'logs.view', name: 'View Audit Logs', desc: 'Inspect platform audit trail and officer activities' },
      { id: 'backups.manage', name: 'Manage Backups', desc: 'Download system backups and restore platform state' }
    ]
  }
];

// Flat list of all valid permission strings
export const ALL_PERMISSION_KEYS = MODULE_PERMISSIONS.flatMap(m => m.permissions.map(p => p.id));

/**
 * Validate that an array of permission keys contains only recognized permissions (or wildcard '*')
 */
export const validatePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) return false;
  return permissions.every(p => p === '*' || ALL_PERMISSION_KEYS.includes(p));
};

