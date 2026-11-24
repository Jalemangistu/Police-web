import mongoose from 'mongoose';
import { modelFor } from './shared.js';

const PermissionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Permission code/key is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    trim: true
  },
  category: {
    type: String,
    default: 'Operations',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  roles: {
    type: [String],
    default: []
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default modelFor('Permission', PermissionSchema);

