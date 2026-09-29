package worker

import (
	"context"
	"sync"
)

type Client interface {
	Get(context.Context, string) (string, error)
}

func Fetch(ctx context.Context, client Client) ([]string, error) {
	workerCtx, cancel := context.WithCancel(ctx)
	type response struct {
		value string
		err   error
	}
	results := make(chan response)
	var workers sync.WaitGroup
	for _, name := range []string{"a", "b"} {
		workers.Add(1)
		go func(name string) {
			defer workers.Done()
			value, err := client.Get(workerCtx, name)
			select {
			case results <- response{value: value, err: err}:
			case <-workerCtx.Done():
			}
		}(name)
	}

	out := make([]string, 0, 2)
	var dependencyErr error
collect:
	for range 2 {
		select {
		case <-ctx.Done():
			break collect
		case result := <-results:
			if result.err != nil {
				dependencyErr = result.err
				break collect
			}
			out = append(out, result.value)
		}
	}

	// Stop abandoned sends or requests, then join every worker before returning.
	cancel()
	workers.Wait()
	// A ready result can win a select even when the caller has canceled.
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if dependencyErr != nil {
		return nil, dependencyErr
	}
	return out, nil
}
