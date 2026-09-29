# Source basis

This is an original engineering workflow informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*, first and second editions. It is not a chapter summary. The ordered steps, risk map, completion criteria, authorization boundaries, and evidence-reporting format are original synthesis.

User-supplied sources:

- [First edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf)
- [Second edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf)

PDF page numbers below count from the first PDF page, starting at 1. The supplied second edition is a 754-page reflowed PDF; its PDF positions are not print page numbers.

| Workflow concept | Verified first-edition locator | Verified second-edition locator |
| --- | --- | --- |
| Test boundaries and feedback | Ch. 7, “Unit Tests,” “Service Tests,” “Trade-Offs,” “How Many?”, PDF 154–156 (print 134–136) | Ch. 9, “Service Tests,” “What About Integration Tests?”, “Trade-Offs,” PDF 355–358 |
| Controlled dependencies | Ch. 7, “Implementing Service Tests,” “Mocking or Stubbing,” PDF 156–157 (print 136–137) | Ch. 9, “Implementing Service Tests,” PDF 358–360 |
| Broad-suite cost and independent delivery | Ch. 7, “Flaky and Brittle Tests,” “The Great Pile-up,” “The Metaversion,” “Test Journeys, Not Stories,” PDF 160–163 (print 140–143) | Ch. 9, “The Metaversion,” “Lack of Independent Testability,” “Should You Avoid End-to-End Tests?”, PDF 367–369 |
| Consumer expectations and verification | Ch. 7, “Consumer-Driven Tests to the Rescue,” PDF 164–165 (print 144–145) | Ch. 9, “Contract Tests and Consumer-Driven Contracts (CDCs),” “It's about conversations,” PDF 369–372 |
| Cross-functional and live-system evidence | Ch. 7, “Cross-Functional Testing,” “Performance Tests,” PDF 171–172 (print 151–152); Ch. 8, “Implementing Semantic Monitoring,” PDF 182 (print 162) | Ch. 9, “From Preproduction to In-Production Testing,” “Making Testing in Production Safe,” PDF 375–377; “Cross-Functional Testing,” “Performance Tests,” “Robustness Tests,” PDF 378–381 |

The books support balancing scope against feedback, testing a service in isolation, consumer expectations as executable compatibility checks, and measuring qualities beyond functionality. Specific contemporary framework APIs and provider guarantees must be verified from the project's versions and current primary documentation when implementing; historical tooling examples are not prescriptions.
