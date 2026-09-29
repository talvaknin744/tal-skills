import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import {
  createMcpHandler,
  McpServer,
  ResourceNotFoundError,
  type AuthInfo,
  type ServerContext,
} from '@modelcontextprotocol/server';
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from '@modelcontextprotocol/node';
import * as z from 'zod/v4';

interface SlowState {
  started: boolean;
  committed: boolean;
  aborted: boolean;
  finished: boolean;
}
interface WireRequest {
  method?: string;
  version?: string | string[];
  mcpMethod?: string | string[];
  name?: string | string[];
  hasSessionHeader: boolean;
  responseStatus?: number;
  responseDisconnected?: boolean;
}
interface Principal {
  principalId: string;
  tenantId: string;
  authorizationVersion: number;
  scopes: string[];
}

const mode = process.argv[2] ?? 'contracts';
if (!['contracts', 'authorization'].includes(mode)) {
  throw new Error('Usage: node server.ts [contracts|authorization]');
}
const contractState = {
  requests: [] as WireRequest[],
  addInvocations: 0,
  slow: {} as Record<string, SlowState>,
};

function contractServer() {
  const server = new McpServer({ name: 'mcp-contract-example', version: '1.0.0' });
  server.registerTool('add', {
    description: 'Add two bounded integers.',
    inputSchema: z.object({
      a: z.number().int().min(-1000).max(1000),
      b: z.number().int().min(-1000).max(1000),
    }),
    outputSchema: z.object({ sum: z.number().int() }),
  }, async ({ a, b }) => {
    contractState.addInvocations += 1;
    return {
      content: [{ type: 'text', text: String(a + b) }],
      structuredContent: { sum: a + b },
    };
  });
  server.registerTool('fail', {
    description: 'Return a deliberate business rejection for verification.',
    inputSchema: z.object({}),
  }, async () => ({
    content: [{ type: 'text', text: 'Deliberate business rejection' }],
    isError: true,
  }));
  server.registerTool('slow', {
    description: 'Observe interruption before or after a simulated in-memory effect.',
    inputSchema: z.object({ token: z.string(), commitFirst: z.boolean() }),
  }, async ({ token, commitFirst }, context) => {
    const state: SlowState = {
      started: true, committed: commitFirst, aborted: false, finished: false,
    };
    contractState.slow[token] = state;
    const signal = context.mcpReq.signal;
    const progressToken = context.mcpReq._meta?.progressToken;
    if (progressToken !== undefined) {
      await context.mcpReq.notify({
        method: 'notifications/progress',
        params: { progressToken, progress: 1, total: 2 },
      });
    }
    await new Promise<void>((resolve) => {
      const abort = () => {
        clearTimeout(timer);
        state.aborted = true;
        resolve();
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        state.finished = true;
        state.committed = true;
        resolve();
      }, 5000);
      if (signal.aborted) abort();
      else signal.addEventListener('abort', abort, { once: true });
    });
    return { content: [{ type: 'text', text: state.aborted ? 'Stopped' : 'Completed' }] };
  });
  return server;
}

// Public synthetic strings stand in for a trusted credential verifier.
// This fixture intentionally does not implement OAuth or JWT verification.
const fixtureCredentials = new Map<string, Principal>([
  ['fixture-alice-token', {
    principalId: 'alice', tenantId: 'tenant-one', authorizationVersion: 1,
    scopes: ['handles:write', 'private:read'],
  }],
  ['fixture-alice-token-rotated', {
    principalId: 'alice', tenantId: 'tenant-one', authorizationVersion: 1,
    scopes: ['handles:write', 'private:read'],
  }],
  ['fixture-bob-token', {
    principalId: 'bob', tenantId: 'tenant-one', authorizationVersion: 1,
    scopes: ['handles:write', 'private:read'],
  }],
  ['fixture-bob-no-read', {
    principalId: 'bob', tenantId: 'tenant-one', authorizationVersion: 2,
    scopes: ['handles:write'],
  }],
]);
const handles = new Map([
  ['opaque_h_7c2eb8', { owner: 'alice', tenant: 'tenant-one', effects: 0 }],
  ['opaque_h_91bd44', { owner: 'bob', tenant: 'tenant-one', effects: 0 }],
]);
const privateCache = new Map<string, {
  expiresAt: number;
  value: { principal: string; privateLabel: string };
}>();
const authState = {
  factoryCalls: 0, authenticationDenials: 0, authorizationDenials: 0,
  cacheHits: 0, cacheMisses: 0, effects: 0,
  contexts: [] as { factoryPrincipal: string; handlerPrincipal: string; oauthClientId: string }[],
  cacheKeys: [] as { principal: string; credentialFingerprint: string; method: string; uri: string }[],
};

function principalOf(authInfo: AuthInfo | undefined) {
  const principal = authInfo?.extra?.principalId;
  const tenant = authInfo?.extra?.tenantId;
  if (typeof principal !== 'string' || typeof tenant !== 'string') {
    throw new Error('Trusted middleware did not provide a principal');
  }
  return { principalId: principal, tenantId: tenant, authorizationVersion: authInfo?.extra?.authorizationVersion };
}

function authorizationServer(authInfo: AuthInfo | undefined) {
  authState.factoryCalls += 1;
  const bound = principalOf(authInfo);
  const server = new McpServer({ name: 'synthetic-authorization-example', version: '1.0.0' });
  function verifiedContext(context: ServerContext) {
    const verified = context.http?.authInfo;
    if (!verified) throw new Error('Missing request authentication context');
    const principal = principalOf(verified);
    if (principal.principalId !== bound.principalId || principal.tenantId !== bound.tenantId) {
      throw new Error('Factory and handler caller differ');
    }
    authState.contexts.push({
      factoryPrincipal: bound.principalId,
      handlerPrincipal: principal.principalId,
      oauthClientId: verified.clientId,
    });
    return { verified, principal };
  }
  server.registerTool('touch-handle', {
    description: 'Record a simulated effect only for an owned handle.',
    inputSchema: z.object({ handle: z.string(), claimedPrincipal: z.string().optional() }),
    outputSchema: z.object({ principal: z.string(), effects: z.number().int() }),
  }, async ({ handle }, context) => {
    const { verified, principal } = verifiedContext(context);
    const record = handles.get(handle);
    if (!verified.scopes.includes('handles:write') || !record
        || record.owner !== principal.principalId || record.tenant !== principal.tenantId) {
      authState.authorizationDenials += 1;
      return { isError: true, content: [{ type: 'text', text: 'Handle unavailable' }] };
    }
    record.effects += 1;
    authState.effects += 1;
    return {
      content: [{ type: 'text', text: 'Effect recorded' }],
      structuredContent: { principal: principal.principalId, effects: record.effects },
    };
  });
  server.registerResource('private-self', 'private://self', {
    mimeType: 'application/json',
    cacheHint: { cacheScope: 'private', ttlMs: 30000 },
  }, async (uri, context) => {
    const { verified, principal } = verifiedContext(context);
    if (!verified.scopes.includes('private:read')) {
      authState.authorizationDenials += 1;
      throw new ResourceNotFoundError(uri.href, 'Resource unavailable');
    }
    // Authorization precedes cache access. A changed token is a distinct context.
    const credentialFingerprint = createHash('sha256').update(verified.token).digest('hex');
    const key = JSON.stringify([
      principal.tenantId, principal.principalId, principal.authorizationVersion,
      [...verified.scopes].sort(), credentialFingerprint, 'resources/read', uri.href,
    ]);
    const now = Date.now();
    let entry = privateCache.get(key);
    if (entry && now < entry.expiresAt) authState.cacheHits += 1;
    else {
      authState.cacheMisses += 1;
      entry = {
        expiresAt: now + 30000,
        value: { principal: principal.principalId, privateLabel: `${principal.principalId}-only` },
      };
      privateCache.set(key, entry);
      authState.cacheKeys.push({ principal: principal.principalId, credentialFingerprint, method: 'resources/read', uri: uri.href });
    }
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(entry.value) }] };
  });
  return server;
}

const handler = createMcpHandler(
  ({ authInfo }) => mode === 'authorization' ? authorizationServer(authInfo) : contractServer(),
  { responseMode: mode === 'authorization' ? 'json' : 'sse' },
);
const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();
const server = createServer((request, response) => {
  if (!validateHost(request, response) || !validateOrigin(request, response)) return;
  // Test instrumentation only, available on the explicitly loopback-bound server.
  if (request.url === '/stats') {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(mode === 'authorization'
      ? { ...authState, handles: Object.fromEntries(handles), cacheEntries: privateCache.size }
      : contractState));
    return;
  }
  if (request.url !== '/mcp') { response.statusCode = 404; response.end(); return; }
  if (mode === 'authorization') {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const identity = fixtureCredentials.get(token);
    if (!identity) {
      authState.authenticationDenials += 1;
      response.statusCode = 401;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: 'Synthetic credential required' }));
      return;
    }
    Object.assign(request, { auth: {
      token, clientId: 'same-fixture-oauth-client', scopes: [...identity.scopes],
      extra: { principalId: identity.principalId, tenantId: identity.tenantId, authorizationVersion: identity.authorizationVersion },
    } satisfies AuthInfo });
  }
  const record: WireRequest = {
    method: request.method, version: request.headers['mcp-protocol-version'],
    mcpMethod: request.headers['mcp-method'], name: request.headers['mcp-name'],
    hasSessionHeader: 'mcp-session-id' in request.headers,
  };
  contractState.requests.push(record);
  response.on('finish', () => { record.responseStatus = response.statusCode; });
  response.on('close', () => { if (!response.writableFinished) record.responseDisconnected = true; });
  void nodeHandler(request, response).catch((error: Error) => {
    console.error(error.message);
    response.destroy(error);
  });
});
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP listener');
  console.log(JSON.stringify({ port: address.port, mode }));
});
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  const deadline = setTimeout(() => process.exit(1), 3000);
  deadline.unref();
  await handler.close();
  server.close(() => { clearTimeout(deadline); process.exit(0); });
}
process.on('SIGTERM', () => void close());
process.on('SIGINT', () => void close());
