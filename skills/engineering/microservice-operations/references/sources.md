# Source basis

This is an original operational workflow informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*, first and second editions. The numbered procedure, completion criteria, execution boundaries, and verification requirements are original synthesis, not quoted book instructions.

User-supplied sources:

- [First edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf)
- [Second edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf)

PDF page numbers are one-based positions from the start of each supplied file. The second edition is a 754-page reflowed PDF, so these are not its print page numbers.

| Workflow concept | Verified first-edition locator | Verified second-edition locator |
| --- | --- | --- |
| Artifact promotion and configuration | Ch. 6, “Build Pipelines and Continuous Delivery,” PDF 127 (print 107); “Service Configuration,” PDF 135 (print 115) | Ch. 8, “Environments,” PDF 288; “Zero-Downtime Deployment,” PDF 296; “Separating Deployment from Release,” PDF 342; “Canary Release,” PDF 344 |
| User outcomes and cross-service diagnosis | Ch. 8, “Service Metrics,” “Synthetic Monitoring,” “Implementing Semantic Monitoring,” “Correlation IDs,” PDF 180–183 (print 160–163) | Ch. 10, “Distributed Tracing,” PDF 407–409; “Are We Doing OK?”, PDF 410–412; “Toward better alerting,” “Semantic Monitoring,” PDF 416–417 |
| Failure containment | Ch. 11, “Degrading Functionality,” PDF 227 (print 207); “Timeouts,” “Circuit Breakers,” “Bulkheads,” “Isolation,” “Idempotency,” PDF 231–235 (print 211–215) | Ch. 12, “Time-Outs,” “Retries,” “Bulkheads,” “Circuit Breakers,” PDF 493–500; “Isolation,” “Middleware,” “Idempotency,” “Spreading Your Risk,” PDF 501–505 |
| Trust and data handling | Ch. 9, “Fine-Grained Authorization,” PDF 192 (print 172); “The Deputy Problem,” PDF 198–199 (print 178–179); “It's All About the Keys,” “Encrypt Backups,” PDF 201 (print 181); “Be Frugal,” PDF 206 (print 186) | Ch. 11, “Principle of Least Privilege,” PDF 433; “Rotation,” “Revocation,” PDF 444–445; “Implicit Trust Versus Zero Trust,” PDF 455–456 |
| Capacity and cache trade-offs | Ch. 11, “Worker-Based Systems,” PDF 240 (print 220); “Caching,” PDF 245 (print 225); “Caching for Writes,” “Caching for Resilience,” “Hiding the Origin,” PDF 248 (print 228) | Ch. 13, “The Four Axes of Scaling,” PDF 520–521; “Horizontal Duplication,” PDF 524; “Data Partitioning,” PDF 528–533; “For Scale,” “For Robustness,” PDF 541; “Invalidation,” PDF 548; “Write-behind,” “The Golden Rule of Caching,” PDF 552–553; “Autoscaling,” PDF 556 |

The books provide the architectural trade-offs. This skill adds an actionable evidence workflow and combines related concerns around a scoped change. Product choices, example timeout values, historical security recipes, and vendor capabilities are deliberately not carried forward; use current primary documentation for implementation-specific claims.
