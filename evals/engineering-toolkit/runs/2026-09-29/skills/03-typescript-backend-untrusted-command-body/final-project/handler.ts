export async function charge(req: { auth: { tenant: string }; body: unknown }, ledger: any) {
  const command = req.body;
  if (typeof command !== 'object' || command === null || Array.isArray(command)) {
    throw new Error('Charge command must be an object');
  }
  if ('tenant' in command) {
    throw new Error('Charge tenant must come from authenticated identity');
  }
  if (
    !('amountCents' in command) ||
    typeof command.amountCents !== 'number' ||
    !Number.isInteger(command.amountCents) ||
    command.amountCents <= 0 ||
    command.amountCents > 100000
  ) {
    throw new Error('amountCents must be a positive integer at most 100000');
  }
  if (
    !('requestId' in command) ||
    typeof command.requestId !== 'string' ||
    command.requestId.length === 0 ||
    command.requestId.length > 80
  ) {
    throw new Error('requestId must be a nonempty string at most 80 characters');
  }
  return ledger.charge(req.auth.tenant, command.requestId, command.amountCents);
}
