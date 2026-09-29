// This executable is opt-in: it requires the disposable backend launcher.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	reservation "example.com/tal/backend/go"
	"github.com/jackc/pgx/v5"
)

type scenario struct {
	ID       string `json:"id"`
	Status   string `json:"status"`
	Evidence any    `json:"evidence"`
}
type report struct {
	Language    string            `json:"language"`
	Runtime     string            `json:"runtime"`
	Drivers     map[string]string `json:"drivers"`
	Scenarios   []scenario        `json:"scenarios"`
	Limitations []string          `json:"limitations"`
}
type result struct {
	receipt reservation.Receipt
	err     error
}
type future struct {
	done   chan struct{}
	result result
}
type fixture struct {
	ctx                context.Context
	admin              *pgx.Conn
	a, b               reservation.Store
	appA, appB, tenant string
	jobs               []*future
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
func require(ok bool, message string) {
	if !ok {
		panic(message)
	}
}
func (f *fixture) start(work func() result) *future {
	job := &future{done: make(chan struct{})}
	f.jobs = append(f.jobs, job)
	go func() { defer close(job.done); job.result = work() }()
	return job
}
func (j *future) get() result { <-j.done; return j.result }
func body(quantity int) []byte {
	return []byte(fmt.Sprintf(`{"sku":"widget","quantity":%d}`, quantity))
}
func (f *fixture) reserve(s reservation.Store, key string, quantity int, hook reservation.Hook) result {
	r, e := s.Reserve(f.ctx, f.tenant, key, body(quantity), hook)
	return result{r, e}
}
func (f *fixture) seed(tenant string, available int) {
	_, e := f.admin.Exec(f.ctx, "INSERT INTO inventory (tenant_id,sku,available) VALUES ($1,'widget',$2)", tenant, available)
	must(e)
}
func (f *fixture) state(tenant string, expectedRows, expectedAvailable int) map[string]int {
	var rows, available int
	must(f.admin.QueryRow(f.ctx, "SELECT count(*) FROM reservations WHERE tenant_id=$1", tenant).Scan(&rows))
	must(f.admin.QueryRow(f.ctx, "SELECT available FROM inventory WHERE tenant_id=$1 AND sku='widget'", tenant).Scan(&available))
	require(rows == expectedRows && available == expectedAvailable, fmt.Sprintf("state rows=%d available=%d, want %d/%d", rows, available, expectedRows, expectedAvailable))
	return map[string]int{"reservation_rows": rows, "available": available}
}
func (f *fixture) poll(check func() bool) {
	ticker := time.NewTicker(5 * time.Millisecond)
	defer ticker.Stop()
	for {
		if check() {
			return
		}
		select {
		case <-f.ctx.Done():
			panic(f.ctx.Err())
		case <-ticker.C:
		}
	}
}
func (f *fixture) lockWait(app string) {
	f.poll(func() bool {
		var found bool
		must(f.admin.QueryRow(f.ctx, "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock')", app).Scan(&found))
		return found
	})
}
func (f *fixture) noTransactions() {
	f.poll(func() bool {
		var n int
		must(f.admin.QueryRow(f.ctx, "SELECT count(*) FROM pg_stat_activity WHERE application_name = ANY($1) AND xact_start IS NOT NULL", []string{f.appA, f.appB}).Scan(&n))
		return n == 0 && f.a.Pool.Stat().AcquiredConns() == 0 && f.b.Pool.Stat().AcquiredConns() == 0
	})
}
func gateAt(phase string) (reservation.Hook, <-chan struct{}, func()) {
	reached, release := make(chan struct{}), make(chan struct{})
	var once sync.Once
	hook := func(ctx context.Context, name string) error {
		if name != phase {
			return nil
		}
		close(reached)
		select {
		case <-release:
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return hook, reached, func() { once.Do(func() { close(release) }) }
}
func await(ctx context.Context, reached <-chan struct{}, operation *future) {
	select {
	case <-operation.done:
		panic(fmt.Sprintf("operation finished before gate: %v", operation.result.err))
	case <-reached:
	case <-ctx.Done():
		panic(ctx.Err())
	}
}
func failKind(err, kind error) *reservation.Failure {
	require(errors.Is(err, kind), fmt.Sprintf("got %v, want %v", err, kind))
	var f *reservation.Failure
	require(errors.As(err, &f), "missing phase-bearing Failure")
	return f
}

func runCase(admin *pgx.Conn, a, b reservation.Store, appA, appB, prefix, id string, work func(*fixture) any) (observed scenario) {
	observed = scenario{ID: id, Status: "passed"}
	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	f := &fixture{ctx: ctx, admin: admin, a: a, b: b, appA: appA, appB: appB, tenant: prefix + "-" + id}
	defer func() {
		cancel()
		for _, j := range f.jobs {
			j.get()
		}
		if problem := recover(); problem != nil {
			observed.Status = "failed"
			observed.Evidence = fmt.Sprint(problem)
		}
	}()
	observed.Evidence = work(f)
	f.noTransactions()
	return
}

func main() {
	databaseURL := os.Getenv("TAL_EXAMPLE_DATABASE_URL")
	parsed, e := url.Parse(databaseURL)
	if os.Getenv("TAL_EXAMPLE_FIXTURE") != "disposable-postgres" || e != nil || parsed == nil || (parsed.Hostname() != "127.0.0.1" && parsed.Hostname() != "localhost" && parsed.Hostname() != "::1") {
		fmt.Fprintln(os.Stderr, "Use the disposable launcher; TAL_EXAMPLE_FIXTURE and a loopback database URL are required.")
		os.Exit(2)
	}
	err := execute(databaseURL)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func execute(databaseURL string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	admin, e := pgx.Connect(ctx, databaseURL)
	if e != nil {
		return e
	}
	defer admin.Close(context.Background())
	prefix := fmt.Sprintf("go-%d", time.Now().UnixNano())
	appA, appB := prefix+"-a", prefix+"-b"
	poolA, e := reservation.NewPool(ctx, databaseURL, "", appA, 1)
	if e != nil {
		return e
	}
	defer poolA.Close()
	poolB, e := reservation.NewPool(ctx, databaseURL, "", appB, 1)
	if e != nil {
		return e
	}
	defer poolB.Close()
	a, b := reservation.Store{Pool: poolA}, reservation.Store{Pool: poolB}
	var server string
	if e = admin.QueryRow(ctx, "SHOW server_version").Scan(&server); e != nil {
		return e
	}
	output := report{Language: "go", Runtime: runtime.Version(), Drivers: map[string]string{"pgx": "5.11.0", "postgresql": server}, Limitations: []string{
		"Synthetic tenants on one disposable primary; this is not authentication, failover, crash recovery, or remote exactly-once evidence.",
		"No automatic retries; receipts and keys remain retained for the lifetime of the records.",
		"Race detector covers exercised schedules only; bounded rollback and driver cleanup may extend beyond the request deadline.",
		"A COMMIT call is conservatively marked dispatched immediately before driver entry; dispatch itself is not separately acknowledged.",
		"If the bounded driver-cleanup join expires, Failure records a secondary cleanup error and unfinished driver work remains pool-owned; that network failure was not induced.",
	}}
	add := func(id string, work func(*fixture) any) {
		output.Scenarios = append(output.Scenarios, runCase(admin, a, b, appA, appB, prefix, id, work))
	}
	add("sequential-duplicate", func(f *fixture) any {
		f.seed(f.tenant, 5)
		one := f.reserve(a, "same", 2, nil)
		must(one.err)
		two := f.reserve(a, "same", 2, nil)
		must(two.err)
		require(one.receipt == two.receipt, "receipt changed")
		return f.state(f.tenant, 1, 3)
	})
	add("legitimate-repeat", func(f *fixture) any {
		f.seed(f.tenant, 5)
		one := f.reserve(a, "one", 2, nil)
		must(one.err)
		two := f.reserve(a, "two", 2, nil)
		must(two.err)
		require(one.receipt.ReservationID != two.receipt.ReservationID, "distinct purchase reused receipt")
		return f.state(f.tenant, 2, 1)
	})
	for _, conflict := range []bool{false, true} {
		id := "concurrent-duplicate"
		if conflict {
			id = "conflicting-intent"
		}
		add(id, func(f *fixture) any {
			f.seed(f.tenant, 5)
			hook, reached, release := gateAt("after-insert")
			defer release()
			first := f.start(func() result { return f.reserve(a, "same", 2, hook) })
			await(f.ctx, reached, first)
			quantity := 2
			if conflict {
				quantity = 1
			}
			second := f.start(func() result { return f.reserve(b, "same", quantity, nil) })
			f.lockWait(appB)
			release()
			one, two := first.get(), second.get()
			must(one.err)
			if conflict {
				failKind(two.err, reservation.ErrIntentConflict)
			} else {
				must(two.err)
				require(one.receipt == two.receipt, "concurrent replay changed receipt")
			}
			return map[string]any{"lock_wait_observed": true, "state": f.state(f.tenant, 1, 3)}
		})
	}
	add("cross-tenant", func(f *fixture) any {
		other := f.tenant + "-other"
		f.seed(f.tenant, 5)
		f.seed(other, 5)
		one := f.reserve(a, "same", 2, nil)
		must(one.err)
		missing, e := b.Lookup(f.ctx, other, "same")
		must(e)
		require(missing == nil, "lookup disclosed another tenant")
		two, e := b.Reserve(f.ctx, other, "same", body(2), nil)
		must(e)
		require(two.ReservationID != one.receipt.ReservationID, "cross-tenant receipt shared")
		return []any{f.state(f.tenant, 1, 3), f.state(other, 1, 3)}
	})
	add("last-item", func(f *fixture) any {
		f.seed(f.tenant, 1)
		hook, reached, release := gateAt("after-effect")
		defer release()
		first := f.start(func() result { return f.reserve(a, "one", 1, hook) })
		await(f.ctx, reached, first)
		second := f.start(func() result { return f.reserve(b, "two", 1, nil) })
		f.lockWait(appB)
		release()
		must(first.get().err)
		failKind(second.get().err, reservation.ErrUnavailableInventory)
		return f.state(f.tenant, 1, 0)
	})
	for _, phase := range []string{"after-insert", "after-effect"} {
		id := "rollback-before-mutation"
		if phase == "after-effect" {
			id = "rollback-before-commit"
		}
		add(id, func(f *fixture) any {
			f.seed(f.tenant, 5)
			requestCtx, stop := context.WithCancel(f.ctx)
			defer stop()
			r, e := a.Reserve(requestCtx, f.tenant, "same", body(2), func(_ context.Context, name string) error {
				if name == phase {
					stop()
					return requestCtx.Err()
				}
				return nil
			})
			_ = r
			failure := failKind(e, context.Canceled)
			require(failure.Phase == reservation.TransactionActive, "incorrect phase")
			require(failure.CleanupError == nil, "bounded rollback failed")
			f.state(f.tenant, 0, 5)
			retry := f.reserve(a, "same", 2, nil)
			must(retry.err)
			return map[string]any{"native_cancellation": true, "rollback_state": "zero rows, stock five", "fresh_request": f.state(f.tenant, 1, 3)}
		})
	}
	proxyURL := os.Getenv("TAL_EXAMPLE_PROXY_URL")
	if proxyURL == "" {
		output.Scenarios = append(output.Scenarios, scenario{ID: "unknown-commit", Status: "skipped", Evidence: "TAL_EXAMPLE_PROXY_URL unavailable"})
	} else {
		add("unknown-commit", func(f *fixture) any {
			f.seed(f.tenant, 5)
			proxy, e := reservation.NewPool(f.ctx, proxyURL, "", prefix+"-proxy", 1)
			must(e)
			_, e = (reservation.Store{Pool: proxy}).Reserve(f.ctx, f.tenant, "same", body(2), nil)
			proxy.Close()
			failure := failKind(e, reservation.ErrUnknownOutcome)
			require(failure.Phase == reservation.CommitDispatched, "lost COMMIT phase missing")
			fresh, e := reservation.NewPool(f.ctx, databaseURL, "", prefix+"-reconcile", 1)
			must(e)
			defer fresh.Close()
			reconciler := reservation.Store{Pool: fresh}
			saved, e := reconciler.Lookup(f.ctx, f.tenant, "same")
			must(e)
			require(saved != nil, "COMMIT was not observed on authoritative connection")
			replay, e := reconciler.Reserve(f.ctx, f.tenant, "same", body(2), nil)
			must(e)
			require(replay == *saved, "replay changed receipt")
			return map[string]any{"fault": "TCP proxy suppressed real COMMIT acknowledgement", "outcome": failure.Outcome(), "state": f.state(f.tenant, 1, 3)}
		})
	}
	add("not-observed-inflight", func(f *fixture) any {
		f.seed(f.tenant, 5)
		hook, reached, release := gateAt("after-insert")
		defer release()
		first := f.start(func() result { return f.reserve(a, "same", 2, hook) })
		await(f.ctx, reached, first)
		found, e := b.Lookup(f.ctx, f.tenant, "same")
		must(e)
		require(found == nil, "uncommitted receipt visible")
		release()
		must(first.get().err)
		found, e = b.Lookup(f.ctx, f.tenant, "same")
		must(e)
		require(found != nil, "committed receipt missing")
		return map[string]any{"initial": "NotObserved, not proof of abort", "state": f.state(f.tenant, 1, 3)}
	})
	add("cancellation-query", func(f *fixture) any {
		f.seed(f.tenant, 5)
		return queryCancellation(f, a)
	})
	add("cancellation-acquire", func(f *fixture) any {
		f.seed(f.tenant, 5)
		held, e := a.Pool.Acquire(f.ctx)
		must(e)
		var once sync.Once
		release := func() { once.Do(held.Release) }
		defer release()
		requestCtx, stop := context.WithTimeout(f.ctx, 30*time.Millisecond)
		defer stop()
		before := a.Pool.Stat().CanceledAcquireCount()
		// This deadline expires inside the real blocked acquire. The pool's
		// canceled-acquire counter supplies the oracle, not an assumed sleep.
		_, err := a.Reserve(requestCtx, f.tenant, "same", body(2), nil)
		failure := failKind(err, context.DeadlineExceeded)
		require(failure.Phase == reservation.NotDispatched, "acquire cancellation dispatch changed")
		require(a.Pool.Stat().CanceledAcquireCount()-before == 1, "native pool waiter did not cancel")
		release()
		must(f.reserve(a, "fresh", 1, nil).err)
		return map[string]any{"canceled_acquire_delta": a.Pool.Stat().CanceledAcquireCount() - before, "capacity_recovered": true, "state": f.state(f.tenant, 1, 4)}
	})
	add("resource-recovery", func(f *fixture) any {
		f.seed(f.tenant, 8)
		for i := 0; i < 3; i++ {
			queryCancellation(f, a)
			must(f.reserve(a, fmt.Sprintf("fresh-%d", i), 1, nil).err)
		}
		return map[string]any{"iterations": 3, "acquired_connections": a.Pool.Stat().AcquiredConns(), "state": f.state(f.tenant, 3, 5)}
	})
	add("boundary-validation", func(f *fixture) any {
		f.seed(f.tenant, 5)
		for _, raw := range []string{`{"sku":"widget","quantity":1}`, `{"sku":"widget","quantity":1.0}`, `{"sku":"widget","quantity":1e0}`, `{"sku":"widget","quantity":1000000}`} {
			_, validationErr := reservation.ValidateJSON([]byte(raw))
			must(validationErr)
		}
		invalid := []string{`{"sku":"widget","quantity":false}`, `{"sku":"widget","quantity":-1}`, `{"sku":"widget","quantity":NaN}`, `{"sku":"widget","quantity":Infinity}`, `{"sku":"widget","quantity":true}`, `{"sku":"widget","quantity":"1"}`, `{"sku":"widget","quantity":1.5}`, `{"sku":"widget","quantity":0}`, `{"sku":"widget","quantity":1000001}`, `{"sku":"widget","quantity":1e400}`, `{"sku":"widget","quantity":null}`, `{"sku":"widget"}`, `{"sku":"widget","quantity":1,"tenant":"injected"}`, `[]`, `null`, `{"sku":"space here","quantity":1}`}
		for _, raw := range invalid {
			_, e := a.Reserve(f.ctx, f.tenant, "invalid", []byte(raw), nil)
			failKind(e, reservation.ErrInvalidInput)
		}
		for _, key := range []string{"", strings.Repeat("x", 129), "bad key", "\n"} {
			_, e := a.Reserve(f.ctx, f.tenant, key, body(1), nil)
			failKind(e, reservation.ErrInvalidInput)
		}
		f.state(f.tenant, 0, 5)
		var saved reservation.Receipt
		for i, raw := range []string{`{"sku":"widget","quantity":1}`, `{"sku":"widget","quantity":1.0}`, `{"sku":"widget","quantity":1e0}`} {
			r, e := a.Reserve(f.ctx, f.tenant, "normal", []byte(raw), nil)
			must(e)
			if i == 0 {
				saved = r
			} else {
				require(r == saved, "numeric normalization changed intent")
			}
		}
		_, e := a.Reserve(f.ctx, f.tenant, "missing", []byte(`{"sku":"missing","quantity":1}`), nil)
		failKind(e, reservation.ErrUnavailableInventory)
		preCtx, stop := context.WithCancel(f.ctx)
		stop()
		_, e = a.Reserve(preCtx, f.tenant, "pre-canceled", body(1), nil)
		failure := failKind(e, context.Canceled)
		require(failure.Phase == reservation.NotDispatched, "pre-cancellation phase")
		responseCtx, cancelResponse := context.WithCancel(f.ctx)
		defer cancelResponse()
		_, e = a.Reserve(responseCtx, f.tenant, "response-loss", body(1), func(_ context.Context, name string) error {
			if name == "after-commit" {
				cancelResponse()
			}
			return nil
		})
		failure = failKind(e, context.Canceled)
		require(failure.Outcome() == "committed", "acknowledged commit lost")
		replay := f.reserve(a, "response-loss", 1, nil)
		must(replay.err)
		return map[string]any{"invalid_commands": len(invalid), "equivalent_numbers": []string{"1", "1.0", "1e0"}, "after_commit_cancellation": "committed receipt recovered", "state": f.state(f.tenant, 2, 3)}
	})
	data, e := json.MarshalIndent(output, "", "  ")
	if e != nil {
		return e
	}
	fmt.Println(string(data))
	if path := os.Getenv("TAL_EXAMPLE_REPORT"); path != "" {
		if e = os.WriteFile(path, append(data, '\n'), 0644); e != nil {
			return e
		}
	}
	for _, s := range output.Scenarios {
		if s.Status == "failed" {
			return fmt.Errorf("scenario %s failed", s.ID)
		}
	}
	return nil
}

func queryCancellation(f *fixture, s reservation.Store) any {
	// Keep the blocker separate from the observer: pg_stat_activity snapshots
	// are cached inside a transaction and could hide a newly entered lock wait.
	blockerConn, e := pgx.ConnectConfig(f.ctx, f.admin.Config().Copy())
	must(e)
	defer func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = blockerConn.Close(cleanupCtx)
	}()
	blocker, e := blockerConn.Begin(f.ctx)
	must(e)
	defer func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = blocker.Rollback(cleanupCtx)
	}()
	_, e = blocker.Exec(f.ctx, "UPDATE inventory SET available=available WHERE tenant_id=$1 AND sku='widget'", f.tenant)
	must(e)
	requestCtx, stop := context.WithCancel(f.ctx)
	defer stop()
	request := f.start(func() result {
		r, e := s.Reserve(requestCtx, f.tenant, "cancel-blocked", body(1), nil)
		return result{r, e}
	})
	f.lockWait(f.appA)
	stop()
	failure := failKind(request.get().err, context.Canceled)
	require(failure.Phase == reservation.TransactionActive, "in-flight cancellation phase changed")
	must(blocker.Rollback(f.ctx))
	f.noTransactions()
	found, e := s.Lookup(f.ctx, f.tenant, "cancel-blocked")
	must(e)
	require(found == nil, "canceled operation committed")
	return map[string]any{"lock_wait_observed": true, "native_cancellation": true, "acquired_connections": s.Pool.Stat().AcquiredConns(), "operation_outcome": failure.Outcome()}
}
