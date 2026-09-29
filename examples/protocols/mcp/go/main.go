package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/modelcontextprotocol/go-sdk/jsonrpc"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type Check struct {
	Name    string `json:"name"`
	Passed  bool   `json:"passed"`
	Details any    `json:"details"`
}

var checks []Check

func record(name string, pass bool, details any) { checks = append(checks, Check{name, pass, details}) }
func stats(endpoint string) map[string]any {
	resp, err := (&http.Client{Timeout: 2 * time.Second}).Get(strings.TrimSuffix(endpoint, "/mcp") + "/stats")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	var value map[string]any
	if err = json.NewDecoder(resp.Body).Decode(&value); err != nil {
		panic(err)
	}
	return value
}
func run() (map[string]any, bool) {
	endpoint := os.Args[1]
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	progress := make(chan string, 4)
	client := mcp.NewClient(&mcp.Implementation{Name: "go-mcp-example", Version: "1.0.0"}, &mcp.ClientOptions{
		ProgressNotificationHandler: func(_ context.Context, req *mcp.ProgressNotificationClientRequest) {
			select {
			case progress <- fmt.Sprint(req.Params.ProgressToken):
			default:
			}
		},
	})
	session, err := client.Connect(ctx, &mcp.StreamableClientTransport{Endpoint: endpoint, MaxRetries: -1}, &mcp.ClientSessionOptions{ProtocolVersion: "2026-07-28"})
	if err != nil {
		panic(err)
	}
	defer session.Close()
	actualVersion := session.InitializeResult().ProtocolVersion
	record("go-negotiated-version", actualVersion == "2026-07-28", map[string]any{"requested": "2026-07-28", "actual": actualVersion})
	if actualVersion != "2026-07-28" {
		return map[string]any{"checks": checks, "passed": 0, "failed": 1}, false
	}
	listed, err := session.ListTools(ctx, &mcp.ListToolsParams{})
	if err != nil {
		panic(err)
	}
	record("go-list-tools", len(listed.Tools) == 3, listed)
	result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "add", Arguments: map[string]any{"a": 12, "b": -2}})
	record("go-valid-call", err == nil && !result.IsError && result.StructuredContent.(map[string]any)["sum"] == float64(10), result)
	result, err = session.CallTool(ctx, &mcp.CallToolParams{Name: "add", Arguments: map[string]any{"a": "bad", "b": 1}})
	record("go-invalid-input", err == nil && result.IsError, result)
	result, err = session.CallTool(ctx, &mcp.CallToolParams{Name: "fail", Arguments: map[string]any{}})
	record("go-business-rejection", err == nil && result.IsError, result)
	_, err = session.CallTool(ctx, &mcp.CallToolParams{Name: "missing", Arguments: map[string]any{}})
	var protocolError *jsonrpc.Error
	record("go-unknown-tool", errors.As(err, &protocolError) && protocolError.Code == jsonrpc.CodeInvalidParams, map[string]any{"error": fmt.Sprint(err), "protocol_error": protocolError})
	for _, committed := range []bool{false, true} {
		token := "go-before-effect"
		if committed {
			token = "go-after-effect"
		}
		callCtx, callCancel := context.WithCancel(ctx)
		params := &mcp.CallToolParams{Name: "slow", Arguments: map[string]any{"token": token, "commitFirst": committed}}
		params.SetProgressToken(token)
		done := make(chan error, 1)
		go func() { _, e := session.CallTool(callCtx, params); done <- e }()
		select {
		case p := <-progress:
			if p != token {
				panic("unexpected progress token")
			}
		case <-ctx.Done():
			panic("no progress")
		}
		callCancel()
		var callErr error
		select {
		case callErr = <-done:
		case <-ctx.Done():
			panic("call did not cancel")
		}
		until := time.Now().Add(2 * time.Second)
		var state map[string]any
		for time.Now().Before(until) {
			state = stats(endpoint)["slow"].(map[string]any)[token].(map[string]any)
			if state["aborted"] == true {
				break
			}
			time.Sleep(20 * time.Millisecond)
		}
		record(token, errors.Is(callErr, context.Canceled) && state["aborted"] == true && state["finished"] == false && state["committed"] == committed, map[string]any{"error": fmt.Sprint(callErr), "state": state})
	}
	snapshot := stats(endpoint)
	record("go-invalid-input-no-side-effect", snapshot["addInvocations"] == float64(1), snapshot["addInvocations"])
	noSession := true
	for _, r := range snapshot["requests"].([]any) {
		req := r.(map[string]any)
		if req["mcpMethod"] == "initialize" || req["hasSessionHeader"] == true {
			noSession = false
		}
	}
	record("go-no-initialize-or-session", noSession, snapshot["requests"])
	passed := 0
	for _, check := range checks {
		if check.Passed {
			passed++
		}
	}
	return map[string]any{"checks": checks, "passed": passed, "failed": len(checks) - passed, "server_observations": snapshot}, passed == len(checks)
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: go run . http://127.0.0.1:PORT/mcp")
		os.Exit(2)
	}
	result, passed := run()
	if err := json.NewEncoder(os.Stdout).Encode(result); err != nil {
		panic(err)
	}
	if !passed {
		os.Exit(1)
	}
}
