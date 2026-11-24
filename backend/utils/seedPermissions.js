import Permission from '../models/Permission.js';
import User from '../models/User.js';
import { ALL_PERMISSIONS, ROLE_DEFINITIONS } from '../config/roles.js';

export const seedInitialPermissions = async () => {
  try {
    // 1. Migrate users whose role field was stored as ObjectId back to role string
    const users = await User.find();
    for (const u of users) {
      if (u.role && typeof u.role === 'object' && u.role.toString) {
        // Was ObjectId
        const legacy = u.legacyRole || (u.email === 'superadmin@police.gov.et' ? 'super_admin' : 'admin');
        u.role = legacy;
        await User.updateOne({ _id: u._id }, { $set: { role: legacy } });
      } else if (!u.role || typeof u.role !== 'string') {
        const fallback = u.legacyRole || (u.email === 'superadmin@police.gov.et' ? 'super_admin' : 'user');
        await User.updateOne({ _id: u._id }, { $set: { role: fallback } });
      }
    }

    // 2. Upsert all system permissions so new additions (e.g. analytics:read) are always present
    for (const p of ALL_PERMISSIONS) {
      const assignedRoles = [];
      for (const [roleKey, def] of Object.entries(ROLE_DEFINITIONS)) {
        if (roleKey === 'super_admin') continue; // Super admin has wildcard access
        if (def.permissions?.includes(p.id) || def.permissions?.includes('*')) {
          assignedRoles.push(roleKey);
        }
      }

      await Permission.updateOne(
        { key: p.id },
        {
          $setOnInsert: {
            key: p.id,
            name: p.name,
            category: p.category || 'Operations',
            description: p.desc || '',
            isSystem: true
          },
          $addToSet: { roles: { $each: assignedRoles } }
        },
        { upsert: true }
      );
    }

    console.log(`✅ System permissions synchronized (${ALL_PERMISSIONS.length} defined).`);
  } catch (err) {
    console.warn('Notice: Could not seed permissions:', err.message);
  }
};
