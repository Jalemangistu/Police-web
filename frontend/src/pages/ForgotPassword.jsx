import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../auth.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = async (p, o = {}) => {
    const r = await fetch(`${API}${p}`, { headers: { 'Content-Type': 'application/json' }, ...o });
    const d = r.status === 204 ? null : await r.json();
    if (!r.ok) throw Error(d.message || 'Request failed');
    return d;
};

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Captcha States
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const canvasRef = useRef(null);

    const generateCaptcha = () => {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(code);
        setCaptchaInput('');
    };

    useEffect(() => {
        if (canvasRef.current && captchaCode) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < 6; i++) {
                    ctx.strokeStyle = `rgba(225, 29, 72, ${Math.random() * 0.4 + 0.15})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
                    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
                    ctx.stroke();
                }

                for (let i = 0; i < 35; i++) {
                    ctx.fillStyle = `rgba(30, 58, 138, ${Math.random() * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.font = 'bold 22px monospace';
                ctx.textBaseline = 'middle';

                for (let i = 0; i < captchaCode.length; i++) {
                    const char = captchaCode[i];
                    ctx.fillStyle = '#0f172a';
                    ctx.save();
                    const x = 12 + i * 20;
                    const y = canvas.height / 2 + (Math.random() * 8 - 4);
                    const angle = (Math.random() * 30 - 15) * Math.PI / 180;
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.fillText(char, 0, 0);
                    ctx.restore();
                }
            }
        }
    }, [captchaCode]);

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (captchaInput.toUpperCase() !== captchaCode) {
            setError('Security code verification failed. Please try again.');
            generateCaptcha();
            return;
        }

        setLoading(true);

        try {
            const res = await api('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            setSuccessMessage(res.message || 'If an account exists with that email, reset instructions have been sent.');
        } catch (err) {
            setError(err.message || 'Failed to request password reset. Please try again.');
            generateCaptcha();
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
                    <div className="auth-badge">Account Recovery</div>
                    <h2 className="auth-title">Addis Ababa Police</h2>
                    <p className="auth-subtitle">
                        Official credential reset protocol. Recover access to authorized administrative functions.
                    </p>
                    <div className="auth-features">
                        <div className="auth-feature">
                            <div className="auth-feature-icon">⏱️</div>
                            <div>
                                <h4>Single-Use Token</h4>
                                <p>Expires in 30 minutes</p>
                            </div>
                        </div>
                        <div className="auth-feature">
                            <div className="auth-feature-icon">🛡️</div>
                            <div>
                                <h4>Session Revocation</h4>
                                <p>Old tokens invalidated on reset</p>
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
                        <div className="auth-tag">🔒 Password Recovery</div>
                        <h1>Forgot Password?</h1>
                        <p>Enter your verified operational email to receive a recovery link</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {successMessage ? (
                        <div className="auth-success-box">
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✉️</div>
                            <h3 style={{ margin: '0 0 0.5rem', color: '#065f46' }}>Check Your Email</h3>
                            <p style={{ margin: 0 }}>{successMessage}</p>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#047857' }}>
                                For security reasons, the link will expire in 30 minutes. Be sure to check your spam or junk folder if you don't see it shortly.
                            </p>
                            <Link to="/admin/login" className="auth-link-btn" style={{ display: 'inline-block', marginTop: '1.25rem' }}>
                                ← Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-form-group">
                                <label>Registered Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@organization.gov.et"
                                    autoFocus
                                />
                            </div>

                            <div className="auth-captcha-box">
                                <div className="auth-captcha-header">
                                    <label>🛡️ Human Verification</label>
                                    <span>Click code to refresh</span>
                                </div>
                                <div className="auth-captcha-row">
                                    <div
                                        className="auth-captcha-canvas-wrap"
                                        onClick={generateCaptcha}
                                        title={`Click to refresh (Code: ${captchaCode})`}
                                    >
                                        <canvas ref={canvasRef} width={128} height={48}></canvas>
                                    </div>
                                    <input
                                        type="text"
                                        value={captchaInput}
                                        onChange={(e) => setCaptchaInput(e.target.value)}
                                        required
                                        placeholder="CODE"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="auth-submit-btn"
                            >
                                {loading ? 'Sending Recovery Link…' : 'Send Recovery Link'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <Link to="/admin/login" className="auth-forgot-link" style={{ color: '#64748b' }}>
                                    Remember your credentials? <strong style={{ color: '#0c1c34' }}>Log in</strong>
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

