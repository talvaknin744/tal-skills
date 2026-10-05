I’m sharing tal-skills, a practical engineering toolkit for coding agents:
49 skills, 15 specialist agents, and eight workflows.

I built it around problems that need more than a plausible code change:

- A deployment finishes while a long-running job still needs to continue.
- A message arrives twice, late, or after a newer revision.
- A delayed cache fill tries to overwrite newer data.
- Retries at several layers multiply calls to an already failing dependency.

The skills ask for the relevant contract, concrete failure history, and an
observable check. Workflows give overlapping files one owner and send independent
review findings back to that owner.

Six performance skills separate diagnosis, overload control, load testing,
capacity planning, database work, and measured data-layout changes. A fast
benchmark and useful service capacity need different evidence.

The latest research pass indexes 58,178 metadata records across 60 publishers
and records 29 selected substantive article readings. Those counts are separate,
and archive gaps stay visible. Runnable examples also state what their local
results establish.

Matt Pocock’s [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents)
influenced the instruction design. This is an independent project.

Start with the skills you need:

```sh
npx skills@latest add talvaknin744/tal-skills
```

The command opens interactive selection. The
[repository](https://github.com/talvaknin744/tal-skills) explains the agent and
workflow paths. I’d welcome concrete failure cases and feedback from using it
on real projects.
