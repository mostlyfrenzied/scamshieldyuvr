import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  type: { type: String, enum: ['phone','url','message','email'], required: true },
  value: { type: String, required: true, maxlength: 5000 },
  normalizedValue: { type: String, required: true, index: true },
  details: { type: String, maxlength: 1000, default: '' },
  reason: { type: String, maxlength: 300, default: '' },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending','verified','rejected'], default: 'pending', index: true },
  corroborations: { type: Number, default: 0 }
}, { timestamps: true });
schema.index({ type: 1, normalizedValue: 1 }, { unique: true });
export const Report = mongoose.model('Report', schema);
