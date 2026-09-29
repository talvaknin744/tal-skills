# Calendar label

This project formats calendar labels using the JavaScript Temporal date API.
It has no Temporal Workflow service, worker, task queue, or durable execution.
The runtime provides Temporal.PlainDate. The input is an ISO calendar date
without a time or timezone. Required output is DD/MM/YYYY with two-digit day
and month; e.g. 2026-03-07 becomes 07/03/2026.

Review the formatter's output order and zero padding only. Do not install a
polyfill, change files, or propose a workflow platform.
