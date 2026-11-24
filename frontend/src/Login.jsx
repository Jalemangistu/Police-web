import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const api = async (p, o = {}) => {
    const r = await fetch(`${API}${p}`, { headers: { 'Content-Type': 'application/json' }, ...o });
    const d = r.status === 204 ? null : await r.json(); 
    if (!r.ok) throw Error(d.message || 'Request failed'); 
    return d;
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const getPasswordStrength = () => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const strength = getPasswordStrength();
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (captchaInput.toUpperCase() !== captchaCode) {
            setError('Security code verification failed. Please try again.');
            generateCaptcha();
            return;
        }

        setLoading(true);

        try {
            const { token } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
            
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            sessionStorage.setItem('adminToken', token);
            navigate('/admin', { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
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
                    <div className="auth-badge">Enterprise Security Portal</div>
                    <h2 className="auth-title">Addis Ababa Police</h2>
                    <p className="auth-subtitle">
                        Access your operational dashboard securely with real-time encrypted data synchronization.
                    </p>
                    <div className="auth-features">
                        <div className="auth-feature">
                            <div className="auth-feature-icon">🛡️</div>
                            <div>
                                <h4>Encrypted Data</h4>
                                <p>256-bit AES Shield</p>
                            </div>
                        </div>
                        <div className="auth-feature">
                            <div className="auth-feature-icon">✓</div>
                            <div>
                                <h4>Compliance</h4>
                                <p>WCAG & ISO 27001</p>
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
                        <div className="auth-tag">🔑 Authentication</div>
                        <h1>Welcome back</h1>
                        <p>Enter your operational credentials to continue</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@organization.gov.et"
                            />
                        </div>

                        <div className="auth-form-group">
                            <div className="auth-label-row">
                                <label>Password</label>
                                <Link to="/admin/forgot-password" className="auth-forgot-link">Forgot Password?</Link>
                            </div>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="auth-show-hide"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="auth-strength-meter">
                                    <div className="auth-strength-bars">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`auth-strength-bar ${strength >= level ? 'active level-' + strength : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="auth-strength-text">{strength > 0 ? strengthLabels[strength - 1] : ''}</span>
                                </div>
                            )}
                        </div>

                        <div className="auth-captcha-box">
                            <div className="auth-captcha-header">
                                <label>🛡️ Human Verification</label>
                                <span>Click code to refresh</span>
                            </div>
                            <div className="auth-captcha-row">
                                <div className="auth-captcha-canvas-wrap" onClick={generateCaptcha} title={`Click to refresh (Code: ${captchaCode})`} data-captcha={captchaCode}>
                                    <canvas ref={canvasRef} width={128} height={48}></canvas>
                                </div>
                                <input
                                    type="text"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    required
                                    placeholder="CODE"
                                    maxLength={6}
                                    className="auth-captcha-input"
                                />
                            </div>
                        </div>

                        <div className="auth-remember-row">
                            <label className="auth-remember-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember my email</span>
                            </label>
                        </div>

                        <button type="submit" disabled={loading} className="auth-submit-btn">
                            {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>© {new Date().getFullYear()} Addis Ababa Police. All rights reserved.</p>
                        <div className="auth-footer-links">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Help Desk</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
