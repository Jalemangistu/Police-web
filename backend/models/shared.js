import mongoose from 'mongoose';

export const localizedText = { en: { type: String, trim: true }, am: { type: String, trim: true }, om: { type: String, trim: true } };
export const localizedRequired = { en: { type: String, required: true, trim: true }, am: { type: String, trim: true }, om: { type: String, trim: true } };
export const modelFor = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
