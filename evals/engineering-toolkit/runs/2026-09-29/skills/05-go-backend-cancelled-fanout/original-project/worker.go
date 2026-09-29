package worker
import "context"
type Client interface { Get(context.Context, string) (string, error) }
func Fetch(ctx context.Context, client Client) ([]string, error) {
 results := make(chan string)
 for _, name := range []string{"a", "b"} {
  go func(name string) { value, _ := client.Get(ctx, name); results <- value }(name)
 }
 out := []string{}
 for range 2 {
  select {
  case <-ctx.Done(): return nil, ctx.Err()
  case value := <-results: out = append(out, value)
  }
 }
 return out, nil
}
