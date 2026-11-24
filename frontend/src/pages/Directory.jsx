import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hero, Section } from '../components/PageBlocks';
import { txt } from '../context/SiteContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Directory() {
    const { t } = useTranslation();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = search.trim()
                ? `${API}/stations?q=${encodeURIComponent(search.trim())}`
                : `${API}/stations`;
            const res = await fetch(url);
            if (res.ok) setStations(await res.json());
        } catch { /* silently fail */ }
        setLoading(false);
    }, [search]);

    /* Initial load */
    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* Debounced search */
    useEffect(() => {
        const timer = setTimeout(load, 350);
        return () => clearTimeout(timer);
    }, [search, load]);

    return (
        <>
            <Hero tag={t('directory.tag', 'STATION DIRECTORY')} title={t('directory.title', 'Police stations in Addis Ababa')}>
                <p>{t('directory.lead', 'Contact details and operating information for city police stations.')}</p>
            </Hero>

            <Section title={t('directory.stationContacts', 'Station contacts')}>
                {/* Search bar */}
                <div className="directorySearch">
                    <input
                        type="text"
                        placeholder={t('directory.filterPlaceholder', 'Filter by sub-city, district, or station name…')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="directorySearchInput"
                    />
                    {search && (
                        <button className="directorySearchClear" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>

                {loading && (
                    <div className="directoryLoading">
                        <div className="directorySpinner" />
                        <p>{t('directory.loading', 'Loading stations…')}</p>
                    </div>
                )}

                {!loading && stations.length === 0 && (
                    <div className="directoryEmpty">
                        <span className="directoryEmptyIcon">🏢</span>
                        <p>{search ? t('directory.noMatch', 'No stations match your search.') : t('directory.noStationsYet', 'No stations have been added yet.')}</p>
                        {search && <button className="button" onClick={() => setSearch('')}>{t('directory.clearSearch', 'Clear search')}</button>}
                    </div>
                )}

                {!loading && stations.length > 0 && (
                    <>
                        <p className="directoryCount">{stations.length} {t('directory.stationsFound', 'stations found')}</p>
                        <div className="grid two">
                            {stations.map(st => (
                                <article className="card stationCard" key={st._id}>
                                    <div className="stationCardHead">
                                        <small className="stationBadge">{st.subCity}</small>
                                        {txt(st.operatingHours) && <small className="stationHours">🕐 {txt(st.operatingHours)}</small>}
                                    </div>
                                    <h3>{txt(st.name)}</h3>
                                    {st.district && <p className="stationDistrict">{t('directory.district', 'District')}: {st.district}</p>}
                                    {txt(st.address) && <p className="stationAddr">{txt(st.address)}</p>}
                                    <div className="stationMeta">
                                        {st.phone?.length > 0 && <span>📞 {st.phone.join(', ')}</span>}
                                        {st.email && <span>✉ <a href={`mailto:${st.email}`}>{st.email}</a></span>}
                                    </div>
                                    <Link to="/contact">{t('directory.getDirections', 'Get directions →')}</Link>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </Section>
        </>
    );
}
