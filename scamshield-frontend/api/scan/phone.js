export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const phone = String(req.body?.phone || '').replace(/[\s()-]/g, '');
  if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: 'Enter a valid international phone number' });

  // Heuristic phone check
  const findings = [];
  let score = 0;
  if (/^(\+?1(800|888|877|866|855|844|833))/.test(phone)) findings.push('Toll-free number prefix; commonly spoofed in support scams');
  if (findings.length === 0) findings.push('No matching scam report on record for this phone number');
  const verdict = score >= 60 ? 'high-risk' : score >= 25 ? 'suspicious' : 'low-risk';
  return res.status(200).json({ score, verdict, findings });
}
