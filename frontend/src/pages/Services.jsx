import React, { useState, useEffect } from 'react';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';
import { api } from '../utils/api';

const offline = [
    ['crime-report', 'Report a Crime', 'Submit a non-emergency incident report securely.'],
    ['lost-found', 'Lost & Found', 'Report lost property or search recovered items.'],
    ['clearance', 'Police Clearance', 'Apply for and track a clearance certificate.'],
    ['traffic', 'Traffic Inquiry', 'Check traffic violation notices.'],
    ['event', 'Event Security Permit', 'Request security support for an event.'],
    ['noise', 'Noise Permit', 'Apply for a public event noise permit.'],
    ['conduct', 'Police Conduct Complaint', 'Submit a confidential complaint.'],
];

export default function Services() {
    const s = useSite();
    const { t } = useTranslation();
    const [items, setItems] = useState([]);

    useEffect(() => {
        api('/services').then(setItems).catch(() => {});
    }, []);

    const shown = items.length
        ? items
        : offline.map(([slug, name, description]) => ({
            _id: slug,
            name: { en: name },
            description: { en: description },
        }));

    return (
        <>
            <Hero tag={t('services.tag', 'SERVICES PORTAL')} title={txt(s.servicesHeroTitle) || t('services.defaultHeroTitle', 'Accessible police services for every resident')}>
                <p>{txt(s.servicesHeroLead) || t('services.defaultHeroLead', 'Access official police clearances, reporting tools, and community permits online.')}</p>
            </Hero>

            <Section title={t('services.onlineServices', 'Online services')} lead={t('services.selectService', 'Select a service to access it.')}>
                <div className="grid three">
                    {shown.map((sv, i) => (
                        <article className="card serviceFull" key={sv._id}>
                            <i>{['⌁', '⌕', '✓', '↗', '◈', '◌', '!'][i % 7]}</i>
                            <h3>{txt(sv.name)}</h3>
                            <p>{txt(sv.description)}</p>
                            {sv.externalUrl && (
                                <a className="button" href={sv.externalUrl} target="_blank" rel="noopener noreferrer">
                                    {t('home.accessService', 'Access service ↗')}
                                </a>
                            )}
                        </article>
                    ))}
                </div>
            </Section>
        </>
    );
}
