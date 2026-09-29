package reservation

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
)

func TestJSONBoundary(t *testing.T) {
	for _, raw := range []string{`{"sku":"x","quantity":1}`, `{"sku":"x","quantity":1.0}`, `{"sku":"x","quantity":1e0}`} {
		command, err := ValidateJSON([]byte(raw))
		if err != nil || command != (Command{SKU: "x", Quantity: 1}) {
			t.Fatalf("equivalent number %s: %#v, %v", raw, command, err)
		}
	}
	for _, raw := range []string{`{"sku":"x","quantity":true}`, `{"sku":"x","quantity":"1"}`, `{"sku":"x","quantity":1.5}`, `{"sku":"x","quantity":0}`, `{"sku":"x","quantity":1000001}`, `{"sku":"x","quantity":1e400}`, `{"sku":"x","quantity":1,"tenant":"other"}`, `{"sku":"x"}`, `{"quantity":1}`, `null`, `[]`} {
		if _, err := ValidateJSON([]byte(raw)); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("accepted invalid command %s", raw)
		}
	}
}

func TestCommitErrorsPreserveOutcomeAndCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	transport := errors.New("lost transport acknowledgement")
	failure := classify(transport, ctx, CommitDispatched, "tenant", "key")
	if !errors.Is(failure, ErrUnknownOutcome) || !errors.Is(failure, context.Canceled) || failure.Outcome() != "unknown" {
		t.Fatalf("lost uncertain canceled COMMIT: %#v", failure)
	}
	aborted := classify(&pgconn.PgError{Code: "40001"}, context.Background(), CommitDispatched, "tenant", "key")
	if !errors.Is(aborted, ErrDatabaseFailure) || aborted.Outcome() != "confirmed-abort" {
		t.Fatalf("confirmed abort misclassified: %#v", aborted)
	}
	disconnected := classify(&pgconn.PgError{Code: "57P01", Severity: "FATAL"}, context.Background(), CommitDispatched, "tenant", "key")
	if !errors.Is(disconnected, ErrUnknownOutcome) {
		t.Fatalf("termination wrongly proves abort: %#v", disconnected)
	}
	completionUnknown := classify(&pgconn.PgError{Code: "40003"}, context.Background(), CommitDispatched, "tenant", "key")
	if !errors.Is(completionUnknown, ErrUnknownOutcome) {
		t.Fatalf("40003 wrongly proves abort: %#v", completionUnknown)
	}
	committed := classify(context.Canceled, ctx, CommitAcknowledged, "tenant", "key")
	if !errors.Is(committed, context.Canceled) || committed.Outcome() != "committed" {
		t.Fatalf("response cancellation erased commit: %#v", committed)
	}
}

func TestExhaustedBudgetFailsBeforeSQL(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	// A nil transaction makes dispatch impossible: expiry must return locally,
	// never encode zero as a server timeout (which would disable the limit).
	if err := budget(ctx, nil); !errors.Is(err, context.Canceled) {
		t.Fatalf("got %v", err)
	}
}
