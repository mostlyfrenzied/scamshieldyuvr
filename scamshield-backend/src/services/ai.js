// Optional NLP provider adapter. Keep private message content out of third-party
// services unless the user has explicitly consented and your privacy notice covers it.
export async function analyzeWithAI(_text) {
  return { score: 0, findings: [], provider: 'disabled' };
}
