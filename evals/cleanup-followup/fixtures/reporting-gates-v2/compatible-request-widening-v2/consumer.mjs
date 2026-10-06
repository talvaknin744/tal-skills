export function readPage(response) {
  if (!Number.isInteger(response.price_cents)) throw new TypeError('integer price required');
  if (!Object.hasOwn(response, 'next_cursor')) throw new TypeError('cursor field required');
  return { dollars: response.price_cents / 100, next: response.next_cursor };
}

export const existingRequest = { method: 'GET', path: '/catalog', tag: 'featured' };
