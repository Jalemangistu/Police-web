import express from 'express';
import { getHealth, getHome, getHotlines, getNews, getNewsBySlug, getServices, getServiceByIdOrSlug, getAlerts, getStations, getStationById, getDocuments, getDocumentBySlugOrId, getMedia, getVacancies, createVacancy, updateVacancy, deleteVacancy } from '../controllers/publicController.js';
import { createContactMessage } from '../controllers/formController.js';

const router = express.Router();

router.get('/health', getHealth);
router.get('/home', getHome);
router.get('/hotlines', getHotlines);
router.get('/news', getNews);
router.get('/news/:slug', getNewsBySlug);
router.get('/services', getServices);
router.get('/services/:id', getServiceByIdOrSlug);
router.get('/alerts', getAlerts);
router.get('/stations', getStations);
router.get('/stations/:id', getStationById);
router.get('/documents', getDocuments);
router.get('/documents/:slug', getDocumentBySlugOrId);
router.get('/media', getMedia);
router.get('/vacancies', getVacancies);
router.post('/vacancies', createVacancy);
router.put('/vacancies/:id', updateVacancy);
router.delete('/vacancies/:id', deleteVacancy);
router.post('/contact', createContactMessage);
router.post('/contact/messages', createContactMessage);

export default router;
