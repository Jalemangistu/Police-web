import mongoose from 'mongoose';
import { localizedRequired, localizedText, modelFor } from './shared.js';

const safetyDocumentSchema = new mongoose.Schema({
  title: localizedRequired,
  slug: { type: String, required: true, unique: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: [
      'protect_home',
      'safe_online',
      'road_safety',
      'missing_persons',
      'most_wanted',
      'safety_advisories',
      'general_guidance'
    ],
    default: 'general_guidance'
  },
  documentNumber: { type: String, trim: true },
  summary: localizedText,
  content: localizedText,
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  department: { type: String, default: 'Addis Ababa Police Crime Prevention Directorate' },
  featuredImage: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default modelFor('SafetyDocument', safetyDocumentSchema);
