// Illustrative Activity adapter. activityContext is supplied by the worker.
export async function charge(input, { gateway, activityContext }) {
  const key = [
    activityContext.workflowRunId,
    activityContext.activityId,
    activityContext.attempt,
  ].join(":");
  return gateway.charge(
    { account: input.tenantId, invoice: input.invoiceId, amount: input.amount },
    { idempotencyKey: key },
  );
}
