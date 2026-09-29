package worker

import (
 "context"
 "errors"
 "testing"
 "time"
)

type result struct { values []string; err error }
type gatedClient struct { entered chan struct{}; cancelled chan struct{}; cleanup chan struct{} }
func (c *gatedClient) Get(ctx context.Context, name string) (string, error) {
 c.entered <- struct{}{}
 <-ctx.Done()
 c.cancelled <- struct{}{}
 <-c.cleanup
 return "", ctx.Err()
}
func TestOwnedWorkersFinishBeforeReturn(t *testing.T) {
 ctx, cancel := context.WithCancel(context.Background())
 defer cancel()
 c := &gatedClient{make(chan struct{},2), make(chan struct{},2), make(chan struct{})}
 done := make(chan result,1)
 go func() { values, err := Fetch(ctx,c); done <- result{values,err} }()
 for range 2 { select { case <-c.entered: case <-time.After(2*time.Second): t.Fatal("workers did not start") } }
 cancel()
 for range 2 { select { case <-c.cancelled: case <-time.After(2*time.Second): t.Fatal("cancellation did not reach client") } }
 select { case <-done: close(c.cleanup); t.Fatal("returned while owned requests were still cleaning up"); default: }
 close(c.cleanup)
 select {
 case out := <-done:
  if !errors.Is(out.err,context.Canceled) { t.Fatalf("want cancellation, got %#v",out) }
 case <-time.After(2*time.Second): t.Fatal("workers did not terminate after cancellation")
 }
}
type ordinaryClient struct { err error }
func (c ordinaryClient) Get(ctx context.Context, name string) (string,error) { return name,c.err }
func TestSuccessfulResults(t *testing.T) {
 values, err := Fetch(context.Background(),ordinaryClient{})
 if err != nil || len(values)!=2 || values[0]==values[1] { t.Fatalf("unexpected %#v, %v",values,err) }
}
func TestDependencyError(t *testing.T) {
 wanted := errors.New("dependency failed")
 _, err := Fetch(context.Background(),ordinaryClient{wanted})
 if !errors.Is(err,wanted) { t.Fatalf("lost dependency error: %v",err) }
}
