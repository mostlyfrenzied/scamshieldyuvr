import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMessage } from '../src/services/detection.js';
test('flags OTP and urgency requests', async () => {
  const r = await analyzeMessage('Urgent: share your OTP immediately or account blocked');
  assert.ok(r.score >= 25);
  assert.notEqual(r.verdict, 'low-risk');
});
