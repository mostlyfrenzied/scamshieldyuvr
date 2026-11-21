export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  const findings = [];
  if (/\.(zip|mov|top|xyz)$/i.test(email.split('@')[1] || '')) {
    findings.push('Uses a domain ending sometimes associated with abuse');
  }
  if (/\+\d{5,}@/.test(email)) {
    findings.push('Contains an unusual plus-address pattern');
  }
  const score = findings.length ? 20 : 0;
  const verdict = score >= 60 ? 'high-risk' : score >= 25 ? 'suspicious' : 'low-risk';
  return res.status(200).json({
    score,
    verdict,
    findings: findings.length ? findings : ['No basic email-format warning detected']
  });
}
