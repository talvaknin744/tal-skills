import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { Socket } from 'node:net';
import pg, { type PoolClient, type QueryResultRow } from 'pg';

const NAMESPACE = 'reserve-v1';
const VISIBLE_ASCII = /^[\x21-\x7e]{1,128}$/;
export type Command = Readonly<{ sku: string; quantity: number }>;
export type Receipt = Readonly<{ reservationId: string; sku: string; quantity: number }>;
export type ErrorCode = 'InvalidInput' | 'IntentConflict' | 'UnavailableInventory' | 'DatabaseFailure' | 'UnknownOutcome';
export class ReservationError extends Error {
  constructor(readonly code: ErrorCode, message: string, options?: ErrorOptions) {
    super(message, options); this.name = code;
  }
}
export class UnknownOutcome extends ReservationError {
  constructor(readonly identity: Readonly<{ tenant: string; key: string; command: Command }>, cause: unknown) {
    super('UnknownOutcome', 'COMMIT was dispatched without an acknowledged result; reconcile the original identity.', { cause });
  }
}
export function validateCommand(value: unknown): Command {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
      || Object.keys(value).sort().join(',') !== 'quantity,sku'
      || !('sku' in value) || !('quantity' in value)
      || typeof value.sku !== 'string' || !VISIBLE_ASCII.test(value.sku)
      || typeof value.quantity !== 'number' || !Number.isFinite(value.quantity)
      || !Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 1_000_000) {
    throw new ReservationError('InvalidInput', 'Expected exactly a visible-ASCII sku and an integral numeric quantity in 1..1000000.');
  }
  return { sku: value.sku, quantity: value.quantity };
}
function validateIdentity(tenant: string, key: string): void {
  // Tenant comes from the authenticated caller; this validation is not authentication.
  if (typeof tenant !== 'string' || !VISIBLE_ASCII.test(tenant)
      || typeof key !== 'string' || !VISIBLE_ASCII.test(key)) {
    throw new ReservationError('InvalidInput', 'Expected a trusted visible-ASCII tenant and request key, each 1..128 characters.');
  }
}
export interface OperationOptions { signal?: AbortSignal; timeoutMs?: number }
/** Test gates pause real transactions and must settle when their signal aborts. */
export interface TestHooks {
  afterInsert?: (signal: AbortSignal) => Promise<void>;
  beforeCommit?: (signal: AbortSignal) => Promise<void>;
}
class WorkScope {
  readonly signal: AbortSignal;
  private readonly timer: ReturnType<typeof setTimeout>;
  private readonly deadline: number;
  constructor(options: OperationOptions) {
    const timeout = options.timeoutMs ?? 5_000;
    if (!Number.isFinite(timeout) || timeout < 1 || timeout > 60_000) {
      throw new ReservationError('InvalidInput', 'timeoutMs must be in 1..60000.');
    }
    const controller = new AbortController();
    this.deadline = performance.now() + timeout;
    this.timer = setTimeout(() => controller.abort(new DOMException('Request deadline exceeded', 'TimeoutError')), timeout);
    this.signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  }
  remaining(): number {
    this.signal.throwIfAborted();
    const ms = Math.floor(this.deadline - performance.now());
    if (ms < 1) throw new DOMException('Request deadline exceeded', 'TimeoutError');
    return ms;
  }
  dispose(): void { clearTimeout(this.timer); }
}
// Retain transport ownership instead of reaching through pg private connection fields.
class OwnedClient extends pg.Client {
  readonly transport: Socket;
  constructor(config?: pg.ClientConfig) {
    const transport = new Socket();
    super({ ...config, stream: () => transport });
    this.transport = transport;
  }
}
class Lease {
  private released = false;
  private retirement: Promise<void> | undefined;
  private readonly onAbort = (): void => { this.discard(); };
  private readonly onConnectionError = (): void => { this.discard(); };
  constructor(private readonly pool: pg.Pool, readonly client: PoolClient, private readonly work: WorkScope,
    private readonly cleanupMs: number, private readonly destroyTransport: () => void) {
    client.on('error', this.onConnectionError);
    work.signal.addEventListener('abort', this.onAbort, { once: true });
    if (work.signal.aborted) this.onAbort();
  }
  get isReleased(): boolean { return this.released; }
  async query<Row extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<pg.QueryResult<Row>> {
    const remaining = this.work.remaining();
    await this.client.query('SELECT set_config($1, $2, false)', ['statement_timeout', String(remaining)]);
    this.work.remaining();
    return this.client.query<Row>(text, values);
  }
  discard(): void {
    if (this.released) return;
    this.released = true;
    // release(true) is void; observe this client's actual end callback.
    this.retirement = new Promise<void>((resolve) => {
      // Idle client.end() is graceful; a half-open peer may never finish it.
      const timer = setTimeout(this.destroyTransport, this.cleanupMs);
      const onRemove = (removed: PoolClient): void => {
        if (removed !== this.client) return;
        clearTimeout(timer);
        this.pool.removeListener('remove', onRemove); resolve();
      };
      this.pool.on('remove', onRemove);
      this.client.release(true);
    });
  }
  async finish(): Promise<void> {
    this.work.signal.removeEventListener('abort', this.onAbort);
    if (!this.released) {
      this.client.removeListener('error', this.onConnectionError);
      this.released = true; this.client.release();
    }
    await this.retirement;
    this.client.removeListener('error', this.onConnectionError);
  }
}
export function createPool(connectionString: string, applicationName: string, max = 4): pg.Pool {
  const pool = new pg.Pool({ Client: OwnedClient, connectionString, application_name: applicationName, max,
    connectionTimeoutMillis: 1_000, statement_timeout: 5_000 });
  pool.on('error', (error: Error) => console.error('Idle PostgreSQL connection failed:', error.message));
  return pool;
}
interface ReceiptRow extends QueryResultRow { reservation_id: string; sku: string; quantity: number }
const receipt = (row: ReceiptRow): Receipt => ({ reservationId: row.reservation_id, sku: row.sku, quantity: row.quantity });
function sqlState(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}
/** Caller owns the pool and awaits pool.end() after every service call settles. */
export class ReservationService {
  cleanupFailures = 0;
  constructor(readonly pool: pg.Pool, private readonly hooks: TestHooks = {}, private readonly cleanupMs = 1_000) {}
  private async acquire(work: WorkScope): Promise<Lease> {
    work.remaining();
    let client: PoolClient;
    try { client = await this.pool.connect(); }
    catch (error) { work.signal.throwIfAborted(); throw error; }
    try { work.remaining(); }
    catch (error) { client.release(); throw error; }
    // Bounded acquisition stayed owned even if cancellation arrived while queued.
    if (!(client instanceof OwnedClient)) {
      client.release();
      throw new ReservationError('DatabaseFailure', 'Use createPool so this adapter owns transport retirement.');
    }
    return new Lease(this.pool, client, work, this.cleanupMs, () => { client.transport.destroy(); });
  }
  private async rollback(lease: Lease): Promise<void> {
    if (lease.isReleased) return;
    const timer = setTimeout(() => lease.discard(), this.cleanupMs);
    try { await lease.client.query('ROLLBACK'); }
    catch { this.cleanupFailures++; lease.discard(); }
    finally { clearTimeout(timer); }
  }
  async reserve(tenant: string, key: string, input: unknown, options: OperationOptions = {}): Promise<Receipt> {
    validateIdentity(tenant, key);
    const command = validateCommand(input);
    const work = new WorkScope(options);
    let lease: Lease | undefined;
    let phase: 'not-dispatched' | 'transaction-active' | 'commit-dispatched' | 'commit-acknowledged' = 'not-dispatched';
    try {
      lease = await this.acquire(work);
      await lease.query('BEGIN ISOLATION LEVEL READ COMMITTED');
      phase = 'transaction-active';
      const inserted = await lease.query<ReceiptRow>(
        `INSERT INTO reservations (tenant_id, operation_type, request_key, reservation_id, sku, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, operation_type, request_key) DO NOTHING
         RETURNING reservation_id, sku, quantity`,
        [tenant, NAMESPACE, key, randomUUID(), command.sku, command.quantity]);
      if (!inserted.rows[0]) {
        // A separate Read Committed statement sees the winning transaction's row.
        const saved = await lease.query<ReceiptRow>(
          'SELECT reservation_id, sku, quantity FROM reservations WHERE tenant_id=$1 AND operation_type=$2 AND request_key=$3',
          [tenant, NAMESPACE, key]);
        const row = saved.rows[0];
        if (!row) throw new ReservationError('DatabaseFailure', 'Retained receipt disappeared after key arbitration.');
        if (row.sku !== command.sku || row.quantity !== command.quantity) {
          throw new ReservationError('IntentConflict', 'The key is already bound to another command.');
        }
        await lease.query('ROLLBACK'); phase = 'not-dispatched';
        return receipt(row);
      }
      await this.hooks.afterInsert?.(work.signal);
      const updated = await lease.query(
        'UPDATE inventory SET available=available-$3 WHERE tenant_id=$1 AND sku=$2 AND available >= $3 RETURNING available',
        [tenant, command.sku, command.quantity]);
      if (updated.rowCount !== 1) throw new ReservationError('UnavailableInventory', 'Inventory cannot satisfy the reservation.');
      await this.hooks.beforeCommit?.(work.signal);
      const remaining = work.remaining();
      await lease.client.query('SELECT set_config($1, $2, false)', ['statement_timeout', String(remaining)]);
      work.remaining();
      phase = 'commit-dispatched';
      await lease.client.query('COMMIT');
      phase = 'commit-acknowledged';
      return receipt(inserted.rows[0]);
    } catch (error) {
      if (phase === 'commit-dispatched') {
        lease?.discard();
        if (['40001', '40P01'].includes(sqlState(error) ?? '')) {
          throw new ReservationError('DatabaseFailure', 'PostgreSQL confirmed transaction abort during COMMIT.', { cause: error });
        }
        throw new UnknownOutcome({ tenant, key, command }, work.signal.aborted ? work.signal.reason : error);
      }
      if (phase === 'transaction-active' && lease) await this.rollback(lease);
      if (work.signal.aborted) throw work.signal.reason;
      if (error instanceof ReservationError || (error instanceof DOMException && error.name === 'TimeoutError')) throw error;
      if (sqlState(error) === '23503') throw new ReservationError('UnavailableInventory', 'Inventory does not exist.', { cause: error });
      throw new ReservationError('DatabaseFailure', 'Database operation failed before COMMIT.', { cause: error });
    } finally {
      try { await lease?.finish(); } finally { work.dispose(); }
    }
  }
  async lookup(tenant: string, key: string, options: OperationOptions = {}): Promise<Receipt | null> {
    validateIdentity(tenant, key);
    const work = new WorkScope(options);
    let lease: Lease | undefined;
    try {
      lease = await this.acquire(work);
      const result = await lease.query<ReceiptRow>(
        'SELECT reservation_id, sku, quantity FROM reservations WHERE tenant_id=$1 AND operation_type=$2 AND request_key=$3',
        [tenant, NAMESPACE, key]);
      return result.rows[0] ? receipt(result.rows[0]) : null; // NotObserved does not mean confirmed abort.
    } catch (error) {
      if (work.signal.aborted) throw work.signal.reason;
      if (error instanceof ReservationError || (error instanceof DOMException && error.name === 'TimeoutError')) throw error;
      throw new ReservationError('DatabaseFailure', 'Receipt lookup failed.', { cause: error });
    } finally {
      try { await lease?.finish(); } finally { work.dispose(); }
    }
  }
}
