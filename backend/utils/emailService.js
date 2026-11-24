import nodemailer from 'nodemailer';

/**
 * Sends a password reset email to the user.
 * Falls back to logging the secure reset URL to the terminal in development
 * if SMTP is not configured.
 */
export const sendPasswordResetEmail = async ({ toEmail, userName, resetUrl, expiresInMinutes = 30 }) => {
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
        .header { background-color: #0c1c34; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.05em; color: #ffffff; }
        .header p { margin: 6px 0 0; color: #d9b048; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; }
        .body { padding: 32px 28px; line-height: 1.6; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #0c1c34; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; border: 2px solid #d9b048; }
        .btn:hover { background-color: #16295a; }
        .footer { padding: 20px 28px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
        .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Addis Ababa Police Commission</h1>
          <p>Official Portal Security</p>
        </div>
        <div class="body">
          <p>Hello <strong>${userName || 'Officer'}</strong>,</p>
          <p>We received a request to reset the password for your portal account (<code>${toEmail}</code>).</p>
          <p>Click the button below to choose a new password. This secure link is valid for <strong>${expiresInMinutes} minutes</strong>.</p>
          
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>

          <p style="font-size: 13px; color: #64748b;">Or copy and paste this URL directly into your browser:<br>
            <a href="${resetUrl}" style="color: #0284c7; word-break: break-all;">${resetUrl}</a>
          </p>

          <div class="warning">
            <strong>Security Notice:</strong> If you did not request this password reset, please disregard this email or report it to platform security immediately. Your current password remains secure until you confirm a new one.
          </div>
        </div>
        <div class="footer">
          This is an automated operational notification from Addis Ababa Police Commission Portal. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  if (hasSmtpConfig) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Addis Ababa Police Portal" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'Password Reset Request - Addis Ababa Police Portal',
      html: htmlContent
    });

    return { sent: true, mode: 'smtp' };
  } else {
    // Development fallback
    console.log('\n============================================================');
    console.log('🔑 [DEV EMAIL SERVICE] PASSWORD RESET LINK GENERATED:');
    console.log(`To: ${toEmail}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires in: ${expiresInMinutes} minutes`);
    console.log('============================================================\n');
    return { sent: true, mode: 'development-log', resetUrl };
  }
};

