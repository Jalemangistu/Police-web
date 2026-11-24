import React from 'react';
import { Link } from 'react-router-dom';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';

export default function Community() {
    const s = useSite();
    const { t } = useTranslation();

    return (
        <>
            <Hero tag={t('community.tag', 'COMMUNITY POLICING')} title={txt(s.communityHeroTitle) || t('community.defaultHeroTitle', 'Building safer neighborhoods together')}>
                <p>{txt(s.communityHeroLead) || t('community.defaultHeroLead', 'Community safety is shared. Discover programs and ways to collaborate with officers in your sub-city.')}</p>
            </Hero>

            <Section title={t('community.getInvolved', 'Get involved')}>
                <div className="grid three">
                    {[
                        [
                            t('community.neighborhoodWatch', 'Neighborhood watch'),
                            t('community.neighborhoodWatchText', 'Connect with residents and local officers to identify concerns.'),
                            '/community/neighborhood-watch'
                        ],
                        [
                            t('community.volunteer', 'Volunteer programmes'),
                            t('community.volunteerText', 'Support community safety initiatives and public education.'),
                            '/community/volunteer'
                        ],
                        [
                            t('community.youthEngagement', 'Youth engagement'),
                            t('community.youthText', 'Help young people lead positive change.'),
                            '/community/youth-engagement'
                        ],
                    ].map((x) => (
                        <article className="card" key={x[0]}>
                            <i>◎</i>
                            <h3>{x[0]}</h3>
                            <p>{x[1]}</p>
                            <Link className="outline" to={x[2]}>{t('community.registerInterest', 'Register interest')}</Link>
                        </article>
                    ))}
                </div>
            </Section>
        </>
    );
}
