import assert from 'node:assert/strict';
import { charge } from './handler.ts';
const calls = [];
const ledger = { async charge(tenant, requestId, amountCents) {
  calls.push({ tenant, requestId, amountCents });
  return { status: 'charged', requestId };
}};
const invoke = body => charge({ auth: { tenant: 'blue' }, body }, ledger);
for (const body of [null, [], 'x', {}, { amountCents: -20, requestId: 'r1' },
  { amountCents: 1.5, requestId: 'r1' }, { amountCents: 100001, requestId: 'r1' },
  { amountCents: '20', requestId: 'r1' }, { amountCents: 20, requestId: '' },
  { amountCents: 20, requestId: 'x'.repeat(81) }]) {
  const before = calls.length;
  await assert.rejects(() => invoke(body), Error);
  assert.equal(calls.length, before, 'invalid command reached the ledger');
}
assert.deepEqual(await invoke({ amountCents: 20, requestId: 'r1' }), { status: 'charged', requestId: 'r1' });
assert.deepEqual(calls, [{ tenant: 'blue', requestId: 'r1', amountCents: 20 }]);
const before = calls.length;
try { await invoke({ tenant: 'red', amountCents: 20, requestId: 'r2' }); } catch (error) { assert.ok(error instanceof Error); }
assert.ok(calls.slice(before).every(call => call.tenant === 'blue'), 'body selected another tenant');
console.log('PASS runtime command validation, trusted identity, and valid result shape');
