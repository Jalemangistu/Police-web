import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';

import './styles.css';
import './home-tab.js';
import './i18n';

// Context & utilities
import { SiteCtx, shadeColor } from './context/SiteContext';
import { api } from './utils/api';

// Layout
import Layout from './components/Layout';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import News from './pages/News';
import Article from './pages/Article';
import Safety from './pages/Safety';
import Community from './pages/Community';
import Contact from './pages/Contact';
import Directory from './pages/Directory';
import Legal from './pages/Legal';
import Vacancies from './pages/Vacancies';
import Form from './pages/Form';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import CommunityRegister from './pages/CommunityRegister';

// Admin
import AdminPanel from './AdminPanel.jsx';
import Login from './Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

// ---------------------------------------------------------------------------
// Admin gate — checks session token before rendering the admin panel
// ---------------------------------------------------------------------------
function AdminGate() {
    const nav = useNavigate();
    const [status, setStatus] = useState('checking');
    const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    useEffect(() => {
        const token = sessionStorage.getItem('adminToken');
        if (!token) {
            nav('/admin/login', { replace: true });
            return;
        }
        fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(() => setStatus('ready'))
            .catch(() => {
                sessionStorage.removeItem('adminToken');
                nav('/admin/login', { replace: true });
            });
    }, [nav]);

    return status === 'ready'
        ? <AdminPanel />
        : <div className="loginPage" aria-live="polite">Checking secure staff session…</div>;
}

// ---------------------------------------------------------------------------
// Public site — all public-facing routes wrapped in the shared Layout
// ---------------------------------------------------------------------------
function PublicSite() {
    return (
        <Layout>
            <Routes>
                <Route path="/"              element={<Home />} />
                <Route path="/about"         element={<About />} />
                <Route path="/services"      element={<Services />} />
                <Route path="/services/:id"  element={<Form />} />
                <Route path="/safety"        element={<Safety />} />
                <Route path="/safety/resources" element={<Documents />} />
                <Route path="/safety/resources/:slug" element={<DocumentView />} />
                <Route path="/documents"     element={<Documents />} />
                <Route path="/documents/:slug" element={<DocumentView />} />
                <Route path="/news"          element={<News />} />
                <Route path="/news/:slug"    element={<Article />} />
                <Route path="/community"     element={<Community />} />
                <Route path="/community/register" element={<CommunityRegister />} />
                <Route path="/community/:programId" element={<CommunityRegister />} />
                <Route path="/contact"       element={<Contact />} />
                <Route path="/stations"      element={<Directory />} />
                <Route path="/legal"         element={<Legal />} />
                <Route path="/vacancies"     element={<Vacancies />} />
                <Route path="/recruitment"   element={<Form recruit />} />
                <Route path="*"             element={<Home />} />
            </Routes>
        </Layout>
    );
}

// ---------------------------------------------------------------------------
// Root app — loads site settings, applies theme, and mounts all routes
// ---------------------------------------------------------------------------
function App() {
    const [site, setSite] = useState({});

    // Load global site settings from the API
    useEffect(() => {
        api('/settings').then(setSite).catch(() => {});
        const sync = (event) => setSite(event.detail);
        window.addEventListener('site-settings-saved', sync);
        return () => window.removeEventListener('site-settings-saved', sync);
    }, []);

    // Keep the favicon in sync with the site logo
    useEffect(() => {
        const icon =
            document.querySelector("link[rel~='icon']") ||
            document.head.appendChild(document.createElement('link'));
        icon.rel = 'icon';
        icon.href = site.logo || '/aap-crest.png';
    }, [site.logo]);

    // Apply dynamic theme colours as CSS custom properties
    useEffect(() => {
        const primary =
            /^#[0-9a-f]{6}$/i.test(site.themePrimary || '')
                ? site.themePrimary
                : /^#[0-9a-f]{6}$/i.test(site.themeColor || '')
                ? site.themeColor
                : '#0a2b5a';

        const secondary =
            /^#[0-9a-f]{6}$/i.test(site.themeSecondary || '')
                ? site.themeSecondary
                : shadeColor(primary, 0.16);

        const root = document.documentElement.style;
        root.setProperty('--aap-primary',      primary);
        root.setProperty('--aap-primary-deep', shadeColor(primary, -0.28));
        root.setProperty('--aap-secondary',    secondary);
        root.setProperty('--aap-alert',        shadeColor(primary, -0.12));
        root.setProperty('--system-color',     primary);
    }, [site.themeColor, site.themePrimary, site.themeSecondary]);

    return (
        <SiteCtx.Provider value={site}>
            <Routes>
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/forgot-password" element={<ForgotPassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/admin/reset-password/:token" element={<ResetPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/admin"       element={<AdminGate />} />
                <Route path="/admin/*"     element={<AdminGate />} />
                <Route path="*"           element={<PublicSite />} />
            </Routes>
        </SiteCtx.Provider>
    );
}

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
