# Read-only status client

GET /status returns a public health snapshot. It has no side effects, including
no analytics counter, billable action, or queue insertion. The client retries
only 503 responses. `fetchImpl` and `sleep` are passed in for testing. The
expected delays are 100ms after the first 503 and 200ms after the second, with
no sleep after the third and final request. Other HTTP statuses return
immediately. This task concerns only the loop's attempt and delay behavior.
