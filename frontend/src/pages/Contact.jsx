import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { Hero, Section, Fields } from '../components/PageBlocks';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Contact() {
    const s = useSite();
    const { t } = useTranslation();
    const additionalEmergency = (s.emergencyContacts || []).filter((c) => c.number);

    /* ── Station search state ── */
    const [query, setQuery] = useState('');
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    /* ── Send Message Form State & Validation ── */
    const [msgForm, setMsgForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        department: 'General Inquiries',
        message: ''
    });
    const [msgErrors, setMsgErrors] = useState({});
    const [msgSubmitting, setMsgSubmitting] = useState(false);
    const [msgStatus, setMsgStatus] = useState(null);

    const validateMessageForm = () => {
        const errors = {};
        if (!msgForm.fullName.trim() || msgForm.fullName.trim().length < 2) {
            errors.fullName = t('contact.errorName', 'Please enter your full name (at least 2 characters).');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!msgForm.email.trim() || !emailRegex.test(msgForm.email.trim())) {
            errors.email = t('contact.errorEmail', 'Please enter a valid email address.');
        }
        if (!msgForm.message.trim() || msgForm.message.trim().length < 10) {
            errors.message = t('contact.errorMessage', 'Please enter a message (at least 10 characters).');
        }
        setMsgErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setMsgStatus(null);
        if (!validateMessageForm()) return;

        setMsgSubmitting(true);
        try {
            const res = await fetch(`${API}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msgForm)
            });
            const data = await res.json();
            if (res.ok) {
                setMsgStatus({
                    success: true,
                    message: data.message || t('contact.successMsg', 'Your message has been sent successfully. An officer will review it and get in touch with you.')
                });
                setMsgForm({
                    fullName: '',
                    email: '',
                    phone: '',
                    department: 'General Inquiries',
                    message: ''
                });
                setMsgErrors({});
            } else {
                setMsgStatus({
                    success: false,
                    message: data.message || t('contact.errorGeneric', 'Failed to send message. Please verify your details or try again.')
                });
            }
        } catch (err) {
            setMsgStatus({
                success: false,
                message: t('contact.errorNetwork', 'Network error: could not connect to police server. For immediate assistance, call 991.')
            });
        }
        setMsgSubmitting(false);
    };

    const searchStations = useCallback(async (q) => {
        setLoading(true);
        try {
            const url = q ? `${API}/stations?q=${encodeURIComponent(q)}` : `${API}/stations`;
            const res = await fetch(url);
            if (res.ok) setStations(await res.json());
        } catch { /* network error — silent */ }
        setLoading(false);
        setSearched(true);
    }, []);

    /* Debounced live search as user types */
    useEffect(() => {
        if (!query.trim()) { setStations([]); setSearched(false); return; }
        const timer = setTimeout(() => searchStations(query.trim()), 350);
        return () => clearTimeout(timer);
    }, [query, searchStations]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) searchStations(query.trim());
    };

    return (
        <>
        <Hero tag={t('contact.tag', 'CONTACT & DIRECTORY')} title={txt(s.contactHeroTitle) || t('contact.defaultHeroTitle', 'Get in touch with Addis Ababa Police')}>
            <p>{txt(s.contactHeroLead) || t('contact.defaultHeroLead', 'Find stations, make enquiries, report non-emergencies, or contact command divisions.')}</p>
        </Hero>

            {/* Emergency guide */ }
    <section className="container section">
        <div className="emGuide">
            <div>
                <small>{t('contact.emergency', 'EMERGENCY')}</small>
                <h2>{t('contact.call', 'Call')} {txt(s.emergencyPolice) || '991'}</h2>
                <p>{t('contact.emergencyText', 'Crime in progress, immediate danger, or urgent police assistance.')}</p>
            </div>
            <div>
                <small>{t('contact.nonEmergency', 'NON-EMERGENCY')}</small>
                <h2>{t('contact.useOnline', 'Use online services')}</h2>
                <p>{t('contact.nonEmergencyText', 'Reports, enquiries, permits, lost property, and feedback.')}</p>
            </div>
        </div>
        {additionalEmergency.length > 0 && (
            <div className="additionalEmergency">
                {additionalEmergency.map((contact, i) => (
                    <a key={`${contact.label}-${i}`} href={`tel:${contact.number}`}>
                        <small>{contact.label || 'Emergency service'}</small>
                        <b>{contact.number}</b>
                    </a>
                ))}
            </div>
        )}
    </section>

    {/* Contact details */ }
    {
        (s.contactEmail || s.contactPhone || txt(s.contactAddress)) && (
            <section className="container section">
                <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
                    <h3>{t('contact.contactDetails', 'Contact details')}</h3>
                    {s.contactEmail && <p>{t('contact.email', 'Email')}: <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></p>}
                    {s.contactPhone && <p>{t('contact.phone', 'Phone')}: <a href={`tel:${s.contactPhone}`}>{s.contactPhone}</a></p>}
                    {txt(s.contactAddress) && <p>{t('contact.address', 'Address')}: {txt(s.contactAddress)}</p>}
                </div>
            </section>
        )
    }

    {/* Station locator & Interactive Map */ }
    <Section title={t('contact.stationLocator', 'Headquarters Location & Station Directory')}>
        <div className="split">
            <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Police Headquarters Location</strong>
                        <small style={{ color: '#64748b' }}>Churchill Avenue, Addis Ababa, Ethiopia</small>
                    </div>
                    <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        24/7 OPEN
                    </span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: '340px', background: '#e2e8f0' }}>
                    <iframe
                        title="Addis Ababa Police Commission Location"
                        src="https://maps.google.com/maps?q=Addis+Ababa+Police+Commission+Headquarters,+Churchill+Avenue,+Addis+Ababa,+Ethiopia&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0, display: 'block' }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>
                <div style={{ padding: '14px 20px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#475569' }}>📍 Near Churchill Ave &amp; Piazza Central Command</span>
                    <a
                        href="https://maps.google.com/?q=Addis+Ababa+Police+Commission+Headquarters,+Addis+Ababa,+Ethiopia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                        Open Google Maps ↗
                    </a>
                </div>
            </div>

            <article className="card">
                <h3>{t('contact.findNearest', 'Find your nearest station')}</h3>
                <form onSubmit={handleSubmit}>
                    <label>
                        {t('contact.searchSubCity', 'Search by sub-city or district')}
                        <input
                            placeholder={t('contact.searchPlaceholder', 'e.g. Bole, Arada, Yeka')}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </label>
                    <button className="button" type="submit" disabled={loading}>
                        {loading ? t('contact.searching', 'Searching…') : t('contact.searchStations', 'Search stations')}
                    </button>
                </form>

                {/* Dynamic results */}
                {loading && <p className="stationSearchHint">{t('contact.searchingStations', 'Searching stations…')}</p>}
                {!loading && searched && stations.length === 0 && (
                    <p className="stationSearchHint">{t('contact.noStations', 'No stations found. Try a different sub-city or district.')}</p>
                )}
                {stations.length > 0 && (
                    <div className="stationResults">
                        {stations.map(st => (
                            <div className="stationResultCard" key={st._id}>
                                <div className="stationResultHead">
                                    <b>{txt(st.name)}</b>
                                    <span className="stationBadge">{st.subCity}</span>
                                </div>
                                {st.district && <small className="stationDistrict">District: {st.district}</small>}
                                {txt(st.address) && <p className="stationAddr">{txt(st.address)}</p>}
                                <div className="stationMeta">
                                    {st.phone?.length > 0 && <span>📞 {st.phone.join(', ')}</span>}
                                    {st.email && <span>✉ {st.email}</span>}
                                    {txt(st.operatingHours) && <span>🕐 {txt(st.operatingHours)}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p><Link to="/stations">{t('contact.openDirectory', 'Open station directory →')}</Link></p>
            </article>
        </div>
    </Section>

    {/* Contact form */ }
    <Section title={t('contact.sendMessage', 'Send a message')}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            {msgStatus && (
                <div
                    style={{
                        padding: '16px 20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: msgStatus.success ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${msgStatus.success ? '#a7f3d0' : '#fecaca'}`,
                        color: msgStatus.success ? '#065f46' : '#991b1b',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                    role="alert"
                >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{msgStatus.success ? '✓' : '⚠'}</span>
                    <span style={{ fontSize: '14.5px', lineHeight: 1.5 }}>{msgStatus.message}</span>
                </div>
            )}

            <form className="card form" onSubmit={handleSendMessage} noValidate style={{ padding: '30px' }}>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
                    {t('contact.formHelp', 'Please complete the form below. For active emergencies, threats to life, or crimes in progress, do not submit this form — call 991 immediately.')}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                    <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            {t('contact.fullName', 'Full name')} <span style={{ color: '#dc2626' }}>*</span>
                        </span>
                        <input
                            type="text"
                            placeholder="e.g. Abebe Bikila"
                            value={msgForm.fullName}
                            onChange={(e) => {
                                setMsgForm({ ...msgForm, fullName: e.target.value });
                                if (msgErrors.fullName) setMsgErrors({ ...msgErrors, fullName: '' });
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: `1px solid ${msgErrors.fullName ? '#ef4444' : '#cbd5e1'}`,
                                outline: 'none'
                            }}
                        />
                        {msgErrors.fullName && (
                            <small style={{ color: '#dc2626', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                                {msgErrors.fullName}
                            </small>
                        )}
                    </label>

                    <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            {t('contact.emailLabel', 'Email address')} <span style={{ color: '#dc2626' }}>*</span>
                        </span>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={msgForm.email}
                            onChange={(e) => {
                                setMsgForm({ ...msgForm, email: e.target.value });
                                if (msgErrors.email) setMsgErrors({ ...msgErrors, email: '' });
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: `1px solid ${msgErrors.email ? '#ef4444' : '#cbd5e1'}`,
                                outline: 'none'
                            }}
                        />
                        {msgErrors.email && (
                            <small style={{ color: '#dc2626', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                                {msgErrors.email}
                            </small>
                        )}
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                    <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            {t('contact.phoneOptional', 'Phone number (optional)')}
                        </span>
                        <input
                            type="tel"
                            placeholder="e.g. 0911 234567"
                            value={msgForm.phone}
                            onChange={(e) => setMsgForm({ ...msgForm, phone: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                            }}
                        />
                    </label>

                    <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            {t('contact.departmentLabel', 'Subject / Department')}
                        </span>
                        <select
                            value={msgForm.department}
                            onChange={(e) => setMsgForm({ ...msgForm, department: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                                background: '#fff'
                            }}
                        >
                            <option value="General Inquiries">General Public Inquiries</option>
                            <option value="Crime Prevention">Crime Prevention &amp; Community</option>
                            <option value="Traffic Management">Traffic &amp; Road Safety Division</option>
                            <option value="Forensics & Clearance">Police Clearance &amp; Forensic Certifications</option>
                            <option value="Public Complaints">Public Complaints &amp; Professional Standards</option>
                        </select>
                    </label>
                </div>

                <label style={{ display: 'block', marginBottom: '20px' }}>
                    <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        {t('contact.howHelp', 'Your message')} <span style={{ color: '#dc2626' }}>*</span>
                    </span>
                    <textarea
                        rows={5}
                        placeholder={t('contact.messagePlaceholder', 'Describe your enquiry, question, or request in detail (minimum 10 characters)...')}
                        value={msgForm.message}
                        onChange={(e) => {
                            setMsgForm({ ...msgForm, message: e.target.value });
                            if (msgErrors.message) setMsgErrors({ ...msgErrors, message: '' });
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '6px',
                            border: `1px solid ${msgErrors.message ? '#ef4444' : '#cbd5e1'}`,
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                    />
                    {msgErrors.message && (
                        <small style={{ color: '#dc2626', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                            {msgErrors.message}
                        </small>
                    )}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <button
                        className="button"
                        type="submit"
                        disabled={msgSubmitting}
                        style={{ padding: '12px 28px', fontSize: '14.5px', cursor: msgSubmitting ? 'not-allowed' : 'pointer', opacity: msgSubmitting ? 0.7 : 1 }}
                    >
                        {msgSubmitting ? t('contact.sending', 'Sending message…') : t('contact.sendBtn', 'Send message')}
                    </button>
                    <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                        🔒 Secure encrypted transmission to police records
                    </small>
                </div>
            </form>
        </div>
    </Section>
        </>
    );
}
