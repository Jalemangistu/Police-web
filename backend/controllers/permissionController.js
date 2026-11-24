import mongoose from 'mongoose';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import { audit } from '../middleware/auditMiddleware.js';
import { ROLE_DEFINITIONS, AVAILABLE_ROLES } from '../config/roles.js';

/**
 * Helper to find permission by ObjectId or key
 */
const findPermission = async (idOrKey) => {
  if (!idOrKey) return null;
  if (mongoose.Types.ObjectId.isValid(idOrKey)) {
    const doc = await Permission.findById(idOrKey);
    if (doc) return doc;
  }
  return await Permission.findOne({ key: idOrKey });
};

/**
 * Get all permissions grouped/listed with available roles and categories
 */
export const getPermissions = async (req, res, next) => {
  try {
    let permissions = await Permission.find().sort('category key');

    // Auto-seed initial permissions if database collection is empty
    if (permissions.length === 0) {
      try {
        const { seedInitialPermissions } = await import('../utils/seedPermissions.js');
        await seedInitialPermissions();
        permissions = await Permission.find().sort('category key');
      } catch (seedErr) {
        console.warn('Could not auto-seed permissions:', seedErr.message);
      }
    }

    const categories = Array.from(new Set(permissions.map(p => p.category || 'General')));

    // Build unified list of roles (system + custom)
    const systemRoleEntries = Object.values(ROLE_DEFINITIONS).map(r => ({
      id: r.id,
      name: r.name,
      badge: r.badge,
      icon: r.icon,
      description: r.description
    }));

    let customRoleEntries = [];
    try {
      const customRoles = await Role.find().sort('name');
      customRoleEntries = customRoles.map(r => ({
        id: r.slug,
        name: r.name,
        badge: r.badge || 'Custom',
        icon: r.icon || '🛡️',
        description: r.description
      }));
    } catch {}

    res.json({
      permissions,
      categories,
      availableRoles: [...systemRoleEntries, ...customRoleEntries]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new permission
 */
export const createPermission = async (req, res, next) => {
  try {
    const { name, key, category = 'Operations', description = '', roles = [] } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Permission name must be at least 2 characters.' });
    }

    // Auto-generate key if not supplied: e.g. "Export Forensic Data" -> "forensic_data:export" or clean slug
    let permKey = (key || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_:-]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!permKey) {
      return res.status(400).json({ message: 'Valid permission key/code is required.' });
    }

    const existing = await Permission.findOne({ key: permKey });
    if (existing) {
      return res.status(400).json({ message: `A permission with code "${permKey}" already exists.` });
    }

    // Validate roles against both system and custom roles
    const dbRoleSlugs = await Role.find().distinct('slug');
    const allValidRoles = [...AVAILABLE_ROLES, ...dbRoleSlugs];
    const validRoles = Array.isArray(roles)
      ? roles.filter(r => allValidRoles.includes(r) && r !== 'super_admin')
      : [];

    const permission = await Permission.create({
      name: name.trim(),
      key: permKey,
      category: category.trim() || 'Operations',
      description: description.trim(),
      roles: validRoles,
      isSystem: false
    });

    // Synchronize to Role documents
    if (validRoles.length > 0) {
      await Role.updateMany(
        { slug: { $in: validRoles } },
        { $addToSet: { permissions: permKey } }
      );
    }

    await audit(req, 'create', 'permissions', permission.id, { name: permission.name, key: permission.key, roles: validRoles });
    res.status(201).json(permission);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a permission (roles, name, category, description, key)
 */
export const updatePermission = async (req, res, next) => {
  try {
    const permission = await findPermission(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found.' });
    }

    const { name, key, category, description, roles } = req.body;

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      permission.name = name.trim();
    }
    if (category !== undefined) {
      permission.category = category.trim() || 'Operations';
    }
    if (description !== undefined) {
      permission.description = description.trim();
    }

    // Allow updating key for non-system permissions
    if (key && !permission.isSystem) {
      const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9_:-]+/g, '_').replace(/^_+|_+$/g, '');
      if (cleanKey && cleanKey !== permission.key) {
        const duplicate = await Permission.findOne({ key: cleanKey, _id: { $ne: permission._id } });
        if (duplicate) {
          return res.status(400).json({ message: `Another permission with code "${cleanKey}" already exists.` });
        }
        const oldKey = permission.key;
        permission.key = cleanKey;
        // Update in Roles
        await Role.updateMany({ permissions: oldKey }, { $pull: { permissions: oldKey }, $addToSet: { permissions: cleanKey } });
      }
    }

    if (Array.isArray(roles)) {
      const dbRoleSlugs = await Role.find().distinct('slug');
      const allValidRoles = [...AVAILABLE_ROLES, ...dbRoleSlugs];
      const validRoles = roles.filter(r => allValidRoles.includes(r) && r !== 'super_admin');
      permission.roles = validRoles;

      // Synchronize to Role documents
      await Role.updateMany(
        { slug: { $in: validRoles } },
        { $addToSet: { permissions: permission.key } }
      );
      await Role.updateMany(
        { slug: { $nin: validRoles } },
        { $pull: { permissions: permission.key } }
      );
    }

    await permission.save();
    await audit(req, 'update', 'permissions', permission.id, { name: permission.name, key: permission.key, roles: permission.roles });

    res.json(permission);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a custom permission
 */
export const deletePermission = async (req, res, next) => {
  try {
    const permission = await findPermission(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found.' });
    }

    if (permission.isSystem) {
      return res.status(400).json({ message: 'Core system permissions cannot be deleted.' });
    }

    const permKey = permission.key;
    await Permission.findByIdAndDelete(permission._id);

    // Remove from all Role documents
    await Role.updateMany(
      { permissions: permKey },
      { $pull: { permissions: permKey } }
    );

    await audit(req, 'delete', 'permissions', permission._id.toString(), { name: permission.name, key: permKey });

    res.json({ message: `Permission "${permission.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
};

