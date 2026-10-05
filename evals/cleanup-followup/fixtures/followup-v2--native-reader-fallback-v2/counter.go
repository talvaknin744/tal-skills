package counter
import "sync"
type Counter struct { mu sync.Mutex; value int }
func (c *Counter) Increment() {
 c.mu.Lock(); before := c.value; c.mu.Unlock()
 c.mu.Lock(); c.value = before + 1; c.mu.Unlock()
}
