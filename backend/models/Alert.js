import mongoose from 'mongoose';
import { localizedRequired, localizedText, modelFor } from './shared.js';

export default modelFor('Alert', new mongoose.Schema({
  title: localizedRequired,
  message: localizedText,
  level: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  category: { type: String, default: 'general' }, // 'general' | 'road_safety'
  corridors: String,
  hotline: String,
  isActive: { type: Boolean, default: true },
  startsAt: Date,
  expiresAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));
