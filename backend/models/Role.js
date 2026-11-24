import mongoose from 'mongoose';
import { modelFor } from './shared.js';

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Role name must be at least 2 characters long']
  },
  slug: {
    type: String,
    required: [true, 'Role slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  icon: {
    type: String,
    default: '🛡️',
    trim: true
  },
  badge: {
    type: String,
    default: 'Custom',
    trim: true
  },
  permissions: {
    type: [String],
    default: []
  },
  isProtected: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Auto-generate slug from name if not provided
RoleSchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
  next();
});

export default modelFor('Role', RoleSchema);

