export async function chargeInvoice(invoice, { provider, audit, activity }) {
  const receipt = await provider.charge({
    tenantId: invoice.tenantId,
    invoiceId: invoice.invoiceId,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
  }, { idempotencyKey: `invoice-charge:${activity.runId}:${activity.attempt}` });
  await audit.record(invoice, receipt);
  return receipt;
}
