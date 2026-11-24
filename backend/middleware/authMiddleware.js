import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import { ROLE_DEFINITIONS } from '../config/roles.js';

/**
 * Authentication Middleware:
 * Verifies JWT token, populates the live user from DB, checks session revocation,
 * and dynamically resolves role permissions from the database.
 */
export const auth = async (req, res, next) => {
  try {
    const rawHeader = req.headers.authorization;
    if (!rawHeader || !rawHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const token = rawHeader.replace('Bearer ', '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated or does not exist.' });
    }

    // Invalidate old sessions if password changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ message: 'Password was recently updated. Please log in again.' });
      }
    }

    const roleKey = typeof user.role === 'string' ? user.role : (user.legacyRole || 'user');
    const isSuperAdmin = roleKey === 'super_admin';
    let roleDef = ROLE_DEFINITIONS[roleKey];

    if (!roleDef) {
      try {
        const customRole = await Role.findOne({ slug: roleKey });
        if (customRole) {
          roleDef = {
            name: customRole.name,
            badge: customRole.badge || 'Custom',
            icon: customRole.icon || '🛡️',
            permissions: customRole.permissions || []
          };
        }
      } catch {
        // fallback
      }
    }
    if (!roleDef) {
      roleDef = ROLE_DEFINITIONS.user;
    }

    let permissions = [];
    if (isSuperAdmin) {
      permissions = ['*'];
    } else {
      try {
        const dbPerms = await Permission.find({ roles: roleKey }).distinct('key');
        const basePerms = roleDef.permissions || [];
        permissions = Array.from(new Set([...basePerms, ...dbPerms]));
      } catch {
        permissions = roleDef.permissions || [];
      }
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: roleKey,
      roleName: roleDef.name,
      roleBadge: roleDef.badge,
      permissions,
      isSuperAdmin
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
};

/**
 * Check if the user has a specific permission (or wildcard '*')
 */
export const authorize = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.isSuperAdmin || req.user.permissions.includes('*') || req.user.permissions.includes(permission)) {
    return next();
  }

  return res.status(403).json({
    message: `Access denied: You do not possess the required permission "${permission}".`
  });
};

/**
 * Check if the user has at least one of the provided permissions
 */
export const requireAnyPermission = (permissions = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.isSuperAdmin || req.user.permissions.includes('*')) {
    return next();
  }

  const hasAny = permissions.some(p => req.user.permissions.includes(p));
  if (hasAny) {
    return next();
  }

  return res.status(403).json({
    message: 'Access denied: You do not have permission for this section.'
  });
};
