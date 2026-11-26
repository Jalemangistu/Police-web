/**
 * HTML Email Templates for Addis Ababa Police Portal
 * Features: Responsive design, professional styling, AAP branding.
 */

const BASE_TEMPLATE = (title, content, footer) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0a2540 0%, #1e3a8a 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 10px 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px; }
    .content { padding: 36px 30px; background-color: #ffffff; }
    .content p { margin-bottom: 20px; font-size: 15px; color: #334155; line-height: 1.7; }
    .cta-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #0c1b33; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; transition: background-color 0.2s ease; box-shadow: 0 4px 12px rgba(12, 27, 51, 0.25); }
    .code-box { background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
    .code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0c1b33; font-family: 'Courier New', monospace; }
    .footer { padding: 24px 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; font-size: 12px; color: #64748b; font-weight: 500; }
    .logo-badge { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; color: #93c5fd; text-transform: uppercase; margin-bottom: 6px; display: block; }
    .highlight-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #1e3a8a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo-badge">Addis Ababa Police Commission</span>
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>${footer || 'This is an automated system message. Please do not reply directly to this email.'}</p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Addis Ababa Police Commission Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const VERIFICATION_EMAIL_TEMPLATE = BASE_TEMPLATE(
  'Verify Your Identity',
  `
    <p>Welcome to the Addis Ababa Police Portal. To verify your identity and activate your account, please enter the following verification code:</p>
    <div class="code-box">
      <div class="code">{verificationCode}</div>
    </div>
    <p>This code will expire in <strong>15 minutes</strong>. If you did not initiate this request, please disregard this message.</p>
    `,
  'Official Security Verification'
);

export const PASSWORD_RESET_REQUEST_TEMPLATE = BASE_TEMPLATE(
  'Password Reset Request',
  `
    <p>Hello <strong>{name}</strong>,</p>
    <p>We received a request to reset the password for your Addis Ababa Police Portal account.</p>
    <div class="cta-container">
      <a href="{resetURL}" class="btn">Reset Password</a>
    </div>
    <div class="highlight-box">
      <strong>Notice:</strong> This secure link will remain active for <strong>{expiresInMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email; your account remains secure.
    </div>
    <p style="font-size: 13px; color: #64748b; word-break: break-all;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="{resetURL}" style="color: #2563eb;">{resetURL}</a>
    </p>
    `,
  'Official Credential Security Protocol'
);

export const PASSWORD_RESET_SUCCESS_TEMPLATE = BASE_TEMPLATE(
  'Password Reset Successful',
  `
    <p>Hello <strong>{name}</strong>,</p>
    <p>Your password for the Addis Ababa Police Portal has been successfully updated.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #10b981; color: white; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; display: inline-block; font-size: 28px;">
        &check;
      </div>
    </div>
    <p>All active sessions have been invalidated as a security measure. You can now log in with your new credentials.</p>
    <div class="cta-container">
      <a href="{loginURL}" class="btn">Sign In to Portal</a>
    </div>
    <p style="font-size: 13px; color: #dc2626;">If you did not perform this change, please notify your system administrator immediately.</p>
    `,
  'Security Integrity Verified'
);

export const ACCOUNT_SETUP_TEMPLATE = BASE_TEMPLATE(
  'Account Invitation',
  `
    <p>Hello <strong>{name}</strong>,</p>
    <p>An administrator has created an account for you on the <strong>Addis Ababa Police Portal</strong> with the role of <strong>{role}</strong>.</p>
    <p>To initialize your account and create your secure password, please click the link below:</p>
    <div class="cta-container">
      <a href="{setupURL}" class="btn">Set Up Account & Password</a>
    </div>
    <div class="highlight-box">
      <strong>Important:</strong> This activation link will remain valid for <strong>{expiresInHours} hours</strong>.
    </div>
    <p style="font-size: 13px; color: #64748b; word-break: break-all;">
      Or paste this URL in your browser:<br>
      <a href="{setupURL}" style="color: #2563eb;">{setupURL}</a>
    </p>
    `,
  'Official Portal Account Invitation'
);

export const WELCOME_EMAIL_TEMPLATE = BASE_TEMPLATE(
  'Welcome to the Portal',
  `
    <p>Hello <strong>{name}</strong>,</p>
    <p>Welcome to the <strong>Addis Ababa Police Portal</strong>. Your account is active and ready.</p>
    <div class="cta-container">
      <a href="{loginURL}" class="btn">Sign In to Portal</a>
    </div>
    `,
  'Account Activation'
);
