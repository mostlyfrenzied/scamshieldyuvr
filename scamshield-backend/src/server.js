import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import scanRoutes from './routes/scans.js';
import reportRoutes from './routes/reports.js';
import callRoutes from './routes/calls.js';
import { requireAuth } from './middleware/auth.js';
import { Scan } from './models/Scan.js';
import { Report } from './models/Report.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5500')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Permit server-to-server and local health checks with no Origin header.
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return callback(null, true);
    return callback(new Error('Origin is not allowed by ScamShield CORS policy'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '256kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/', (_req, res) => res.json({ service: 'ScamShield API', status: 'running', health: '/health' }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'scamshield-api', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/calls', callRoutes);

app.get('/api/history', requireAuth, async (req, res, next) => {
  try {
    const items = await Scan.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ items });
  } catch (error) { next(error); }
});

app.get('/api/threats', requireAuth, async (_req, res, next) => {
  try {
    const items = await Report.find({ status: 'verified' }).sort({ updatedAt: -1 }).limit(100).lean();
    res.json({ items });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  if (error.message?.includes('CORS policy')) return res.status(403).json({ error: error.message });
  if (error.name === 'ValidationError') return res.status(400).json({ error: 'Invalid data supplied' });
  if (error.code === 11000) return res.status(409).json({ error: 'This item has already been submitted' });
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);
let mongoUri = process.env.MONGODB_URI;

if (mongoUri === 'memory' || (!mongoUri && process.env.NODE_ENV !== 'production')) {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    console.log(`[ScamShield] In-memory MongoDB running at: ${mongoUri}`);
  } catch (error) {
    console.warn('[ScamShield] Could not initialize in-memory MongoDB:', error.message);
  }
}

if (!mongoUri) {
  console.error('Missing MONGODB_URI. Add it to your environment before starting ScamShield API.');
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters.');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  app.listen(port, '0.0.0.0', () => console.log(`ScamShield API listening on port ${port}`));
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exit(1);
}
