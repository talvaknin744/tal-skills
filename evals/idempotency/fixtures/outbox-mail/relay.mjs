import { randomUUID } from 'node:crypto';

export async function deliver(row, { mailPort, outbox }) {
  const receipt = await mailPort.send(row.payload, {
    idempotencyKey: randomUUID(),
  });
  await outbox.markSent(row.event_id, receipt.id);
}
