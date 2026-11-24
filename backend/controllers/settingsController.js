import SiteSettings from '../models/SiteSettings.js';
import { audit } from '../middleware/auditMiddleware.js';

const getSettingsObj = () => SiteSettings.findOneAndUpdate({ _key: 'singleton' }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });

export const getSettings = async (_, res) => res.json(await getSettingsObj());

export const updateSettings = async (req, res) => {
  const allowed = [
    'siteName', 'tagline', 'footerCopy', 'socialLinks',
    'logo', 'themeColor', 'themePrimary', 'themeSecondary',
    'emergencyPolice', 'emergencyAmbulance', 'emergencyFire', 'emergencyContacts',
    'heroSlides',
    'cityBandActive', 'cityBandBgColor', 'cityBandTag', 'cityBandTitle', 'cityBandText', 'cityBandLinkText', 'cityBandLinkUrl', 'cityBandAdvisoriesActive', 'cityBandWeatherActive', 'cityBandWeatherCity', 'cityBandWeatherUnit', 'cityBandTrafficActive', 'cityBandTrafficTag', 'cityBandTrafficTitle', 'cityBandTrafficText', 'cityBandTrafficLinkText', 'cityBandTrafficLinkUrl', 'cityBandCustomCards',
    'aboutHeroTitle', 'aboutHeroLead', 'aboutMission', 'aboutVision', 'aboutValues',
    'commissionerPhoto', 'commissionerName', 'commissionerTitle', 'commissionerMessage',
    'organizationalStructure', 'organizationChart',
    'servicesHeroTitle', 'servicesHeroLead',
    'safetyHeroTitle', 'safetyHeroLead',
    'communityHeroTitle', 'communityHeroLead',
    'contactHeroTitle', 'contactHeroLead', 'contactEmail', 'contactPhone', 'contactAddress',
    'newsHeroTitle', 'newsHeroLead'
  ];
  const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const settings = await SiteSettings.findOneAndUpdate({ _key: 'singleton' }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await audit(req, 'update', 'settings', settings.id, update);
  res.json(settings);
};
