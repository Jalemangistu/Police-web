import Alert from '../models/Alert.js';
import News from '../models/News.js';
import Service from '../models/Service.js';
import Station from '../models/Station.js';
import SafetyDocument from '../models/SafetyDocument.js';
import MediaAsset from '../models/MediaAsset.js';
import Vacancy from '../models/Vacancy.js';
import Hotline from '../models/Hotline.js';
import mongoose from 'mongoose';

export const getHealth = (_, res) => res.json({ status: 'ok' });

export const getHome = async (_, res) => res.json({ 
  alerts: await Alert.find({ isActive: true }).sort('-createdAt').limit(3), 
  news: await News.find({ status: 'published' }).sort('-publishedAt').limit(4), 
  services: await Service.find({ isActive: true }).sort('sortOrder name.en'),
  hotlines: await Hotline.find({ isActive: true }).sort('sortOrder createdAt')
});

export const getHotlines = async (_, res) => {
  const hotlines = await Hotline.find({ isActive: true }).sort('sortOrder createdAt');
  res.json(hotlines);
};

export const getNews = async (_, res) => res.json(await News.find({ status: 'published' }).sort('-publishedAt'));

export const getNewsBySlug = async (req, res) => { 
  const item = await News.findOne({ slug: req.params.slug, status: 'published' }); 
  item ? res.json(item) : res.status(404).json({ message: 'News item not found.' }); 
};

export const getServices = async (_, res) => res.json(await Service.find({ isActive: true }).sort('sortOrder name.en'));

export const getServiceByIdOrSlug = async (req, res) => {
  const criteria = mongoose.isObjectIdOrHexString(req.params.id) ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] } : { slug: req.params.id };
  const service = await Service.findOne({ ...criteria, isActive: true });
  service ? res.json(service) : res.status(404).json({ message: 'Service not found.' });
};

export const getAlerts = async (_, res) => res.json(await Alert.find({ isActive: true }).sort('-createdAt'));

export const getStations = async (req, res) => {
  const filter = { isActive: true };
  const q = req.query.q?.trim();
  if (q) {
    const regex = new RegExp(q, 'i');
    filter.$or = [
      { 'name.en': regex }, { 'name.am': regex }, { 'name.om': regex },
      { subCity: regex }, { district: regex },
      { 'address.en': regex }, { 'address.am': regex }
    ];
  }
  res.json(await Station.find(filter).sort('subCity name.en'));
};

export const getStationById = async (req, res) => {
  const station = await Station.findOne({ _id: req.params.id, isActive: true });
  station ? res.json(station) : res.status(404).json({ message: 'Station not found.' });
};

export const getDocuments = async (req, res) => {
  const filter = { isActive: true, status: 'published' };
  const { category, q } = req.query;
  if (category && category !== 'all') {
    filter.category = category;
  }
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { 'title.en': regex },
      { 'title.am': regex },
      { 'title.om': regex },
      { 'summary.en': regex },
      { 'content.en': regex },
      { documentNumber: regex }
    ];
  }
  res.json(await SafetyDocument.find(filter).sort('-publishedAt -createdAt'));
};

export const getDocumentBySlugOrId = async (req, res) => {
  const param = req.params.slug;
  const criteria = mongoose.isObjectIdOrHexString(param)
    ? { $or: [{ _id: param }, { slug: param }], isActive: true }
    : { slug: param, isActive: true };
  const doc = await SafetyDocument.findOneAndUpdate(criteria, { $inc: { views: 1 } }, { new: true });
  doc ? res.json(doc) : res.status(404).json({ message: 'Document not found.' });
};

export const getMedia = async (req, res) => {
  try {
    const filter = {};
    const { category, q } = req.query;
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { fileName: regex },
        { 'altText.en': regex },
        { 'altText.am': regex },
        { 'altText.om': regex },
        { 'caption.en': regex },
        { 'caption.am': regex },
        { 'caption.om': regex }
      ];
    }
    res.json(await MediaAsset.find(filter).sort('-createdAt'));
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve media assets.', error: err.message });
  }
};

export const getVacancies = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: { $ne: 'draft' } };
    const list = await Vacancy.find(filter).sort('-createdAt');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve vacancies.' });
  }
};

export const createVacancy = async (req, res) => {
  try {
    const doc = await Vacancy.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create vacancy.' });
  }
};

export const updateVacancy = async (req, res) => {
  try {
    const doc = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    doc ? res.json(doc) : res.status(404).json({ message: 'Vacancy not found.' });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update vacancy.' });
  }
};

export const deleteVacancy = async (req, res) => {
  try {
    await Vacancy.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete vacancy.' });
  }
};



