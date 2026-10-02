package rollout

import (
	"context"
	"time"
)

type QuoteStore interface {
	Lookup(context.Context, string) error
}

func Receive(parent context.Context, store QuoteStore, message Envelope) error {
	ctx, cancel := context.WithTimeout(parent, time.Until(message.Deadline))
	defer cancel()
	return store.Lookup(ctx, message.OperationID)
}
