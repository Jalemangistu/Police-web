import News from '../models/News.js';
import Service from '../models/Service.js';
import Alert from '../models/Alert.js';
import ServiceRequest from '../models/ServiceRequest.js';
import RecruitmentApplication from '../models/RecruitmentApplication.js';
import CommunityRegistration from '../models/CommunityRegistration.js';
import ContactMessage from '../models/ContactMessage.js';
import User from '../models/User.js';
import MediaAsset from '../models/MediaAsset.js';
import Page from '../models/Page.js';
import AuditLog from '../models/AuditLog.js';
import Vacancy from '../models/Vacancy.js';
import Hotline from '../models/Hotline.js';
import Role from '../models/Role.js';
import { ROLE_DEFINITIONS, AVAILABLE_ROLES } from '../config/roles.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { audit } from '../middleware/auditMiddleware.js';
import { clean } from '../utils/authUtils.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import { sendAccountSetupEmail } from '../utils/emailService.js';

export const createGenericController = (Model, pathName) => ({
  getAll: async (_, res, next) => {
    try {
      res.json(await Model.find().sort('-createdAt'));
    } catch (err) {
      next(err);
    }
  },
  create: async (req, res, next) => {
    try {
      if (req.user?.role === 'author' && pathName === 'news') req.body.status = 'draft';
      const doc = await Model.create(req.body);
      await audit(req, 'create', pathName, doc.id, req.body);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },
  update: async (req, res, next) => {
    try {
      if (req.user?.role === 'author' && pathName === 'news') req.body.status = 'draft';
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (doc) await audit(req, 'update', pathName, doc.id, req.body);
      doc ? res.json(doc) : res.status(404).json({ message: 'Not found.' });
    } catch (err) {
      next(err);
    }
  },
  delete: async (req, res, next) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      await audit(req, 'delete', pathName, req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
});

export const getRequests = async (_, res) => res.json({ 
  contactMessages: await ContactMessage.find().sort('-createdAt'),
  recruitmentApplications: await RecruitmentApplication.find().sort('-createdAt'),
  communityRegistrations: await CommunityRegistration.find().sort('-createdAt')
});

export const getUsers = async (_, res) => {
  const users = await User.find().sort('name');
  const customRolesMap = {};
  try {
    const customRoles = await Role.find();
    customRoles.forEach(r => {
      customRolesMap[r.slug] = r;
    });
  } catch {}

  res.json(users.map(u => {
    const item = clean(u);
    const roleKey = typeof u.role === 'string' ? u.role : (u.legacyRole || 'user');
    const customRole = customRolesMap[roleKey];
    const roleDef = ROLE_DEFINITIONS[roleKey] || (customRole ? {
      name: customRole.name,
      badge: customRole.badge || 'Custom',
      icon: customRole.icon || '🛡️',
      permissions: customRole.permissions || []
    } : ROLE_DEFINITIONS.user);

    item.role = roleKey;
    item.roleName = roleDef.name;
    item.roleBadge = roleDef.badge;
    item.roleIcon = roleDef.icon;
    item.isProtectedRole = roleKey === 'super_admin';
    item.rolePermissions = roleDef.permissions;
    return item;
  }));
};

export const createUser = async (req, res) => { 
  const { name, email, password, role = 'user' } = req.body; 

  if (!name || !email) {
    return res.status(400).json({ message: 'Full name and email are required.' }); 
  }

  let finalPassword = password;
  if (!finalPassword || typeof finalPassword !== 'string' || !finalPassword.trim()) {
    // Auto-generate strong secure temporary password for invite flow
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    finalPassword = `Invite!${suffix}2026#`;
  } else {
    // Strong password policy check if manual password supplied
    const passwordCheck = validatePassword(finalPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'Password does not meet the security policy requirements.',
        errors: passwordCheck.errors
      });
    }
  }

  let roleKey = 'user';
  let roleDef = ROLE_DEFINITIONS.user;

  if (AVAILABLE_ROLES.includes(role)) {
    roleKey = role;
    roleDef = ROLE_DEFINITIONS[roleKey];
  } else {
    const customRole = await Role.findOne({ slug: role });
    if (customRole) {
      roleKey = customRole.slug;
      roleDef = {
        name: customRole.name,
        badge: customRole.badge || 'Custom',
        icon: customRole.icon || '🛡️',
        permissions: customRole.permissions || []
      };
    }
  }

  // Privilege escalation check: only Super Admins can assign the Super Admin role
  if (roleKey === 'super_admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Privilege escalation prevented: Only Super Admins can assign the Super Admin role.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(400).json({ message: 'A user with this email address already exists.' });
  }

  // Generate secure invite / setup token (expires in 24 hours)
  const rawInviteToken = crypto.randomBytes(32).toString('hex');
  const hashedInviteToken = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
  const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({ 
    name: name.trim(), 
    email: email.toLowerCase().trim(), 
    password: await bcrypt.hash(finalPassword, 12), 
    role: roleKey,
    resetPasswordToken: hashedInviteToken,
    resetPasswordExpires: inviteExpires
  }); 

  // Send account invite email
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const setupURL = `${clientUrl}/admin/reset-password/${rawInviteToken}`;

  try {
    await sendAccountSetupEmail({
      email: user.email,
      name: user.name,
      role: roleDef.name || roleKey,
      setupUrl: setupURL,
      expiresInHours: 24
    });
  } catch (emailErr) {
    console.error('[AdminController] Error dispatching user invite email:', emailErr.message);
  }

  await audit(req, 'create', 'users', user.id, { name: user.name, email: user.email, role: roleDef.name }); 
  const cleaned = clean(user);
  cleaned.role = roleKey;
  cleaned.roleName = roleDef.name;
  cleaned.roleBadge = roleDef.badge;
  cleaned.isProtectedRole = roleKey === 'super_admin';
  res.status(201).json(cleaned); 
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    const isSelf = req.params.id === req.user.id;
    const isTargetSuper = targetUser.role === 'super_admin';

    if (isTargetSuper && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'You do not have permission to modify a Super Administrator account.' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      targetUser.name = name.trim();
    }

    if (role !== undefined) {
      if (isSelf && role !== targetUser.role) {
        return res.status(403).json({ message: 'Privilege escalation prevented: You cannot modify your own role.' });
      }
      let roleKey = AVAILABLE_ROLES.includes(role) ? role : null;
      if (!roleKey) {
        const customRole = await Role.findOne({ slug: role });
        if (customRole) roleKey = customRole.slug;
      }
      if (!roleKey) {
        return res.status(400).json({ message: 'Invalid operational role selected.' });
      }
      if (roleKey === 'super_admin' && !req.user.isSuperAdmin) {
        return res.status(403).json({ message: 'Privilege escalation prevented: Only Super Admins can assign the Super Admin role.' });
      }
      targetUser.role = roleKey;
    }

    if (isActive !== undefined) {
      if (isTargetSuper && !isActive) {
        return res.status(403).json({ message: 'The Super Administrator account cannot be deactivated.' });
      }
      if (isSelf && !isActive) {
        return res.status(403).json({ message: 'You cannot deactivate your own account.' });
      }
      targetUser.isActive = !!isActive;
    }

    await targetUser.save();
    await audit(req, 'update', 'users', targetUser.id, { name: targetUser.name, role: targetUser.role, isActive: targetUser.isActive });
    res.json(clean(targetUser));
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res) => { 
  const { role } = req.body;

  // Anti-privilege escalation check: user cannot edit their own role
  if (req.params.id === req.user.id) {
    return res.status(403).json({ message: 'Privilege escalation prevented: You cannot modify your own role.' });
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const isTargetSuper = targetUser.role === 'super_admin';
  if (isTargetSuper && !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'You do not have permission to modify a Super Administrator account.' });
  }

  let roleKey = null;
  let roleDef = null;

  if (AVAILABLE_ROLES.includes(role)) {
    roleKey = role;
    roleDef = ROLE_DEFINITIONS[roleKey];
  } else {
    const customRole = await Role.findOne({ slug: role });
    if (customRole) {
      roleKey = customRole.slug;
      roleDef = {
        name: customRole.name,
        badge: customRole.badge || 'Custom',
        icon: customRole.icon || '🛡️'
      };
    }
  }

  if (!roleKey) {
    return res.status(400).json({ message: 'Invalid operational role selected.' });
  }

  if (roleKey === 'super_admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Privilege escalation prevented: Only Super Admins can assign the Super Admin role.' });
  }

  targetUser.role = roleKey;
  await targetUser.save();

  await audit(req, 'role_change', 'users', targetUser.id, { role: roleKey, roleName: roleDef?.name || roleKey }); 
  const cleaned = clean(targetUser);
  cleaned.role = roleKey;
  cleaned.roleName = roleDef?.name || roleKey;
  cleaned.roleBadge = roleDef?.badge || 'Custom';
  cleaned.isProtectedRole = roleKey === 'super_admin';
  res.json(cleaned); 
};

export const updateUserStatus = async (req, res) => { 
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'User not found.' });

  const isTargetSuper = targetUser.role === 'super_admin';
  if (isTargetSuper && !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'You cannot alter the active status of a Super Administrator.' });
  }

  targetUser.isActive = !!req.body.isActive;
  await targetUser.save();

  await audit(req, 'status_change', 'users', targetUser.id, { isActive: targetUser.isActive }); 
  res.json(clean(targetUser)); 
};

export const deleteUser = async (req, res) => { 
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' }); 
  }
  const targetUser = await User.findById(req.params.id);
  const isTargetSuper = targetUser?.role === 'super_admin';
  if (isTargetSuper && !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Only Super Administrators can delete a Super Administrator account.' });
  }
  await User.findByIdAndDelete(req.params.id); 
  await audit(req, 'delete', 'users', req.params.id); 
  res.status(204).end(); 
};

/* ── Dynamic Emergency Hotlines Management ── */
export const getAdminHotlines = async (_, res, next) => {
  try {
    const hotlines = await Hotline.find().sort('sortOrder createdAt');
    res.json(hotlines);
  } catch (err) {
    next(err);
  }
};

export const createHotline = async (req, res, next) => {
  try {
    const { title, number, subtitle, icon = 'phone', isActive = true, sortOrder = 0 } = req.body;

    if (!number) {
      return res.status(400).json({ message: 'Phone/hotline number is required.' });
    }

    // Title can be object { en, am, om } or string
    const formattedTitle = typeof title === 'object' ? title : { en: String(title || ''), am: '', om: '' };
    const formattedSubtitle = typeof subtitle === 'object' ? subtitle : { en: String(subtitle || ''), am: '', om: '' };

    if (!formattedTitle.en) {
      return res.status(400).json({ message: 'Hotline title is required.' });
    }

    const hotline = await Hotline.create({
      title: formattedTitle,
      number: String(number).trim(),
      subtitle: formattedSubtitle,
      icon,
      isActive,
      sortOrder: Number(sortOrder) || 0
    });

    await audit(req, 'create', 'hotlines', hotline.id, req.body);
    res.status(201).json(hotline);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateHotline = async (req, res, next) => {
  try {
    const { title, number, subtitle, icon, isActive, sortOrder } = req.body;
    const updateData = {};

    if (title !== undefined) {
      updateData.title = typeof title === 'object' ? title : { en: String(title || ''), am: '', om: '' };
    }
    if (subtitle !== undefined) {
      updateData.subtitle = typeof subtitle === 'object' ? subtitle : { en: String(subtitle || ''), am: '', om: '' };
    }
    if (number !== undefined) updateData.number = String(number).trim();
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    const hotline = await Hotline.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!hotline) return res.status(404).json({ message: 'Hotline not found.' });

    await audit(req, 'update', 'hotlines', hotline.id, req.body);
    res.json(hotline);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const deleteHotline = async (req, res, next) => {
  try {
    await Hotline.findByIdAndDelete(req.params.id);
    await audit(req, 'delete', 'hotlines', req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const reorderHotlines = async (req, res, next) => {
  try {
    const { items } = req.body; // array of { id, sortOrder }
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required for reordering.' });
    }

    await Promise.all(
      items.map(({ id, sortOrder }) =>
        Hotline.findByIdAndUpdate(id, { sortOrder: Number(sortOrder) })
      )
    );

    await audit(req, 'reorder', 'hotlines', undefined, { count: items.length });
    const updated = await Hotline.find().sort('sortOrder createdAt');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const getMedia = async (_, res) => res.json(await MediaAsset.find().sort('-createdAt'));
export const createMedia = async (req, res) => { 
  const asset = await MediaAsset.create({ ...req.body, uploadedBy: req.user.id }); 
  await audit(req, 'create', 'media', asset.id, req.body); res.status(201).json(asset); 
};
export const deleteMedia = async (req, res) => { 
  await MediaAsset.findByIdAndDelete(req.params.id); 
  await audit(req, 'delete', 'media', req.params.id); res.status(204).end(); 
};

export const getPages = async (_, res) => res.json(await Page.find().sort('slug'));
export const createPage = async (req, res) => { const page = await Page.create({ ...req.body, author: req.user.id }); await audit(req, 'create', 'pages', page.id, req.body); res.status(201).json(page); };
export const updatePage = async (req, res) => { const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (page) await audit(req, 'update', 'pages', page.id, req.body); page ? res.json(page) : res.status(404).json({ message: 'Page not found.' }); };
export const deletePage = async (req, res) => { await Page.findByIdAndDelete(req.params.id); await audit(req, 'delete', 'pages', req.params.id); res.status(204).end(); };

export const deleteContactMessage = async (req, res) => { await ContactMessage.findByIdAndDelete(req.params.id); await audit(req, 'delete', 'contactMessages', req.params.id); res.status(204).end(); };
export const deleteServiceRequest = async (req, res) => { await ServiceRequest.findByIdAndDelete(req.params.id); await audit(req, 'delete', 'serviceRequests', req.params.id); res.status(204).end(); };
export const deleteRecruitment = async (req, res) => { await RecruitmentApplication.findByIdAndDelete(req.params.id); await audit(req, 'delete', 'recruitmentApplications', req.params.id); res.status(204).end(); };
export const deleteCommunityRegistration = async (req, res) => { await CommunityRegistration.findByIdAndDelete(req.params.id); await audit(req, 'delete', 'communityRegistrations', req.params.id); res.status(204).end(); };

export const getAnalytics = async (_, res) => res.json({
  contactMessages: await ContactMessage.countDocuments(),
  recruitmentApplications: await RecruitmentApplication.countDocuments(),
  publishedNews: await News.countDocuments({ status: 'published' }),
  mediaAssets: await MediaAsset.countDocuments(),
  activeServices: await Service.countDocuments({ isActive: true }),
  vacancies: await Vacancy.countDocuments({ status: 'open' }),
  activeHotlines: await Hotline.countDocuments({ isActive: true })
});
export const getAuditLogs = async (_, res) => res.json(await AuditLog.find().populate('actor', 'name email role').sort('-createdAt').limit(200));
export const getBackup = async (_, res) => res.json({ version: 1, createdAt: new Date(), data: { news: await News.find(), services: await Service.find(), alerts: await Alert.find(), pages: await Page.find(), media: await MediaAsset.find(), hotlines: await Hotline.find() } });
export const restoreBackup = async (req, res) => { const data = req.body?.data; if (!data || typeof data !== 'object') return res.status(400).json({ message: 'A valid backup payload is required.' }); const collections = { news: News, services: Service, alerts: Alert, pages: Page, media: MediaAsset, hotlines: Hotline }; let restored = 0; for (const [key, Model] of Object.entries(collections)) { const records = Array.isArray(data[key]) ? data[key] : []; if (!records.length) continue; await Model.bulkWrite(records.map(record => { const item = { ...record }; delete item._id; delete item.__v; return { updateOne: { filter: { _id: record._id }, update: { $set: item }, upsert: true } }; })); restored += records.length; } await audit(req, 'restore', 'backup', undefined, { restored }); res.json({ message: `Restored ${restored} records.`, restored }); };
