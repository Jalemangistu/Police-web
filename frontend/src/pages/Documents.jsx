import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSite, txt } from '../context/SiteContext';
import { Hero, Section } from '../components/PageBlocks';
import { api } from '../utils/api';

const CATEGORIES = [
    { key: 'all', icon: '✦', labelEn: 'All Documents', labelAm: 'ሁሉም ሰነዶች', labelOm: 'Waraqaalee Hunda' },
    { key: 'protect_home', icon: '🏠', labelEn: 'Protect your home', labelAm: 'ቤትዎን ይጠብቁ', labelOm: 'Mana keessan eegaa' },
    { key: 'safe_online', icon: '💻', labelEn: 'Stay safe online', labelAm: 'በኢንተርኔት ላይ ደህንነትዎ ይጠበቅ', labelOm: 'Toora interneetii irratti of eeggadhaa' },
    { key: 'road_safety', icon: '🚗', labelEn: 'Road safety', labelAm: 'የመንገድ ደህንነት', labelOm: 'Nageenya daandii' },
    { key: 'missing_persons', icon: '🔍', labelEn: 'Missing persons alerts', labelAm: 'የጠፉ ሰዎች ማስታወቂያዎች', labelOm: 'Akeekkachiisa namoota dhabamanii' },
    { key: 'most_wanted', icon: '⚖️', labelEn: 'Most wanted notices', labelAm: 'በጣም የሚፈለጉ ተጠርጣሪዎች', labelOm: 'Shakkamtoota baay\'ee barbaadaman' },
    { key: 'safety_advisories', icon: '🛡️', labelEn: 'Safety advisories', labelAm: 'የደህንነት ማሳወቂያዎች', labelOm: 'Gorsa nageenyaa' },
];

export default function Documents() {
    const s = useSite();
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');

    const currentLang = i18n.language?.split('-')[0] || 'en';

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            setSelectedCategory(cat);
        }
    }, [searchParams]);

    useEffect(() => {
        setLoading(true);
        api('/documents')
            .then((data) => {
                setDocuments(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setDocuments([]);
                setLoading(false);
            });
    }, []);

    const handleCategoryClick = (key) => {
        setSelectedCategory(key);
        if (key === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', key);
        }
        setSearchParams(searchParams);
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
            const titleStr = (txt(doc.title) || '').toLowerCase();
            const summaryStr = (txt(doc.summary) || '').toLowerCase();
            const numStr = (doc.documentNumber || '').toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || titleStr.includes(q) || summaryStr.includes(q) || numStr.includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [documents, selectedCategory, searchQuery, currentLang]);

    const getCategoryBadgeLabel = (catKey) => {
        const cat = CATEGORIES.find((c) => c.key === catKey);
        if (!cat) return catKey;
        if (currentLang === 'am') return cat.labelAm;
        if (currentLang === 'om') return cat.labelOm;
        return cat.labelEn;
    };

    return (
        <div className="documentsPage">
            <Hero
                tag={t('safety.tag', 'SAFETY & ALERTS')}
                title={t('documents.heroTitle', 'Public Safety Documents & Guides')}
            >
                <p>
                    {t(
                        'documents.heroLead',
                        'Official publications, crime prevention directives, procedural handbooks, and citizen guidance from Addis Ababa Police.'
                    )}
                </p>
            </Hero>

            <Section title={t('documents.browseTitle', 'Explore Safety Documents & Directives')}>
                {/* Search & Category Filter Controls */}
                <div className="docFilterContainer">
                    <div className="docSearchWrap">
                        <span className="docSearchIcon" aria-hidden="true">🔍</span>
                        <input
                            type="search"
                            className="docSearchInput"
                            placeholder={t('documents.searchPlaceholder', 'Search documents by title, keyword, or reference number…')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="docSearchClear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="docCategoryPills" role="tablist" aria-label="Document categories">
                        {CATEGORIES.map((cat) => {
                            const label = currentLang === 'am' ? cat.labelAm : currentLang === 'om' ? cat.labelOm : cat.labelEn;
                            const isActive = selectedCategory === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`docCategoryPill ${isActive ? 'active' : ''}`}
                                    onClick={() => handleCategoryClick(cat.key)}
                                >
                                    <span className="docPillIcon">{cat.icon}</span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Document Results Count */}
                <div className="docResultsMeta">
                    <span>
                        {t('documents.showingResults', 'Showing {{count}} document(s)', { count: filteredDocuments.length })}
                        {selectedCategory !== 'all' && (
                            <> in <strong>{getCategoryBadgeLabel(selectedCategory)}</strong></>
                        )}
                    </span>
                    {(selectedCategory !== 'all' || searchQuery) && (
                        <button
                            type="button"
                            className="docResetFilterBtn"
                            onClick={() => {
                                setSelectedCategory('all');
                                setSearchQuery('');
                                searchParams.delete('category');
                                setSearchParams(searchParams);
                            }}
                        >
                            {t('documents.resetFilters', 'Reset filters')}
                        </button>
                    )}
                </div>

                {/* Documents Grid */}
                {loading ? (
                    <div className="docLoading">
                        <div className="docSpinner" />
                        <p>{t('common.loading', 'Loading official documents…')}</p>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="docEmptyState">
                        <span className="docEmptyIcon">📑</span>
                        <h3>{t('documents.noDocsFound', 'No documents found')}</h3>
                        <p>{t('documents.noDocsDesc', 'No official publications currently match your filter or search query.')}</p>
                        <button
                            type="button"
                            className="button"
                            onClick={() => {
                                setSelectedCategory('all');
                                setSearchQuery('');
                                searchParams.delete('category');
                                setSearchParams(searchParams);
                            }}
                        >
                            {t('documents.viewAllDocs', 'View All Safety Documents')}
                        </button>
                    </div>
                ) : (
                    <div className="docGrid">
                        {filteredDocuments.map((doc) => {
                            const title = txt(doc.title) || 'Official Police Directive';
                            const summary = txt(doc.summary) || 'Official public guidance published by the Addis Ababa Police.';
                            const categoryLabel = getCategoryBadgeLabel(doc.category);
                            const publishedDate = doc.publishedAt
                                ? new Date(doc.publishedAt).toLocaleDateString(currentLang === 'am' ? 'am-ET' : 'en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                  })
                                : '';

                            return (
                                <article className="docCard" key={doc._id || doc.slug}>
                                    <div className="docCardHead">
                                        <span className={`docCatBadge cat-${doc.category}`}>
                                            {categoryLabel}
                                        </span>
                                        {doc.documentNumber && (
                                            <span className="docRefCode">{doc.documentNumber}</span>
                                        )}
                                    </div>

                                    <h3 className="docCardTitle">
                                        <Link to={`/safety/resources/${doc.slug || doc._id}`}>{title}</Link>
                                    </h3>

                                    <p className="docCardSummary">{summary}</p>

                                    <div className="docCardMeta">
                                        {doc.department && (
                                            <div className="docDepartment">
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                                                    <path d="M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Zm0 2.18 6 2.25v4.66c0 4.09-2.73 7.89-6 8.91-3.27-1.02-6-4.82-6-8.91V6.43l6-2.25Z" />
                                                </svg>
                                                <span>{doc.department}</span>
                                            </div>
                                        )}
                                        <div className="docCardSubMeta">
                                            {publishedDate && <span>📅 {publishedDate}</span>}
                                            {doc.views > 0 && <span>👁 {doc.views} views</span>}
                                        </div>
                                    </div>

                                    <div className="docCardActions">
                                        <Link
                                            to={`/safety/resources/${doc.slug || doc._id}`}
                                            className="docReadBtn"
                                        >
                                            {t('documents.readDocument', 'Read Document')} →
                                        </Link>

                                        {doc.fileName && (
                                            <a
                                                href={doc.fileUrl || `#download-${doc.slug}`}
                                                download={doc.fileName}
                                                className="docDownloadBtn"
                                                onClick={(e) => {
                                                    if (!doc.fileUrl) {
                                                        e.preventDefault();
                                                        window.location.href = `/safety/resources/${doc.slug || doc._id}#download`;
                                                    }
                                                }}
                                                title={`Download ${doc.fileName}`}
                                            >
                                                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
                                                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                                                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                                                </svg>
                                                <span>PDF {doc.fileSize ? `(${doc.fileSize})` : ''}</span>
                                            </a>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </Section>
        </div>
    );
}
