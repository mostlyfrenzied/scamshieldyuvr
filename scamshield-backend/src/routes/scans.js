import { Router } from 'express';
import { z } from 'zod';
import { Scan } from '../models/Scan.js';
import { Report } from '../models/Report.js';
import { requireAuth } from '../middleware/auth.js';
import { analyzeMessage, analyzePhone, analyzeEmail } from '../services/detection.js';
import { checkUrl } from '../services/urlReputation.js';

const router = Router();
const maybeAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return next();
  return requireAuth(req, res, next);
};

async function saveScan(req, type, target, result) {
  await Scan.create({
    userId: req.user?.id || null,
    type,
    target: String(target).slice(0, 5000),
    score: result.score,
    verdict: result.verdict,
    findings: result.findings || []
  });
}

router.post('/message', maybeAuth, async (req, res, next) => {
  try {
    const text = z.string().trim().min(1).max(5000).parse(req.body?.text);
    const result = await analyzeMessage(text);
    await saveScan(req, 'message', text, result);
    res.json(result);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Message must contain 1–5000 characters' });
    next(error);
  }
});

router.post('/url', maybeAuth, async (req, res, next) => {
  try {
    const url = z.string().trim().url().max(2048).parse(req.body?.url);
    const result = await checkUrl(url);
    await saveScan(req, 'url', url, result);
    res.json(result);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Enter a valid URL (maximum 2048 characters)' });
    next(error);
  }
});

router.post('/phone', maybeAuth, async (req, res, next) => {
  try {
    const phone = String(req.body?.phone || '').replace(/[\s()-]/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: 'Enter a valid international phone number' });
    const reports = await Report.find({ type: 'phone', normalizedValue: phone, status: { $in: ['pending', 'verified'] } }).limit(20).lean();
    const result = analyzePhone(phone, reports);
    await saveScan(req, 'phone', phone, result);
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/email', maybeAuth, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address' });
    const result = analyzeEmail(email);
    await saveScan(req, 'email', email, result);
    res.json(result);
  } catch (error) { next(error); }
});

export default router;
