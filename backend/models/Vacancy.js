import mongoose from 'mongoose';
import { localizedRequired, localizedText, modelFor } from './shared.js';

export default modelFor('Vacancy', new mongoose.Schema({
  title: localizedRequired,
  description: localizedText,
  department: String,
  location: { type: String, default: 'Addis Ababa' },
  deadline: Date,
  closingDate: Date,
  employmentType: { type: String, default: 'Full-time / Active Duty' },
  requirements: localizedText,
  status: { type: String, enum: ['draft', 'open', 'closed'], default: 'open' },
  attachments: [String],
  publishedAt: Date
}, { timestamps: true }));
