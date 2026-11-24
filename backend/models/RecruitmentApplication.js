import mongoose from 'mongoose';
import { modelFor } from './shared.js';

export default modelFor('RecruitmentApplication', new mongoose.Schema({
  position: String,
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  educationLevel: { type: String, required: true },
  address: { type: String, required: true },
  statement: { type: String, required: true },
  attachments: [String],
  status: { type: String, enum: ['pending', 'shortlisted', 'rejected', 'accepted'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));
