import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PasswordStrengthMeter, { checkPasswordCriteria } from '../components/PasswordStrengthMeter';
import '../auth.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = async (p, o = {}) => {
    const r = await fetch(`${API}${p}`, { headers: { 'Content-Type': 'application/json' }, ...o });
    const d = r.status === 204 ? null : await r.json();
    if (!r.ok) throw Error(d.message || 'Request failed');
    return d;
};

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const criteria = checkPasswordCriteria(newPassword);
    const isStrong =
        criteria.minLength &&
        criteria.hasUpper &&
        criteria.hasLower &&
        criteria.hasNumber &&
        criteria.hasSpecial &&
        criteria.isNotCommon;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Missing password reset token. Please request a new recovery link.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please ensure both fields are identical.');
            return;
        }

        if (!isStrong) {
            setError('Please ensure your new password satisfies all strong policy requirements.');
            return;
        }

        setLoading(true);

        try {
            await api(`/auth/reset-password/${token}`, {
                method: 'POST',
                body: JSON.stringify({ newPassword })
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Password reset failed. The link may have expired or is invalid.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-hero-content">
                    <div className="auth-logo-wrapper">
                        <img src="/aap-crest.png" alt="AAP Logo" className="auth-logo" />
                    </div>
                    <div className="auth-badge">Security Standard</div>
                    <h2 className="auth-title">Addis Ababa Police</h2>
                    <p className="auth-subtitle">
                        Strong credential creation. All passwords must conform to official security policy requirements.
                    </p>
                    <div className="auth-features">
                        <div className="auth-feature">
                            <div className="auth-feature-icon">🔑</div>
                            <div>
                                <h4>Strong Cryptography</h4>
                                <p>Bcrypt Cost 12 Enforced</p>
                            </div>
                        </div>
                        <div className="auth-feature">
                            <div className="auth-feature-icon">🛡️</div>
                            <div>
                                <h4>Session Revocation</h4>
                                <p>All prior logins terminated</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-header">
                    <div className="auth-brand">
                        <img src="/aap-crest.png" alt="Logo" className="auth-brand-logo" />
                        <span>AAP Portal</span>
                    </div>
                    <Link to="/" className="auth-back-link">← Home</Link>
                </div>

                <div className="auth-form-container">
                    <div className="auth-form-header">
                        <div className="auth-tag">🛡️ Set New Password</div>
                        <h1>Create new password</h1>
                        <p>Your new password must satisfy all policy requirements below</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {success ? (
                        <div className="auth-success-box">
                            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✅</div>
                            <h3 style={{ margin: '0 0 0.5rem', color: '#065f46' }}>Password Reset Successful!</h3>
                            <p style={{ margin: '0 0 1rem', color: '#047857' }}>
                                Your password has been updated securely. All prior active sessions have been invalidated. You can now sign in with your new password.
                            </p>
                            <Link to="/admin/login" className="auth-link-btn" style={{ display: 'inline-block' }}>
                                Go to Sign In →
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-form-group">
                                <label>New Password</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="Enter strong new password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="auth-show-hide"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <PasswordStrengthMeter password={newPassword} showChecklist={true} />
                            </div>

                            <div className="auth-form-group">
                                <label>Confirm New Password</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                        ⚠️ Passwords do not match
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !isStrong || newPassword !== confirmPassword}
                                className="auth-submit-btn"
                            >
                                {loading ? 'Updating Password…' : 'Update Password & Sign In'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <Link to="/admin/login" className="auth-forgot-link" style={{ color: '#64748b' }}>
                                    Remembered your password? <strong style={{ color: '#0c1c34' }}>Sign In</strong>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <div className="auth-footer">
                    <span>© {new Date().getFullYear()} Addis Ababa Police Commission</span>
                    <div className="auth-footer-links">
                        <Link to="/legal">Privacy & Security</Link>
                        <Link to="/contact">Support Desk</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

