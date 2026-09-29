// Package reservation implements one PostgreSQL-local inventory reservation.
package reservation

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"math"
	"time"
)

var (
	ErrInvalidInput         = errors.New("invalid input")
	ErrIntentConflict       = errors.New("request key already names different intent")
	ErrUnavailableInventory = errors.New("inventory unavailable")
	ErrDatabaseFailure      = errors.New("database operation failed")
	ErrUnknownOutcome       = errors.New("COMMIT not acknowledged; reconcile original identity")
)

type Phase string

const (
	NotDispatched      Phase = "not-dispatched"
	TransactionActive  Phase = "transaction-active"
	CommitDispatched   Phase = "commit-dispatched"
	CommitAcknowledged Phase = "commit-acknowledged"
)

// Failure keeps cancellation identity (errors.Is) separate from business outcome.
// A cleanup failure never replaces the primary cause. Do not expose Cause to an
// untrusted client; it may contain database diagnostics.
type Failure struct {
	Kind               error
	Cause              error
	CleanupError       error
	Phase              Phase
	Tenant, RequestKey string
}

func (f *Failure) Error() string { return fmt.Sprintf("%s (%s)", f.Kind, f.Phase) }
func (f *Failure) Unwrap() []error {
	causes := make([]error, 0, 2)
	if f.Kind != nil {
		causes = append(causes, f.Kind)
	}
	if f.Cause != nil {
		causes = append(causes, f.Cause)
	}
	return causes
}

// Outcome describes this attempt, not earlier uncertain attempts using the key.
func (f *Failure) Outcome() string {
	switch f.Phase {
	case CommitAcknowledged:
		return "committed"
	case CommitDispatched:
		if errors.Is(f.Kind, ErrDatabaseFailure) {
			return "confirmed-abort"
		}
		return "unknown"
	case TransactionActive:
		return "no-commit-requested"
	default:
		return "not-dispatched"
	}
}

type Receipt struct {
	ReservationID string `json:"reservation_id"`
	SKU           string `json:"sku"`
	Quantity      int    `json:"quantity"`
}
type Command struct {
	SKU      string
	Quantity int
}

func identifier(value string) bool {
	if len(value) < 1 || len(value) > 128 {
		return false
	}
	for i := range value {
		if value[i] < 0x21 || value[i] > 0x7e {
			return false
		}
	}
	return true
}

// ValidateJSON accepts JSON numbers such as 1.0 and 1e0 after numeric parsing.
// Static Go struct types alone would not reject missing fields or extra fields.
func ValidateJSON(raw []byte) (Command, error) {
	var fields map[string]any
	if err := json.Unmarshal(raw, &fields); err != nil || len(fields) != 2 {
		return Command{}, ErrInvalidInput
	}
	sku, skuOK := fields["sku"].(string)
	quantity, numberOK := fields["quantity"].(float64)
	if !skuOK || !identifier(sku) || !numberOK || math.IsNaN(quantity) || math.IsInf(quantity, 0) || quantity < 1 || quantity > 1_000_000 || math.Trunc(quantity) != quantity {
		return Command{}, ErrInvalidInput
	}
	return Command{SKU: sku, Quantity: int(quantity)}, nil
}

// Hook is awaited verifier instrumentation. Business effects do not belong in
// hooks. The caller owns and joins any goroutines started by a hook.
type Hook func(context.Context, string) error

type Store struct{ Pool *pgxpool.Pool }

// NewPool creates an application-owned pool. Close it after all calls finish.
// schema is an isolated schema for this example; an empty value uses defaults.
func NewPool(ctx context.Context, databaseURL, schema, applicationName string, maxConnections int32) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = maxConnections
	cfg.ConnConfig.ConnectTimeout = 5 * time.Second
	cfg.ConnConfig.RuntimeParams["application_name"] = applicationName
	if schema != "" {
		cfg.ConnConfig.RuntimeParams["search_path"] = pgx.Identifier{schema}.Sanitize()
	}
	return pgxpool.NewWithConfig(ctx, cfg)
}

func boundedRequest(ctx context.Context) (context.Context, context.CancelFunc) {
	if _, ok := ctx.Deadline(); ok {
		return context.WithCancel(ctx)
	}
	return context.WithTimeout(ctx, 10*time.Second)
}

func budget(ctx context.Context, tx pgx.Tx) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	deadline, _ := ctx.Deadline()
	remaining := time.Until(deadline)
	if remaining <= 0 {
		return context.DeadlineExceeded
	}
	// Round a positive remainder up. Zero disables PostgreSQL's timeout.
	milliseconds := (remaining + time.Millisecond - 1) / time.Millisecond
	_, err := tx.Exec(ctx, "SELECT set_config('statement_timeout', $1, true), set_config('lock_timeout', $1, true)", fmt.Sprint(int64(milliseconds)))
	return err
}

func candidateID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}

func classify(err error, ctx context.Context, phase Phase, tenant, key string) *Failure {
	kind := ErrDatabaseFailure
	cause := err
	var pgErr *pgconn.PgError
	if phase == CommitDispatched {
		// Only explicit abort evidence is classified as confirmed. Completion
		// unknown (40003), FATAL termination, and transport loss remain unknown.
		confirmedAbort := errors.Is(err, pgx.ErrTxCommitRollback)
		if errors.As(err, &pgErr) && len(pgErr.Code) >= 2 {
			confirmedAbort = pgErr.Code[:2] == "23" || pgErr.Code == "40001" || pgErr.Code == "40P01"
		}
		if !confirmedAbort {
			kind = ErrUnknownOutcome
		}
	} else {
		for _, candidate := range []error{ErrInvalidInput, ErrIntentConflict, ErrUnavailableInventory} {
			if errors.Is(err, candidate) {
				kind = candidate
				break
			}
		}
		if ctx.Err() != nil {
			cause = errors.Join(err, ctx.Err())
			kind = ctx.Err()
		}
		if errors.Is(err, context.Canceled) {
			kind = context.Canceled
		}
		if errors.Is(err, context.DeadlineExceeded) {
			kind = context.DeadlineExceeded
		}
	}
	if phase == CommitDispatched && ctx.Err() != nil {
		cause = errors.Join(err, ctx.Err())
	}
	return &Failure{Kind: kind, Cause: cause, Phase: phase, Tenant: tenant, RequestKey: key}
}

func finish(conn *pgxpool.Conn, tx pgx.Tx, primary *error, phase Phase, tenant, key string) {
	var cleanupError error
	if tx != nil {
		// Create the cleanup allowance now; the request budget may be exhausted.
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		err := tx.Rollback(cleanupCtx)
		cancel()
		if err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			cleanupError = err
		}
	}
	if conn.Conn().IsClosed() {
		// pgx's closed flag can precede its network cleanup. This pin uses an
		// internal 15-second allowance; observe completion before release.
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 16*time.Second)
		select {
		case <-conn.Conn().PgConn().CleanupDone():
		case <-cleanupCtx.Done():
			cleanupError = errors.Join(cleanupError, cleanupCtx.Err())
		}
		cancel()
	}
	conn.Release()
	if cleanupError != nil {
		var failure *Failure
		if errors.As(*primary, &failure) {
			failure.CleanupError = cleanupError
		} else {
			*primary = &Failure{Kind: ErrDatabaseFailure, Cause: *primary, CleanupError: cleanupError, Phase: phase, Tenant: tenant, RequestKey: key}
		}
	}
}

func (s Store) Reserve(ctx context.Context, trustedTenant, requestKey string, raw []byte, hook Hook) (receipt Receipt, resultErr error) {
	ctx, cancel := boundedRequest(ctx)
	defer cancel()
	phase := NotDispatched
	fail := func(err error) error { return classify(err, ctx, phase, trustedTenant, requestKey) }
	if err := ctx.Err(); err != nil {
		return receipt, fail(err)
	}
	command, err := ValidateJSON(raw)
	if err != nil || !identifier(trustedTenant) || !identifier(requestKey) {
		return receipt, fail(ErrInvalidInput)
	}
	id, err := candidateID()
	if err != nil {
		return receipt, fail(err)
	}
	conn, err := s.Pool.Acquire(ctx)
	if err != nil {
		return receipt, fail(err)
	}
	var tx pgx.Tx
	defer func() { finish(conn, tx, &resultErr, phase, trustedTenant, requestKey) }()
	if err = ctx.Err(); err != nil {
		return receipt, fail(err)
	}
	tx, err = conn.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return receipt, fail(err)
	}
	phase = TransactionActive
	gate := func(name string) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		if hook != nil {
			if err := hook(ctx, name); err != nil {
				return err
			}
		}
		return ctx.Err()
	}
	if err = budget(ctx, tx); err != nil {
		return receipt, fail(err)
	}
	err = tx.QueryRow(ctx, `INSERT INTO reservations
  (tenant_id, operation_type, request_key, reservation_id, sku, quantity)
  VALUES ($1, 'reserve-v1', $2, $3, $4, $5)
  ON CONFLICT (tenant_id, operation_type, request_key) DO NOTHING
  RETURNING reservation_id::text, sku, quantity`, trustedTenant, requestKey, id, command.SKU, command.Quantity).
		Scan(&receipt.ReservationID, &receipt.SKU, &receipt.Quantity)
	if errors.Is(err, pgx.ErrNoRows) {
		// Use a fresh Read Committed statement snapshot after unique arbitration.
		if err = budget(ctx, tx); err != nil {
			return receipt, fail(err)
		}
		err = tx.QueryRow(ctx, `SELECT reservation_id::text, sku, quantity FROM reservations
   WHERE tenant_id = $1 AND operation_type = 'reserve-v1' AND request_key = $2`, trustedTenant, requestKey).
			Scan(&receipt.ReservationID, &receipt.SKU, &receipt.Quantity)
		if err != nil {
			return receipt, fail(err)
		}
		if receipt.SKU != command.SKU || receipt.Quantity != command.Quantity {
			return Receipt{}, fail(ErrIntentConflict)
		}
	} else if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return Receipt{}, fail(ErrUnavailableInventory)
		}
		return Receipt{}, fail(err)
	} else {
		if err = gate("after-insert"); err != nil {
			return Receipt{}, fail(err)
		}
		if err = budget(ctx, tx); err != nil {
			return Receipt{}, fail(err)
		}
		var available int
		err = tx.QueryRow(ctx, `UPDATE inventory SET available = available - $3
   WHERE tenant_id = $1 AND sku = $2 AND available >= $3 RETURNING available`, trustedTenant, command.SKU, command.Quantity).Scan(&available)
		if errors.Is(err, pgx.ErrNoRows) {
			return Receipt{}, fail(ErrUnavailableInventory)
		}
		if err != nil {
			return Receipt{}, fail(err)
		}
		if err = gate("after-effect"); err != nil {
			return Receipt{}, fail(err)
		}
	}
	if err = gate("before-commit"); err != nil {
		return Receipt{}, fail(err)
	}
	if err = budget(ctx, tx); err != nil {
		return Receipt{}, fail(err)
	}
	if err = ctx.Err(); err != nil {
		return Receipt{}, fail(err)
	}
	// Mark conservatively immediately before the call which can dispatch COMMIT.
	phase = CommitDispatched
	if err = tx.Commit(ctx); err != nil {
		return Receipt{}, fail(err)
	}
	phase = CommitAcknowledged
	if err = gate("after-commit"); err != nil {
		return Receipt{}, fail(err)
	}
	return receipt, nil
}

// Lookup returns nil for NotObserved. Absence does not prove an attempt aborted.
func (s Store) Lookup(ctx context.Context, trustedTenant, requestKey string) (receipt *Receipt, resultErr error) {
	ctx, cancel := boundedRequest(ctx)
	defer cancel()
	phase := NotDispatched
	fail := func(err error) error { return classify(err, ctx, phase, trustedTenant, requestKey) }
	if err := ctx.Err(); err != nil {
		return nil, fail(err)
	}
	if !identifier(trustedTenant) || !identifier(requestKey) {
		return nil, fail(ErrInvalidInput)
	}
	conn, err := s.Pool.Acquire(ctx)
	if err != nil {
		return nil, fail(err)
	}
	var tx pgx.Tx
	defer func() { finish(conn, tx, &resultErr, phase, trustedTenant, requestKey) }()
	tx, err = conn.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted, AccessMode: pgx.ReadOnly})
	if err != nil {
		return nil, fail(err)
	}
	phase = TransactionActive
	if err = budget(ctx, tx); err != nil {
		return nil, fail(err)
	}
	var found Receipt
	err = tx.QueryRow(ctx, `SELECT reservation_id::text, sku, quantity FROM reservations
  WHERE tenant_id = $1 AND operation_type = 'reserve-v1' AND request_key = $2`, trustedTenant, requestKey).
		Scan(&found.ReservationID, &found.SKU, &found.Quantity)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fail(err)
	}
	return &found, nil
}
