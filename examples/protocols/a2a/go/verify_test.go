package probe

import (
	"context"
	"errors"
	"fmt"
	"iter"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/a2aproject/a2a-go/v2/a2aclient"
	"github.com/a2aproject/a2a-go/v2/a2asrv"
	"github.com/a2aproject/a2a-go/v2/a2asrv/taskstore"
)

func clientFor(t *testing.T, executor a2asrv.AgentExecutor, options ...a2asrv.RequestHandlerOption) *a2aclient.Client {
	t.Helper()
	server := httptest.NewServer(a2asrv.NewJSONRPCHandler(a2asrv.NewHandler(executor, options...)))
	t.Cleanup(func() { server.CloseClientConnections(); server.Close() })
	card := &a2a.AgentCard{
		Name:                "Scratch lifecycle probe",
		SupportedInterfaces: []*a2a.AgentInterface{a2a.NewAgentInterface(server.URL, a2a.TransportProtocolJSONRPC)},
		Capabilities:        a2a.AgentCapabilities{Streaming: true},
	}
	client, err := a2aclient.NewFromCard(t.Context(), card)
	if err != nil {
		t.Fatal(err)
	}
	return client
}

type observed struct {
	event a2a.Event
	err   error
}

func observe(sequence iter.Seq2[a2a.Event, error]) <-chan observed {
	ch := make(chan observed, 20)
	go func() {
		defer close(ch)
		for event, err := range sequence {
			ch <- observed{event, err}
		}
	}()
	return ch
}

func next(t *testing.T, ch <-chan observed) observed {
	t.Helper()
	select {
	case item, open := <-ch:
		if !open {
			t.Fatal("stream ended before expected event")
		}
		if item.err != nil {
			t.Fatal(item.err)
		}
		return item
	case <-time.After(5 * time.Second):
		t.Fatal("stream timed out")
	}
	return observed{}
}

func drain(t *testing.T, ch <-chan observed, allowCancellation bool) []a2a.Event {
	t.Helper()
	var out []a2a.Event
	timer := time.NewTimer(5 * time.Second)
	defer timer.Stop()
	for {
		select {
		case item, open := <-ch:
			if !open {
				return out
			}
			if item.err != nil && !(allowCancellation && errors.Is(item.err, context.Canceled)) {
				t.Fatal(item.err)
			}
			if item.event != nil {
				out = append(out, item.event)
			}
		case <-timer.C:
			t.Fatal("stream did not finish")
		}
	}
}

func request() *a2a.SendMessageRequest {
	return &a2a.SendMessageRequest{Message: a2a.NewMessage(a2a.MessageRoleUser, a2a.NewTextPart("work"))}
}

func controlled(t *testing.T) (a2asrv.AgentExecutor, func(), <-chan struct{}) {
	t.Helper()
	gate := make(chan struct{})
	done := make(chan struct{})
	var once sync.Once
	release := func() { once.Do(func() { close(gate) }) }
	t.Cleanup(release)
	executor := a2asrv.AgentExecutorFunc(func(ctx context.Context, ec *a2asrv.ExecutorContext) iter.Seq2[a2a.Event, error] {
		return func(yield func(a2a.Event, error) bool) {
			defer close(done)
			if !yield(a2a.NewSubmittedTask(ec, ec.Message), nil) {
				return
			}
			if !yield(a2a.NewStatusUpdateEvent(ec, a2a.TaskStateWorking, nil), nil) {
				return
			}
			select {
			case <-gate:
			case <-ctx.Done():
				return
			}
			if !yield(a2a.NewArtifactEvent(ec, a2a.NewTextPart("finished payload")), nil) {
				return
			}
			yield(a2a.NewStatusUpdateEvent(ec, a2a.TaskStateCompleted, nil), nil)
		}
	})
	return executor, release, done
}

func firstTask(t *testing.T, ch <-chan observed) *a2a.Task {
	t.Helper()
	item := next(t, ch)
	task, ok := item.event.(*a2a.Task)
	if !ok {
		t.Fatalf("first event is %T, want task", item.event)
	}
	return task
}

func waitDone(t *testing.T, done <-chan struct{}) {
	t.Helper()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("executor did not clean up")
	}
}

func TestDuplicateInitialMessageIDDoesNotDeduplicateDefaultHandler(t *testing.T) {
	var calls atomic.Int32
	executor := a2asrv.AgentExecutorFunc(func(ctx context.Context, ec *a2asrv.ExecutorContext) iter.Seq2[a2a.Event, error] {
		return func(yield func(a2a.Event, error) bool) {
			calls.Add(1)
			if !yield(a2a.NewSubmittedTask(ec, ec.Message), nil) {
				return
			}
			if !yield(a2a.NewArtifactEvent(ec, a2a.NewTextPart("result")), nil) {
				return
			}
			yield(a2a.NewStatusUpdateEvent(ec, a2a.TaskStateCompleted, nil), nil)
		}
	})
	client := clientFor(t, executor)
	req := request()
	var tasks []*a2a.Task
	for range 2 {
		result, err := client.SendMessage(t.Context(), req)
		if err != nil {
			t.Fatal(err)
		}
		task, ok := result.(*a2a.Task)
		if !ok || task.Status.State != a2a.TaskStateCompleted {
			t.Fatalf("unexpected result %#v", result)
		}
		if len(task.Artifacts) != 1 {
			t.Fatalf("artifacts = %d, want 1", len(task.Artifacts))
		}
		tasks = append(tasks, task)
	}
	if calls.Load() != 2 || tasks[0].ID == tasks[1].ID {
		t.Fatalf("expected two executions and distinct tasks, got %d", calls.Load())
	}
	t.Logf("same messageId accepted twice; executions=%d; distinct task IDs=true", calls.Load())

	followup := request()
	followup.Message.TaskID = tasks[0].ID
	_, err := client.SendMessage(t.Context(), followup)
	if !errors.Is(err, a2a.ErrUnsupportedOperation) {
		t.Fatalf("terminal followup error=%v", err)
	}
	if calls.Load() != 2 {
		t.Fatalf("terminal followup executed; calls=%d", calls.Load())
	}
	t.Log("terminal task continuation rejected before another execution")
}

func TestDisconnectOneObserverPreservesTaskAndOtherObserver(t *testing.T) {
	executor, release, done := controlled(t)
	client := clientFor(t, executor)
	firstContext, closeFirst := context.WithCancel(t.Context())
	defer closeFirst()
	first := observe(client.SendStreamingMessage(firstContext, request()))
	task := firstTask(t, first)
	second := observe(client.SubscribeToTask(t.Context(), &a2a.SubscribeToTaskRequest{ID: task.ID}))
	secondSnapshot := firstTask(t, second)
	if secondSnapshot.ID != task.ID {
		t.Fatal("observer attached to different task")
	}
	closeFirst()
	drain(t, first, true)
	select {
	case <-done:
		t.Fatal("disconnect stopped executor")
	default:
	}
	stillActive, err := client.GetTask(t.Context(), &a2a.GetTaskRequest{ID: task.ID})
	if err != nil || stillActive.Status.State.Terminal() {
		t.Fatalf("task after disconnect=%#v err=%v", stillActive, err)
	}
	release()
	events := drain(t, second, false)
	var artifact, completed bool
	for _, event := range events {
		switch e := event.(type) {
		case *a2a.TaskArtifactUpdateEvent:
			artifact = true
		case *a2a.TaskStatusUpdateEvent:
			completed = completed || e.Status.State == a2a.TaskStateCompleted
		}
	}
	if !artifact || !completed {
		t.Fatalf("remaining observer saw artifact=%t completed=%t", artifact, completed)
	}
	final, err := client.GetTask(t.Context(), &a2a.GetTaskRequest{ID: task.ID})
	if err != nil || final.Status.State != a2a.TaskStateCompleted {
		t.Fatalf("final=%#v err=%v", final, err)
	}
	waitDone(t, done)
	t.Log("closed initial stream; second observer received artifact and completion; GetTask reconciled completed state")
}

func TestCancelIsRepeatableAndCompletionCannotReplaceCanceledTask(t *testing.T) {
	executor, release, done := controlled(t)
	client := clientFor(t, executor)
	stream := observe(client.SendStreamingMessage(t.Context(), request()))
	task := firstTask(t, stream)
	for range 2 {
		canceled, err := client.CancelTask(t.Context(), &a2a.CancelTaskRequest{ID: task.ID})
		if err != nil || canceled.Status.State != a2a.TaskStateCanceled {
			t.Fatalf("cancel=%#v err=%v", canceled, err)
		}
	}
	release()
	drain(t, stream, false)
	waitDone(t, done)
	final, err := client.GetTask(t.Context(), &a2a.GetTaskRequest{ID: task.ID})
	if err != nil || final.Status.State != a2a.TaskStateCanceled {
		t.Fatalf("final=%#v err=%v", final, err)
	}
	t.Log("both cancel calls returned canceled; releasing completion preserved canceled state; executor returned")
}

func TestCompletionCancelRaceHasValidTerminalOutcome(t *testing.T) {
	wins := map[a2a.TaskState]int{}
	for iteration := range 30 {
		t.Run(fmt.Sprintf("race-%02d", iteration), func(t *testing.T) {
			executor, release, done := controlled(t)
			client := clientFor(t, executor)
			stream := observe(client.SendStreamingMessage(t.Context(), request()))
			task := firstTask(t, stream)
			start := make(chan struct{})
			cancelResult := make(chan error, 1)
			go func() {
				<-start
				_, err := client.CancelTask(t.Context(), &a2a.CancelTaskRequest{ID: task.ID})
				cancelResult <- err
			}()
			go func() { <-start; release() }()
			close(start)
			cancelError := <-cancelResult
			drain(t, stream, false)
			waitDone(t, done)
			final, err := client.GetTask(t.Context(), &a2a.GetTaskRequest{ID: task.ID})
			if err != nil {
				t.Fatal(err)
			}
			switch final.Status.State {
			case a2a.TaskStateCanceled:
				if cancelError != nil {
					t.Fatalf("canceled task but cancel failed: %v", cancelError)
				}
			case a2a.TaskStateCompleted:
				if !errors.Is(cancelError, a2a.ErrTaskNotCancelable) {
					t.Fatalf("completed task but cancel error=%v", cancelError)
				}
			default:
				t.Fatalf("invalid final state %s", final.Status.State)
			}
			wins[final.Status.State]++
		})
	}
	t.Logf("30 released-at-once races: outcomes=%v", wins)
}

func TestSharedStoreCancellationDoesNotFenceExternalEffects(t *testing.T) {
	store := taskstore.NewInMemory(nil)
	gate := make(chan struct{})
	var releaseOnce sync.Once
	release := func() { releaseOnce.Do(func() { close(gate) }) }
	t.Cleanup(release)
	started := make(chan context.Context, 1)
	done := make(chan struct{})
	var effects atomic.Int32
	executor := a2asrv.AgentExecutorFunc(func(ctx context.Context, ec *a2asrv.ExecutorContext) iter.Seq2[a2a.Event, error] {
		return func(yield func(a2a.Event, error) bool) {
			defer close(done)
			if !yield(a2a.NewSubmittedTask(ec, ec.Message), nil) {
				return
			}
			if !yield(a2a.NewStatusUpdateEvent(ec, a2a.TaskStateWorking, nil), nil) {
				return
			}
			started <- ctx
			select {
			case <-gate:
			case <-ctx.Done():
				return
			}
			// Adverse fixture: this represents a downstream effect with no ownership fence.
			// The assertion demonstrates a missing application guarantee, not recommended behavior.
			effects.Add(1)
			yield(a2a.NewStatusUpdateEvent(ec, a2a.TaskStateCompleted, nil), nil)
		}
	})
	workerClient := clientFor(t, executor, a2asrv.WithTaskStore(store))
	cancelClient := clientFor(t, executor, a2asrv.WithTaskStore(store))
	stream := observe(workerClient.SendStreamingMessage(t.Context(), request()))
	task := firstTask(t, stream)
	var executionContext context.Context
	select {
	case executionContext = <-started:
	case <-time.After(5 * time.Second):
		t.Fatal("execution did not start")
	}
	canceled, err := cancelClient.CancelTask(t.Context(), &a2a.CancelTaskRequest{ID: task.ID})
	if err != nil || canceled.Status.State != a2a.TaskStateCanceled {
		t.Fatalf("cancel=%#v err=%v", canceled, err)
	}
	if executionContext.Err() != nil {
		t.Fatalf("unexpected immediate cross-handler cancellation: %v", executionContext.Err())
	}
	release()
	drain(t, stream, false)
	waitDone(t, done)
	final, err := workerClient.GetTask(t.Context(), &a2a.GetTaskRequest{ID: task.ID})
	if err != nil || final.Status.State != a2a.TaskStateCanceled {
		t.Fatalf("final=%#v err=%v", final, err)
	}
	if effects.Load() != 1 {
		t.Fatalf("adverse fixture effect count=%d", effects.Load())
	}
	t.Log("separate handlers sharing store: CancelTask returned canceled before worker noticed; unfenced simulated effect ran once; task stayed canceled")
}
