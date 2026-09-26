export async function transfer(req, { cache, authorizeWallet, moveMoney }) {
  const key = req.headers['idempotency-key'];
  const cached = await cache.get(key);
  if (cached) return cached;

  const { walletId, destination, amountMinor, currency } = req.body;
  await authorizeWallet(req.actor, walletId);
  const result = await moveMoney({
    tenantId: req.actor.tenantId, walletId, destination, amountMinor, currency,
  });
  const response = { status: 201, body: result };
  await cache.set(key, response);
  return response;
}
