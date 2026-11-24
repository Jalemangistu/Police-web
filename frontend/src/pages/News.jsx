import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';
import { api } from '../utils/api';
import { resolvePortalAssetUrl } from '../utils/resolvePortalAssetUrl';

function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_KEYS = ['image', 'video', 'document', 'audio'];

const CATEGORY_META = {
    all: {
        key: 'all',
        icon: '✦',
        labelKey: 'news.mediaFilterAll',
        defaultLabel: 'All Media',
        badgeColor: '#0a2b5a'
    },
    image: {
        key: 'image',
        icon: '📷',
        labelKey: 'news.mediaCatImage',
        defaultLabel: 'Photos & Gallery',
        badgeColor: '#0284c7'
    },
    video: {
        key: 'video',
        icon: '🎬',
        labelKey: 'news.mediaCatVideo',
        defaultLabel: 'Videos & Broadcasts',
        badgeColor: '#e11d48'
    },
    document: {
        key: 'document',
        icon: '📄',
        labelKey: 'news.mediaCatDocument',
        defaultLabel: 'Documents & Releases',
        badgeColor: '#2563eb'
    },
    audio: {
        key: 'audio',
        icon: '🎙️',
        labelKey: 'news.mediaCatAudio',
        defaultLabel: 'Audio & Recordings',
        badgeColor: '#0d9488'
    }
};

const FALLBACK_MEDIA = [
    {
        _id: 'fb-img-1',
        fileName: 'Addis_Ababa_Police_Patrol_Fleet.jpg',
        path: '/addis-skyline.jpg',
        mimeType: 'image/jpeg',
        size: 955160,
        category: 'image',
        altText: {
            en: 'Addis Ababa Police City Patrol Fleet and Rapid Response Units',
            am: 'የአዲስ አበባ ፖሊስ የከተማ ጥበቃ ተሸከርካሪዎች እና ፈጣን ምላሽ ክፍሎች',
            om: 'Mootaraa fi Konkolaattota Qophii Hatattamaa Poolisii Finfinnee'
        },
        caption: {
            en: 'Official parade and readiness display across major metropolitan patrol routes.',
            am: 'በዋና ዋና የከተማ መንገዶች የተከናወነ ይፋዊ የሰልፍ እና የዝግጁነት ማሳያ።',
            om: 'Daawwannaa fi qophii poolisii daandiiwwan gurguddoo irratti taasifame.'
        }
    },
    {
        _id: 'fb-img-2',
        fileName: 'Commissioner_General_Official_Portrait.jpg',
        path: '/commissioner.jpg',
        mimeType: 'image/jpeg',
        size: 703199,
        category: 'image',
        altText: {
            en: 'Official Portrait of Commissioner General Demelash Gebremichael',
            am: 'የኮሚሽነር ጀነራል ደመላሽ ገብረሚካኤል ይፋዊ ፎቶግራፍ',
            om: "Suuraa Mootummaa Koomishinar Jeneraal Dammallaash Gabramikaa'el"
        },
        caption: {
            en: 'High-resolution official portrait for press publications and official news coverage.',
            am: 'ለፕሬስ ህትመቶች እና ለይፋዊ የዜና ሽፋን የተዘጋጀ ጥራት ያለው ፎቶግራፍ።',
            om: "Suuraa qulqullina olaanaa qabu kan maxxansa miidiyaatiif qophaa'e."
        }
    },
    {
        _id: 'fb-img-3',
        fileName: 'Addis_Ababa_Police_Official_Insignia_Crest.png',
        path: '/aap-crest.png',
        mimeType: 'image/png',
        size: 325188,
        category: 'image',
        altText: {
            en: 'Addis Ababa Police Official Seal and Crest',
            am: 'የአዲስ አበባ ፖሊስ ይፋዊ ማህተም እና አርማ',
            om: 'Asxaa fi Chaappaa Seera Qabeessa Poolisii Finfinnee'
        },
        caption: {
            en: 'High-definition insignia crest for accredited news publications and official documentation.',
            am: 'ለዜና ተቋማት እና ይፋዊ ሰነዶች የተዘጋጀ ከፍተኛ ጥራት ያለው የፖሊስ አርማ።',
            om: 'Asxaa qulqullina olaanaa qabu waraqaalee seera qabeessaaf.'
        }
    },
    {
        _id: 'fb-vid-1',
        fileName: 'Annual_Readiness_Inspection_2026.mp4',
        path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        mimeType: 'video/mp4',
        size: 15400000,
        category: 'video',
        altText: {
            en: 'Addis Ababa Police 2026 Annual Operational Readiness and Community Safety Review',
            am: 'የአዲስ አበባ ፖሊስ 2026 ዓመታዊ የክዋኔ ዝግጁነት እና የማህበረሰብ ደህንነት ግምገማ',
            om: 'Daawwannaa Qophii fi Nageenya Hawaasaa Poolisii Finfinnee 2026'
        },
        caption: {
            en: 'Broadcast recording of commissioner general addressing tactical modernization and emergency preparedness.',
            am: 'ኮሚሽነር ጀነራሉ ስለ ዘመናዊ አሰራር እና ድንገተኛ አደጋ ዝግጁነት ያስተላለፉት ይፋዊ የቪዲዮ ስርጭት።',
            om: 'Waraabbii tamsaasa viidiyoo qophii poolisii fi teknoolojii haaraa ilaalchisee.'
        }
    },
    {
        _id: 'fb-vid-2',
        fileName: 'City_Traffic_Flow_Corridor_Briefing.mp4',
        path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        mimeType: 'video/mp4',
        size: 12200000,
        category: 'video',
        altText: {
            en: 'Metropolitan Traffic Safety & Intelligent Signals Operation',
            am: 'የከተማው የትራፊክ ደህንነት እና ስማርት ሲግናሎች አሰራር',
            om: 'Nageenya Daandii Magaalaa fi Mallattoolee Ammayyaa'
        },
        caption: {
            en: 'Overview of city traffic safety initiatives, pedestrian corridors, and speed enforcement monitoring.',
            am: 'የትራፊክ ደህንነት፣ የእግረኞች መተላለፊያ እና የፍጥነት ቁጥጥር ስርዓትን የተመለከተ ማብራሪያ።',
            om: "Ibsa nageenya daandii fi to'annoo saffisa konkolaattotaa magaalaa keessaa."
        }
    },
    {
        _id: 'fb-doc-1',
        fileName: 'AAP_Official_Media_Kit_Brand_Guide_2026.pdf',
        path: '/AAP_Press_Media_Kit_2026.pdf',
        mimeType: 'application/pdf',
        size: 2450000,
        category: 'document',
        altText: {
            en: 'Official Media Guide, Accreditation Protocols & Media Contact Directory 2026',
            am: 'ይፋዊ የሚዲያ መመሪያ፣ የጋዜጠኞች እውቅና አሰጣጥ እና የመገናኛ አድራሻዎች 2026',
            om: 'Qajeelfama Miidiyaa, Haala Eeyyama Gaazexeessummaa fi Teessoo 2026'
        },
        caption: {
            en: 'Essential guidelines, embargo policy, and media contact channels for accredited press outlets.',
            am: 'ለተፈቀደላቸው የሚዲያ ተቋማት የተዘጋጀ መመሪያ፣ የስነ-ምግባር ደንብ እና የመገናኛ መስመሮች።',
            om: 'Qajeelfama barbaachisaa miidiyaalee seera qabeessaa fi qunnamtii isaaniif.'
        }
    },
    {
        _id: 'fb-doc-2',
        fileName: 'Quarterly_Crime_Prevention_Statistical_Report_Q1.pdf',
        path: '/Quarterly_Safety_Statistics_Q1_2026.pdf',
        mimeType: 'application/pdf',
        size: 3820000,
        category: 'document',
        altText: {
            en: 'Quarterly Crime Reduction and Response Outcomes Report - Q1 2026',
            am: 'የሩብ ዓመት የወንጀል ቅነሳ እና የአስቸኳይ ጊዜ ምላሽ ሪፖርት - 2026',
            om: "Gabaasa Istaatiistiksii Hir'ina Yakkaa Kurmaana 1ffaa 2026"
        },
        caption: {
            en: 'Public statistical digest outlining emergency response times, crime prevention metrics, and division performance.',
            am: 'የምላሽ አሰጣጥ ፍጥነት፣ የወንጀል መከላከል ውጤቶች እና የክፍለ ከተሞች አፈፃፀም የተካተተበት ይፋዊ ሪፖርት።',
            om: "Ibsa yeroo deebii hatattamaa fi qorannoo raawwii kutaalee magaalaa."
        }
    },
    {
        _id: 'fb-aud-1',
        fileName: 'Commissioner_General_City_Radio_Address.mp3',
        path: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        mimeType: 'audio/mpeg',
        size: 4200000,
        category: 'audio',
        altText: {
            en: 'Commissioner General Demelash Gebremichael City-Wide Radio Address on Public Trust',
            am: 'ኮሚሽነር ጀነራል ደመላሽ ገብረሚካኤል ስለ ህዝብ አጋርነት ያስተላለፉት የሬዲዮ መልዕክት',
            om: "Waraabbii Sagalee Raadiyoo: Koomishinar Jeneraal Dammallaash Gabramikaa'el"
        },
        caption: {
            en: 'Audio recording: Keynote address broadcast across metropolitan radio on strengthening community trust and security partnership.',
            am: 'በሬዲዮ የተላለፈ የድምጽ ቅጂ፡ የማህበረሰብ ፖሊሲንግ እና የህዝብ ተሳትፎን ለማጠናከር የተላለፈ መልዕክት።',
            om: 'Waraabbii sagalee qajeelfama poolisii hawaasaa fi nageenya waloo irratti darbe.'
        }
    },
    {
        _id: 'fb-aud-2',
        fileName: '991_Emergency_Dispatch_Protocols_Audio_Notice.mp3',
        path: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
        mimeType: 'audio/mpeg',
        size: 1950000,
        category: 'audio',
        altText: {
            en: 'Official Audio Guide: When and How to Use the 991 Emergency Hotline',
            am: 'ይፋዊ የድምጽ መመሪያ፡ የ991 አስቸኳይ ጊዜ መስመርን እንዴት መጠቀም እንደሚገባ',
            om: 'Qajeelfama Sagalee: Sarara Hatattamaa 991 Akkamitti Itti Fayyadamaa'
        },
        caption: {
            en: 'Public advisory audio explaining priority dispatch lines, medical cooperation, and emergency hotline etiquette.',
            am: 'የአደጋ ጊዜ ጥሪ ቅድሚያ አሰጣጥን እና ከህክምና ቡድኖች ጋር ያለውን ቅንጅት የሚያስረዳ የድምጽ ማስታወቂያ።',
            om: 'Beeksisa sagalee itti fayyadama sarara bilbila hatattamaa 991.'
        }
    }
];

function MediaCard({ item, onPreview, t }) {
    const itemTitle = txt(item.caption) || txt(item.altText) || item.fileName || 'Media Asset';
    const itemDesc = txt(item.altText) || txt(item.caption) || '';
    const resolvedUrl = resolvePortalAssetUrl(item.path);
    const sizeStr = formatFileSize(item.size);

    return (
        <article className="mediaCard" key={item._id || item.fileName}>
            <div className="mediaCardMediaWrap">
                <span className={`mediaBadge mediaBadge${item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}`}>
                    {item.category === 'image' && '📷 PHOTO'}
                    {item.category === 'video' && '🎬 VIDEO'}
                    {item.category === 'document' && '📄 DOCUMENT'}
                    {item.category === 'audio' && '🎙️ AUDIO'}
                </span>

                {item.category === 'image' && (
                    <img
                        src={resolvedUrl}
                        alt={itemTitle}
                        className="mediaCardThumbImg"
                        loading="lazy"
                        onClick={() => onPreview(item)}
                        style={{ cursor: 'pointer' }}
                    />
                )}

                {item.category === 'video' && (
                    <div className="mediaCardVideoWrap" onClick={() => onPreview(item)} style={{ cursor: 'pointer' }}>
                        <video src={resolvedUrl} preload="metadata" muted />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
                            <span style={{ fontSize: '36px', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>▶</span>
                        </div>
                    </div>
                )}

                {item.category === 'audio' && (
                    <div className="mediaCardAudioWrap">
                        <span className="mediaAudioVisualizer">🎙️</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#a5f3fc' }}>Official Audio Broadcast</span>
                    </div>
                )}

                {item.category === 'document' && (
                    <div className="mediaCardDocWrap" onClick={() => onPreview(item)} style={{ cursor: 'pointer' }}>
                        <span className="mediaDocIconLarge">📑</span>
                        <span className="mediaDocExtPill">{item.fileName?.split('.').pop()?.toUpperCase() || 'PDF'}</span>
                    </div>
                )}
            </div>

            <div className="mediaCardBody">
                <h4 className="mediaCardTitle" title={itemTitle}>{itemTitle}</h4>
                {itemDesc && itemDesc !== itemTitle && (
                    <p className="mediaCardDesc" title={itemDesc}>{itemDesc}</p>
                )}

                {item.category === 'audio' && (
                    <div className="mediaCardInlineAudio">
                        <audio src={resolvedUrl} controls preload="none" />
                    </div>
                )}

                <div className="mediaCardMeta">
                    {sizeStr && <span>💾 {sizeStr}</span>}
                    <span>📁 {item.fileName}</span>
                </div>

                <div className="mediaCardActions">
                    <button
                        type="button"
                        className="mediaBtnPrimary"
                        onClick={() => onPreview(item)}
                    >
                        👁 {t('news.mediaPreview', 'Preview')}
                    </button>
                    <a
                        href={resolvedUrl}
                        download={item.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mediaBtnSecondary"
                    >
                        ⤓ {t('news.mediaDownload', 'Download')}
                    </a>
                </div>
            </div>
        </article>
    );
}

export default function News() {
    const s = useSite();
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [mediaSearch, setMediaSearch] = useState('');
    const [activePreview, setActivePreview] = useState(null);

    useEffect(() => {
        api('/news').then(setItems).catch(() => {});
        api('/media')
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setMediaItems(data);
                } else {
                    setMediaItems(FALLBACK_MEDIA);
                }
            })
            .catch(() => {
                setMediaItems(FALLBACK_MEDIA);
            });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setActivePreview(null);
        };
        if (activePreview) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePreview]);

    // Calculate count per category
    const categoryCounts = useMemo(() => {
        const counts = { all: mediaItems.length, image: 0, video: 0, document: 0, audio: 0 };
        mediaItems.forEach((item) => {
            if (counts[item.category] !== undefined) {
                counts[item.category] += 1;
            }
        });
        return counts;
    }, [mediaItems]);

    // Filter media items by category and search query
    const filteredMedia = useMemo(() => {
        return mediaItems.filter((item) => {
            const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
            const q = mediaSearch.toLowerCase().trim();
            if (!q) return matchesCat;

            const nameStr = (item.fileName || '').toLowerCase();
            const altStr = (txt(item.altText) || '').toLowerCase();
            const captionStr = (txt(item.caption) || '').toLowerCase();

            const matchesSearch = nameStr.includes(q) || altStr.includes(q) || captionStr.includes(q);
            return matchesCat && matchesSearch;
        });
    }, [mediaItems, selectedCategory, mediaSearch]);

    // Group items by category for "all" view
    const groupedByCategory = useMemo(() => {
        const groups = {};
        CATEGORY_KEYS.forEach((catKey) => {
            const catItems = filteredMedia.filter((item) => item.category === catKey);
            if (catItems.length > 0) {
                groups[catKey] = catItems;
            }
        });
        return groups;
    }, [filteredMedia]);

    return (
        <>
            <Hero tag={t('news.tag', 'NEWS & MEDIA CENTRE')} title={txt(s.newsHeroTitle) || t('news.defaultHeroTitle', 'Updates from Addis Ababa Police')}>
                <p>{txt(s.newsHeroLead) || t('news.defaultHeroLead', 'Official news, press releases, public notices, and media resources.')}</p>
            </Hero>

            {/* LATEST NEWS UPDATES */}
            <Section title={t('news.latestUpdates', 'Latest updates')}>
                <div className="grid three">
                    {items.length
                        ? items.map((n) => (
                            <article className="card news" key={n._id}>
                                <div>AAP<br /><small>MEDIA</small></div>
                                {n.featuredImage && (n.featuredImage.startsWith('data:video') ? <video src={n.featuredImage} controls style={{ width: '100%', marginBottom: '10px' }} /> : <img src={n.featuredImage} alt={txt(n.title)} style={{ width: '100%', objectFit: 'cover', marginBottom: '10px' }} />)}
                                <h3>{txt(n.title)}</h3>
                                <p>{txt(n.excerpt)}</p>
                                <Link to={`/news/${n.slug}`}>{t('news.readArticle', 'Read article →')}</Link>
                            </article>
                        ))
                        : (
                            <article className="card">
                                <h3>{t('news.noNewsTitle', 'News updates will appear here')}</h3>
                                <p>{t('news.noNewsDesc', 'Visit regularly for official announcements and press releases.')}</p>
                            </article>
                        )}
                </div>
            </Section>

            {/* MEDIA RESOURCES DISPLAYED BY CATEGORY */}
            <Section title={t('news.mediaResources', 'Media resources')}>
                <div className="mediaSectionContainer">
                    <p className="mediaSectionIntro">
                        {t('news.mediaSubtitle', 'Official photos, video broadcasts, publications, and audio briefings released by Addis Ababa Police.')}
                    </p>

                    {/* Filter and Search Controls */}
                    <div className="mediaControlsBar">
                        <div className="mediaSearchWrap">
                            <span className="mediaSearchIcon" aria-hidden="true">🔍</span>
                            <input
                                type="search"
                                className="mediaSearchInput"
                                placeholder={t('news.mediaSearchPlaceholder', 'Search media resources by name, caption, or topic…')}
                                value={mediaSearch}
                                onChange={(e) => setMediaSearch(e.target.value)}
                            />
                            {mediaSearch && (
                                <button
                                    type="button"
                                    className="mediaSearchClear"
                                    onClick={() => setMediaSearch('')}
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Category Filter Pills */}
                        <div className="mediaCategoryPills" role="tablist" aria-label="Media Categories">
                            {['all', ...CATEGORY_KEYS].map((catKey) => {
                                const config = CATEGORY_META[catKey];
                                const count = categoryCounts[catKey] ?? 0;
                                const isActive = selectedCategory === catKey;
                                return (
                                    <button
                                        key={catKey}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        className={`mediaCategoryPill ${isActive ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(catKey)}
                                    >
                                        <span className="mediaPillIcon">{config.icon}</span>
                                        <span>{t(config.labelKey, config.defaultLabel)}</span>
                                        <span className="mediaPillCount">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Results Meta Info */}
                    <div className="mediaResultsMeta">
                        <span>
                            {t('news.mediaShowingCount', 'Showing {{count}} media resource(s)', { count: filteredMedia.length })}
                            {selectedCategory !== 'all' && (
                                <> {t('news.mediaInCat', 'in {{category}}', { category: t(CATEGORY_META[selectedCategory]?.labelKey, CATEGORY_META[selectedCategory]?.defaultLabel) })}</>
                            )}
                        </span>
                        {(selectedCategory !== 'all' || mediaSearch) && (
                            <button
                                type="button"
                                className="mediaResetBtn"
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setMediaSearch('');
                                }}
                            >
                                ✕ {t('news.mediaResetFilter', 'Reset filters')}
                            </button>
                        )}
                    </div>

                    {/* Resources Displayed By Category */}
                    {filteredMedia.length === 0 ? (
                        <div className="mediaEmptyState">
                            <span className="mediaEmptyIcon">📂</span>
                            <h3>{t('news.mediaNoItems', 'No media resources found')}</h3>
                            <p>{t('news.mediaNoItemsDesc', 'No media assets currently match the selected category or search query.')}</p>
                            <button
                                type="button"
                                className="mediaBtnPrimary"
                                style={{ display: 'inline-flex', width: 'auto', margin: '0 auto' }}
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setMediaSearch('');
                                }}
                            >
                                {t('news.mediaResetFilter', 'View all media resources')}
                            </button>
                        </div>
                    ) : selectedCategory === 'all' ? (
                        /* Grouped by category display when All is selected */
                        CATEGORY_KEYS.map((catKey) => {
                            const catItems = groupedByCategory[catKey];
                            if (!catItems || catItems.length === 0) return null;
                            const config = CATEGORY_META[catKey];

                            return (
                                <div className="mediaCategoryGroup" key={catKey}>
                                    <div className="mediaCategoryGroupHeader">
                                        <div className="mediaCategoryGroupTitle">
                                            <span className="mediaGroupIcon">{config.icon}</span>
                                            <h3>{t(config.labelKey, config.defaultLabel)}</h3>
                                            <span className="mediaGroupCount">{catItems.length}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="mediaViewCatBtn"
                                            onClick={() => setSelectedCategory(catKey)}
                                        >
                                            {t('news.viewAllInCat', 'View category →')}
                                        </button>
                                    </div>

                                    <div className="mediaGrid">
                                        {catItems.map((item) => (
                                            <MediaCard
                                                key={item._id || item.fileName}
                                                item={item}
                                                onPreview={setActivePreview}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        /* Specific Category Grid View */
                        <div className="mediaCategoryGroup">
                            <div className="mediaCategoryGroupHeader">
                                <div className="mediaCategoryGroupTitle">
                                    <span className="mediaGroupIcon">{CATEGORY_META[selectedCategory]?.icon}</span>
                                    <h3>{t(CATEGORY_META[selectedCategory]?.labelKey, CATEGORY_META[selectedCategory]?.defaultLabel)}</h3>
                                    <span className="mediaGroupCount">{filteredMedia.length}</span>
                                </div>
                            </div>
                            <div className="mediaGrid">
                                {filteredMedia.map((item) => (
                                    <MediaCard
                                        key={item._id || item.fileName}
                                        item={item}
                                        onPreview={setActivePreview}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Press and Accredited Media Contact Card */}
                    <div className="mediaPressNoticeCard">
                        <div className="mediaPressNoticeIcon">🎙️</div>
                        <div className="mediaPressNoticeContent">
                            <h4>{t('news.mediaPressNotice', 'Accredited Media & Press Enquiries')}</h4>
                            <p>{t('news.mediaPressNoticeDesc', 'For broadcast requests, official interviews, and press credential inquiries, contact our central media relations desk.')}</p>
                        </div>
                        <Link to="/contact" className="mediaPressNoticeBtn">
                            {t('news.mediaContactPressBtn', 'Contact Media Relations')} →
                        </Link>
                    </div>
                </div>
            </Section>

            {/* LIGHTBOX PREVIEW MODAL */}
            {activePreview && (
                <div
                    className="mediaLightboxOverlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setActivePreview(null);
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Media Preview"
                >
                    <div className="mediaLightboxDialog">
                        <button
                            type="button"
                            className="mediaLightboxClose"
                            onClick={() => setActivePreview(null)}
                            aria-label="Close modal"
                        >
                            ✕
                        </button>

                        <div className="mediaLightboxStage">
                            {activePreview.category === 'image' && (
                                <img
                                    src={resolvePortalAssetUrl(activePreview.path)}
                                    alt={txt(activePreview.altText) || activePreview.fileName}
                                />
                            )}

                            {activePreview.category === 'video' && (
                                <video
                                    src={resolvePortalAssetUrl(activePreview.path)}
                                    controls
                                    autoPlay
                                />
                            )}

                            {activePreview.category === 'audio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', width: '90%' }}>
                                    <span style={{ fontSize: '64px' }}>🎙️</span>
                                    <audio
                                        src={resolvePortalAssetUrl(activePreview.path)}
                                        controls
                                        autoPlay
                                        style={{ width: '100%', maxWidth: '480px' }}
                                    />
                                </div>
                            )}

                            {activePreview.category === 'document' && (
                                <div className="mediaLightboxDocPreview">
                                    <span className="docIcon">📑</span>
                                    <h3>{activePreview.fileName}</h3>
                                    <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '8px' }}>
                                        {activePreview.mimeType || 'Application document'} · {formatFileSize(activePreview.size)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mediaLightboxBody">
                            <span className={`mediaBadge mediaBadge${activePreview.category?.charAt(0).toUpperCase() + activePreview.category?.slice(1)}`} style={{ position: 'static', display: 'inline-block', marginBottom: '12px' }}>
                                {CATEGORY_META[activePreview.category]?.icon} {t(CATEGORY_META[activePreview.category]?.labelKey, CATEGORY_META[activePreview.category]?.defaultLabel)}
                            </span>
                            <h3 className="mediaLightboxTitle">
                                {txt(activePreview.caption) || txt(activePreview.altText) || activePreview.fileName}
                            </h3>
                            {(txt(activePreview.altText) || txt(activePreview.caption)) && (
                                <p className="mediaLightboxDesc">
                                    {txt(activePreview.caption) || txt(activePreview.altText)}
                                </p>
                            )}

                            <div className="mediaLightboxMetaRow">
                                <div><b>{t('news.mediaFileType', 'Type')}:</b> {activePreview.category?.toUpperCase()} ({activePreview.mimeType || 'unknown'})</div>
                                {activePreview.size && <div><b>{t('news.mediaFileSize', 'File size')}:</b> {formatFileSize(activePreview.size)}</div>}
                                <div><b>File:</b> {activePreview.fileName}</div>
                            </div>

                            <div className="mediaLightboxActions">
                                <a
                                    href={resolvePortalAssetUrl(activePreview.path)}
                                    download={activePreview.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mediaBtnPrimary"
                                    style={{ flex: 'none', padding: '10px 22px' }}
                                >
                                    ⤓ {t('news.mediaDownload', 'Download')}
                                </a>
                                <button
                                    type="button"
                                    className="mediaBtnSecondary"
                                    onClick={() => setActivePreview(null)}
                                >
                                    {t('news.mediaClosePreview', 'Close preview')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
