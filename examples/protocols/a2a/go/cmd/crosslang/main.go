package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"time"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/a2aproject/a2a-go/v2/a2aclient"
	"github.com/a2aproject/a2a-go/v2/a2aclient/agentcard"
)

// This is deliberately a local fixed identity, not an authentication implementation.
type localFixtureTransport struct{ base http.RoundTripper }

func (t localFixtureTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	copy := req.Clone(req.Context())
	copy.Header.Set("Authorization", "Bearer fixture-alice")
	return t.base.RoundTrip(copy)
}

type assertion struct {
	Name        string `json:"name"`
	Status      string `json:"status"`
	Observation any    `json:"observation"`
}

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "Usage: go run ./cmd/crosslang BASE_URL OUTPUT_JSON")
		os.Exit(2)
	}
	baseURL, output := os.Args[1], os.Args[2]
	parsed, err := url.Parse(baseURL)
	if err != nil || parsed.Hostname() != "127.0.0.1" || parsed.Scheme != "http" {
		fmt.Fprintln(os.Stderr, "Synthetic identities require a loopback HTTP peer")
		os.Exit(2)
	}
	report := map[string]any{
		"probe":       "a2a-go-client-to-python-server",
		"at":          time.Now().UTC().Format(time.RFC3339),
		"runtime":     runtime.Version(),
		"client":      "github.com/a2aproject/a2a-go/v2 v2.6.0",
		"server":      "a2a-sdk Python 1.1.5 deterministic fixture",
		"transport":   "JSON-RPC HTTP wire 1.0",
		"base_url":    baseURL,
		"limitations": []string{"local static bearer identity only; no production authentication claim", "no persistent store or process recovery", "same host loopback network", "server pin checked by launcher; client resolves real public agent card"},
	}
	var checks []assertion
	err = run(baseURL, &checks)
	report["checks"] = checks
	report["status"] = "passed"
	if err != nil {
		report["status"] = "failed"
		report["error"] = err.Error()
	}
	payload, _ := json.MarshalIndent(report, "", "  ")
	if writeErr := os.WriteFile(output, append(payload, '\n'), 0644); writeErr != nil {
		panic(writeErr)
	}
	fmt.Println(string(payload))
	if err != nil {
		os.Exit(1)
	}
}

func run(baseURL string, checks *[]assertion) error {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	card, err := agentcard.DefaultResolver.Resolve(ctx, baseURL)
	if err != nil {
		return fmt.Errorf("resolve: %w", err)
	}
	if len(card.SupportedInterfaces) != 1 || card.SupportedInterfaces[0].ProtocolVersion != "1.0" {
		return fmt.Errorf("unexpected interfaces: %#v", card.SupportedInterfaces)
	}
	*checks = append(*checks, assertion{"discovery", "passed", card.SupportedInterfaces})
	httpClient := &http.Client{Timeout: 15 * time.Second, Transport: localFixtureTransport{base: http.DefaultTransport}}
	client, err := a2aclient.NewFromCard(ctx, card, a2aclient.WithDefaultsDisabled(), a2aclient.WithJSONRPCTransport(httpClient))
	if err != nil {
		return fmt.Errorf("client: %w", err)
	}
	send := func(text string, task *a2a.Task) (*a2a.Task, error) {
		message := a2a.NewMessage(a2a.MessageRoleUser, a2a.NewTextPart(text))
		if task != nil {
			message.TaskID = task.ID
			message.ContextID = task.ContextID
		}
		response, err := client.SendMessage(ctx, &a2a.SendMessageRequest{Message: message})
		if err != nil {
			return nil, err
		}
		result, ok := response.(*a2a.Task)
		if !ok {
			return nil, fmt.Errorf("expected task; got %T", response)
		}
		return result, nil
	}
	immediate, err := send("immediate", nil)
	if err != nil {
		return fmt.Errorf("immediate: %w", err)
	}
	if immediate.Status.State != a2a.TaskStateCompleted || len(immediate.Artifacts) != 1 || len(immediate.Artifacts[0].Parts) != 1 {
		return fmt.Errorf("immediate result unexpected: %#v", immediate)
	}
	*checks = append(*checks, assertion{"immediate", "passed", immediate})
	paused, err := send("input", nil)
	if err != nil {
		return fmt.Errorf("input: %w", err)
	}
	if paused.Status.State != a2a.TaskStateInputRequired {
		return fmt.Errorf("expected input-required; got %s", paused.Status.State)
	}
	finished, err := send("finish", paused)
	if err != nil {
		return fmt.Errorf("finish: %w", err)
	}
	if finished.ID != paused.ID || finished.ContextID != paused.ContextID || finished.Status.State != a2a.TaskStateCompleted || len(finished.Artifacts) != 1 {
		return fmt.Errorf("continuation result unexpected: %#v", finished)
	}
	*checks = append(*checks, assertion{"input_required_continuation", "passed", map[string]any{"initial_state": paused.Status.State, "final_task": finished}})
	retrieved, err := client.GetTask(ctx, &a2a.GetTaskRequest{ID: finished.ID})
	if err != nil {
		return fmt.Errorf("get: %w", err)
	}
	if retrieved.ID != finished.ID || retrieved.Status.State != a2a.TaskStateCompleted || len(retrieved.Artifacts) != 1 {
		return fmt.Errorf("get mismatch: %#v", retrieved)
	}
	*checks = append(*checks, assertion{"get_task", "passed", retrieved})

	cancelable, err := send("input", nil)
	if err != nil {
		return fmt.Errorf("cancel fixture: %w", err)
	}
	if cancelable.Status.State != a2a.TaskStateInputRequired {
		return fmt.Errorf("cancel fixture must be parked input-required; got %s", cancelable.Status.State)
	}
	canceled, err := client.CancelTask(ctx, &a2a.CancelTaskRequest{ID: cancelable.ID})
	if err != nil {
		return fmt.Errorf("cancel: %w", err)
	}
	if canceled.Status.State != a2a.TaskStateCanceled {
		return fmt.Errorf("cancel returned state %s", canceled.Status.State)
	}
	*checks = append(*checks, assertion{"cancel_input_required", "passed", canceled})
	repeated, repeatErr := client.CancelTask(ctx, &a2a.CancelTaskRequest{ID: cancelable.ID})
	if repeatErr != nil {
		if !errors.Is(repeatErr, a2a.ErrTaskNotCancelable) {
			return fmt.Errorf("unexpected repeat-cancel error: %w", repeatErr)
		}
		*checks = append(*checks, assertion{"repeat_cancel_response_for_parked_task", "passed", map[string]any{"error": repeatErr.Error(), "is_task_not_cancelable": true}})
	} else if repeated.Status.State != a2a.TaskStateCanceled {
		return fmt.Errorf("repeat cancel state %s", repeated.Status.State)
	} else {
		*checks = append(*checks, assertion{"repeat_cancel_response_for_parked_task", "passed", repeated})
	}
	finalCanceled, err := client.GetTask(ctx, &a2a.GetTaskRequest{ID: cancelable.ID})
	if err != nil || finalCanceled.Status.State != a2a.TaskStateCanceled {
		return fmt.Errorf("cancel reconciliation: task=%#v err=%v", finalCanceled, err)
	}
	*checks = append(*checks, assertion{"get_task_after_repeated_cancel", "passed", finalCanceled})
	return nil
}
