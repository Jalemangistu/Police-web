import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';

export default function Legal() {
    const { t } = useTranslation();

    const docs = [
        t('legal.doc1', 'Police proclamations and regulations'),
        t('legal.doc2', 'Standard Operating Procedures (public versions)'),
        t('legal.doc3', 'Human rights policy'),
        t('legal.doc4', 'Data protection and privacy policy'),
        t('legal.doc5', 'Freedom of information guidelines'),
        t('legal.doc6', 'Annual reports and strategic plans'),
    ];

    return (
        <>
            <Hero tag={t('legal.tag', 'LEGAL & POLICIES')} title={t('legal.title', 'Rules, regulations & public information')}>
                <p>{t('legal.lead', 'Public documents supporting transparent, accountable policing and access to information.')}</p>
            </Hero>

            <Section title={t('legal.publicDocs', 'Public documents')}>
                <div className="docs">
                    {docs.map((x) => (
                        <a href="#document" key={x}>
                            <small>PDF</small>
                            {x}
                            <b>{t('legal.download', 'Download →')}</b>
                        </a>
                    ))}
                </div>
            </Section>
        </>
    );
}
