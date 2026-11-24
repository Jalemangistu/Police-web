import React from 'react';
import { Link } from 'react-router-dom';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';

const defaultOrganizationChart = [
    { id: 'commissioner', label: 'Commissioner', parentId: '' },
    { id: 'deputies', label: 'Deputy Commissioners', parentId: 'commissioner' },
    { id: 'operations', label: 'Operations', parentId: 'deputies' },
    { id: 'investigations', label: 'Investigations', parentId: 'deputies' },
    { id: 'community', label: 'Community Policing', parentId: 'deputies' },
    { id: 'support', label: 'Support Services', parentId: 'deputies' },
    { id: 'commands', label: 'Sub-city & District Commands', parentId: 'deputies' },
];

function unitLabel(unit, t) {
    const rawLabel = unit.name || unit.label;
    const label = unit.id && t ? t(`about.org.${unit.id}`, rawLabel) : rawLabel;
    const rawTitle = unit.title;
    const title = unit.titleKey && t ? t(unit.titleKey, rawTitle) : rawTitle;
    return [label, title].filter(Boolean).join(label ? ' — ' : '');
}

function Branch({ unit, valid, visited = [] }) {
    const { t } = useTranslation();
    const children = valid.filter((child) => child.parentId === unit.id && !visited.includes(child.id));
    return (
        <li>
            <span className="orgNode">{unitLabel(unit, t)}</span>
            {children.length > 0 && (
                <ul>
                    {children.map((child) => (
                        <Branch key={child.id} unit={child} valid={valid} visited={[...visited, unit.id]} />
                    ))}
                </ul>
            )}
        </li>
    );
}

function Organogram({ units }) {
    const { t } = useTranslation();
    const valid = units.filter((unit) => unit?.id && (unit.name || unit.label));
    const roots = valid.filter((unit) => !unit.parentId || !valid.some((other) => other.id === unit.parentId));
    return (
        <div className="organogram">
            {roots.length
                ? <ul>{roots.map((unit) => <Branch key={unit.id} unit={unit} valid={valid} />)}</ul>
                : <p>{t('about.orgNotConfigured', 'Organization structure has not been configured.')}</p>}
        </div>
    );
}

export default function About() {
    const s = useSite();
    const { t } = useTranslation();
    const chart = s.organizationChart?.length ? s.organizationChart : defaultOrganizationChart;

    return (
        <>
            <Hero tag={t('about.tag', 'ABOUT AAP')} title={txt(s.aboutHeroTitle, t('about.defaultHeroTitle', 'Committed to the safety and dignity of every resident'))}>
                <p>{txt(s.aboutHeroLead, t('about.defaultHeroLead', 'Addis Ababa Police works alongside the public to prevent crime, uphold the law, and build a peaceful city.'))}</p>
            </Hero>

            <Section title={t('about.missionVisionValues', 'Mission, vision & values')}>
                <div className="grid three">
                    {[
                        ['◉', t('about.ourMission', 'Our mission'), txt(s.aboutMission, t('about.defaultMission', 'Protect life and property, prevent crime, and deliver professional, responsive police services.'))],
                        ['◈', t('about.ourVision', 'Our vision'), txt(s.aboutVision, t('about.defaultVision', 'A trusted, modern police service helping create a safe and inclusive Addis Ababa.'))],
                        ['✦', t('about.ourValues', 'Our values'), txt(s.aboutValues, t('about.defaultValues', 'Integrity, respect, accountability, service, courage, and partnership.'))],
                    ].map((x) => (
                        <article className="card" key={x[1]}>
                            <i>{x[0]}</i>
                            <h3>{x[1]}</h3>
                            <p>{x[2]}</p>
                        </article>
                    ))}
                </div>
            </Section>

            <Section title={t('about.leadershipOrg', 'Leadership & organization')} lead={t('about.leadershipLead', 'A coordinated structure serving every district of Addis Ababa.')}>
                <div className="split">
                    <article className="card commissionerCard">
                        <h3>{t('about.commissionerMessage', "Commissioner's message")}</h3>
                        <div className="commissionerPhotoWrap">
                            <img
                                src={s.commissionerPhoto || '/commissioner.jpg'}
                                alt={typeof s.commissionerName === 'string' && s.commissionerName ? s.commissionerName : t('about.commissionerAlt', 'Commissioner General')}
                                className="commissionerPhoto"
                            />
                        </div>
                        <div className="commissionerMessageBody">
                            <p>{txt(s.commissionerMessage, t('about.commissionerQuote', '“Public trust is earned through fairness, professionalism, and everyday service. We are committed to listening, responding, and working with every community.”'))}</p>
                        </div>
                        <div className="commissionerSignature">
                            <b>
                                {typeof s.commissionerName === 'string' && s.commissionerName
                                    ? s.commissionerName
                                    : t('about.commissionerDefaultName', 'Demelash Gebremichael')}
                            </b>
                            <span className="commissionerTitle">
                                {typeof s.commissionerTitle === 'string' && s.commissionerTitle
                                    ? s.commissionerTitle
                                    : t('about.commissionerDefaultTitle', 'Commissioner General, Addis Ababa Police')}
                            </span>
                        </div>
                    </article>
                    <Organogram units={chart} />
                </div>
            </Section>

            <Section title={t('about.historyTitle', 'History, achievements & reports')}>
                <div className="stats">
                    <div><b>11</b>{t('about.subCities', 'Sub-cities served')}</div>
                    <div><b>24/7</b>{t('about.emergencyResponse', 'Emergency response')}</div>
                    <div><b>100+</b>{t('about.communityPartnerships', 'Community partnerships')}</div>
                    <div><b>1</b>{t('about.saferCity', 'Safer city, together')}</div>
                </div>
            </Section>
        </>
    );
}
