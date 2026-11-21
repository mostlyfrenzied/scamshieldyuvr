import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Report } from '../models/Report.js';
const router = Router();
router.post('/report', requireAuth, async (req, res) => {
  const phone = String(req.body.phone || '').replace(/[\s()-]/g,'');
  if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });
  const report = await Report.findOneAndUpdate({ type: 'phone', normalizedValue: phone },
    { $setOnInsert: { type: 'phone', value: phone, normalizedValue: phone, reason: String(req.body.reason || '').slice(0,300), reporterId: req.user.id, status: 'pending' } },
    { upsert: true, new: true, setDefaultsOnInsert: true });
  res.status(201).json({ id: report.id, status: report.status, message: 'Caller report queued for moderation' });
});
// Only independently verified reports enter the native blocking directory.
router.get('/directory', requireAuth, async (_req, res) => {
  const reports = await Report.find({ type: 'phone', status: 'verified' }).select('normalizedValue value').limit(10000).lean();
  res.json({ updatedAt: new Date().toISOString(), entries: reports.map(r => ({ phone: r.normalizedValue, label: 'ScamShield verified spam' })) });
});
export default router;
