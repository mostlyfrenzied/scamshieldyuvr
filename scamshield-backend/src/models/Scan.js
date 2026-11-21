import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  type: { type: String, enum: ['message','url','phone','email'], required: true },
  target: { type: String, maxlength: 5000 },
  score: { type: Number, min: 0, max: 100, required: true },
  verdict: { type: String, enum: ['low-risk','suspicious','high-risk'], required: true },
  findings: [{ type: String }]
}, { timestamps: true });
export const Scan = mongoose.model('Scan', schema);
