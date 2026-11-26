import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  ACCOUNT_SETUP_TEMPLATE
} from '../utils/emailTemplates.js';

dotenv.config();

export const DEFAULT_EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE || process.env.EMAIL_SMTP_SECURE) === 'true',
  user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  fromName: process.env.EMAIL_FROM_NAME || 'Addis Ababa Police Commission',
  fromEmail: process.env.SMTP_FROM || process.env.EMAIL_USER || 'no-reply@police.gov.et',
  replyTo: process.env.EMAIL_REPLY_TO || '',
};

let cachedTransporter = null;
let lastConfigVersion = null;

/**
 * Build Nodemailer transporter from config or environment variables
 */
export const createTransporter = (config = DEFAULT_EMAIL_CONFIG) => {
  const cfg = { ...DEFAULT_EMAIL_CONFIG, ...config };

  // If using Gmail service directly
  if (cfg.host && (cfg.host.toLowerCase().includes('gmail') || cfg.service?.toLowerCase() === 'gmail')) {
    return nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });
  }

  // Custom SMTP server configuration
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure || cfg.port === 465,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert issues on enterprise intranet relays
    },
  });
};

/**
 * Get active transporter
 */
export const getTransporter = async () => {
  const config = DEFAULT_EMAIL_CONFIG;
  const configKey = `${config.host}-${config.port}-${config.user}-${config.pass}`;

  if (!cachedTransporter || lastConfigVersion !== configKey) {
    cachedTransporter = createTransporter(config);
    lastConfigVersion = configKey;
  }

  return { transporter: cachedTransporter, config };
};

/**
 * Send an email message
 */
export const sendEmail = async ({
  to,
  recipientName = '',
  subject,
  text,
  html,
  type = 'Other',
}) => {
  if (!to || !to.includes('@')) {
    throw new Error(`Invalid recipient email address: "${to}".`);
  }

  const { transporter, config } = await getTransporter();

  // If credentials aren't set, log email info to terminal in dev mode
  if (!config.user || !config.pass) {
    console.warn('[EmailService] SMTP credentials not fully configured. Email output to console:');
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    if (text) console.log(`[Email Body Text]:\n${text}`);
    return { messageId: `mock-${Date.now()}` };
  }

  const fromHeader = `"${config.fromName}" <${config.fromEmail}>`;

  const mailOptions = {
    from: fromHeader,
    to: to.trim().toLowerCase(),
    subject,
    text,
    html,
  };

  if (config.replyTo) {
    mailOptions.replyTo = config.replyTo;
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EmailService] [${type}] Email sent successfully: ${info.messageId} to ${to}`);
  return info;
};

/**
 * Send password reset email
 * Supports both call signatures:
 * 1) (email, resetURL)
 * 2) ({ toEmail, userName, resetUrl, expiresInMinutes })
 */
export const sendPasswordResetEmail = async (param1, param2) => {
  let email, resetURL, userName = 'Officer / Staff Member', expiresInMinutes = 30;

  if (typeof param1 === 'object' && param1 !== null) {
    email = param1.toEmail || param1.email;
    resetURL = param1.resetUrl || param1.resetURL;
    userName = param1.userName || userName;
    expiresInMinutes = param1.expiresInMinutes || expiresInMinutes;
  } else {
    email = param1;
    resetURL = param2;
  }

  const subject = 'Addis Ababa Police Portal - Password Reset Request';
  const text = `Hello ${userName},\n\nA password reset request was received for your Addis Ababa Police account.\nPlease click the link below to reset your password (valid for ${expiresInMinutes} minutes):\n${resetURL}\n\nIf you did not request this, you can ignore this email.`;
  const html = PASSWORD_RESET_REQUEST_TEMPLATE
    .replace('{name}', userName)
    .replace(/\{resetURL\}/g, resetURL)
    .replace('{expiresInMinutes}', String(expiresInMinutes));

  return await sendEmail({ to: email, recipientName: userName, subject, text, html, type: 'PasswordReset' });
};

/**
 * Send password reset confirmation email
 */
export const sendResetSuccessEmail = async (email, userName = 'Officer / Staff Member') => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginURL = `${clientUrl}/admin/login`;

  const subject = 'Addis Ababa Police Portal - Password Reset Successful';
  const text = `Hello ${userName},\n\nYour password for the Addis Ababa Police Portal has been successfully updated. All prior sessions have been invalidated.\n\nYou can log in now: ${loginURL}`;
  const html = PASSWORD_RESET_SUCCESS_TEMPLATE
    .replace('{name}', userName)
    .replace('{loginURL}', loginURL);

  return await sendEmail({ to: email, recipientName: userName, subject, text, html, type: 'PasswordResetSuccess' });
};

/**
 * Send account invitation / setup email when an administrator creates a new account
 * Supports:
 * ({ email, name, role, setupUrl, expiresInHours }) or (email, setupUrl, name, role)
 */
export const sendAccountSetupEmail = async (param1, param2, param3, param4) => {
  let email, setupURL, name = 'Officer / Staff Member', role = 'Portal User', expiresInHours = 24;

  if (typeof param1 === 'object' && param1 !== null) {
    email = param1.email || param1.toEmail;
    setupURL = param1.setupUrl || param1.setupURL;
    name = param1.name || param1.userName || name;
    role = param1.role || role;
    expiresInHours = param1.expiresInHours || expiresInHours;
  } else {
    email = param1;
    setupURL = param2;
    name = param3 || name;
    role = param4 || role;
  }

  const subject = 'Addis Ababa Police Portal - Account Invitation';
  const text = `Hello ${name},\n\nYou have been invited to join the Addis Ababa Police Portal as "${role}".\nPlease set up your secure password by opening the link below (valid for ${expiresInHours} hours):\n${setupURL}\n\nWelcome to the team!`;
  const html = ACCOUNT_SETUP_TEMPLATE
    .replace('{name}', name)
    .replace('{role}', role)
    .replace(/\{setupURL\}/g, setupURL)
    .replace('{expiresInHours}', String(expiresInHours));

  return await sendEmail({ to: email, recipientName: name, subject, text, html, type: 'AccountSetup' });
};

/**
 * Send welcome email with default credentials (if direct password was generated)
 */
export const sendWelcomeEmail = async (email, fullname, password) => {
  const defaultPass = password || 'Provided by your administrator';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginURL = `${clientUrl}/admin/login`;

  const subject = 'Welcome to Addis Ababa Police Portal';
  const text = `Hello ${fullname},\n\nWelcome to the Addis Ababa Police Portal! Your account is now active.\n\nLogin credentials:\nEmail: ${email}\nInitial Password: ${defaultPass}\n\nPlease log in and update your password at: ${loginURL}`;
  const html = WELCOME_EMAIL_TEMPLATE
    .replace('{name}', fullname || 'User')
    .replace('{loginURL}', loginURL);

  return await sendEmail({ to: email, recipientName: fullname, subject, text, html, type: 'Welcome' });
};
