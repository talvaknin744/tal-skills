package rollout

import (
	"context"
	"encoding/json"
	"time"
)

type Envelope struct {
	OperationID string    `json:"operation_id"`
	Deadline    time.Time `json:"deadline"`
}

type Client interface {
	Quote(context.Context, Envelope) error
}

func Quote(parent context.Context, client Client, operationID string) error {
	const requestBudget = 2 * time.Second
	deadline := time.Now().Add(requestBudget)
	encoded, err := json.Marshal(Envelope{OperationID: operationID, Deadline: deadline})
	if err != nil {
		return err
	}
	var message Envelope
	if err := json.Unmarshal(encoded, &message); err != nil {
		return err
	}
	for attempt := 0; attempt < 2; attempt++ {
		if time.Until(message.Deadline) <= 0 {
			return context.DeadlineExceeded
		}
		attemptCtx, cancel := context.WithTimeout(context.Background(), requestBudget)
		err = client.Quote(attemptCtx, message)
		cancel()
		if err == nil {
			return nil
		}
	}
	return err
}
