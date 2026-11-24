import mongoose from 'mongoose';
import { modelFor } from './shared.js';

// Regex to validate emergency hotlines / telephone numbers (e.g., 991, 112, 011-551-2222, +251...)
const PHONE_REGEX = /^\+?[0-9\s\-()]{3,20}$/;

const HotlineSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: [true, 'English title is required'], trim: true },
    am: { type: String, default: '', trim: true },
    om: { type: String, default: '', trim: true }
  },
  number: {
    type: String,
    required: [true, 'Hotline phone number is required'],
    trim: true,
    validate: {
      validator: (v) => PHONE_REGEX.test(v),
      message: (props) => `"${props.value}" is not a valid emergency hotline or phone number.`
    }
  },
  subtitle: {
    en: { type: String, default: '', trim: true },
    am: { type: String, default: '', trim: true },
    om: { type: String, default: '', trim: true }
  },
  icon: {
    type: String,
    enum: ['emergency', 'traffic', 'misconduct', 'corruption', 'maritime', 'license', 'fire', 'phone', 'shield'],
    default: 'phone'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default modelFor('Hotline', HotlineSchema);

