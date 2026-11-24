import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { txt } from '../context/SiteContext';
import { api } from '../utils/api';
import { Hero } from '../components/PageBlocks';

export default function Article() {
    const { slug } = useParams();
    const { t } = useTranslation();
    const [item, setItem] = useState(null);

    useEffect(() => {
        api(`/news/${slug}`).then(setItem).catch(() => {});
    }, [slug]);

    return (
        <>
            <Hero
                tag={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', flexWrap: 'wrap' }}>
                        <Link to="/news" style={{ color: '#d9b048', textDecoration: 'none' }}>
                            ← {t('news.tag', 'NEWS & MEDIA')}
                        </Link>
                        {item?.category && (
                            <>
                                <span style={{ color: '#64748b' }}>/</span>
                                <span style={{ color: '#cbd5e1' }}>{item.category.toUpperCase()}</span>
                            </>
                        )}
                    </span>
                }
                title={
                    <span
                        style={{
                            display: 'block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            lineHeight: '1.2'
                        }}
                    >
                        {item ? txt(item.title) : t('article.defaultTitle', 'News article')}
                    </span>
                }
            >
                {item && (
                    <p
                        style={{
                            maxWidth: '100%',
                            overflow: 'hidden',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            lineHeight: '1.6'
                        }}
                    >
                        Published on {new Date(item.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}
            </Hero>

            <section className="container section" style={{ maxWidth: '1240px', overflow: 'hidden' }}>
                <article
                    className="card article"
                    style={{
                        background: '#ffffff',
                        borderRadius: '8px',
                        padding: '36px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 16px rgba(12,28,52,0.04)',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                    }}
                >
                    {item ? (
                        <>
                            {item.featuredImage && (
                                <img
                                    src={item.featuredImage}
                                    alt={txt(item.title)}
                                    style={{ width: '100%', maxHeight: '440px', objectFit: 'cover', borderRadius: '6px', marginBottom: '28px' }}
                                />
                            )}
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    lineHeight: '1.8',
                                    color: '#334155',
                                    whiteSpace: 'pre-wrap',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {txt(item.content)}
                            </div>
                            <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                <Link className="outline" to="/news">← {t('article.backToNews', 'Back to news')}</Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2
                                style={{
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.3'
                                }}
                            >
                                {t('article.defaultTitle', 'News article')}
                            </h2>
                            <p
                                style={{
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.6'
                                }}
                            >
                                {t('article.notAvailable', 'This article is not currently available.')}
                            </p>
                            <Link className="outline" to="/news">{t('article.backToNews', 'Back to news')}</Link>
                        </>
                    )}
                </article>
            </section>
        </>
    );
}
