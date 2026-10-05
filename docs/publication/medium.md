# A practical engineering toolkit for coding agents

Consider a worker processing a job that takes 24 hours. A deployment replaces
the process after six hours. The new process starts successfully, readiness is
green, and the rollout completes. That still leaves the engineering question:
what happened to the accepted job, its progress, and any effects already committed?

That kind of question shaped [tal-skills](https://github.com/talvaknin744/tal-skills),
the engineering toolkit I’ve been building for coding agents. It currently
contains 49 skills, 15 specialist agents, and eight workflows. The aim is to make
the next decision concrete: establish the contract, locate the failure boundary,
make the scoped change, and check the outcome.

## Keep the task and the coordination small

A skill guides one decision or class of task. A specialist agent takes a bounded
implementation or review question. A workflow coordinates those pieces when a
change crosses boundaries. You can use a skill independently; a small local fix
can keep one owner and a focused check.

For larger changes, the workflow records the objective, scope, invariants,
evidence, and acceptance criteria. Overlapping files have one writer. Independent
reviewers return findings to that owner, who corrects the candidate and reruns
the affected checks. The value is in the questions assigned and the evidence
returned, rather than the number of agents involved.

The skill entrypoints stay short. Conditional references carry the detail needed
for a particular branch. Matt Pocock’s
[Writing for Agents](https://www.aihero.dev/skills-writing-for-agents) influenced
this structure: precise triggers, progressive disclosure, observable completion
criteria, and pruning instructions that do not change useful behavior. The
repository is an independent project and retains attribution for adapted work.

## Work that outlives a deployment

For the long-running worker, I want the agent to separate the logical job from
the process currently executing it. Planned retirement, a business failure, and
an uncertain external effect need distinct outcomes. A process restarting should
not silently spend the job’s business-failure budget.

The worker rollout path asks how admission closes, who owns continuation, whether
a successor can read the retained input and checkpoint, and what stops a stale
executor from writing after takeover. It also keeps operational retirement
responsibility visible when old jobs outlive rollout completion.

The repository includes a
[process-and-database example](https://github.com/talvaknin744/tal-skills/tree/main/examples/draining)
with short controlled handoffs and a crash between effect commit and checkpoint
publication. Its recorded checks demonstrate those local transitions. They do
not establish 24-hour operation or Kubernetes rollout behavior. Keeping that
boundary visible makes the example useful when planning the corresponding checks
in an actual service.

## Late events, duplicates, and stale cache fills

Messaging work needs several identities and time boundaries. Two deliveries can
refer to one business operation. An older complete-state snapshot can be safely
superseded under a revision contract, while an older delta may still represent
required work. Event time, arrival time, corrections, and retained state answer
different questions.

The new stream-processing skill asks which time domain governs the result, what
a duplicate means, when a window becomes final, and how corrections affect both
their old and new destinations. It keeps operator contributions separate from
external business effects. A replay-safe aggregate does not by itself make a
payment or notification safe to repeat.

Cache correctness has another useful counterexample: a read starts at revision
1, a writer commits revision 2, and the delayed read later fills the cache with
revision 1. A client-side check followed by a separate write can race too. The
[cache example](https://github.com/talvaknin744/tal-skills/tree/main/examples/cache)
forces these orderings and tests an atomic publication rule with retained
revision metadata. It also shows why losing that metadata or applying snapshot
rules to deltas changes the contract.

## Count retries across the whole path

Retry coordination is a recent addition prompted by
[Uber’s engineering account](https://www.uber.com/us/en/blog/protecting-against-retry-storms/).
A quota at one layer can still leave several ancestors independently retrying
the same failure. Error ownership can coordinate their existing opportunities,
provided attribution and metadata are reliable.

The reference preserves a critical exception: when the closest caller has no
eligible retry policy, suppressing every ancestor can remove all configured
retry opportunities. Ownership permission also remains separate from
idempotency, deadlines, admission, and an uncertain remote effect.

The local example makes the multiplication visible. With three retrying edges
and two total attempts at each edge, persistent leaf failure produces eight
leaf calls. The coordinated history produces two. Missing context leaves a
larger residual count. Those are observations of a finite custom HTTP model;
they are not a reproduction of Uber’s infrastructure or evidence about production
overload recovery.

## Performance needs several distinct questions

The six performance packages sharpen the decision before choosing a tool:

| Question | Skill |
| --- | --- |
| Where does useful work execute or wait? | Performance diagnosis |
| Which work should enter when capacity is exhausted? | Overload control |
| Did the generator deliver representative demand? | Load testing |
| What capacity remains during growth, failure, and recovery? | Capacity planning |
| Is the delay in a plan, lock, pool, or transaction lifetime? | Database performance |
| Does a measured Go or Python hot path justify a layout change? | Data-layout performance |

A configured request rate is different from delivered traffic. A lower latency
percentile can hide rejected work. More replicas can increase pressure on a
shared dependency. A faster inner loop may have little effect on the service’s
critical path. Each skill asks for the evidence needed to resolve its question
while preserving the relevant correctness contract.

## Make the evidence inspectable

The 1 October research pass revisits 60 engineering publishers, indexes 58,178
normalized metadata records, and records 29 selected substantive article readings.
The archive keeps missing history, access limits, unknown dates, and per-article
reading scope explicit. Indexing an article URL does not mean its body was read,
and a publisher’s production result is not a benchmark for this toolkit.

Repository validation, local runtime experiments, and agent trials have separate
records. Checks of packaging and source hashes can establish that artifacts fit
together; they cannot establish the quality of an agent’s decisions. The
[research ledger](https://github.com/talvaknin744/tal-skills/tree/main/docs/research/engineering-toolkit)
and example reports preserve those distinctions.

## Start with the relevant skill

The skill catalog is available through the
[skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add talvaknin744/tal-skills
```

In an interactive terminal, choose the skills and installation targets relevant
to your project. The
[README](https://github.com/talvaknin744/tal-skills#readme) explains the specialist
roster, workflow installation, and host limitations.

My preferred first use is one concrete task: review a worker rollout, reconstruct
a stale-cache race, or explain why a load-test result is misleading. Keep the
project’s acceptance criteria and inspect the evidence the agent returns.
