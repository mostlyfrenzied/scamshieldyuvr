import { analyzeWithAI } from './ai.js';

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
export async function analyzeMessage(text) {
  let score = 0; const findings = [];
  for (const [regex, weight, finding] of patterns) if (regex.test(text)) { score += weight; findings.push(finding); }
  const ai = await analyzeWithAI(text);
  score = Math.min(100, score + (ai.score || 0));
  findings.push(...(ai.findings || []));
  return result(score, findings);
}
export function analyzePhone(phone, reports = []) {
  const verified = reports.some(r => r.status === 'verified');
  const pending = reports.length > 0;
  return result(verified ? 95 : pending ? 25 : 0,
    verified ? ['Number appears in verified community reports'] : pending ? ['Number has an unverified community report'] : ['No matching community report found']);
}
export function analyzeEmail(email) {
  const findings = [];
  if (/\.(zip|mov|top|xyz)$/i.test(email.split('@')[1] || '')) findings.push('Uses a domain ending sometimes associated with abuse');
  if (/\+\d{5,}@/.test(email)) findings.push('Contains an unusual plus-address pattern');
  return result(findings.length ? 20 : 0, findings.length ? findings : ['No basic email-format warning detected']);
}
export function result(score, findings) {
  const verdict = score >= 60 ? 'high-risk' : score >= 25 ? 'suspicious' : 'low-risk';
  return { score, verdict, findings };
}
