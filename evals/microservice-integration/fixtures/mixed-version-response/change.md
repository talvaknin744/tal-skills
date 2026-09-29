# Pricing response migration

Pricing v1 GET /quotes/{id} returns {"amount_cents":1250,"currency":"USD"}. Checkout v1 reads amount_cents and rejects responses when that field is absent. The mobile app also reads amount_cents; deployed clients can remain active for 60 days. Pricing v2 will return only {"amount_minor":1250,"currency":"USD"}. Checkout v2 understands amount_minor but cannot read amount_cents.

The proposed rollout deploys Pricing v2 at 10:00 and Checkout v2 at 10:05. Mobile releases take up to a week to pass review. A rollback can independently return either server to v1. Pricing has no client-version telemetry today. Existing tests pair Pricing v1 with Checkout v1 and Pricing v2 with Checkout v2; they never mix versions. Product requires valid quotes to keep working during deployments.
