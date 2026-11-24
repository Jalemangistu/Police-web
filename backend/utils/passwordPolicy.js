// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password',
  'password123',
  'password1234',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'admin123',
  'admin1234',
  'police123',
  'welcome123',
  'letmein123',
  'iloveyou',
  'changeme123',
  'pass1234',
  'secret123'
];

/**
 * Validates a password against the Strong Password Policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - Not a common/predictable password
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required.'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter (A-Z).');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter (a-z).');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number (0-9).');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must include at least one special character (!@#$%^&*...).');
  }

  const lower = password.toLowerCase().trim();
  const isCommon = COMMON_PASSWORDS.some(common => lower === common || lower === common.replace(/\d+/g, ''));
  if (isCommon) {
    errors.push('This password is too common. Please choose a more secure password.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate numerical strength score (0 to 4)
 */
export const calculatePasswordScore = (password) => {
  if (!password || typeof password !== 'string') return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score++;
  if (password.length >= 12 && score === 4) score = 4;
  return score;
};

