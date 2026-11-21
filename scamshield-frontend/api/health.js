import { connectToDatabase } from './lib/db.js';

export default async function handler(req, res) {
  let dbStatus = 'disconnected';
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }
  }
  res.status(200).json({ ok: true, service: 'scamshield-api', database: dbStatus });
}
