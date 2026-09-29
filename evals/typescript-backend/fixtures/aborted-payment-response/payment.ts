export async function pay(provider: any, amount: number, signal: AbortSignal) {
  const operationId = crypto.randomUUID();
  try {
    return await provider.charge({ operationId, amount, signal });
  } catch (error) {
    if (signal.aborted) return { status: "not-charged" };
    throw error;
  }
}
