import mongoose from 'mongoose';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import { ROLE_DEFINITIONS } from '../config/roles.js';
import { MODULE_PERMISSIONS, ALL_PERMISSION_KEYS, validatePermissions } from '../config/permissions.js';
import { audit } from '../middleware/auditMiddleware.js';

/**
 * Get all roles with live user count (unifies built-in system roles and custom database roles)
 */
export const getRoles = async (_, res, next) => {
  try {
    const dbRoles = await Role.find().sort('createdAt');
    const dbSlugs = new Set(dbRoles.map(r => r.slug));

    // Built-in system roles from ROLE_DEFINITIONS (preserve all existing functionality)
    const systemRoles = await Promise.all(
      Object.values(ROLE_DEFINITIONS)
        .filter(def => !dbSlugs.has(def.id))
        .map(async (def) => {
          const userCount = await User.countDocuments({
            $or: [{ role: def.id }, { role: def.name }]
          });
          return {
            _id: 'sys_' + def.id,
            id: def.id,
            slug: def.id,
            name: def.name,
            badge: def.badge,
            icon: def.icon,
            description: def.description,
            permissions: def.permissions,
            isProtected: def.id === 'super_admin',
            isSystem: true,
            isActive: true,
            userCount
          };
        })
    );

    // Custom roles from database
    const customRoles = await Promise.all(
      dbRoles.map(async (r) => {
        const userCount = await User.countDocuments({
          $or: [{ role: r.slug }, { role: r._id.toString() }, { role: r.name }]
        });
        const obj = r.toObject();
        obj.id = r.slug;
        obj.isSystem = !!r.isProtected;
        obj.userCount = userCount;
        return obj;
      })
    );

    res.json([...systemRoles, ...customRoles]);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all available permissions grouped by module
 */
export const getPermissions = async (_, res) => {
  res.json({
    modules: MODULE_PERMISSIONS,
    allKeys: ALL_PERMISSION_KEYS
  });
};

/**
 * Create a new dynamic custom role
 * Prevents privilege escalation: non-super-admins cannot grant permissions they do not possess.
 */
export const createRole = async (req, res, next) => {
  try {
    const { name, slug, description = '', icon = '🛡️', badge = 'Custom', permissions = [], isActive = true } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Role name must be at least 2 characters.' });
    }

    const trimmedName = name.trim();

    // Auto-generate clean slug from name if not provided
    let finalSlug = (slug || trimmedName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!finalSlug) {
      return res.status(400).json({ message: 'A valid role identifier (slug) is required.' });
    }

    // Check conflict with system roles
    if (ROLE_DEFINITIONS[finalSlug]) {
      return res.status(400).json({ message: `Role code "${finalSlug}" is reserved for system roles.` });
    }

    // Check conflict with existing database roles
    const existing = await Role.findOne({
      $or: [
        { slug: finalSlug },
        { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({ message: `A role with name "${trimmedName}" or code "${finalSlug}" already exists.` });
    }

    // Privilege escalation prevention:
    // If not super admin, cannot grant wildcard '*' or permissions they don't personally have
    if (!req.user.isSuperAdmin) {
      if (permissions.includes('*')) {
        return res.status(403).json({ message: 'Privilege escalation prevented: Only Super Admins can create roles with wildcard (*) permissions.' });
      }
      const disallowed = permissions.filter(p => !req.user.permissions.includes(p));
      if (disallowed.length > 0) {
        return res.status(403).json({
          message: `Privilege escalation prevented: You cannot grant permissions you do not possess (${disallowed.join(', ')}).`
        });
      }
    }

    const role = await Role.create({
      name: trimmedName,
      slug: finalSlug,
      description: description.trim(),
      icon: (icon && icon.trim()) || '🛡️',
      badge: (badge && badge.trim()) || 'Custom',
      permissions: Array.isArray(permissions) ? permissions : [],
      isProtected: false,
      isActive: !!isActive
    });

    await audit(req, 'create', 'roles', role.id, { name: role.name, slug: role.slug, permissions: role.permissions });

    const obj = role.toObject();
    obj.id = role.slug;
    obj.userCount = 0;
    obj.isSystem = false;
    res.status(201).json(obj);
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing custom role
 * Protects system/protected roles and prevents privilege escalation.
 */
export const updateRole = async (req, res, next) => {
  try {
    const { name, description, icon, badge, permissions, isActive } = req.body;

    let role;
    if (req.params.id.startsWith('sys_')) {
      const slug = req.params.id.replace('sys_', '');
      const def = ROLE_DEFINITIONS[slug];
      if (!def) {
        return res.status(404).json({ message: 'Role not found.' });
      }
      role = await Role.findOne({ slug });
      if (!role) {
        role = await Role.create({
          name: def.name,
          slug,
          description: def.description || '',
          permissions: Array.isArray(permissions) ? permissions : (def.permissions || []),
          isProtected: slug === 'super_admin',
          isActive: true
        });
      }
    } else if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      role = await Role.findById(req.params.id);
    } else {
      role = await Role.findOne({ slug: req.params.id });
    }

    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    // Protection check for protected roles (e.g. Super Admin)
    if (role.isProtected || role.slug === 'super_admin') {
      if (name && name.trim().toLowerCase() !== role.name.toLowerCase()) {
        return res.status(403).json({ message: 'The Super Admin role cannot be renamed.' });
      }
      if (isActive === false) {
        return res.status(403).json({ message: 'The Super Admin role cannot be deactivated.' });
      }
      if (permissions && !permissions.includes('*')) {
        return res.status(403).json({ message: 'The Super Admin role must retain full wildcard (*) permissions.' });
      }
    }

    // Privilege escalation prevention
    if (permissions && !req.user.isSuperAdmin) {
      if (permissions.includes('*')) {
        return res.status(403).json({ message: 'Privilege escalation prevented: Only Super Admins can grant wildcard (*) permissions.' });
      }
      const disallowed = permissions.filter(p => !req.user.permissions.includes(p));
      if (disallowed.length > 0) {
        return res.status(403).json({
          message: `Privilege escalation prevented: You cannot grant permissions you do not possess (${disallowed.join(', ')}).`
        });
      }
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const duplicate = await Role.findOne({
        _id: { $ne: role._id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      if (duplicate) {
        return res.status(400).json({ message: `Another role named "${trimmedName}" already exists.` });
      }
      role.name = trimmedName;
    }

    if (description !== undefined) role.description = description.trim();
    if (icon !== undefined) role.icon = (icon && icon.trim()) || '🛡️';
    if (badge !== undefined) role.badge = (badge && badge.trim()) || 'Custom';
    if (permissions && Array.isArray(permissions)) {
      role.permissions = permissions;
      try {
        await Permission.updateMany({ key: { $in: permissions } }, { $addToSet: { roles: role.slug } });
        await Permission.updateMany({ key: { $nin: permissions } }, { $pull: { roles: role.slug } });
      } catch (syncErr) {
        console.warn('Sync permissions notice:', syncErr.message);
      }
    }
    if (isActive !== undefined && !role.isProtected) {
      role.isActive = !!isActive;
    }

    await role.save();
    await audit(req, 'update', 'roles', role.id, { name: role.name, permissions: role.permissions, isActive: role.isActive });

    const obj = role.toObject();
    obj.id = role.slug;
    obj.userCount = await User.countDocuments({
      $or: [{ role: role.slug }, { role: role._id.toString() }, { role: role.name }]
    });
    res.json(obj);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a custom role
 * Prevents deleting built-in/protected roles and roles currently assigned to users.
 */
export const deleteRole = async (req, res, next) => {
  try {
    if (req.params.id.startsWith('sys_')) {
      return res.status(403).json({ message: 'Built-in system roles cannot be deleted.' });
    }

    let role = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      role = await Role.findById(req.params.id);
    }
    if (!role) {
      role = await Role.findOne({ slug: req.params.id });
    }
    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    if (role.isProtected || role.isSystem || ROLE_DEFINITIONS[role.slug]) {
      return res.status(403).json({ message: 'Default system roles cannot be deleted.' });
    }

    // Check for assigned users
    const userCount = await User.countDocuments({
      $or: [{ role: role.slug }, { role: role._id.toString() }, { role: role.name }]
    });

    const reassignTo = req.query.reassignTo || req.body?.reassignTo;

    if (userCount > 0) {
      if (reassignTo) {
        await User.updateMany(
          { $or: [{ role: role.slug }, { role: role._id.toString() }, { role: role.name }] },
          { $set: { role: reassignTo } }
        );
      } else {
        return res.status(400).json({
          message: `Cannot delete role "${role.name}" because it is currently assigned to ${userCount} user(s). Please choose a replacement role to transfer them to.`,
          userCount
        });
      }
    }

    await Role.findByIdAndDelete(role._id);
    await audit(req, 'delete', 'roles', role._id.toString(), { name: role.name, slug: role.slug, reassignedTo: reassignTo || null });
    res.status(200).json({ message: `Role "${role.name}" deleted successfully.`, reassignedTo: reassignTo || null });
  } catch (err) {
    next(err);
  }
};
