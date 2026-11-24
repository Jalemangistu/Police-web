import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSite, txt, stripTags } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import LanguageDropdown from './LanguageDropdown';

export function SiteLogo() {
    const s = useSite();
    return s.logo
        ? <img className="siteLogo" src={s.logo} alt={`${txt(s.siteName) || 'Addis Ababa Police'} logo`} />
        : <img className="siteLogo" src="/aap-crest.png" alt="Addis Ababa Police logo" />;
}

const resolvePlatform = (rawPlatform = '', url = '') => {
    const p = stripTags(rawPlatform).toLowerCase().trim();
    const u = (url || '').toLowerCase();
    if (p.includes('facebook') || u.includes('facebook.com') || u.includes('fb.me')) return 'facebook';
    if (p.includes('telegram') || u.includes('t.me') || u.includes('telegram.me')) return 'telegram';
    if (p.includes('twitter') || p.includes('x') || u.includes('twitter.com') || u.includes('x.com')) return 'x';
    if (p.includes('youtube') || u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (p.includes('tiktok') || u.includes('tiktok.com')) return 'tiktok';
    if (p.includes('linkedin') || u.includes('linkedin.com')) return 'linkedin';
    if (p.includes('instagram') || u.includes('instagram.com')) return 'instagram';
    return 'generic';
};

const getSocialIcon = (platform) => {
    switch (platform) {
        case 'facebook':
            return (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            );
        case 'telegram':
            return (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.196 1.006.128.832.922z"/>
                </svg>
            );
        case 'x':
        case 'twitter':
            return (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            );
        case 'youtube':
            return (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            );
        case 'tiktok':
            return (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23.99-.04 2.09.6 2.89.65.81 1.74 1.25 2.77 1.17 1.01-.04 1.95-.63 2.45-1.49.27-.47.38-1.01.38-1.55.03-3.58.01-7.16.02-10.74z"/>
                </svg>
            );
        case 'linkedin':
            return (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            );
        case 'instagram':
            return (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            );
    }
};

const DEFAULT_SOCIAL_LINKS = [
    { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/AddisAbabaPolice' },
    { platform: 'telegram', label: 'Telegram', url: 'https://t.me/AddisAbabaPolice' },
    { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/AddisPolice' },
    { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@AddisAbabaPoliceCommission' },
    { platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@addisababapolice' },
];

export default function Layout({ children }) {
    const s = useSite();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    const emergencyNum = txt(s.emergencyPolice) || '991';

    const activeSocialLinks = (s?.socialLinks && s.socialLinks.length > 0 && s.socialLinks.some(l => l.url))
        ? s.socialLinks.filter(l => l.url).map(l => ({
            platform: resolvePlatform(l.platform, l.url),
            label: stripTags(l.platform) || 'Social Channel',
            url: l.url
        }))
        : DEFAULT_SOCIAL_LINKS;

    return (
        <div className="aap-site-shell">
            {/* Top Bar (Photo 5) */}
            <div className="aap-topbar">
                <div className="aap-topbar-inner">
                    <div className="aap-topbar-left">
                        {t('common.officialPortal', 'Official website of the Addis Ababa Police Commission')}
                    </div>
                    <div className="aap-topbar-right">
                        <a href={`tel:${emergencyNum}`} className="aap-topbar-emergency" title="Emergency Hotline">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>{t('footer.emergencyLabel', 'Emergency')}: <strong>{emergencyNum}</strong></span>
                        </a>
                        <span className="aap-topbar-sep" aria-hidden="true">|</span>
                        <LanguageDropdown />
                    </div>
                </div>
            </div>

            {/* Main Header (Photo 5) */}
            <header className="aap-header">
                <div className="aap-header-top">
                    <div className="aap-header-container">
                        <Link className="aap-brand" to="/">
                            <img className="aap-brand-seal" src={s.logo || '/aap-crest.png'} alt="Addis Ababa Police" />
                            <div className="aap-brand-text">
                                <span className="aap-brand-title">{t('common.aap', 'ADDIS ABABA POLICE')}</span>
                                <span className="aap-brand-sub">{t('common.policeCommission', 'POLICE COMMISSION')}</span>
                            </div>
                        </Link>

                        <div className="aap-header-actions">
                            <button
                                className="aap-search-btn"
                                onClick={() => setSearchOpen((prev) => !prev)}
                                aria-label="Search website"
                                title="Search website"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                            <button
                                className="aap-mobile-toggle"
                                onClick={() => setMobileOpen((prev) => !prev)}
                                aria-label="Toggle navigation"
                            >
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation links bar */}
                <div className="aap-header-nav-wrap">
                    <div className="aap-header-container">
                        <nav className={`aap-main-nav ${mobileOpen ? 'open' : ''}`}>
                            <NavLink to="/" end className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.home', 'HOME')}
                            </NavLink>
                            <NavLink to="/about" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.about', 'ABOUT')}
                            </NavLink>
                            <NavLink to="/services" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.services', 'SERVICES')}
                            </NavLink>
                            <NavLink to="/safety" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.safety', 'SAFETY & ALERTS')}
                            </NavLink>
                            <NavLink to="/news" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.news', 'NEWS & MEDIA')}
                            </NavLink>
                            <NavLink to="/community" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.community', 'COMMUNITY')}
                            </NavLink>
                            <NavLink to="/vacancies" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.vacancies', 'VACANCIES')}
                            </NavLink>
                            <NavLink to="/contact" className={({ isActive }) => isActive ? 'aap-nav-link active' : 'aap-nav-link'} onClick={() => setMobileOpen(false)}>
                                {t('nav.contact', 'CONTACT')}
                            </NavLink>
                        </nav>
                    </div>
                </div>

                {/* Expandable Search Bar */}
                {searchOpen && (
                    <div className="aap-search-bar-wrap">
                        <div className="aap-header-container">
                            <form onSubmit={handleSearchSubmit} className="aap-search-form">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="search"
                                    placeholder={t('footer.searchPlaceholder', 'Search police services, safety notices, news, and guidelines...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="aap-search-submit">{t('footer.searchBtn', 'Search')}</button>
                                <button type="button" onClick={() => setSearchOpen(false)} className="aap-search-close" aria-label="Close search">✕</button>
                            </form>
                        </div>
                    </div>
                )}
            </header>

            {/* Main content body */}
            <main className="aap-main-content">{children}</main>

            {/* Footer (Photo 1) */}
            <footer className="aap-footer">
                <div className="aap-footer-container">
                    <div className="aap-footer-grid">
                        {/* Col 1: Brand */}
                        <div className="aap-foot-col aap-foot-brand-col">
                            <Link className="aap-foot-brand" to="/">
                                <img src={s.logo || '/aap-crest.png'} alt="Addis Ababa Police" className="aap-foot-seal" />
                                <div className="aap-foot-brand-text">
                                    <div className="aap-foot-name">{t('common.aap', 'Addis Ababa Police')}</div>
                                    <div className="aap-foot-sub">{t('common.policeCommission', 'POLICE COMMISSION')}</div>
                                </div>
                            </Link>
                            <p className="aap-foot-lead">
                                {t('footer.missionLead', 'Dedicated to protecting life and property, maintaining peace, and building lasting trust with the people we serve.')}
                            </p>
                        </div>

                        {/* Col 2: Contact Us */}
                        <div className="aap-foot-col">
                            <h4 className="aap-foot-heading">{t('footer.contactUs', 'CONTACT US')}</h4>
                            <ul className="aap-foot-list">
                                <li className="aap-foot-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <span>{t('footer.location', 'Addis Ababa, Ethiopia')}</span>
                                </li>
                                <li className="aap-foot-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    <span>{t('footer.emergencyLabel', 'Emergency')}: <strong>{emergencyNum}</strong></span>
                                </li>
                                <li className="aap-foot-item">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>{t('footer.available24', 'Available 24 hours')}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Col 3: Quick Links */}
                        <div className="aap-foot-col">
                            <h4 className="aap-foot-heading">{t('footer.quickLinks', 'QUICK LINKS')}</h4>
                            <ul className="aap-foot-links">
                                <li><Link to="/services">{t('footer.services', 'Police services')}</Link></li>
                                <li><Link to="/safety">{t('footer.safetyAlerts', 'Safety alerts')}</Link></li>
                                <li><Link to="/news">{t('footer.newsMedia', 'News & media')}</Link></li>
                                <li><Link to="/vacancies">{t('footer.vacanciesCareers', 'Vacancies & Careers')}</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Stay Informed & Social Channels */}
                        <div className="aap-foot-col">
                            <h4 className="aap-foot-heading">{t('footer.stayInformed', 'STAY INFORMED')}</h4>
                            <p className="aap-foot-desc">
                                {t('footer.socialDesc', 'Follow official updates, crime advisories, and public safety announcements.')}
                            </p>

                            {/* Official Social Media Channels */}
                            <div className="aap-foot-socials" aria-label="Official Social Media Channels">
                                {activeSocialLinks.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="aap-foot-social-btn"
                                        aria-label={item.label}
                                        title={item.label}
                                    >
                                        {getSocialIcon(item.platform)}
                                    </a>
                                ))}
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <Link to="/news" className="aap-foot-more-link">
                                    {t('footer.viewUpdates', 'View latest updates')} <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="aap-foot-bottom">
                        <div className="aap-foot-copy">
                            © {new Date().getFullYear()} {t('common.aap', 'Addis Ababa Police')} {t('common.policeCommission', 'Police Commission')}. {t('footer.rights', 'All rights reserved.')}
                        </div>
                        <div className="aap-foot-tagline">
                            {t('footer.tagline', 'Public service • Safety • Trust')}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
