import { randomUUID } from 'node:crypto';

export async function deliver(event, { bridge, outbox }) {
  const receipt = await bridge.post(event.payload, {
    idempotencyKey: randomUUID(),
  });
  await outbox.markDispatched(event.id, receipt.id);
  return receipt;
}
