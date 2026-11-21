import jwt from 'jsonwebtoken';
import { connectToDatabase } from './lib/db.js';
import { Scan } from './models/Scan.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scamshield-super-secure-jwt-secret-min-32-chars-long';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectToDatabase();
    const items = await Scan.find({ userId: decoded.sub })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ items });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    console.error('History error:', error);
    return res.status(500).json({ error: 'Failed to retrieve scan history.' });
  }
}
