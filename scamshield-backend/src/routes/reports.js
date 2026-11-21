import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Report } from '../models/Report.js';

const router = Router();
router.post('/', async (req, res, next) => {
  try {
    const { type, value, details = '' } = req.body || {};
    if (!['phone', 'url', 'message', 'email'].includes(type) || typeof value !== 'string' || !value.trim() || value.length > 5000 || typeof details !== 'string' || details.length > 1000) {
      return res.status(400).json({ error: 'Provide a valid report type, item and optional details (maximum 1000 characters)' });
    }
    let reporterId = null;
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (token) {
      try { reporterId = jwt.verify(token, process.env.JWT_SECRET).sub; }
      catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
    }
    const normalizedValue = type === 'phone' ? value.replace(/[\s()-]/g, '') : value.trim().toLowerCase();
    const report = await Report.findOneAndUpdate(
      { type, normalizedValue },
      { $setOnInsert: { type, value: value.trim().slice(0, 5000), normalizedValue, details: details.trim(), reporterId, status: 'pending' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: 'Report submitted for review', status: report.status, id: report.id });
  } catch (error) { next(error); }
});
export default router;
