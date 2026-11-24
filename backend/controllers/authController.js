import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import AuditLog from '../models/AuditLog.js';
import { tokenFor, clean } from '../utils/authUtils.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { ROLE_DEFINITIONS } from '../config/roles.js';

export const resolveRolePermissions = async (roleKey) => {
  if (roleKey === 'super_admin') return ['*'];
  try {
    const dbPerms = await Permission.find({ roles: roleKey }).distinct('key');
    const staticPerms = ROLE_DEFINITIONS[roleKey]?.permissions || [];
    return Array.from(new Set([...staticPerms, ...dbPerms]));
  } catch {
    return ROLE_DEFINITIONS[roleKey]?.permissions || [];
  }
};

/**
 * Log in user
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.isActive || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  await AuditLog.create({
    actor: user.id,
    action: 'login',
    resourceType: 'auth',
    ipAddress: req.ip
  });

  const roleKey = typeof user.role === 'string' ? user.role : (user.legacyRole || 'user');
  const roleDef = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.user;
  const isSuperAdmin = roleKey === 'super_admin';
  const permissions = await resolveRolePermissions(roleKey);

  const cleanedUser = clean(user);
  cleanedUser.role = roleKey;
  cleanedUser.roleTitle = roleDef.name;
  cleanedUser.roleBadge = roleDef.badge;
  cleanedUser.permissions = permissions;
  cleanedUser.isSuperAdmin = isSuperAdmin;

  res.json({
    token: tokenFor(user),
    user: cleanedUser
  });
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: 'User not found.' });
  }

  const roleKey = typeof user.role === 'string' ? user.role : (user.legacyRole || 'user');
  const roleDef = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.user;
  const isSuperAdmin = roleKey === 'super_admin';
  const permissions = await resolveRolePermissions(roleKey);

  const cleanedUser = clean(user);
  cleanedUser.role = roleKey;
  cleanedUser.roleTitle = roleDef.name;
  cleanedUser.roleBadge = roleDef.badge;
  cleanedUser.permissions = permissions;
  cleanedUser.isSuperAdmin = isSuperAdmin;

  res.json(cleanedUser);
};

/**
 * Request password reset (Forgot Password)
 * Does NOT reveal whether an email exists in the database.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isActive: true });

  if (user) {
    // Generate secure 32-byte hex token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 30 minutes
    const expirationMinutes = 30;
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + expirationMinutes * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/admin/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.name,
        resetUrl,
        expiresInMinutes: expirationMinutes
      });
      await AuditLog.create({
        actor: user.id,
        action: 'forgot_password_request',
        resourceType: 'auth',
        ipAddress: req.ip
      });
    } catch (err) {
      console.error('Error sending reset email:', err);
    }
  }

  // Consistent message returned regardless of email existence to prevent enumeration
  res.json({
    message: 'If an account with that email address exists, password reset instructions have been sent.'
  });
};

/**
 * Reset password using a valid, unexpired token
 * Enforces Strong Password Policy and invalidates existing sessions.
 */
export const resetPassword = async (req, res) => {
  const token = req.params.token || req.body.token;
  const { newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Password reset token is required.' });
  }

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  // Validate password strength against policy
  const policyCheck = validatePassword(newPassword);
  if (!policyCheck.valid) {
    return res.status(400).json({
      message: 'Password does not meet the security requirements.',
      errors: policyCheck.errors
    });
  }

  // Hash incoming token to match stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
    isActive: true
  });

  if (!user) {
    return res.status(400).json({
      message: 'Password reset link is invalid or has expired. Please request a new one.'
    });
  }

  // Hash new password using bcrypt cost factor 12
  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await AuditLog.create({
    actor: user.id,
    action: 'password_reset_success',
    resourceType: 'auth',
    ipAddress: req.ip
  });

  res.json({
    message: 'Your password has been reset successfully. Please log in with your new credentials.'
  });
};
