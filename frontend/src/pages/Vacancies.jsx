import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';
import { useSite, txt } from '../context/SiteContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const DEFAULT_VACANCIES = [
    {
        _id: 'v-1',
        title: {
            en: 'Cadet Police Officer (Regular Service)',
            am: 'የፖሊስ ካዴት መኮንን (መደበኛ አገልግሎት)',
            om: 'Miseensa Poolisii Kaadeetii'
        },
        department: 'Operations & Patrol Directorate',
        location: 'Addis Ababa Metropolitan Divisions (All 11 Sub-Cities)',
        deadline: '30 Dec 2026',
        employmentType: 'Full-time / Active Duty',
        description: {
            en: 'Entry-level cadet recruitment for patrol operations, incident response, and neighborhood protection. Full academy training provided upon selection.',
            am: 'ለመደበኛ የጥበቃ፣ የፈጣን ምላሽ እና የከተማ ሰላም ማስከበር ስራዎች የሚመለመሉ የፖሊስ ካዴት መኮንኖች ክፍት የስራ ቦታ።',
            om: 'Hojii eegumsaa, deebii hatattamaa fi nageenya eegsisuuf miseensota kaadeetii haaraa qacaruuf dorgommii banaa.'
        },
        requirements: {
            en: 'High school completion or diploma; Age 18–28; Ethiopian citizenship; clean criminal record; medical and physical fitness clearance.',
            am: 'የሁለተኛ ደረጃ ትምህርት ወይም ዲፕሎማ ያጠናቀቀ/ች፤ ዕድሜ ከ18-28፤ ከማንኛውም ወንጀል ነጻ፤ የህክምና እና የአካል ብቃት ማረጋገጫ።',
            om: 'Kutaa 12 kan xumure/diploma; Umuriin 18-28; Galmee yakkaa irraa bilisa; Fayyummaa qaamaa kan qabu.'
        }
    },
    {
        _id: 'v-2',
        title: {
            en: 'Cybercrime Forensic Investigator',
            am: 'የሳይበር ወንጀል ፎረንሲክ መርማሪ',
            om: 'Qorataa Saayibarii fi Ragaa Diijitaalaa'
        },
        department: 'Digital Forensics & Cyber Investigation Unit',
        location: 'Police Headquarters, Mexico Square, Addis Ababa',
        deadline: '15 Jan 2027',
        employmentType: 'Civilian Professional',
        description: {
            en: 'Specialist role investigating electronic fraud, system breaches, unauthorized data access, and digital forensic evidence recovery for judicial proceedings.',
            am: 'የኤሌክትሮኒክስ ማጭበርበር፣ የሲስተም ጥሰት እና የዲጂታል ማስረጃዎችን የመመርመር እና የማስረጃ ትንተና ስራ።',
            om: 'Yakka saayibarii, gowwoomsaa elektirooniksii fi ragaalee diijitaalaa qorachuu fi xiinxaluu.'
        },
        requirements: {
            en: 'BSc in Computer Science, Cybersecurity, Information Systems, or related field; 2+ years of relevant security/forensic analysis experience.',
            am: 'በኮምፒውተር ሳይንስ፣ ሳይበር ደህንነት ወይም ተዛማጅ መስክ የመጀመሪያ ዲግሪ እና 2+ ዓመት አግባብነት ያለው የስራ ልምድ።',
            om: 'Digirii jalqabaa Saayinsii Kompiwitaraa ykn Nageenya Saayibarii; Muuxannoo hojii waggaa 2 fi isaa ol.'
        }
    },
    {
        _id: 'v-3',
        title: {
            en: 'Traffic Operations & Incident Specialist',
            am: 'የትራፊክ ደህንነት እና ቁጥጥር ባለሙያ',
            om: 'Ogeessa Nageenya Tiraafikaa Magaalaa'
        },
        department: 'Traffic Management & Highway Patrol Directorate',
        location: 'City Corridor Management Commands, Addis Ababa',
        deadline: '20 Jan 2027',
        employmentType: 'Full-time / Specialist',
        description: {
            en: 'Enforcing metropolitan road regulations, automated speed monitoring, major corridor collision response, and road safety education campaigns.',
            am: 'የከተማውን የትራፊክ ደንቦች ማስከበር፣ የፍጥነት ቁጥጥር እና የአደጋ መከላከል ግንዛቤ ማስጨበጫ ስራዎች።',
            om: "Seera tiraafikaa kabachiisuu, to'annoo saffisaa fi ittisa balaa konkolaataa irratti hojjechuu."
        },
        requirements: {
            en: 'Diploma or Degree in Transport Management, Law Enforcement, or related field; Valid driver license; Good communication skills.',
            am: 'በትራንስፖርት ማኔጅመንት፣ ፖሊስ ሳይንስ ወይም ተዛማጅ መስክ ዲፕሎማ ወይም ዲግሪ፤ ህጋዊ የመንጃ ፈቃድ።',
            om: 'Tajaajila Geejjibaa ykn Saayinsii Poolisiitiin Diploomaa ykn Digirii; Hayyama konkolaachisummaa.'
        }
    },
    {
        _id: 'v-4',
        title: {
            en: 'Community Outreach & Youth Engagement Specialist',
            am: 'የማህበረሰብ ፖሊሲንግ እና የወጣቶች አስተባባሪ',
            om: 'Qindeessaa Poolisii Hawaasaa fi Dargaggootaa'
        },
        department: 'Crime Prevention & Community Policing Directorate',
        location: 'Sub-City Police Commands, Addis Ababa',
        deadline: '05 Feb 2027',
        employmentType: 'Civilian Professional',
        description: {
            en: 'Coordinating neighborhood safety committees, youth anti-crime clubs, volunteer programs, and citizen-police consultative forums.',
            am: 'የሰፈር ደህንነት ኮሚቴዎችን፣ የወጣቶች የወንጀል መከላከያ ክበባትን እና የህዝብ ግንኙነት መድረኮችን የማስተባበር ስራ።',
            om: 'Koree nageenya naannoo, kilaba dargaggootaa fi waltumsa poolisii fi hawaasaa qindeessuu.'
        },
        requirements: {
            en: 'BA in Sociology, Social Work, Public Administration, or related discipline; strong community engagement and conflict mediation abilities.',
            am: 'በሶሲዮሎጂ፣ ማህበራዊ ስራ፣ የህዝብ አስተዳደር ወይም ተዛማጅ መስክ የመጀመሪያ ዲግሪ።',
            om: 'Digirii Soosiyoolojii, Hojii Hawaasummaa ykn Bulchiinsa Ummataa; Dandeettii hariiroo hawaasaa.'
        }
    },
    {
        _id: 'v-5',
        title: {
            en: '991 Emergency Dispatch & Communications Operator',
            am: 'የ991 ድንገተኛ ጥሪ ተቀባይ እና አስተባባሪ',
            om: 'Ogeessa Sarara Hatattamaa 991'
        },
        department: 'Command & Emergency Dispatch Directorate',
        location: 'Central Police Command Center, Addis Ababa',
        deadline: '28 Feb 2027',
        employmentType: 'Rotational Shift / Dispatch',
        description: {
            en: 'Receiving incoming citizen distress calls, triaging emergency incidents, dispatching frontline patrol units, and coordinating with ambulance/fire services.',
            am: 'የህዝብ የአስቸኳይ ጊዜ ጥሪዎችን መቀበል፣ መመደብ እና የፈጣን ምላሽ ሰጪ ክፍሎችን በሬዲዮ ማስተባበር።',
            om: "Bilbila hatattamaa ummataa fudhachuu, adda baasuu fi garee deebii hatattamaa qindeessuu."
        },
        requirements: {
            en: 'Diploma or Degree; multi-lingual fluency (Amharic and Afaan Oromoo required, English advantageous); ability to work under high pressure on 24/7 rotational shifts.',
            am: 'ዲፕሎማ ወይም ዲግሪ፤ አማርኛ እና አፋን ኦሮሞ አቀላጥፎ መናገር የሚችል/የምትችል፤ በፈረቃ ለመስራት ፍቃደኛ።',
            om: "Diploomaa ykn Digirii; Afaan Oromoo fi Amaariffa sirriitti kan danda'u; Dabaree sa'aatii 24 hojjechuuf qophii kan ta'e."
        }
    }
];

export default function Vacancies() {
    const s = useSite();
    const { t } = useTranslation();
    const [vacancies, setVacancies] = useState(DEFAULT_VACANCIES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('all');

    /* Apply Modal State */
    const [activeApplyVacancy, setActiveApplyVacancy] = useState(null);
    const [applyForm, setApplyForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        educationLevel: 'Bachelor Degree',
        statement: ''
    });
    const [applyErrors, setApplyErrors] = useState({});
    const [applySubmitting, setApplySubmitting] = useState(false);
    const [applyResult, setApplyResult] = useState(null);

    useEffect(() => {
        fetch(`${API}/vacancies`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setVacancies(data);
                }
            })
            .catch(() => { });
    }, []);

    const departments = ['all', ...new Set(vacancies.map(v => v.department).filter(Boolean))];

    const filteredVacancies = vacancies.filter(v => {
        const titleStr = typeof v.title === 'object' ? `${v.title?.en || ''} ${v.title?.am || ''} ${v.title?.om || ''}` : String(v.title || '');
        const descStr = typeof v.description === 'object' ? `${v.description?.en || ''} ${v.description?.am || ''} ${v.description?.om || ''}` : String(v.description || '');
        const deptStr = String(v.department || '');
        const matchesQuery = !searchQuery.trim() ||
            titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            descStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deptStr.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDept === 'all' || v.department === selectedDept;
        return matchesQuery && matchesDept;
    });

    const openApplyModal = (vac) => {
        setActiveApplyVacancy(vac);
        setApplyResult(null);
        setApplyErrors({});
        setApplyForm({
            fullName: '',
            email: '',
            phone: '',
            address: '',
            educationLevel: 'Bachelor Degree',
            statement: ''
        });
    };

    const closeApplyModal = () => {
        setActiveApplyVacancy(null);
        setApplyResult(null);
        setApplyErrors({});
    };

    const validateApplyForm = () => {
        const errs = {};
        if (!applyForm.fullName.trim() || applyForm.fullName.trim().length < 2) {
            errs.fullName = 'Full name is required (minimum 2 characters).';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!applyForm.email.trim() || !emailRegex.test(applyForm.email.trim())) {
            errs.email = 'Valid email address is required.';
        }
        if (!applyForm.phone.trim() || applyForm.phone.trim().length < 9) {
            errs.phone = 'Valid phone number is required.';
        }
        if (!applyForm.address.trim()) {
            errs.address = 'Residential sub-city / address is required.';
        }
        if (!applyForm.statement.trim() || applyForm.statement.trim().length < 20) {
            errs.statement = 'Please provide a statement of qualifications (minimum 20 characters).';
        }
        setApplyErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!validateApplyForm()) return;

        setApplySubmitting(true);
        setApplyResult(null);

        const positionName = activeApplyVacancy ? (txt(activeApplyVacancy.title) || activeApplyVacancy.title?.en || 'Police Position') : 'Cadet Police Officer (Regular Service)';

        const payload = {
            position: positionName,
            fullName: applyForm.fullName.trim(),
            email: applyForm.email.trim(),
            phone: applyForm.phone.trim(),
            address: applyForm.address.trim(),
            educationLevel: applyForm.educationLevel,
            statement: `[Position: ${positionName}] ${applyForm.statement.trim()}`
        };

        try {
            let res = await fetch(`${API}/forms/recruitment/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 404) {
                res = await fetch(`${API}/recruitment/applications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const contentType = res.headers.get('content-type') || '';
            let data = null;
            if (contentType.includes('application/json')) {
                try {
                    data = await res.json();
                } catch {
                    data = null;
                }
            } else {
                const text = await res.text().catch(() => '');
                data = { message: text && text.length < 250 ? text : `Server returned status ${res.status}` };
            }

            if (res.ok) {
                setApplyResult({
                    success: true,
                    message: data?.message || `Your application for "${positionName}" has been successfully recorded. You will be contacted for document verification.`
                });
            } else {
                setApplyResult({
                    success: false,
                    message: data?.message || 'Submission error. Please verify your details.'
                });
            }
        } catch {
            setApplyResult({
                success: false,
                message: 'Network error connecting to police recruitment server. Please try again later.'
            });
        }
        setApplySubmitting(false);
    };

    return (
        <>
            <Hero tag={t('vacancies.tag', 'CAREERS & OPPORTUNITIES')} title={t('vacancies.title', 'Job Openings & Career Opportunities')}>
                <p>{t('vacancies.lead', 'Join the Addis Ababa Police Commission. Explore public safety, investigative, technical, and civilian roles dedicated to protecting our capital.')}</p>
            </Hero>

            {/* Overview Banner */}
            <section className="container section" style={{ paddingTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #b21e2b', background: '#ffffff' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{t('vacancies.equalOpportunity', 'Equal Opportunity')}</strong>
                        <small style={{ color: '#64748b', fontSize: '13px' }}>{t('vacancies.equalOpportunityDesc', 'Merit-based recruitment adhering to federal and city civil service standards.')}</small>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #c9a64a', background: '#ffffff' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{t('vacancies.subCityDivisions', '11 Sub-City Divisions')}</strong>
                        <small style={{ color: '#64748b', fontSize: '13px' }}>{t('vacancies.subCityDivisionsDesc', 'Operational deployment across all sub-cities and specialized commands.')}</small>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #0284c7', background: '#ffffff' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{t('vacancies.trainingGrowth', 'Training & Growth')}</strong>
                        <small style={{ color: '#64748b', fontSize: '13px' }}>{t('vacancies.trainingGrowthDesc', 'Comprehensive academy foundation, specialist certifications, and career development.')}</small>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="card" style={{ padding: '20px', marginBottom: '28px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <input
                                type="search"
                                placeholder={t('vacancies.searchPlaceholder', 'Search openings by job title or keyword…')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#475569' }}>{t('vacancies.department', 'Department')}:</label>
                            <select
                                value={selectedDept}
                                onChange={e => setSelectedDept(e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                            >
                                <option value="all">{t('vacancies.allDepartments', 'All Directorates & Units')}</option>
                                {departments.filter(d => d !== 'all').map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Vacancy Openings List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {filteredVacancies.length === 0 ? (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            <p style={{ fontSize: '16px', margin: 0 }}>No job openings found matching your criteria. Try adjusting your search query or department filter.</p>
                        </div>
                    ) : (
                        filteredVacancies.map((vac) => {
                            const title = txt(vac.title);
                            const desc = txt(vac.description);
                            const reqs = txt(vac.requirements);
                            const deadlineDate = vac.deadline ? new Date(vac.deadline) : null;
                            const deadlineStr = deadlineDate && !isNaN(deadlineDate.getTime())
                                ? deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : (vac.deadline ? String(vac.deadline) : 'Open until filled');

                            return (
                                <article
                                    key={vac._id}
                                    className="card"
                                    style={{
                                        padding: '28px',
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', textTransform: 'uppercase' }}>
                                                    {vac.department || 'Addis Ababa Police'}
                                                </span>
                                                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                                                    {vac.employmentType || 'Full-time'}
                                                </span>
                                            </div>
                                            <h3 style={{ margin: '0 0 6px', fontSize: '1.4rem', color: '#0f172a' }}>{title}</h3>
                                        </div>

                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() => openApplyModal(vac)}
                                            style={{
                                                padding: '10px 22px',
                                                fontSize: '13.5px',
                                                fontWeight: 700,
                                                letterSpacing: '0.04em',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {t('vacancies.applyPosition', 'Apply for Position')} →
                                        </button>
                                    </div>

                                    {/* Location & Deadline metadata row */}
                                    <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b', padding: '10px 0', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', marginBottom: '16px' }}>
                                        <span>📍 <b>{t('vacancies.location', 'Location')}:</b> {vac.location || 'Addis Ababa'}</span>
                                        <span>📅 <b>{t('vacancies.deadline', 'Application Deadline')}:</b> <strong style={{ color: '#b21e2b' }}>{deadlineStr}</strong></span>
                                        <span>🛡️ <b>{t('vacancies.department', 'Department')}:</b> {vac.department}</span>
                                    </div>

                                    {/* Short Description */}
                                    <p style={{ color: '#334155', lineHeight: 1.6, margin: '0 0 12px', fontSize: '14.5px' }}>
                                        {desc}
                                    </p>

                                    {/* Requirements */}
                                    {reqs && (
                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>
                                            <strong style={{ color: '#1e293b' }}>{t('vacancies.keyQualifications', 'Key Qualifications')}:</strong> {reqs}
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Bids & Tenders section */}
            {/* <Section title={t('vacancies.bidsTitle', 'Bids & Procurement Notices')}>
                <article className="card" style={{ padding: '24px' }}>
                    <h3 style={{ margin: '0 0 8px' }}>{t('vacancies.procurementNotices', 'Public Procurement & Tenders')}</h3>
                    <p style={{ color: '#64748b', margin: 0 }}>
                        {t('vacancies.procurementDesc', 'All public procurement bids, tenders for protective equipment, IT infrastructure, and facilities are published per Federal & Addis Ababa City Government Procurement Directives.')}
                    </p>
                </article>
            </Section> */}

            {/* Application Modal Dialog */}
            {activeApplyVacancy && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={closeApplyModal}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            maxWidth: '620px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            padding: '32px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#b21e2b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    OFFICIAL RECRUITMENT APPLICATION
                                </span>
                                <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#0f172a' }}>
                                    {txt(activeApplyVacancy.title)}
                                </h2>
                                <small style={{ color: '#64748b' }}>{activeApplyVacancy.department}</small>
                            </div>
                            <button
                                type="button"
                                onClick={closeApplyModal}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '22px',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: '4px'
                                }}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {applyResult ? (
                            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                                <div style={{ fontSize: '42px', marginBottom: '14px' }}>
                                    {applyResult.success ? '🎉' : '⚠️'}
                                </div>
                                <h3 style={{ color: applyResult.success ? '#065f46' : '#991b1b', marginBottom: '10px' }}>
                                    {applyResult.success ? 'Application Submitted Successfully' : 'Submission Encountered An Issue'}
                                </h3>
                                <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
                                    {applyResult.message}
                                </p>
                                <button type="button" className="button" onClick={closeApplyModal}>
                                    Done &amp; Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleApplySubmit} noValidate>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                            Full Name *
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Your full legal name"
                                            value={applyForm.fullName}
                                            onChange={e => {
                                                setApplyForm({ ...applyForm, fullName: e.target.value });
                                                if (applyErrors.fullName) setApplyErrors({ ...applyErrors, fullName: '' });
                                            }}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${applyErrors.fullName ? '#ef4444' : '#cbd5e1'}` }}
                                        />
                                        {applyErrors.fullName && <small style={{ color: '#ef4444', fontSize: '11px' }}>{applyErrors.fullName}</small>}
                                    </label>

                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                            Email Address *
                                        </span>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={applyForm.email}
                                            onChange={e => {
                                                setApplyForm({ ...applyForm, email: e.target.value });
                                                if (applyErrors.email) setApplyErrors({ ...applyErrors, email: '' });
                                            }}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${applyErrors.email ? '#ef4444' : '#cbd5e1'}` }}
                                        />
                                        {applyErrors.email && <small style={{ color: '#ef4444', fontSize: '11px' }}>{applyErrors.email}</small>}
                                    </label>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                            Phone Number *
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="e.g. 0911 000000"
                                            value={applyForm.phone}
                                            onChange={e => {
                                                setApplyForm({ ...applyForm, phone: e.target.value });
                                                if (applyErrors.phone) setApplyErrors({ ...applyErrors, phone: '' });
                                            }}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${applyErrors.phone ? '#ef4444' : '#cbd5e1'}` }}
                                        />
                                        {applyErrors.phone && <small style={{ color: '#ef4444', fontSize: '11px' }}>{applyErrors.phone}</small>}
                                    </label>

                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                            Education Level *
                                        </span>
                                        <select
                                            value={applyForm.educationLevel}
                                            onChange={e => setApplyForm({ ...applyForm, educationLevel: e.target.value })}
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                                        >
                                            <option value="High School Completion">High School (Grade 12)</option>
                                            <option value="Technical/Vocational TVET">Technical / TVET Diploma</option>
                                            <option value="Bachelor Degree">Bachelor's Degree (BSc / BA)</option>
                                            <option value="Master Degree">Master's Degree (MSc / MA)</option>
                                            <option value="Doctorate">Doctorate (PhD / MD / JD)</option>
                                        </select>
                                    </label>
                                </div>

                                <label style={{ display: 'block', marginBottom: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                        Sub-City &amp; Residential Address *
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bole Sub-city, Woreda 03, House 450"
                                        value={applyForm.address}
                                        onChange={e => {
                                            setApplyForm({ ...applyForm, address: e.target.value });
                                            if (applyErrors.address) setApplyErrors({ ...applyErrors, address: '' });
                                        }}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${applyErrors.address ? '#ef4444' : '#cbd5e1'}` }}
                                    />
                                    {applyErrors.address && <small style={{ color: '#ef4444', fontSize: '11px' }}>{applyErrors.address}</small>}
                                </label>

                                <label style={{ display: 'block', marginBottom: '20px' }}>
                                    <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                        Statement of Qualifications / Experience *
                                    </span>
                                    <textarea
                                        rows={4}
                                        placeholder="Briefly state your relevant experience, education, skills, and reasons for applying to the Addis Ababa Police Commission..."
                                        value={applyForm.statement}
                                        onChange={e => {
                                            setApplyForm({ ...applyForm, statement: e.target.value });
                                            if (applyErrors.statement) setApplyErrors({ ...applyErrors, statement: '' });
                                        }}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${applyErrors.statement ? '#ef4444' : '#cbd5e1'}`, fontSize: '13.5px' }}
                                    />
                                    {applyErrors.statement && <small style={{ color: '#ef4444', fontSize: '11px' }}>{applyErrors.statement}</small>}
                                </label>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" className="button" style={{ background: '#f1f5f9', color: '#475569' }} onClick={closeApplyModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="button" disabled={applySubmitting}>
                                        {applySubmitting ? 'Submitting Application…' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
