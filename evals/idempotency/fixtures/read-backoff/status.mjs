export async function readStatus(fetchImpl, sleep) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchImpl('/status');
    if (response.status !== 503 || attempt === 2) return response;
    await sleep(100 * (2 ** (attempt + 1)));
  }
}
