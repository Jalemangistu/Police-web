import mongoose from 'mongoose';
import { modelFor } from './shared.js';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: 'user',
    trim: true
  },
  legacyRole: { type: String },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  passwordChangedAt: { type: Date },
  lastLoginAt: { type: Date }
}, { timestamps: true });

export default modelFor('User', UserSchema);
