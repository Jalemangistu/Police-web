import mongoose from 'mongoose';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { ALL_PERMISSION_KEYS } from '../config/permissions.js';

export const INITIAL_ROLES = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Full, unrestricted executive authority across all portal modules and security controls.',
    permissions: ['*'],
    isProtected: true,
    isActive: true
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'General system administrator managing content, hotlines, media, staff accounts, and portal settings.',
    permissions: ALL_PERMISSION_KEYS.filter(p => !p.startsWith('backups.')),
    isProtected: false,
    isActive: true
  },
  {
    name: 'Emergency Dispatcher',
    slug: 'dispatcher',
    description: 'Dedicated emergency response officer managing dynamic hotlines and urgent safety alerts.',
    permissions: [
      'hotlines.view', 'hotlines.create', 'hotlines.edit', 'hotlines.delete',
      'alerts.view', 'alerts.create', 'alerts.edit',
      'submissions.view',
      'services.view'
    ],
    isProtected: false,
    isActive: true
  },
  {
    name: 'Communications Officer',
    slug: 'communications',
    description: 'Public relations officer publishing news releases, safety campaigns, and media library assets.',
    permissions: [
      'news.view', 'news.create', 'news.edit', 'news.publish', 'news.delete',
      'media.view', 'media.manage',
      'alerts.view', 'alerts.create', 'alerts.edit',
      'services.view'
    ],
    isProtected: false,
    isActive: true
  },
  {
    name: 'Station Commander',
    slug: 'station_commander',
    description: 'District commander managing local police stations, personnel vacancies, and citizen requests.',
    permissions: [
      'stations.view', 'stations.manage',
      'vacancies.view', 'vacancies.manage',
      'submissions.view', 'submissions.manage',
      'services.view'
    ],
    isProtected: false,
    isActive: true
  },
  {
    name: 'Investigator',
    slug: 'investigator',
    description: 'Officer assigned to reviewing citizen crime reports, legal safety documents, and evidence.',
    permissions: [
      'submissions.view', 'submissions.manage',
      'documents.view', 'documents.manage',
      'services.view'
    ],
    isProtected: false,
    isActive: true
  },
  {
    name: 'Field Officer',
    slug: 'staff',
    description: 'Field officer reviewing and responding to incoming public citizen inquiries and requests.',
    permissions: [
      'submissions.view', 'submissions.manage',
      'services.view'
    ],
    isProtected: false,
    isActive: true
  },
  {
    name: 'User',
    slug: 'user',
    description: 'Standard authenticated portal account with read-only operational visibility.',
    permissions: [
      'services.view', 'news.view', 'documents.view', 'stations.view'
    ],
    isProtected: false,
    isActive: true
  }
];

export const seedInitialRoles = async () => {
  try {
    const roleMap = {};

    // 1. Ensure all initial roles exist in DB
    for (const r of INITIAL_ROLES) {
      let roleDoc = await Role.findOne({ slug: r.slug });
      if (!roleDoc) {
        roleDoc = await Role.create(r);
        console.log(`✅ Seeded role: ${r.name}`);
      } else if (r.isProtected && (!roleDoc.isProtected || !roleDoc.permissions.includes('*'))) {
        roleDoc.isProtected = true;
        roleDoc.permissions = ['*'];
        await roleDoc.save();
      }
      roleMap[r.slug] = roleDoc._id;
    }

    // 2. Migrate existing users whose role is a string or unset
    const users = await User.find();
    for (const user of users) {
      const isObjectId = mongoose.isValidObjectId(user.role);
      if (!isObjectId || typeof user.role === 'string') {
        const rawRoleStr = String(user.role || user.legacyRole || 'user').toLowerCase();
        const targetRoleId = roleMap[rawRoleStr] || roleMap['user'] || roleMap['staff'];
        if (targetRoleId) {
          user.legacyRole = rawRoleStr;
          user.role = targetRoleId;
          await user.save();
          console.log(`🔄 Migrated user ${user.email} -> Role ID: ${targetRoleId}`);
        }
      }
    }

    // 3. Ensure super_admin role is assigned to primary admin if none exists
    const superAdminRole = await Role.findOne({ slug: 'super_admin' });
    if (superAdminRole) {
      const superAdminCount = await User.countDocuments({ role: superAdminRole._id });
      if (superAdminCount === 0) {
        // Upgrade first admin user to super_admin
        const firstUser = await User.findOne().sort('createdAt');
        if (firstUser) {
          firstUser.role = superAdminRole._id;
          await firstUser.save();
          console.log(`👑 Assigned Super Admin role to: ${firstUser.email}`);
        }
      }
    }
  } catch (err) {
    console.warn('Notice: Error during role seeding/migration:', err.message);
  }
};

