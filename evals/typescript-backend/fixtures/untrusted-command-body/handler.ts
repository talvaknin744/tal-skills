type Charge = { tenant: string; amountCents: number; requestId: string };
export async function charge(req: { auth: { tenant: string }; body: unknown }, ledger: any) {
  const command = req.body as Charge;
  return ledger.charge(command.tenant, command.requestId, command.amountCents);
}
