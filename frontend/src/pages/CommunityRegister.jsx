import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';

const PROGRAMS = {
    'neighborhood-watch': {
        key: 'neighborhood_watch',
        id: 'neighborhood-watch',
        title: 'Neighborhood Watch Programme',
        badge: 'COMMUNITY SAFETY',
        subtitle: 'Connect with neighbors and local police to protect your neighborhood.',
        lead: 'Neighborhood Watch groups empower residents to work hand-in-hand with their sub-city police station, sharing alerts, organizing local safety walks, and resolving security concerns.',
        benefits: [
            'Direct communication channel with your local woreda police liaison',
            'Timely public safety and crime prevention alerts for your zone',
            'Monthly community security review meetings with local officers',
            'Guidance on home security, lighting, and neighborhood risk reduction'
        ],
        commitments: [
            'Attend periodic local coordination meetings (in-person or virtual)',
            'Share verified safety observations with the community coordinator',
            'Foster a welcoming, supportive, and vigilant street environment'
        ]
    },
    'volunteer': {
        key: 'volunteer',
        id: 'volunteer',
        title: 'Police Volunteer Programmes',
        badge: 'VOLUNTEER SERVICE',
        subtitle: 'Support public safety education, community outreach, and special initiatives.',
        lead: 'Civic volunteers contribute their skills to support non-enforcement police activities, including safety education in schools, road safety awareness, community events, and language translation.',
        benefits: [
            'Formal volunteer training conducted by the Addis Ababa Police Academy',
            'Certificate of civic service recognition from the Police Commission',
            'Opportunity to contribute to community education and youth guidance',
            'Flexible scheduling tailored around your profession or studies'
        ],
        commitments: [
            'Dedicate 2-4 hours per week or month based on your selected initiative',
            'Uphold the core values of integrity, neutrality, and respectful public service',
            'Participate in annual volunteer briefing and safety workshops'
        ]
    },
    'youth-engagement': {
        key: 'youth_engagement',
        id: 'youth-engagement',
        title: 'Youth Engagement & Cadet Initiative',
        badge: 'YOUTH & FUTURE',
        subtitle: 'Inspiring young people to lead positive change and safety in Addis Ababa.',
        lead: 'Our youth initiatives create constructive spaces for dialogue, sports activities, digital safety awareness, and leadership development in collaboration with schools and youth centers.',
        benefits: [
            'Participation in police-sponsored sports tournaments and arts activities',
            'Mentorship opportunities with experienced officers and community leaders',
            'Digital safety and cybercrime awareness workshops',
            'Leadership and peer-mediator certification courses'
        ],
        commitments: [
            'Active involvement in local school or youth center activities',
            'Promote peace, anti-bullying, and substance abuse prevention among peers',
            'Champion community service and neighborhood pride'
        ]
    }
};

const SUB_CITIES = [
    'Addis Ketema',
    'Akaki Kality',
    'Arada',
    'Bole',
    'Gullele',
    'Kirkos',
    'Kolfe Keranio',
    'Lemi Kura',
    'Lideta',
    'Nifas Silk-Lafto',
    'Yeka'
];

export default function CommunityRegister() {
    const { programId } = useParams();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Determine initial program selection
    const queryProg = searchParams.get('program');
    const resolvedId = programId || (queryProg === 'volunteer' ? 'volunteer' : queryProg === 'youth_engagement' || queryProg === 'youth-engagement' ? 'youth-engagement' : 'neighborhood-watch');
    const [activeProgram, setActiveProgram] = useState(PROGRAMS[resolvedId] ? resolvedId : 'neighborhood-watch');

    useEffect(() => {
        if (programId && PROGRAMS[programId]) {
            setActiveProgram(programId);
        } else if (queryProg) {
            const match = Object.keys(PROGRAMS).find(k => k === queryProg || PROGRAMS[k].key === queryProg);
            if (match) setActiveProgram(match);
        }
    }, [programId, queryProg]);

    const progInfo = PROGRAMS[activeProgram] || PROGRAMS['neighborhood-watch'];

    const [form, setForm] = useState({
        program: progInfo.key,
        fullName: '',
        phone: '',
        email: '',
        subCity: 'Bole',
        woreda: '',
        availability: 'Flexible',
        message: ''
    });

    useEffect(() => {
        setForm(prev => ({ ...prev, program: progInfo.key }));
    }, [progInfo.key]);

    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleProgramSelect = (id) => {
        setActiveProgram(id);
        navigate(`/community/${id}`, { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const payload = {
                program: form.program || progInfo.key,
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                subCity: form.subCity,
                message: [
                    form.woreda ? `Woreda: ${form.woreda}` : '',
                    form.availability ? `Availability: ${form.availability}` : '',
                    form.message ? `Details: ${form.message}` : ''
                ].filter(Boolean).join(' | ') || undefined
            };

            const res = await api('/community/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            setStatus({
                type: 'success',
                message: res?.message || 'Thank you for registering! Your application has been received successfully.'
            });
            setSubmitted(true);
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.message || 'Unable to submit your registration. Please check your network and try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="aap-community-reg-page" style={{ background: '#fbfaf7', minHeight: '80vh', paddingBottom: '90px' }}>
            {/* Header / Hero */}
            <section className="pagehero">
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <Link to="/community" style={{ color: '#d9b048', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                            ← {t('community.backLink', 'Community Policing')}
                        </Link>
                        <span style={{ color: '#64748b' }}>/</span>
                        <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{progInfo.badge}</span>
                    </div>

                    <h1 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(2.4rem, 4vw, 3.2rem)',
                        fontWeight: 700,
                        margin: '0 0 16px',
                        lineHeight: 1.15
                    }}>
                        {progInfo.title}
                    </h1>

                    <p style={{
                        fontSize: '1.15rem',
                        color: '#cbd5e1',
                        maxWidth: '720px',
                        margin: 0,
                        lineHeight: 1.6
                    }}>
                        {progInfo.subtitle}
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <div style={{ maxWidth: '1240px', margin: '40px auto 0', padding: '0 24px' }}>
                {/* Program Selector Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '36px',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '16px'
                }}>
                    {Object.values(PROGRAMS).map((prog) => {
                        const isActive = prog.id === activeProgram;
                        return (
                            <button
                                key={prog.id}
                                onClick={() => handleProgramSelect(prog.id)}
                                type="button"
                                style={{
                                    padding: '12px 22px',
                                    borderRadius: '6px',
                                    border: isActive ? '1px solid #0c1c34' : '1px solid #cbd5e1',
                                    background: isActive ? '#0c1c34' : '#ffffff',
                                    color: isActive ? '#ffffff' : '#334155',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span>{prog.title}</span>
                                {isActive && <span style={{ color: '#d9b048' }}>✓</span>}
                            </button>
                        );
                    })}
                </div>

                <div className="aap-comm-grid">
                    {/* Left Column: Program Information */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '36px 30px',
                        boxShadow: '0 4px 16px rgba(12, 28, 52, 0.04)'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            background: '#fcf6e9',
                            color: '#c59b27',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            marginBottom: '16px'
                        }}>
                            ABOUT THIS PROGRAMME
                        </div>

                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '1.8rem',
                            color: '#0c1c34',
                            margin: '0 0 16px',
                            fontWeight: 700
                        }}>
                            {progInfo.title}
                        </h2>

                        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
                            {progInfo.lead}
                        </p>

                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0c1c34', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            What you receive &amp; experience
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {progInfo.benefits.map((b, i) => (
                                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                                    <span>{b}</span>
                                </li>
                            ))}
                        </ul>

                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0c1c34', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            Expected commitments
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {progInfo.commitments.map((c, i) => (
                                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                                    <span style={{ color: '#d9b048', fontWeight: 'bold' }}>•</span>
                                    <span>{c}</span>
                                </li>
                            ))}
                        </ul>

                        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#94a3b8' }}>
                            Questions? Call community liaison at <strong style={{ color: '#0c1c34' }}>991</strong> or contact your nearest station.
                        </div>
                    </div>

                    {/* Right Column: Registration Form */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '36px 32px',
                        boxShadow: '0 4px 20px rgba(12, 28, 52, 0.05)'
                    }}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    margin: '0 auto 20px'
                                }}>
                                    ✓
                                </div>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#0c1c34', margin: '0 0 12px' }}>
                                    Registration Received!
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 28px' }}>
                                    {status.message}
                                </p>
                                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubmitted(false);
                                            setForm(prev => ({ ...prev, fullName: '', phone: '', email: '', message: '' }));
                                        }}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: '#ffffff',
                                            color: '#0c1c34',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Register another person
                                    </button>
                                    <Link
                                        to="/community"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '12px 24px',
                                            borderRadius: '6px',
                                            background: '#0c1c34',
                                            color: '#ffffff',
                                            textDecoration: 'none',
                                            fontWeight: 700
                                        }}
                                    >
                                        Back to Community
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <h3 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '1.7rem',
                                        color: '#0c1c34',
                                        margin: '0 0 6px'
                                    }}>
                                        Register your interest
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                                        Complete the details below to join the <strong>{progInfo.title}</strong>.
                                    </p>
                                </div>

                                {status.message && (
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: '6px',
                                        background: status.type === 'error' ? '#fef2f2' : '#f0fdf4',
                                        border: `1px solid ${status.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                                        color: status.type === 'error' ? '#b91c1c' : '#15803d',
                                        fontSize: '14px'
                                    }}>
                                        {status.message}
                                    </div>
                                )}

                                {/* Selected Programme */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Selected Initiative *
                                    </label>
                                    <select
                                        name="program"
                                        value={activeProgram}
                                        onChange={(e) => handleProgramSelect(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '6px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '15px',
                                            color: '#0c1c34',
                                            background: '#ffffff'
                                        }}
                                    >
                                        <option value="neighborhood-watch">Neighborhood Watch Programme</option>
                                        <option value="volunteer">Police Volunteer Programmes</option>
                                        <option value="youth-engagement">Youth Engagement &amp; Cadet Initiative</option>
                                    </select>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        placeholder="e.g. Almaz Bekele"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '6px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '15px',
                                            color: '#0c1c34',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                {/* Phone & Email Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            placeholder="0911 000 000"
                                            value={form.phone}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                border: '1.5px solid #cbd5e1',
                                                fontSize: '15px',
                                                color: '#0c1c34',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Email Address (optional)
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="name@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                border: '1.5px solid #cbd5e1',
                                                fontSize: '15px',
                                                color: '#0c1c34',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Sub-City & Woreda Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Sub-City (Kifle Ketema) *
                                        </label>
                                        <select
                                            name="subCity"
                                            value={form.subCity}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                border: '1.5px solid #cbd5e1',
                                                fontSize: '15px',
                                                color: '#0c1c34',
                                                background: '#ffffff',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            {SUB_CITIES.map(sc => (
                                                <option key={sc} value={sc}>{sc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Woreda / Area
                                        </label>
                                        <input
                                            type="text"
                                            name="woreda"
                                            placeholder="e.g. Woreda 03, Around Edna Mall"
                                            value={form.woreda}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                border: '1.5px solid #cbd5e1',
                                                fontSize: '15px',
                                                color: '#0c1c34',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Availability */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Availability / Preferred Schedule
                                    </label>
                                    <select
                                        name="availability"
                                        value={form.availability}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '6px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '15px',
                                            color: '#0c1c34',
                                            background: '#ffffff',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="Flexible">Flexible schedule</option>
                                        <option value="Weekends">Weekends only</option>
                                        <option value="Weekdays">Weekday mornings/afternoons</option>
                                        <option value="Evenings">Evenings only</option>
                                    </select>
                                </div>

                                {/* Message / Motivation */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Why would you like to participate? (optional)
                                    </label>
                                    <textarea
                                        name="message"
                                        rows="3"
                                        placeholder="Tell us about your background, neighborhood concerns, or how you wish to help..."
                                        value={form.message}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '6px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '15px',
                                            color: '#0c1c34',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                            resize: 'vertical'
                                        }}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        background: '#d9b048',
                                        color: '#0c1c34',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '16px 28px',
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        letterSpacing: '0.04em',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        opacity: submitting ? 0.7 : 1,
                                        transition: 'all 0.2s ease',
                                        marginTop: '10px'
                                    }}
                                >
                                    {submitting ? 'Submitting registration…' : 'Submit Registration →'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
