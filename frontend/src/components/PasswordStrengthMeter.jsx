import React from 'react';

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

export const checkPasswordCriteria = (password = '') => {
  const pwd = String(password);
  const lower = pwd.toLowerCase().trim();
  const isCommon = COMMON_PASSWORDS.some(c => lower === c || lower === c.replace(/\d+/g, ''));

  return {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd),
    isNotCommon: !isCommon && pwd.length > 0
  };
};

export const getPasswordStrengthScore = (password = '') => {
  if (!password) return 0;
  const criteria = checkPasswordCriteria(password);
  let score = 0;
  if (criteria.minLength) score++;
  if (criteria.hasUpper && criteria.hasLower) score++;
  if (criteria.hasNumber) score++;
  if (criteria.hasSpecial && criteria.isNotCommon) score++;
  return score;
};

export default function PasswordStrengthMeter({ password = '', showChecklist = true }) {
  if (!password) return null;

  const criteria = checkPasswordCriteria(password);
  const score = getPasswordStrengthScore(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthClass = ['weak', 'fair', 'good', 'strong'][Math.max(0, score - 1)] || 'weak';

  return (
    <div className="psm-container">
      {/* 4-bar indicator */}
      <div className="psm-bar-wrapper">
        <div className="psm-bars">
          {[1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`psm-bar ${score >= level ? `active ${strengthClass}` : ''}`}
            />
          ))}
        </div>
        <span className={`psm-label-text ${strengthClass}`}>
          {score > 0 ? labels[score - 1] : 'Very Weak'}
        </span>
      </div>

      {/* Real-time policy requirements checklist */}
      {showChecklist && (
        <ul className="psm-checklist">
          <li className={criteria.minLength ? 'valid' : 'invalid'}>
            <span className="psm-icon">{criteria.minLength ? '✓' : '○'}</span>
            <span>At least 8 characters long</span>
          </li>
          <li className={criteria.hasUpper ? 'valid' : 'invalid'}>
            <span className="psm-icon">{criteria.hasUpper ? '✓' : '○'}</span>
            <span>Uppercase letter (A–Z)</span>
          </li>
          <li className={criteria.hasLower ? 'valid' : 'invalid'}>
            <span className="psm-icon">{criteria.hasLower ? '✓' : '○'}</span>
            <span>Lowercase letter (a–z)</span>
          </li>
          <li className={criteria.hasNumber ? 'valid' : 'invalid'}>
            <span className="psm-icon">{criteria.hasNumber ? '✓' : '○'}</span>
            <span>At least one number (0–9)</span>
          </li>
          <li className={criteria.hasSpecial ? 'valid' : 'invalid'}>
            <span className="psm-icon">{criteria.hasSpecial ? '✓' : '○'}</span>
            <span>Special character (!@#$%^&*...)</span>
          </li>
          {!criteria.isNotCommon && password.length >= 8 && (
            <li className="invalid warning">
              <span className="psm-icon">⚠️</span>
              <span>Common password phrase detected</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

