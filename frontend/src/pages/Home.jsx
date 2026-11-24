import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSite, txt } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import {
    Siren,
    CarFront,
    ShieldCheck,
    UserPlus,
    Anchor,
    IdCard,
    Flame,
    Phone
} from 'lucide-react';

// Custom SVG icons matching the design
const PoliceCarIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2h4" />
        <path d="M12 2v2" />
        <path d="M5 11l1.6-4.5A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.5L19 11" />
        <rect x="3" y="11" width="18" height="8" rx="2" />
        <circle cx="7.5" cy="16" r="1.5" />
        <circle cx="16.5" cy="16" r="1.5" />
    </svg>
);

const TrafficCarIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.5 5h-5z" />
        <path d="M5 13l1.8-4.5A2 2 0 0 1 8.7 7h6.6a2 2 0 0 1 1.9 1.5L19 13" />
        <rect x="3" y="13" width="18" height="7" rx="2" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
);

const MaritimeBoatIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14l2.5-6h11l2.5 6" />
        <path d="M9 8V5h6v3" />
        <path d="M2 17.5c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1" />
        <path d="M2 20.5c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1" />
    </svg>
);

const FireRescueIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5c-4 5.5-6 8.5-6 12a6 6 0 0 0 12 0c0-3.5-2-6.5-6-12z" />
        <path d="M12 17.5a2.2 2.2 0 0 1-2.2-2.2c0-1.6 1.4-2.5 2.2-4 0.8 1.5 2.2 2.4 2.2 4a2.2 2.2 0 0 1-2.2 2.2z" />
    </svg>
);

// Emergency Hotline Numbers (easily editable array matching the design)
const HOTLINE_NUMBERS = [
    {
        id: 'emergency',
        title: 'Emergency',
        titleKey: 'home.hotlineEmergency',
        subtitle: 'Immediate assistance',
        subtitleKey: 'home.hotlineEmergencySub',
        number: '112',
        icon: PoliceCarIcon,
    },
    {
        id: 'traffic',
        title: 'Traffic Accidents',
        titleKey: 'home.hotlineTraffic',
        subtitle: 'Road incident support',
        subtitleKey: 'home.hotlineTrafficSub',
        number: '113',
        icon: TrafficCarIcon,
    },
    {
        id: 'misconduct',
        title: 'Police Misconduct',
        titleKey: 'home.hotlineMisconduct',
        subtitle: 'Report abuse by an officer',
        subtitleKey: 'home.hotlineMisconductSub',
        number: '3511',
        icon: ShieldCheck,
    },
    {
        id: 'corruption',
        title: 'Anti-Corruption',
        titleKey: 'home.hotlineCorruption',
        subtitle: 'Report corruption safely',
        subtitleKey: 'home.hotlineCorruptionSub',
        number: '997',
        icon: UserPlus,
    },
    {
        id: 'maritime',
        title: 'Maritime Problems',
        titleKey: 'home.hotlineMaritime',
        subtitle: 'Emergency support on water',
        subtitleKey: 'home.hotlineMaritimeSub',
        number: '110',
        icon: MaritimeBoatIcon,
    },
    {
        id: 'license',
        title: 'Driving Licence',
        titleKey: 'home.hotlineLicense',
        subtitle: 'Licence information & queries',
        subtitleKey: 'home.hotlineLicenseSub',
        number: '118',
        icon: IdCard,
    },
    {
        id: 'fire',
        title: 'Fire & Rescue',
        titleKey: 'home.hotlineFire',
        subtitle: 'Fire and rescue response',
        subtitleKey: 'home.hotlineFireSub',
        number: '111',
        icon: FireRescueIcon,
    },
];

const resolveHotlineIcon = (iconKey) => {
    switch (iconKey) {
        case 'emergency': return PoliceCarIcon;
        case 'traffic': return TrafficCarIcon;
        case 'misconduct': return ShieldCheck;
        case 'corruption': return UserPlus;
        case 'maritime': return MaritimeBoatIcon;
        case 'license': return IdCard;
        case 'fire': return FireRescueIcon;
        case 'shield': return ShieldCheck;
        case 'phone':
        default:
            return Phone;
    }
};

const getServiceIcon = (iconName) => {
    switch (iconName) {
        case 'clearance':
        case 'document':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            );
        case 'traffic':
        case 'car':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3c-.1.2-.1.4-.1.6v4.5c0 .6.4 1 1 1h2"></path>
                    <circle cx="7" cy="17" r="2"></circle>
                    <path d="M9 17h6"></path>
                    <circle cx="17" cy="17" r="2"></circle>
                </svg>
            );
        case 'community':
        case 'users':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            );
        case 'phone':
        case 'emergency':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
            );
        case 'scales':
        case 'legal':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
                    <path d="M7 21h10"></path>
                    <path d="M12 3v18"></path>
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
                </svg>
            );
        case 'building':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01"></path>
                    <path d="M16 6h.01"></path>
                    <path d="M8 10h.01"></path>
                    <path d="M16 10h.01"></path>
                    <path d="M8 14h.01"></path>
                    <path d="M16 14h.01"></path>
                </svg>
            );
        case 'info':
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
            );
        case 'shield':
        case 'crime':
        default:
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
            );
    }
};

const CORE_SERVICES = [
    {
        id: 'crime-reporting',
        icon: getServiceIcon('shield'),
        titleKey: 'home.srvCrime',
        defaultTitle: 'Report a Crime (Non-Emergency)',
        descKey: 'home.srvCrimeDesc',
        defaultDesc: 'Official guidance on submitting non-emergency incident reports safely and securely.',
        overview: {
            en: 'Allows citizens and residents to report non-emergency incidents, property losses, minor accidents, and local concerns without visiting a station immediately.',
            am: 'ዜጎች እና ነዋሪዎች ድንገተኛ ያልሆኑ ክስተቶችን፣ የንብረት መጥፋትን እና አነስተኛ አደጋዎችን በቀላሉ ለፖሊስ የሚያሳውቁበት ይፋዊ መመሪያ።',
            om: 'Lammileen taateewwan balaa hin hatatamne, qabeenya bade fi komii nageenyaa poolisiitti akka beeksisan kan dandeessisu.'
        },
        requirements: {
            en: 'Valid National ID, Kebele ID, or Passport; precise date, time, and location of the incident; details of involved individuals or property.',
            am: 'ህጋዊ የታደሰ መታወቂያ ወይም ፓስፖርት፤ የወንጀሉ የተፈጸመበት ቀን፣ ሰዓት እና ትክክለኛ ቦታ፤ የንብረት ወይም የተጠርጣሪዎች መግለጫ።',
            om: 'Waraqaa eenyummaa seera qabeessa, guyyaa, sa\'aatii fi bakka taatee, ibsa qabeenya badee.'
        },
        availability: {
            en: '24/7 at all 11 Sub-City Police Divisions and local District Woreda stations across Addis Ababa.',
            am: 'በሁሉም 11 ክፍለ ከተሞች እና በየወረዳው በሚገኙ ፖሊስ ጣቢያዎች 24 ሰዓት በሳምንት 7 ቀናት ይሰጣል።',
            om: 'Kutaalee magaalaa 11 fi waajjiraalee aanaalee hunda keessatti sa\'aatii 24 banaadha.'
        },
        fee: {
            en: 'Free of charge (Official Public Service)',
            am: 'ያለክፍያ የሚሰጥ ይፋዊ የህዝብ አገልግሎት',
            om: 'Kaffaltii malee kan kennamu'
        }
    },
    {
        id: 'police-clearance',
        icon: getServiceIcon('clearance'),
        titleKey: 'home.srvClearance',
        defaultTitle: 'Police Clearance Certificate',
        descKey: 'home.srvClearanceDesc',
        defaultDesc: 'Official information on requirements and verification for criminal record clearance certificates.',
        overview: {
            en: 'The Police Clearance Certificate certifies the criminal record history of an individual for employment, immigration, higher education, and international travel.',
            am: 'የፖሊስ ማጣሪያ ሰነድ ለስራ ቅጥር፣ ለውጭ ሀገር ጉዞ፣ ለትምህርት እና ህጋዊ ጉዳዮች ከማንኛውም የወንጀል ድርጊት ነፃ መሆንን የሚያረጋግጥ ይፋዊ ሰነድ ነው።',
            om: 'Waraqaan qulqullina poolisii qacarrii hojii, imala biyya alaa, fi barumsaaf galmee yakkaa irraa bilisa ta\'uu mirkaneessa.'
        },
        requirements: {
            en: 'Two recent passport-size photographs; original and copy of Kebele ID / Passport; fingerprint biometric capture at the division headquarters.',
            am: 'ሁለት የፓስፖርት መጠን ያላቸው ፎቶግራፎች፤ ዋናውና ፎቶ ኮፒ የታደሰ መታወቂያ ወይም ፓስፖርት፤ የጣት አሻራ ምርመራ በክፍለ ከተማው መምሪያ።',
            om: 'Suuraa paaspoortii 2, waraqaa eenyummaa ykn paaspoortii orijinaala fi koppii, ashaaraa qubaa.'
        },
        availability: {
            en: 'Monday – Friday: 8:30 AM – 5:00 PM, Saturday: 8:30 AM – 12:30 PM (Forensic Documentation Centers)',
            am: 'ከሰኞ እስከ አርብ፡ ከጠዋቱ 2:30 - 11:00፣ ቅዳሜ፡ ከጠዋቱ 2:30 - 6:30 (በፎረንሲክ እና ማስረጃ ማዕከላት)',
            om: 'Wiixata - Jimaata: Sa\'aatii 2:30 - 11:00, Sanbata: 2:30 - 6:30'
        },
        fee: {
            en: 'Official administrative fee applies per government directive (150 ETB standard processing)',
            am: 'በመንግስት መመሪያ መሰረት የተወሰነ ይፋዊ የአገልግሎት ክፍያ (150 የኢትዮጵያ ብር)',
            om: 'Kaffaltii tajaajilaa mootummaa (Qarshii 150)'
        }
    },
    {
        id: 'traffic-services',
        icon: getServiceIcon('traffic'),
        titleKey: 'home.srvTraffic',
        defaultTitle: 'Traffic & Road Safety Guidance',
        descKey: 'home.srvTrafficDesc',
        defaultDesc: 'Official regulations, collision reporting procedures, and road safety information across the city.',
        overview: {
            en: 'Guidance on city traffic regulations, corridor speed compliance, pedestrian safety measures, and official collision reporting procedures.',
            am: 'ስለ ከተማው የትራፊክ ደህንነት መመሪያዎች፣ የእግረኞች መሻገሪያዎች፣ የፍጥነት ገደብ እና የአደጋ ሪፖርት አደራረግ ሂደቶች መረጃ።',
            om: 'Qajeelfama seerota tiraafikaa magaalaa, eegumsa deemtoota faanaa, fi haala gabaasa balaa konkolaataa.'
        },
        requirements: {
            en: 'In case of minor traffic incidents: driver license, vehicle registration booklet (Libre), third-party insurance certificate, and incident location photos.',
            am: 'በትራፊክ አደጋ ወቅት፡ የመንጃ ፈቃድ፣ የተሸከርካሪ የባለቤትነት ማረጋገጫ (ሊብሬ)፣ የሶስተኛ ወገን ኢንሹራንስ ሰነድ እና የአደጋው ፎቶግራፍ።',
            om: 'Hayyama konkolaachisummaa, liibre konkolaataa, inshuraansii qaama sadaffaa, fi suuraalee bakka balaa.'
        },
        availability: {
            en: 'Traffic Emergency Response: 24/7 Hotline via 991 or 011 552 4433. Division desks open regular business hours.',
            am: 'የትራፊክ ድንገተኛ አደጋ ምላሽ፡ በ991 ወይም 011 552 4433 24 ሰዓት ክፍት ነው። የቢሮ አገልግሎት በመደበኛ የስራ ሰዓት ይሰጣል።',
            om: 'Deebii hatattamaa tiraafikaa: Sarara bilisaa 991 ykn 011 552 4433 sa\'aatii 24.'
        },
        fee: {
            en: 'Safety guidance is free. Infraction resolution per statutory traffic penalty schedules.',
            am: 'የደህንነት መረጃና መመሪያ ያለክፍያ የሚሰጥ ሲሆን የቅጣት አፈጻጸም በህጉ መሰረት ይፈጸማል።',
            om: 'Gorsi nageenyaa kaffaltii malee kennama.'
        }
    },
    {
        id: 'community-policing',
        icon: getServiceIcon('community'),
        titleKey: 'home.srvCommunity',
        defaultTitle: 'Community Policing Partnership',
        descKey: 'home.srvCommunityDesc',
        defaultDesc: 'Information on partnering with neighborhood officers, local safety committees, and advisory councils.',
        overview: {
            en: 'Community policing brings residents, local business owners, youth groups, and district officers together to proactively maintain peace, prevent local crime, and resolve neighborhood issues.',
            am: 'የማህበረሰብ ፖሊሲንግ ነዋሪዎች፣ የንግድ ማህበረሰብ፣ ወጣቶች እና የአካባቢ ፖሊስ አባላት በጋራ በመተባበር ሰላምን የሚያስከብሩበትና ወንጀልን አስቀድመው የሚከላከሉበት አሰራር ነው።',
            om: 'Poolisiin hawaasaa jiraattota, daldaltoota, dargaggoota fi poolisii naannoo walitti fiduun nageenya mirkaneessa.'
        },
        requirements: {
            en: 'Open to all residents of Addis Ababa. No special credentials required to attend local monthly safety meetings.',
            am: 'ለማንኛውም የአዲስ አበባ ከተማ ነዋሪ ክፍት ነው። ወርሃዊ የደህንነት ውይይቶችን ለመሳተፍ ምንም አይነት ልዩ ቅድመ-ሁኔታ አይጠይቅም።',
            om: 'Jiraattota Finfinnee hundaaf banaadha. Walga\'iiwwan ji\'aa irratti hirmaachuun ni danda\'ama.'
        },
        availability: {
            en: 'Monthly neighborhood forums at local Woreda police posts; community officers available daily.',
            am: 'በየወረዳው ፖሊስ ኬላዎች ወርሃዊ የውይይት መድረኮች ይካሄዳሉ፤ የማህበረሰብ ፖሊስ አስተባባሪዎች በየቀኑ ያገለግላሉ።',
            om: 'Walga\'ii ji\'aa waajjira aanaatti taasifama; qindeessitoonni guyyaa guyyaan tajaajilu.'
        },
        fee: {
            en: 'Completely free community engagement program.',
            am: 'ሙሉ በሙሉ ያለክፍያ የሚካሄድ የህዝብ ተሳትፎ መርሃ-ግብር።',
            om: 'Sagantaa hirmaannaa hawaasaa kaffaltii malee gaggeeffamu.'
        }
    }
];

export default function Home() {
    const s = useSite();
    const { t } = useTranslation();
    const [data, setData] = useState({ alerts: [], news: [], services: [] });
    const [selectedService, setSelectedService] = useState(null);

    // Hero Slider State
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStart, setTouchStart] = useState(null);

    useEffect(() => {
        api('/home')
            .then((res) => {
                if (res) setData((prev) => ({ ...prev, ...res }));
            })
            .catch(() => { });

        api('/hotlines')
            .then((hotlines) => {
                if (Array.isArray(hotlines) && hotlines.length > 0) {
                    setData((prev) => ({ ...prev, hotlines }));
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedService(null);
        };
        if (selectedService) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedService]);

    // Active alert message
    const activeAlert = data?.alerts?.[0];
    const rawTitle = activeAlert ? txt(activeAlert.title) : '';
    const rawMsg = activeAlert ? txt(activeAlert.message) : '';
    const alertTitle = rawTitle && rawTitle.toLowerCase() !== 'warning' && rawTitle.toLowerCase() !== 'test'
        ? rawTitle
        : t('home.alertDefaultTitle', 'Stay informed. Stay prepared.');
    const alertMessage = rawMsg && rawMsg.toLowerCase() !== 'test warning' && rawMsg.toLowerCase() !== 'test'
        ? rawMsg
        : t('home.alertDefaultMsg', 'View current safety notices, traffic updates, and public advisories for Addis Ababa.');

    // News items
    const defaultNews = [
        {
            _id: 'default-1',
            tag: t('home.newsTagCommunity', 'COMMUNITY'),
            date: '12 JUN 2025',
            title: t('home.defaultNews1', 'Community safety forum brings residents and officers together'),
            slug: 'community-safety-forum',
            isDark: true,
        },
        {
            _id: 'default-2',
            tag: t('home.newsTagSafety', 'PUBLIC SAFETY'),
            date: '08 JUN 2025',
            title: t('home.defaultNews2', 'Road safety campaign expands across Addis Ababa'),
            slug: 'road-safety-campaign',
            isDark: false,
        },
        {
            _id: 'default-3',
            tag: t('home.newsTagAnnouncements', 'ANNOUNCEMENTS'),
            date: '03 JUN 2025',
            title: t('home.defaultNews3', 'New digital services make police support easier to access'),
            slug: 'digital-services-launch',
            isDark: false,
        },
    ];

    const combinedNews = [...(data?.news || [])];
    while (combinedNews.length < 3) {
        combinedNews.push(defaultNews[combinedNews.length]);
    }
    const newsList = combinedNews.slice(0, 3).map((item, idx) => ({
        _id: item._id || `news-${idx}`,
        tag: item.tag || item.category || (idx === 0 ? t('home.newsTagCommunity', 'COMMUNITY') : idx === 1 ? t('home.newsTagSafety', 'PUBLIC SAFETY') : t('home.newsTagAnnouncements', 'ANNOUNCEMENTS')),
        date: item.publishedAt
            ? new Date(item.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
            : (item.date || '12 JUN 2025'),
        title: (typeof item.title === 'object' ? txt(item.title) : item.title) || defaultNews[idx]?.title,
        slug: item.slug || defaultNews[idx]?.slug,
    }));

    // Dynamic Police Services (prefers database services configured by admin, falls back to core services)
    const activeDbServices = (data?.services || []).filter(srv => srv.isActive !== false);

    const servicesList = activeDbServices.length > 0
        ? activeDbServices.map((srv, idx) => ({
            id: srv._id || srv.slug || `srv-${idx}`,
            icon: getServiceIcon(srv.icon || (idx === 0 ? 'shield' : idx === 1 ? 'clearance' : idx === 2 ? 'traffic' : 'community')),
            title: txt(srv.name) || srv.slug,
            desc: txt(srv.description) || txt(srv.overview) || '',
            overview: srv.overview,
            requirements: srv.requirements,
            availability: srv.availability,
            fee: txt(srv.feeDescription) || (srv.feeAmount ? `${srv.feeAmount} ETB` : t('home.freeService', 'Free of charge (Official Public Service)')),
            emergencyNotice: srv.emergencyNotice
        }))
        : CORE_SERVICES.map(cs => ({
            ...cs,
            title: t(cs.titleKey, cs.defaultTitle),
            desc: t(cs.descKey, cs.defaultDesc),
            fee: txt(cs.fee)
        }));

    // Hero Slider Configurations & Default Slides
    const defaultHeroSlides = [
        {
            id: 'default-hero-1',
            tag: t('home.heroSlide1Tag', 'PROTECTING OUR CITY, SERVING OUR COMMUNITY'),
            title: t('home.heroSlide1Title', 'Safety, trust, and service.'),
            desc: t('home.heroSlide1Desc', 'Working together for a safer Addis Ababa — with integrity, courage, and respect for every community.'),
            image: '/addis-skyline.jpg',
            btn1: {
                text: t('home.heroSlide1Btn1', 'POLICE SERVICES'),
                link: '#police-services',
                isScroll: true
            },
            btn2: {
                text: t('home.heroSlide1Btn2', 'LEARN ABOUT US'),
                link: '/about'
            }
        },
        {
            id: 'default-hero-2',
            tag: t('home.heroSlide2Tag', '24/7 DEDICATED OPERATIONS'),
            title: t('home.heroSlide2Title', 'Always vigilant. Ready to respond.'),
            desc: t('home.heroSlide2Desc', 'Over 11 Sub-City Divisions and round-the-clock emergency patrol units safeguarding peace day and night.'),
            image: '/addis-skyline.jpg',
            btn1: {
                text: t('home.heroSlide2Btn1', 'STATIONS & CONTACTS'),
                link: '/stations'
            },
            btn2: {
                text: t('home.heroSlide2Btn2', 'PUBLIC SAFETY'),
                link: '/safety'
            }
        },
        {
            id: 'default-hero-3',
            tag: t('home.heroSlide3Tag', 'COMMUNITY PARTNERSHIP'),
            title: t('home.heroSlide3Title', 'Stronger neighborhoods built together.'),
            desc: t('home.heroSlide3Desc', 'Proactive crime prevention through citizen dialogue, neighborhood watch forums, and trusted community engagement.'),
            image: '/addis-skyline.jpg',
            btn1: {
                text: t('home.heroSlide3Btn1', 'COMMUNITY POLICING'),
                link: '/community'
            },
            btn2: {
                text: t('home.heroSlide3Btn2', 'SAFETY GUIDES'),
                link: '/safety/resources'
            }
        }
    ];

    const configuredHeroSlides = (s?.heroSlides || []).filter(
        (sl) => sl && (
            (typeof sl.headline === 'object' && (sl.headline?.en || sl.headline?.am || sl.headline?.om)) ||
            (typeof sl.headline === 'string' && sl.headline.trim()) ||
            sl.image
        )
    );

    const heroSlides = configuredHeroSlides.length > 0
        ? configuredHeroSlides.map((sl, idx) => ({
            id: `custom-hero-${idx}`,
            tag: txt(sl.tag) || t('home.heroSlide1Tag', 'PROTECTING OUR CITY, SERVING OUR COMMUNITY'),
            title: txt(sl.headline) || t('home.heroSlide1Title', 'Safety, trust, and service.'),
            desc: txt(sl.body) || t('home.heroSlide1Desc', 'Working together for a safer Addis Ababa — with integrity, courage, and respect for every community.'),
            image: sl.image || '/addis-skyline.jpg',
            btn1: {
                text: txt(sl.linkText) || (sl.link === '#police-services' || !sl.link ? t('home.accessPoliceServices', 'POLICE SERVICES') : t('home.heroSlide1Btn1', 'EXPLORE MORE')),
                link: sl.link || '#police-services',
                isScroll: sl.link === '#police-services' || !sl.link
            },
            btn2: {
                text: t('home.learnAboutUs', 'LEARN ABOUT US'),
                link: '/about'
            }
        }))
        : defaultHeroSlides;

    const totalSlides = heroSlides.length;

    // Reset slide index if count changes
    useEffect(() => {
        if (currentSlide >= totalSlides) {
            setCurrentSlide(0);
        }
    }, [totalSlides, currentSlide]);

    // Automatic Slideshow Timer (Pauses on hover/focus)
    useEffect(() => {
        if (isPaused || totalSlides <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 6500);
        return () => clearInterval(timer);
    }, [isPaused, totalSlides]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const goToSlide = (idx) => setCurrentSlide(idx);

    const handleHeroKeyDown = (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        }
    };

    const handleTouchStart = (e) => {
        if (e.touches && e.touches.length > 0) {
            setTouchStart(e.touches[0].clientX);
        }
    };

    const handleTouchEnd = (e) => {
        if (touchStart === null) return;
        if (e.changedTouches && e.changedTouches.length > 0) {
            const touchEnd = e.changedTouches[0].clientX;
            const diff = touchStart - touchEnd;
            if (diff > 45) {
                nextSlide();
            } else if (diff < -45) {
                prevSlide();
            }
        }
        setTouchStart(null);
    };

    return (
        <div className="aap-home-page">
            {/* 1. HERO SLIDER */}
            <section
                className="aap-hero aap-hero-slider"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onKeyDown={handleHeroKeyDown}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                tabIndex={0}
                aria-label="Addis Ababa Police City Highlights"
                aria-roledescription="carousel"
            >
                {heroSlides.map((slide, index) => {
                    const isActive = index === currentSlide;
                    return (
                        <div
                            key={slide.id}
                            className={`aap-hero-slide ${isActive ? 'is-active' : ''}`}
                            aria-hidden={!isActive}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${totalSlides}`}
                        >
                            <div
                                className="aap-hero-slide-bg"
                                style={{ backgroundImage: `url('${slide.image}')` }}
                                aria-hidden="true"
                            />
                            <div className="aap-hero-overlay" aria-hidden="true" />

                            <div className="aap-hero-container">
                                <div className="aap-hero-content">
                                    <div className="aap-tag-row">
                                        <span className="aap-gold-line" aria-hidden="true" />
                                        <span className="aap-tag-text">{slide.tag}</span>
                                    </div>

                                    <h1 className="aap-hero-title">{slide.title}</h1>

                                    <p className="aap-hero-desc">{slide.desc}</p>

                                    <div className="aap-hero-btns">
                                        {slide.btn1?.isScroll ? (
                                            <a
                                                href="#police-services"
                                                className="aap-btn-gold"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    document.getElementById('police-services')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                            >
                                                <span>{slide.btn1.text}</span>
                                                <span aria-hidden="true">↓</span>
                                            </a>
                                        ) : slide.btn1?.link?.startsWith('http') ? (
                                            <a
                                                href={slide.btn1.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="aap-btn-gold"
                                            >
                                                <span>{slide.btn1.text}</span>
                                                <span aria-hidden="true">↗</span>
                                            </a>
                                        ) : (
                                            <Link to={slide.btn1?.link || '/services'} className="aap-btn-gold">
                                                <span>{slide.btn1?.text || t('home.accessPoliceServices', 'POLICE SERVICES')}</span>
                                                <span aria-hidden="true">→</span>
                                            </Link>
                                        )}

                                        {slide.btn2 && (
                                            <Link to={slide.btn2.link} className="aap-btn-outline-white">
                                                <span>{slide.btn2.text}</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Left & Right Arrow Navigation */}
                {totalSlides > 1 && (
                    <>
                        <button
                            type="button"
                            className="aap-hero-arrow aap-hero-arrow-prev"
                            onClick={prevSlide}
                            aria-label={t('home.heroPrevSlide', 'Previous slide')}
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="aap-hero-arrow aap-hero-arrow-next"
                            onClick={nextSlide}
                            aria-label={t('home.heroNextSlide', 'Next slide')}
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Bottom Control Bar: Counter, Indicator Dots, Play/Pause */}
                {totalSlides > 1 && (
                    <div className="aap-hero-controls-bar">
                        <div className="aap-hero-counter" aria-hidden="true">
                            <span className="aap-hero-counter-current">{String(currentSlide + 1).padStart(2, '0')}</span>
                            <span className="aap-hero-counter-sep">/</span>
                            <span className="aap-hero-counter-total">{String(totalSlides).padStart(2, '0')}</span>
                        </div>

                        <div className="aap-hero-dots" role="tablist" aria-label="Slider navigation">
                            {heroSlides.map((_, dotIdx) => (
                                <button
                                    key={dotIdx}
                                    type="button"
                                    className={`aap-hero-dot ${dotIdx === currentSlide ? 'is-active' : ''}`}
                                    onClick={() => goToSlide(dotIdx)}
                                    aria-selected={dotIdx === currentSlide}
                                    aria-label={t('home.heroGoToSlide', { slide: dotIdx + 1, defaultValue: `Go to slide ${dotIdx + 1}` })}
                                    role="tab"
                                >
                                    <span className="aap-hero-dot-inner" />
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="aap-hero-pause-btn"
                            onClick={() => setIsPaused((prev) => !prev)}
                            aria-label={isPaused ? t('home.heroPlay', 'Play slideshow') : t('home.heroPause', 'Pause slideshow')}
                            title={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                        >
                            {isPaused ? (
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </section>

            {/* 2. PUBLIC SAFETY ALERT BANNER (Photo 3) */}
            <section className="aap-alert-banner" aria-label="Public Safety Notice">
                <div className="aap-alert-container">
                    <div className="aap-alert-left">
                        <div className="aap-alert-icon-box" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div className="aap-alert-title-wrap">
                            <span className="aap-alert-tag">{t('home.alertTag', 'PUBLIC SAFETY ALERT')}</span>
                            <span className="aap-alert-heading">{alertTitle}</span>
                        </div>
                    </div>

                    <div className="aap-alert-middle">
                        <p className="aap-alert-msg">{alertMessage}</p>
                    </div>

                    <div className="aap-alert-right">
                        <Link to="/safety" className="aap-alert-link">
                            <span>{t('home.viewAlerts', 'VIEW ALL ALERTS')}</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2.5 EMERGENCY HOTLINE NUMBERS SECTION */}
            <section
                className="aap-hotline-section"
                aria-label={`${t('home.hotlineTitlePart1', 'Emergency')} ${t('home.hotlineTitlePart2', 'hotline numbers')}`}
            >
                {/* Soft beige circle in the top-left background */}
                <div className="aap-hotline-bg-circle" aria-hidden="true" />
                {/* Faint dotted pattern */}
                <div className="aap-hotline-bg-dots" aria-hidden="true" />

                <div className="aap-section-container">
                    {/* Header */}
                    <div className="aap-hotline-header">
                        <div className="aap-hotline-eyebrow">
                            <span className="aap-hotline-dot" aria-hidden="true" />
                            <span>{t('home.hotlineEyebrow', 'HELP IS ONE CALL AWAY')}</span>
                        </div>

                        <h2 className="aap-hotline-heading">
                            <span className="aap-hotline-line-1">
                                <span className="text-navy">{t('home.hotlineEmergencyWord', 'Emergency')}</span>{' '}
                                <span className="text-gold">{t('home.hotlineWord', 'hotline')}</span>
                            </span>
                            <span className="aap-hotline-line-2 text-gold">
                                {t('home.numbersWord', 'numbers')}
                            </span>
                        </h2>

                        <p className="aap-hotline-subtext">
                            {t(
                                'home.hotlineSubtext',
                                'Save these essential contacts for when every second matters. Tap any card to call the service directly.'
                            )}
                        </p>
                    </div>

                    {/* Responsive grid of cards (4 cols desktop, 2 cols tablet, 1 col mobile) */}
                    <div className="aap-hotline-grid">
                        {((data?.hotlines && data.hotlines.length > 0)
                            ? data.hotlines.map(h => ({
                                id: h._id,
                                title: txt(h.title),
                                subtitle: txt(h.subtitle),
                                number: h.number,
                                icon: resolveHotlineIcon(h.icon)
                            }))
                            : HOTLINE_NUMBERS.map(card => ({
                                id: card.id,
                                title: t(card.titleKey, card.title),
                                subtitle: t(card.subtitleKey, card.subtitle),
                                number: card.number,
                                icon: card.icon
                            }))
                        ).map((card) => {
                            const IconComponent = card.icon;
                            const cardTitle = card.title;
                            const cardSubtitle = card.subtitle;
                            const callPrefix = t('home.hotlineCallPrefix', 'Call');
                            const ariaLabel = t('home.hotlineAriaLabel', {
                                defaultValue: `Call ${cardTitle} on ${card.number}`,
                                service: cardTitle,
                                number: card.number,
                            });

                            return (
                                <a
                                    key={card.id}
                                    href={`tel:${card.number}`}
                                    className="aap-hotline-card"
                                    aria-label={ariaLabel}
                                >
                                    {/* Gold bars on navy outer frame */}
                                    <span className="aap-hotline-gold-bar aap-hotline-bar-top" aria-hidden="true" />
                                    <span className="aap-hotline-gold-bar aap-hotline-bar-bottom" aria-hidden="true" />

                                    {/* Inner off-white rounded panel */}
                                    <div className="aap-hotline-inner-panel">
                                        <div>
                                            {/* Rounded beige icon tile */}
                                            <div className="aap-hotline-icon-tile" aria-hidden="true">
                                                <IconComponent size={22} strokeWidth={2.2} />
                                            </div>

                                            {/* Bold navy title */}
                                            <h3 className="aap-hotline-card-title">{cardTitle}</h3>

                                            {/* Gray subtitle */}
                                            <p className="aap-hotline-card-subtitle">{cardSubtitle}</p>
                                        </div>

                                        {/* Bottom Call NUMBER + Phone Button (matching design) */}
                                        <div className="aap-hotline-card-bottom">
                                            <span className="aap-hotline-call-label">
                                                <span>{callPrefix}</span>
                                                <strong className="aap-hotline-number">{card.number}</strong>
                                            </span>
                                            <span className="aap-hotline-phone-btn" aria-hidden="true">
                                                <Phone size={18} strokeWidth={2.2} />
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. POLICE SERVICES INFORMATION SECTION */}
            <section className="aap-services-section" id="police-services">
                <div className="aap-section-container">
                    <div className="aap-section-head">
                        <div>
                            <div className="aap-section-tag">{t('home.servicesTag', 'HOW WE CAN HELP')}</div>
                            <h2 className="aap-section-title">{t('home.servicesTitle', 'Police services')}</h2>
                        </div>
                        <p className="aap-section-sub">
                            {t('home.servicesSub', 'Official information and procedural guidance for essential police services.')}
                        </p>
                    </div>

                    <div className="aap-services-grid">
                        {servicesList.map((srv) => (
                            <div
                                key={srv.id}
                                className="aap-service-card aap-service-info-card"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedService(srv)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedService(srv);
                                    }
                                }}
                                aria-label={`${srv.title} - ${t('home.viewServiceInfo', 'VIEW INFORMATION')}`}
                            >
                                <div>
                                    <span className="aap-service-info-badge">
                                        <span aria-hidden="true">ℹ️</span> {t('home.serviceInfoBadge', 'SERVICE INFORMATION')}
                                    </span>
                                    <div className="aap-service-icon-box" aria-hidden="true">
                                        {srv.icon}
                                    </div>
                                    <h3 className="aap-service-card-title">{srv.title}</h3>
                                    <p className="aap-service-card-desc">{srv.desc}</p>
                                </div>
                                <button
                                    type="button"
                                    className="aap-service-card-info-action"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedService(srv);
                                    }}
                                >
                                    <span>{t('home.viewServiceInfo', 'VIEW INFORMATION')}</span>
                                    <span aria-hidden="true">→</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. OUR COMMITMENT SECTION (Photo 4) */}
            <section className="aap-commitment-section">
                <div className="aap-section-container">
                    <div className="aap-commitment-grid">
                        {/* Left Side: Police Seal with Rings and 24/7 Badge */}
                        <div className="aap-commitment-left">
                            <div className="aap-commitment-rings">
                                <div className="aap-ring-outer" aria-hidden="true"></div>
                                <div className="aap-ring-inner" aria-hidden="true"></div>
                                <img
                                    src="/aap-crest.png"
                                    alt="Addis Ababa Police Commission Seal"
                                    className="aap-commitment-seal"
                                />
                                <div className="aap-badge-247">
                                    <div className="aap-badge-num">24/7</div>
                                    <div className="aap-badge-text">{t('home.servingAddis', 'SERVING ADDIS ABABA')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Commitment Content */}
                        <div className="aap-commitment-right">
                            <div className="aap-commitment-tag">{t('home.commitmentTag', 'OUR COMMITMENT')}</div>
                            <h2 className="aap-commitment-title">
                                {t('home.commitmentTitle', 'Policing with purpose,')}<br />
                                {t('home.commitmentTitleLine2', 'serving with pride.')}
                            </h2>

                            <p className="aap-commitment-desc">
                                {t('home.commitmentDesc', 'The Addis Ababa Police Commission is committed to protecting life and property, maintaining peace, and building lasting trust with the people we serve.')}
                            </p>

                            <div className="aap-pillars-row">
                                <div className="aap-pillar-item">
                                    <span className="aap-pillar-num">01</span>
                                    <span className="aap-pillar-name">{t('home.integrity', 'Integrity')}</span>
                                </div>
                                <div className="aap-pillar-item">
                                    <span className="aap-pillar-num">02</span>
                                    <span className="aap-pillar-name">{t('home.service', 'Service')}</span>
                                </div>
                                <div className="aap-pillar-item">
                                    <span className="aap-pillar-num">03</span>
                                    <span className="aap-pillar-name">{t('home.justice', 'Justice')}</span>
                                </div>
                            </div>

                            <Link to="/about" className="aap-commitment-link">
                                <span>{t('home.discoverMission', 'DISCOVER OUR MISSION')}</span>
                                <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. NEWS & MEDIA SECTION (Photo 2) */}
            <section className="aap-news-section">
                <div className="aap-section-container">
                    <div className="aap-section-head">
                        <div>
                            <div className="aap-section-tag">{t('home.newsTag', 'LATEST UPDATES')}</div>
                            <h2 className="aap-section-title">{t('home.newsTitle', 'News & media')}</h2>
                        </div>
                        <Link to="/news" className="aap-news-view-all">
                            <span>{t('home.viewAllNews', 'VIEW ALL NEWS')}</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="aap-news-grid">
                        {newsList.map((item) => (
                            <Link
                                key={item._id}
                                to={`/news/${item.slug}`}
                                className={`aap-news-card ${item.isDark ? 'aap-news-card-dark' : 'aap-news-card-light'}`}
                            >
                                <div>
                                    <div className="aap-news-meta">
                                        <span className="aap-news-tag">{item.tag}</span>
                                        <span className="aap-news-date">{item.date}</span>
                                    </div>
                                    <h3 className="aap-news-title">{item.title}</h3>
                                </div>
                                <div className="aap-news-bottom">
                                    <div className="aap-news-arrow-btn" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. TOGETHER, WE ARE SAFER (Photo 1) */}
            <section className="aap-cta-section">
                <div className="aap-cta-container">
                    <div className="aap-cta-left">
                        <div className="aap-cta-tag">{t('home.ctaTag', 'TOGETHER, WE ARE SAFER')}</div>
                        <h2 className="aap-cta-title">{t('home.ctaTitle', 'Be part of a safer community.')}</h2>
                        <p className="aap-cta-desc">
                            {t('home.ctaDesc', 'Your partnership helps us prevent crime, resolve local concerns, and strengthen every neighborhood.')}
                        </p>
                    </div>

                    <div className="aap-cta-right">
                        <Link to="/contact" className="aap-btn-gold">
                            <span>{t('home.connectLocalPolice', 'CONNECT WITH YOUR LOCAL POLICE')}</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 7. POLICE SERVICE INFORMATION MODAL (Gives info on the homepage without redirecting) */}
            {selectedService && (
                <div
                    className="aap-service-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedService(null);
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="aap-service-modal-title"
                >
                    <div className="aap-service-modal-box">
                        <div className="aap-service-modal-header">
                            <div className="aap-service-modal-header-left">
                                <div className="aap-service-modal-icon-box" aria-hidden="true">
                                    {selectedService.icon}
                                </div>
                                <div>
                                    <span className="aap-service-modal-tag">{t('home.serviceInfoBadge', 'OFFICIAL SERVICE INFORMATION')}</span>
                                    <h3 id="aap-service-modal-title" className="aap-service-modal-title">
                                        {selectedService.title || txt(selectedService.name) || t(selectedService.titleKey, selectedService.defaultTitle)}
                                    </h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="aap-service-modal-close"
                                onClick={() => setSelectedService(null)}
                                aria-label={t('home.closeServiceInfo', 'Close Information')}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="aap-service-modal-body">
                            <div className="aap-service-info-row">
                                <h4>📋 {t('home.serviceOverview', 'Service Overview')}</h4>
                                <p>{txt(selectedService.overview) || selectedService.desc || txt(selectedService.description) || t(selectedService.descKey, selectedService.defaultDesc)}</p>
                            </div>

                            <div className="aap-service-info-row">
                                <h4>📑 {t('home.serviceRequirements', 'Key Requirements & Documents')}</h4>
                                <p>{txt(selectedService.requirements) || t('home.defaultRequirements', 'Contact your local division command or Woreda station for documentation requirements.')}</p>
                            </div>

                            <div className="aap-service-info-row">
                                <h4>📍 {t('home.serviceAvailability', 'Availability & Locations')}</h4>
                                <p>{txt(selectedService.availability) || t('home.defaultAvailability', 'Available 24/7 across all 11 Sub-City Division Commands.')}</p>
                            </div>

                            <div className="aap-service-info-row">
                                <h4>💳 {t('home.serviceFees', 'Official Fee Status')}</h4>
                                <p>{txt(selectedService.fee) || txt(selectedService.feeDescription) || (selectedService.feeAmount ? `${selectedService.feeAmount} ETB` : 'Free of charge (Official Public Service)')}</p>
                            </div>

                            <div className="aap-service-emergency-box">
                                <span className="aap-service-emergency-icon" aria-hidden="true">🚨</span>
                                <div>
                                    <h5>{t('home.emergencyNotice', 'Emergency Notice')}</h5>
                                    <p>{txt(selectedService.emergencyNotice) || t('home.emergencyNoticeText', 'For active crimes in progress, severe injury, or immediate threats to life, call 991 immediately. Non-emergency service information does not replace emergency police dispatch.')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="aap-service-modal-footer">
                            <button
                                type="button"
                                className="aap-btn-gold"
                                onClick={() => setSelectedService(null)}
                            >
                                {t('home.closeServiceInfo', 'Close Information')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
