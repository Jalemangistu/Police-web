import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSite, txt } from '../context/SiteContext';
import { api } from '../utils/api';

const CATEGORY_MAP = {
    protect_home: { labelEn: 'Protect your home', labelAm: 'ቤትዎን ይጠብቁ', labelOm: 'Mana keessan eegaa', icon: '🏠' },
    safe_online: { labelEn: 'Stay safe online', labelAm: 'በኢንተርኔት ላይ ደህንነትዎ ይጠበቅ', labelOm: 'Toora interneetii irratti of eeggadhaa', icon: '💻' },
    road_safety: { labelEn: 'Road safety', labelAm: 'የመንገድ ደህንነት', labelOm: 'Nageenya daandii', icon: '🚗' },
    missing_persons: { labelEn: 'Missing persons alerts', labelAm: 'የጠፉ ሰዎች ማስታወቂያዎች', labelOm: 'Akeekkachiisa namoota dhabamanii', icon: '🔍' },
    most_wanted: { labelEn: 'Most wanted notices', labelAm: 'በጣም የሚፈለጉ ተጠርጣሪዎች', labelOm: 'Shakkamtoota baay\'ee barbaadaman', icon: '⚖️' },
    safety_advisories: { labelEn: 'Safety advisories', labelAm: 'የደህንነት ማሳወቂያዎች', labelOm: 'Gorsa nageenyaa', icon: '🛡️' },
    general_guidance: { labelEn: 'General Guidance', labelAm: 'አጠቃላይ መመሪያ', labelOm: 'Qajeelfama Waliigalaa', icon: '📋' },
};

export default function DocumentView() {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const s = useSite();

    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedDocs, setRelatedDocs] = useState([]);
    const [copied, setCopied] = useState(false);

    const currentLang = i18n.language?.split('-')[0] || 'en';

    useEffect(() => {
        setLoading(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        api(`/documents/${slug}`)
            .then((data) => {
                setDoc(data);
                setLoading(false);

                // Load related documents in same or general category
                api('/documents')
                    .then((all) => {
                        if (Array.isArray(all)) {
                            const related = all.filter((d) => (d.slug !== slug && d._id !== data._id)).slice(0, 3);
                            setRelatedDocs(related);
                        }
                    })
                    .catch(() => {});
            })
            .catch(() => {
                setDoc(null);
                setLoading(false);
            });
    }, [slug]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const getCatInfo = (catKey) => {
        return CATEGORY_MAP[catKey] || { labelEn: 'Safety Document', labelAm: 'የደህንነት ሰነድ', labelOm: 'Waraqaa Nageenyaa', icon: '📑' };
    };

    if (loading) {
        return (
            <div className="docViewLoading container">
                <div className="docSpinner" />
                <p>{t('documents.loadingDoc', 'Loading official police document…')}</p>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="docNotFound container">
                <div className="docEmptyState">
                    <span className="docEmptyIcon">⚠️</span>
                    <h2>{t('documents.notFoundTitle', 'Document Not Found')}</h2>
                    <p>{t('documents.notFoundDesc', 'The requested safety directive or resource document could not be located.')}</p>
                    <Link to="/safety/resources" className="button">
                        ← {t('documents.backToAll', 'Return to All Safety Documents')}
                    </Link>
                </div>
            </div>
        );
    }

    const title = txt(doc.title) || 'Official Police Directive';
    const summary = txt(doc.summary) || '';
    const rawContent = txt(doc.content) || '';
    const catInfo = getCatInfo(doc.category);
    const categoryLabel = currentLang === 'am' ? catInfo.labelAm : currentLang === 'om' ? catInfo.labelOm : catInfo.labelEn;

    const publishedDate = doc.publishedAt
        ? new Date(doc.publishedAt).toLocaleDateString(currentLang === 'am' ? 'am-ET' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '';

    // Render formatted markdown or html content cleanly
    const renderContent = (text) => {
        if (!text) return null;
        if (text.includes('<p>') || text.includes('<div>') || text.includes('<ul>')) {
            return <div className="docHtmlBody" dangerouslySetInnerHTML={{ __html: text }} />;
        }

        // Split into paragraphs and sections
        const lines = text.split('\n');
        const elements = [];
        let currentList = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                if (currentList.length > 0) {
                    elements.push(<ul key={`ul-${index}`} className="docBulletList">{[...currentList]}</ul>);
                    currentList = [];
                }
                return;
            }

            if (trimmed.startsWith('### ')) {
                if (currentList.length > 0) {
                    elements.push(<ul key={`ul-${index}`} className="docBulletList">{[...currentList]}</ul>);
                    currentList = [];
                }
                elements.push(<h3 key={index} className="docSectionHeading">{trimmed.replace('### ', '')}</h3>);
            } else if (trimmed.startsWith('## ')) {
                if (currentList.length > 0) {
                    elements.push(<ul key={`ul-${index}`} className="docBulletList">{[...currentList]}</ul>);
                    currentList = [];
                }
                elements.push(<h2 key={index} className="docSubHeading">{trimmed.replace('## ', '')}</h2>);
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                currentList.push(<li key={`li-${index}`}>{trimmed.substring(2)}</li>);
            } else if (/^\d+\.\s/.test(trimmed)) {
                elements.push(<div key={index} className="docNumberedItem"><strong>{trimmed.match(/^\d+\./)[0]}</strong> {trimmed.replace(/^\d+\.\s*/, '')}</div>);
            } else {
                if (currentList.length > 0) {
                    elements.push(<ul key={`ul-${index}`} className="docBulletList">{[...currentList]}</ul>);
                    currentList = [];
                }
                elements.push(<p key={index} className="docParagraph">{trimmed}</p>);
            }
        });

        if (currentList.length > 0) {
            elements.push(<ul key="ul-final" className="docBulletList">{currentList}</ul>);
        }

        return elements;
    };

    return (
        <div className="docViewPage">
            {/* Header / Hero */}
            <section className="pagehero">
                <div className="container">
                    <nav className="docBreadcrumbs" aria-label="Breadcrumb" style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                        <Link to="/" style={{ color: '#d9b048', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Home</Link>
                        <span style={{ color: '#64748b' }}>›</span>
                        <Link to="/safety" style={{ color: '#d9b048', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Safety &amp; Alerts</Link>
                        <span style={{ color: '#64748b' }}>›</span>
                        <Link to="/safety/resources" style={{ color: '#d9b048', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Crime Prevention Resources</Link>
                        <span style={{ color: '#64748b' }}>›</span>
                        <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{categoryLabel}</span>
                    </nav>
                    <h1>{title}</h1>
                    {summary && <p>{summary}</p>}
                </div>
            </section>

            <div className="container docViewMain">
                {/* Top Action Toolbar */}
                <div className="docTopToolbar no-print">
                    <Link to="/safety/resources" className="docBackBtn">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                        </svg>
                        <span>{t('documents.backToList', 'Back to Safety Resources')}</span>
                    </Link>

                    <div className="docActionGroup">
                        <button type="button" className="docActionBtn" onClick={handlePrint} title="Print official document">
                            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                                <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0 1 16.75 8H17a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1.25V18a1 1 0 0 1-1 1h-9.5a1 1 0 0 1-1-1v-2H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h.25A1.75 1.75 0 0 1 5 6.25v-3.5Zm1.5 0v3.5h7v-3.5h-7ZM5.25 15h9.5v3h-9.5v-3Z" clipRule="evenodd" />
                            </svg>
                            <span>Print</span>
                        </button>

                        <button type="button" className="docActionBtn" onClick={handleCopyLink} title="Copy link to clipboard">
                            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                                <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                                <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                            </svg>
                            <span>{copied ? 'Copied!' : 'Share'}</span>
                        </button>

                        {doc.fileName && (
                            <a
                                href={doc.fileUrl || '#'}
                                download={doc.fileName}
                                className="docDownloadPrimaryBtn"
                                title={`Download official PDF: ${doc.fileName}`}
                                onClick={(e) => {
                                    if (!doc.fileUrl) {
                                        e.preventDefault();
                                        window.print();
                                    }
                                }}
                            >
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                                </svg>
                                <span>Download PDF {doc.fileSize ? `(${doc.fileSize})` : ''}</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* The Official Document Sheet */}
                <article className="docPaperSheet">
                    {/* Official Document Seal Header */}
                    <header className="docPaperHeader">
                        <div className="docPaperEmblemWrap">
                            <img
                                src={s.logo || '/aap-crest.png'}
                                alt="Addis Ababa Police Crest"
                                className="docPaperEmblem"
                            />
                            <div className="docPaperGovernmentTitle">
                                <strong>FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</strong>
                                <span>ADDIS ABABA POLICE COMMISSION</span>
                                <small>{doc.department || 'Crime Prevention Directorate'}</small>
                            </div>
                        </div>

                        <div className="docPaperMetaBox">
                            <div className="docPaperRefBadge">
                                <span className="docPaperRefLabel">OFFICIAL REF:</span>
                                <strong>{doc.documentNumber || 'AAP-DOC-2026'}</strong>
                            </div>
                            <div className="docPaperStatusBadge">
                                <span className="docStatusPulse" />
                                <span>ACTIVE DIRECTIVE</span>
                            </div>
                        </div>
                    </header>

                    <div className="docPaperDivider" />

                    {/* Metadata strip */}
                    <div className="docPaperDetailsStrip">
                        <div className="docDetailItem">
                            <span className="docDetailLabel">TOPIC CATEGORY:</span>
                            <span className="docDetailValue">
                                <span className="docCatDot" />
                                {catInfo.icon} {categoryLabel}
                            </span>
                        </div>

                        <div className="docDetailItem">
                            <span className="docDetailLabel">EFFECTIVE DATE:</span>
                            <span className="docDetailValue">{publishedDate}</span>
                        </div>

                        <div className="docDetailItem">
                            <span className="docDetailLabel">CLASSIFICATION:</span>
                            <span className="docDetailValue">PUBLIC RELEASE / CITIZEN DIRECTIVE</span>
                        </div>

                        {doc.views > 0 && (
                            <div className="docDetailItem">
                                <span className="docDetailLabel">READERSHIP:</span>
                                <span className="docDetailValue">{doc.views} verified reads</span>
                            </div>
                        )}
                    </div>

                    {/* Document Title */}
                    <h1 className="docPaperTitle">{title}</h1>

                    {/* Executive Summary Callout Box */}
                    {summary && (
                        <div className="docPaperSummaryCard">
                            <div className="docSummaryCardHead">
                                <span className="docSummaryIcon">📌</span>
                                <strong>Executive Summary for Residents & Businesses</strong>
                            </div>
                            <p className="docSummaryCardText">{summary}</p>
                        </div>
                    )}

                    {/* Main Document Content Body */}
                    <div className="docPaperContent">
                        {renderContent(rawContent)}
                    </div>

                    {/* Downloadable Attachment Section (if file exists) */}
                    {doc.fileName && (
                        <div className="docAttachmentCard no-print" id="download">
                            <div className="docAttachmentInfo">
                                <div className="docAttachmentIcon">
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6Zm2 16H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="docAttachmentTitle">{doc.fileName}</h4>
                                    <p className="docAttachmentDesc">
                                        Official signed directive file • Verified digital release {doc.fileSize ? `(${doc.fileSize})` : ''}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={doc.fileUrl || '#'}
                                download={doc.fileName}
                                className="button docDownloadCalloutBtn"
                                onClick={(e) => {
                                    if (!doc.fileUrl) {
                                        e.preventDefault();
                                        window.print();
                                    }
                                }}
                            >
                                Download Official Document
                            </a>
                        </div>
                    )}

                    {/* Official Sign-Off Block */}
                    <footer className="docPaperFooter">
                        <div className="docSignatureBlock">
                            <div className="docPoliceStamp">
                                <div className="docStampCircle">
                                    <span>ADDIS ABABA POLICE</span>
                                    <strong>VERIFIED</strong>
                                    <small>2026</small>
                                </div>
                            </div>
                            <div className="docSignText">
                                <strong>COMMANDER, CRIME PREVENTION DIRECTORATE</strong>
                                <span>Addis Ababa Police Headquarters</span>
                                <small>Issued under the authority of the Addis Ababa Police Administration</small>
                            </div>
                        </div>

                        {/* Emergency Quick Numbers */}
                        <div className="docEmergencyFootnote">
                            <strong>Emergency Police: 991</strong> • Ambulance: 939 • Fire & Rescue: 945
                        </div>
                    </footer>
                </article>

                {/* Citizen Crime Reporting Callout */}
                <aside className="docReportingBox no-print">
                    <div className="docReportingContent">
                        <div className="docReportingIcon">🚨</div>
                        <div>
                            <h3>Need to report an incident or require emergency assistance?</h3>
                            <p>
                                If you have observed a crime, suspicious activity, or require non-emergency police assistance regarding this directive, reach out via our official secure channels.
                            </p>
                        </div>
                    </div>
                    <div className="docReportingActions">
                        <a href="tel:991" className="button button--danger">
                            Call 991 Emergency
                        </a>
                        <Link to="/services/crime-reporting" className="button">
                            Submit Online Crime Report
                        </Link>
                    </div>
                </aside>

                {/* Related Documents Grid */}
                {relatedDocs.length > 0 && (
                    <section className="docRelatedSection no-print">
                        <div className="docRelatedHead">
                            <h3>Related Safety Directives & Guides</h3>
                            <Link to="/safety/resources" className="docSeeAllLink">
                                View all resources →
                            </Link>
                        </div>

                        <div className="grid three">
                            {relatedDocs.map((r) => {
                                const rTitle = txt(r.title) || 'Police Guide';
                                const rCat = getCatInfo(r.category);
                                return (
                                    <article className="card docRelatedCard" key={r._id || r.slug}>
                                        <div className="docRelatedCardTop">
                                            <span className="docRelatedCat">{rCat.icon} {rCat.labelEn}</span>
                                            {r.documentNumber && <small className="docRelatedRef">{r.documentNumber}</small>}
                                        </div>
                                        <h4>
                                            <Link to={`/safety/resources/${r.slug || r._id}`}>{rTitle}</Link>
                                        </h4>
                                        <p>{txt(r.summary) || 'Practical guidance and safety notice for citizens.'}</p>
                                        <Link to={`/safety/resources/${r.slug || r._id}`} className="docRelatedLink">
                                            Read document →
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
