// Controlled cancellation observations; the unsafe controls are not examples
// of production ownership policy.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"runtime"
	"sync"
	"sync/atomic"
	"time"
)

type scenario struct {
	ID       string         `json:"id"`
	Status   string         `json:"status"`
	Evidence map[string]any `json:"evidence"`
}

func operandBeforeSelection() (map[string]any, error) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	output := make(chan int) // Unbuffered, and no receiver exists.
	started := 0
	operand := func() int { started++; return 42 }
	selected := ""
	select {
	case output <- operand():
		selected = "send"
	case <-ctx.Done():
		selected = "cancellation"
	}
	if selected != "cancellation" || started != 1 {
		return nil, fmt.Errorf("selected=%s operand calls=%d", selected, started)
	}
	return map[string]any{"selected": selected, "effectful_operand_calls": started, "receivers": 0}, nil
}

func precheck(ctx context.Context, start func()) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	start()
	return nil
}

func alreadyCanceled() (map[string]any, error) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	started := 0
	err := precheck(ctx, func() { started++ })
	if !errors.Is(err, context.Canceled) || started != 0 {
		return nil, fmt.Errorf("error=%v starts=%d", err, started)
	}
	return map[string]any{"error_is_canceled": true, "effect_starts": started}, nil
}

func await(ch <-chan struct{}, name string) error {
	timer := time.NewTimer(time.Second)
	defer timer.Stop()
	select {
	case <-ch:
		return nil
	case <-timer.C:
		return fmt.Errorf("deadline awaiting %s", name)
	}
}

func precheckIsNotFence() (evidence map[string]any, resultErr error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	checked, proceed, done := make(chan struct{}), make(chan struct{}), make(chan struct{})
	var starts atomic.Int32
	var releaseOnce sync.Once
	release := func() { releaseOnce.Do(func() { close(proceed) }) }
	go func() {
		defer close(done)
		_ = precheck(ctx, func() {
			close(checked) // The successful check has already returned.
			<-proceed
			starts.Add(1) // Intentional unsafe control: no later checkpoint.
		})
	}()
	defer func() {
		release()
		if err := await(done, "worker cleanup"); err != nil {
			resultErr = errors.Join(resultErr, err)
		}
	}()
	if err := await(checked, "successful precheck"); err != nil {
		return nil, err
	}
	cancel()
	release()
	if err := await(done, "worker completion"); err != nil {
		return nil, err
	}
	if starts.Load() != 1 || !errors.Is(ctx.Err(), context.Canceled) {
		return nil, fmt.Errorf("starts=%d context=%v", starts.Load(), ctx.Err())
	}
	return map[string]any{"cancel_after_check_before_effect": true, "effect_starts": starts.Load(), "worker_joined": true}, nil
}

func main() {
	cases := []scenario{}
	failure := false
	for _, c := range []struct {
		id, status string
		run        func() (map[string]any, error)
	}{
		{"select-operand-before-canceled-case", "observed-unsafe", operandBeforeSelection},
		{"precheck-known-cancellation", "pass", alreadyCanceled},
		{"precheck-not-an-effect-fence", "observed-unsafe", precheckIsNotFence},
	} {
		evidence, err := c.run()
		status := c.status
		if err != nil {
			status, failure = "fail", true
			evidence = map[string]any{"error": err.Error()}
		}
		cases = append(cases, scenario{c.id, status, evidence})
	}
	report := map[string]any{
		"language": "go", "runtime": runtime.Version(), "platform": runtime.GOOS + "/" + runtime.GOARCH,
		"scenarios": cases,
		"limitations": []string{
			"The select case is deterministic: cancellation is ready and the unbuffered send cannot proceed.",
			"The effect is an in-process counter, not a remote effect or transaction.",
			"No claim that a precheck excludes cancellation arriving after it.",
		},
	}
	if err := json.NewEncoder(os.Stdout).Encode(report); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if failure {
		os.Exit(1)
	}
}
