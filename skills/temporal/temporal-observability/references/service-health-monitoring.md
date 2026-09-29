# Temporal Cloud Service Health Monitoring

<!-- Source: docs/cloud/service-health.mdx -->

This reference covers patterns for monitoring Temporal Cloud service health: availability monitoring, Workflow execution latency, service error rate queries, activity/workflow failure detection, replication lag monitoring, resource exhaustion detection, and limit monitoring.

## Availability Monitoring
<!-- docs/cloud/service-health.mdx:20-30 -->

When you see a sudden drop in Worker resource utilization, verify whether Temporal Cloud's API is showing increased latency and error rates.

### Key Metric: `temporal_cloud_v1_service_latency_p99`
<!-- docs/cloud/service-health.mdx:26-29 -->

This metric measures latency for `SignalWithStartWorkflowExecution`, `SignalWorkflowExecution`, `StartWorkflowExecution` operations. These operations are mission critical and never throttled. This metric is a good indicator of the lowest possible latency for the 99th percentile of requests. <!-- docs/cloud/service-health.mdx:28-29 -->

## Workflow Execution Latency
<!-- docs/cloud/service-health.mdx:33-40 -->

To monitor end-to-end Workflow execution time (not just service API latency), use the workflow schedule-to-close latency metrics: <!-- docs/cloud/service-health.mdx:34 -->

- `temporal_cloud_v1_workflow_schedule_to_close_latency_p50` <!-- docs/cloud/service-health.mdx:36 -->
- `temporal_cloud_v1_workflow_schedule_to_close_latency_p95` <!-- docs/cloud/service-health.mdx:37 -->
- `temporal_cloud_v1_workflow_schedule_to_close_latency_p99` <!-- docs/cloud/service-health.mdx:38 -->

These measure the time from when a Workflow is scheduled until it closes, including all Activity execution time. A sudden increase may indicate Worker capacity issues, downstream service degradation, or retry storms. <!-- docs/cloud/service-health.mdx:40 -->

## Service Error Rate
<!-- docs/cloud/service-health.mdx:42-73 -->

Check for Temporal Service gRPC API errors. Service API errors are not equivalent to guarantees in the Temporal Cloud SLA. <!-- docs/cloud/service-health.mdx:44-45 -->

### Key Metrics
<!-- docs/cloud/service-health.mdx:49-50 -->

- `temporal_cloud_v1_service_error_count` <!-- docs/cloud/service-health.mdx:49 -->
- `temporal_cloud_v1_service_request_count` <!-- docs/cloud/service-health.mdx:50 -->

### Query: Daily Average Success Rate Over 10-Minute Windows
<!-- docs/cloud/service-health.mdx:54-73 -->

OpenMetrics v1 metrics are pre-computed rates. Use `sum()` to aggregate across dimensions rather than `increase()` or `rate()`. <!-- docs/cloud/service-health.mdx:56 -->

```promql
avg_over_time((
    (
        (
            sum(temporal_cloud_v1_service_request_count{temporal_namespace=~"$namespace", operation=~"StartWorkflowExecution|SignalWorkflowExecution|SignalWithStartWorkflowExecution|RequestCancelWorkflowExecution|TerminateWorkflowExecution"})
            -
            sum(temporal_cloud_v1_service_error_count{temporal_namespace=~"$namespace", operation=~"StartWorkflowExecution|SignalWorkflowExecution|SignalWithStartWorkflowExecution|RequestCancelWorkflowExecution|TerminateWorkflowExecution"})
        )
        /
        sum(temporal_cloud_v1_service_request_count{temporal_namespace=~"$namespace", operation=~"StartWorkflowExecution|SignalWorkflowExecution|SignalWithStartWorkflowExecution|RequestCancelWorkflowExecution|TerminateWorkflowExecution"})
    )

    or vector(1)

    )[1d:1m])
```

## Detecting Activity and Workflow Failures
<!-- docs/cloud/service-health.mdx:75-116 -->

The metrics `temporal_cloud_v1_activity_fail_count` and `temporal_cloud_v1_workflow_failed_count` together provide failure detection for Temporal applications, giving both component-level visibility and high-level workflow health insights. <!-- docs/cloud/service-health.mdx:77 -->

### Activity Failure Cascade
<!-- docs/cloud/service-health.mdx:79-89 -->

If not using infinite retry policies, Activity failures can lead to Workflow failures:

```
Activity Failure --> Retry Logic --> More Activity Failures --> Workflow Decision --> Potential Workflow Failure
```

Activity failures can be recoverable. Workflow failures are terminal outcomes: classify expected business rejections separately from unexpected operational failures. A spike in Activity failures may precede Workflow failures or a growing population stuck retrying. <!-- docs/cloud/service-health.mdx:87-88 -->

Define the intended terminal outcome for each failure class. Handle retry exhaustion with the required compensation, reconciliation, notification, or explicit failure. Do not turn a valid business rejection into success merely to improve a metric. <!-- docs/cloud/service-health.mdx:89 -->

### Ratio-Based Monitoring
<!-- docs/cloud/service-health.mdx:91-112 -->

#### Failure Conversion Rate
<!-- docs/cloud/service-health.mdx:93-104 -->

Monitor the ratio of workflow failures to activity failures:

```promql
workflow_failure_rate = temporal_cloud_v1_workflow_failed_count / temporal_cloud_v1_activity_fail_count
```

Interpret this as an investigation signal, not a universal health score. Confirm whether each metric counts attempt failures or terminal executions, and align labels, time windows, and a nonzero denominator. SDK attempt-failure counters and Cloud execution metrics need not have identical semantics.

- High ratio: inspect failure classes and histories; expected business rejection may correctly fail a Workflow.
- Low ratio: verify completion within the business deadline, pending age, and retry/time budgets. Endless retries can produce few Workflow failures while delivering no useful work.
- Sudden change: compare with a workload-specific baseline and the business completion SLO.

This is a local applicability clarification of the heuristics in [Cloud service health](https://docs.temporal.io/cloud/service-health), informed by [retry policy semantics](https://docs.temporal.io/encyclopedia/retry-policies) and [intentional Workflow failure for business errors](https://docs.temporal.io/develop/python/best-practices/error-handling). The source's 0.1/0.01 examples are not universal correctness thresholds.

#### Activity Success Rate
<!-- docs/cloud/service-health.mdx:106-112 -->

```promql
activity_success_rate = temporal_cloud_v1_activity_success_count / (temporal_cloud_v1_activity_success_count + temporal_cloud_v1_activity_fail_count)
```

Choose a target from the business SLO and expected rejection mix. Compare with the baseline and pending/completion latency; this rate alone cannot prove the system meets its deadline. <!-- docs/cloud/service-health.mdx:112 -->

## Replication Lag Monitoring
<!-- docs/cloud/service-health.mdx:118-145 -->

Replication lag refers to the transmission delay of Workflow updates and history events from the primary Namespace to the replica. Always check replication lag before initiating a failover. A forced failover when there is a large replication lag has a higher likelihood of rolling back Workflow progress. <!-- docs/cloud/service-health.mdx:120-122 -->

### Key Metrics
<!-- docs/cloud/service-health.mdx:143-145 -->

- `temporal_cloud_v1_replication_lag_p99` <!-- docs/cloud/service-health.mdx:143 -->
- `temporal_cloud_v1_replication_lag_p95` <!-- docs/cloud/service-health.mdx:144 -->
- `temporal_cloud_v1_replication_lag_p50` <!-- docs/cloud/service-health.mdx:145 -->

### Guidance
<!-- docs/cloud/service-health.mdx:124-136 -->

Temporal owns replication lag. There is no SLA for replication lag. Temporal recommends that customers do not trigger failovers except for testing or emergency situations. Customers who decide to trigger failovers should examine this metric before proceeding. Contact Temporal support if you have a pressing need. <!-- docs/cloud/service-health.mdx:125-136 -->

## Detecting Resource Exhaustion
<!-- docs/cloud/service-health.mdx:147-153 -->

The metric `temporal_cloud_v1_resource_exhausted_error_count` is the primary indicator for Cloud-side throttling, signaling system limits are exceeded and `ResourceExhausted` gRPC errors are occurring. This generally does not break workflow processing due to how resources are prioritized. <!-- docs/cloud/service-health.mdx:149-150 -->

Persistent non-zero values of this metric are unexpected. <!-- docs/cloud/service-health.mdx:152 -->

## Monitoring Trends Against Limits
<!-- docs/cloud/service-health.mdx:154-186 -->

The limit metrics provide a time series of values for limits. Use these with their corresponding count metrics to monitor general trends against limits and set alerts. Use the corresponding throttle metrics to determine the severity of any active rate limiting. <!-- docs/cloud/service-health.mdx:156-158 -->

### Limit / Count / Throttle Triads
<!-- docs/cloud/service-health.mdx:159-163 -->

| Limit Metric | Count Metric | Throttle Metric |
|---|---|---|
| `temporal_cloud_v1_action_limit` | `temporal_cloud_v1_total_action_count` | `temporal_cloud_v1_total_action_throttled_count` |
| `temporal_cloud_v1_service_request_limit` | `temporal_cloud_v1_service_request_count` | `temporal_cloud_v1_service_request_throttled_count` |
| `temporal_cloud_v1_operations_limit` | `temporal_cloud_v1_operations_count` | `temporal_cloud_v1_operations_throttled_count` |

### On-Demand Envelope Limits
<!-- docs/cloud/service-health.mdx:165-176 -->

For Namespaces using provisioned capacity, the following metrics show what limits would be under on-demand mode. Compare against current provisioned limits to evaluate capacity mode choices: <!-- docs/cloud/service-health.mdx:167-168 -->

| On-Demand Envelope Metric | Equivalent Limit Metric |
|---|---|
| `temporal_cloud_v1_action_on_demand_envelope_limit` | `temporal_cloud_v1_action_limit` |
| `temporal_cloud_v1_operations_on_demand_envelope_limit` | `temporal_cloud_v1_operations_limit` |
| `temporal_cloud_v1_service_request_on_demand_envelope_limit` | `temporal_cloud_v1_service_request_limit` |

For Namespaces already in on-demand mode, these metrics track the same values as their equivalent limit metrics. <!-- docs/cloud/service-health.mdx:176 -->

### Alerting Guidance
<!-- docs/cloud/service-health.mdx:181-186 -->

The limit, throttle, and count metrics are directly comparable as per-second rates. Each `count` metric is a per-second rate averaged over each minute; to get the total count (e.g., of Actions), multiply by 60. <!-- docs/cloud/service-health.mdx:181-182 -->

When setting alerts against limits, consider workload characteristics: <!-- docs/cloud/service-health.mdx:183-186 -->
- **Latency-sensitive workloads:** Alert when `temporal_cloud_v1_total_action_count` reaches 50% of `temporal_cloud_v1_action_limit`.
- **Latency-insensitive workloads:** Alert at 90% of the threshold, or directly when throttling is detected (value greater than zero for `temporal_cloud_v1_total_action_throttled_count`).
- This logic can also be used to automatically scale Temporal Resource Units up or down as needed.
- Some workloads choose to exceed limits and accept throttling because they are not latency sensitive.

A [Grafana dashboard example](https://github.com/grafana/jsonnet-libs/blob/master/temporal-mixin/dashboards/temporal-overview.json) includes a Usage & Quotas section with demo charts for limits and count metrics. <!-- docs/cloud/service-health.mdx:178-179 -->
