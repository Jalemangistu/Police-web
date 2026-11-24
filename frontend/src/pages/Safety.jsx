import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';
import { api } from '../utils/api';

export default function Safety() {
    const s = useSite();
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState([]);
    const [featuredDocs, setFeaturedDocs] = useState([]);

    useEffect(() => {
        api('/alerts').then(setAlerts).catch(() => {});
        api('/documents')
            .then((docs) => {
                if (Array.isArray(docs)) {
                    setFeaturedDocs(docs.slice(0, 3));
                }
            })
            .catch(() => {});
    }, []);

    // Locate the dynamic Road Safety Alert (or fall back to official default)
    const roadSafetyAlert = alerts.find(a => 
        a.category === 'road_safety' || 
        (typeof a.title === 'object' && a.title?.en?.toLowerCase().includes('traffic')) || 
        (typeof a.title === 'string' && a.title?.toLowerCase().includes('traffic'))
    );

    const generalAlerts = alerts.filter(a => a._id !== roadSafetyAlert?._id);
    const displayAlerts = generalAlerts.length
        ? generalAlerts
        : [{
            _id: 'a',
            level: 'Safety notice',
            title: { en: 'Stay alert and use official channels' },
            message: { en: 'Report immediate danger through emergency services. Never share personal information with unverified sources.' },
        }];

    const roadAlertDate = roadSafetyAlert?.updatedAt || roadSafetyAlert?.createdAt;
    const formattedRoadDate = roadAlertDate
        ? new Date(roadAlertDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

    const roadSeverityLevel = (roadSafetyAlert?.level || 'high').toLowerCase();
    const severityColors = {
        critical: { bg: '#fef2f2', border: '#f87171', text: '#991b1b', dot: '#dc2626', label: 'Critical Alert' },
        high: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626', label: 'High Alert' },
        medium: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b', label: 'Advisory Alert' },
        low: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#22c55e', label: 'Routine Notice' }
    }[roadSeverityLevel] || { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626', label: 'High Alert' };

    const resourceCards = [
        { key: 'protect_home', title: t('safety.protectHome', 'Protect your home') },
        { key: 'safe_online', title: t('safety.safeOnline', 'Stay safe online') },
        { key: 'road_safety', title: t('safety.roadSafety', 'Road safety') },
        { key: 'missing_persons', title: t('safety.missingPersons', 'Missing persons alerts') },
        { key: 'most_wanted', title: t('safety.mostWanted', 'Most wanted notices') },
        { key: 'safety_advisories', title: t('safety.safetyAdvisories', 'Safety advisories') },
    ];

    return (
        <>
            <Hero tag={t('safety.tag', 'SAFETY & ALERTS')} title={txt(s.safetyHeroTitle) || t('safety.defaultHeroTitle', 'Public safety alerts and crime prevention advice')}>
                <p>{txt(s.safetyHeroLead) || t('safety.defaultHeroLead', 'Current advisories, crime prevention guidance, and public security information.')}</p>
            </Hero>

            {/* Road Safety Alert Section */}
            <Section title={t('safety.roadSafetyAlertTitle', 'Road Safety & Traffic Alert')}>
                <article
                    className="alert"
                    style={{
                        borderLeft: '4px solid #b21e2b',
                        background: '#fff6f5',
                        padding: '26px',
                        borderRadius: '0 8px 8px 0',
                        position: 'relative',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: '#fee2e2',
                                    color: '#b21e2b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                                aria-hidden="true"
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3c-.1.2-.1.4-.1.6v4.5c0 .6.4 1 1 1h2" />
                                    <circle cx="7" cy="17" r="2" />
                                    <path d="M9 17h6" />
                                    <circle cx="17" cy="17" r="2" />
                                </svg>
                            </div>
                            <div>
                                <small style={{ color: '#b21e2b', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', fontSize: '11.5px' }}>
                                    {t('safety.roadSafetyAlertBadge', 'TRAFFIC & ROAD SAFETY')}
                                </small>
                                <span style={{ fontSize: '12.5px', color: '#657586', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                    <span>📅</span> {formattedRoadDate}
                                </span>
                            </div>
                        </div>

                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                background: severityColors.bg,
                                color: severityColors.text,
                                border: `1px solid ${severityColors.border}`
                            }}
                        >
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: severityColors.dot }}></span>
                            Severity: {severityColors.label}
                        </span>
                    </div>

                    <h2 style={{ font: "700 24px 'Playfair Display', serif", margin: '14px 0 10px', color: '#142940' }}>
                        {(roadSafetyAlert && txt(roadSafetyAlert.title)) || t('safety.roadSafetyAlertHeading', 'Corridor Traffic Regulation & Road Safety Enforcement')}
                    </h2>

                    <p style={{ color: '#657586', lineHeight: 1.65, margin: '0 0 16px', fontSize: '15px' }}>
                        {(roadSafetyAlert && txt(roadSafetyAlert.message)) || t('safety.roadSafetyAlertDesc', 'Active traffic safety advisory across Addis Ababa corridors. Strict enforcement of 50 km/h speed limits, mandatory yielding at pedestrian crossings, and vehicle spacing in rainy weather are in effect. Follow lane markings and heed officer directions.')}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(178, 30, 43, 0.12)', paddingTop: '14px', fontSize: '13px', color: '#64748b' }}>
                        <span>📍 Corridors: {roadSafetyAlert?.corridors || 'Meskel Square · Bole Road · Ring Road Interchange'}</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            🚨 {roadSafetyAlert?.hotline ? `Traffic Hotline: ${roadSafetyAlert.hotline}` : t('safety.roadSafetyHotline', 'Traffic Operations Hotline: 991 / 011 552 4433')}
                        </span>
                    </div>
                </article>
            </Section>

            <Section title={t('safety.currentAlerts', 'Current public safety alerts')}>
                <div className="grid two">
                    {displayAlerts.map((a) => (
                        <article className="alert" key={a._id}>
                            <small>{a.level}</small>
                            <h2>{txt(a.title)}</h2>
                            <p>{txt(a.message)}</p>
                        </article>
                    ))}
                </div>
            </Section>

            <Section title={t('safety.crimeResources', 'Crime prevention resources')}>
                <div className="grid three">
                    {resourceCards.map((x) => (
                        <article className="card" key={x.key}>
                            <i>✦</i>
                            <h3>{x.title}</h3>
                            <p>{t('safety.resourceText', 'Practical guidance, public notices, and resources for citizens.')}</p>
                            <Link to={`/safety/resources?category=${x.key}`}>
                                {t('safety.exploreResources', 'Explore resources →')}
                            </Link>
                        </article>
                    ))}
                </div>
            </Section>

            {featuredDocs.length > 0 && (
                <Section title={t('safety.featuredDocsTitle', 'Featured Safety Documents & Directives')}>
                    <div className="grid three">
                        {featuredDocs.map((doc) => (
                            <article className="card docPreviewCard" key={doc._id || doc.slug}>
                                <small className="docCardRefBadge">{doc.documentNumber || 'OFFICIAL DIRECTIVE'}</small>
                                <h3>{txt(doc.title)}</h3>
                                <p>{txt(doc.summary)}</p>
                                <div className="docCardFooter">
                                    <Link to={`/safety/resources/${doc.slug || doc._id}`}>
                                        {t('documents.readDocument', 'Read Document')} →
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '36px' }}>
                        <Link to="/safety/resources" className="button">
                            {t('safety.viewAllDocsArchive', 'Browse All Safety Documents Archive →')}
                        </Link>
                    </div>
                </Section>
            )}
        </>
    );
}
