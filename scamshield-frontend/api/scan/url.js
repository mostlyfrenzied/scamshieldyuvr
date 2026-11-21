export async function checkUrl(url) {
  const findings = [];
  let score = 0;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') { score += 12; findings.push('URL does not use HTTPS'); }
    if (parsed.username || parsed.password) { score += 25; findings.push('URL embeds credentials'); }
    if (parsed.hostname.startsWith('xn--') || parsed.hostname.split('.').some(x => x.startsWith('xn--'))) {
      score += 20; findings.push('Internationalized/punycode hostname; inspect for lookalike domains');
    }
    if (/\d{1,3}(?:\.\d{1,3}){3}/.test(parsed.hostname)) { score += 20; findings.push('Uses an IP address instead of a domain name'); }
  } catch {
    return { score: 100, verdict: 'high-risk', findings: ['Invalid URL format'] };
  }

  score = Math.min(100, score);
  const verdict = score >= 60 ? 'high-risk' : score >= 25 ? 'suspicious' : 'low-risk';
  return { score, verdict, findings: findings.length ? findings : ['No basic URL threat indicators detected'] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = (req.body?.url || '').trim();
  if (!url || url.length > 2048) {
    return res.status(400).json({ error: 'Enter a valid URL (maximum 2048 characters)' });
  }
  const result = await checkUrl(url);
  return res.status(200).json(result);
}
