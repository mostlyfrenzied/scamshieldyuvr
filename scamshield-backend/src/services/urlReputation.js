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
  } catch { return { score: 100, verdict: 'high-risk', findings: ['Invalid URL'] }; }

  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (key) {
    try {
      const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client: { clientId: 'scamshield', clientVersion: '1.0' },
          threatInfo: { threatTypes: ['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE'], platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'], threatEntries: [{ url }] } }),
        signal: AbortSignal.timeout(3500)
      });
      if (response.ok && (await response.json()).matches?.length) {
        score += 80; findings.push('Google Safe Browsing reports a known threat');
      }
    } catch { findings.push('Safe Browsing lookup unavailable; local checks only'); }
  } else findings.push('Safe Browsing API key not configured');
  score = Math.min(100, score);
  return { score, verdict: score >= 60 ? 'high-risk' : score >= 25 ? 'suspicious' : 'low-risk', findings };
}
