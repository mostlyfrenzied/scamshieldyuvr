import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../lib/db.js';
import { Scan } from '../models/Scan.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scamshield-super-secure-jwt-secret-min-32-chars-long';

const patterns = [
  [/\b(otp|one[- ]time password)\b/i, 18, 'Requests or mentions an OTP'],
  [/\b(share|send|tell|provide)\b.{0,35}\b(otp|pin|password|cvv)\b/i, 35, 'Asks for a sensitive authentication secret'],
  [/\b(urgent|immediately|account.*(block|suspend)|last warning)\b/i, 12, 'Uses urgency or account-threat language'],
  [/\b(kyc|pan card|aadhaar|aadhaar update)\b/i, 10, 'Mentions identity/KYC information'],
  [/\b(prize|lottery|won|reward|cashback)\b/i, 10, 'Unexpected prize or reward language'],
  [/\b(remote access|anydesk|teamviewer|screen share)\b/i, 25, 'Requests remote access or screen sharing'],
  [/\b(pay.*(fee|tax|charge)|processing fee)\b/i, 15, 'Requests an advance payment'],
  [/https?:\/\//i, 8, 'Contains a web link']
];

export function analyzeMessage(text) {
  let score = 0;
  const findings = [];
  for (const [regex, weight, finding] of patterns) {
    if (regex.test(text)) {
      score += weight;
      findings.push(finding);
    }
  }
  score = Math.min(100, score);
  const verdict = score >= 60 ? 'high-risk' : score >= 25 ? 'suspicious' : 'low-risk';
  return { score, verdict, findings: findings.length ? findings : ['No common scam patterns detected'] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const text = (req.body?.text || '').trim();
  if (!text || text.length > 5000) {
    return res.status(400).json({ error: 'Message must contain 1–5000 characters' });
  }
  const result = analyzeMessage(text);

  // Optional: save to database if user is authenticated and DB configured
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      await connectToDatabase();
      await Scan.create({
        userId: decoded.sub,
        type: 'message',
        target: text.slice(0, 5000),
        score: result.score,
        verdict: result.verdict,
        findings: result.findings
      });
    } catch {
      // Non-blocking if DB is not configured or token expired
    }
  }

  return res.status(200).json(result);
}
