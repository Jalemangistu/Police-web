import mongoose from 'mongoose';
import { localizedRequired, localizedText, modelFor } from './shared.js';

export default modelFor('Service', new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: localizedRequired,
  description: localizedText,
  overview: localizedText,
  requirements: localizedText,
  availability: localizedText,
  feeAmount: { type: Number, min: 0, default: 0 },
  feeDescription: localizedText,
  emergencyNotice: localizedText,
  icon: { type: String, default: 'shield' },
  externalUrl: { type: String, trim: true, default: '' },
  paymentRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  formSchema: [{
    name: String,
    label: localizedText,
    type: { type: String, enum: ['text', 'email', 'phone', 'textarea', 'select', 'file'] },
    required: Boolean,
    options: [String]
  }]
}, { timestamps: true }));
