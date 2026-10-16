# Sources and scope

Reviewed 2026-10-14. Guidance and synthetic cases are independently authored
synthesis. These readings support evaluation distinctions, not a required vendor,
benchmark size, tool sequence or production guarantee. No linked source authorizes
external actions, exposes hidden reasoning or establishes results for this package.

| Source | Reading scope and basis | Limits |
| --- | --- | --- |
| [Anthropic, Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 2026-01-09 | Complete main article prose and code examples from introduction through evaluation roadmap and holistic methods. Task versus trial, authoritative outcome versus response, clean state, calibrated criterion graders, capability versus regression and repeated success events | Diagrams not visually inspected, linked benchmarks and SDK examples not executed. The article's sample task counts and reported benchmark scores are not package requirements |
| [NVIDIA, Mastering Agentic Techniques: AI Agent Evaluation](https://developer.nvidia.com/blog/mastering-agentic-techniques-ai-agent-evaluation/), 2026-05-19 | Complete authored body from model versus agent evaluation through Get started, table and text captions, using the archived primary body. Intent with constraints, scenario segmentation, observable tool behavior and effort per successful task | Excludes separately labeled generated summary, author bios and linked sessions. Figures not visually inspected. A model benchmark score is not adopted as a prerequisite for task reliability |
| [OpenAI, Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills), 2026-01-22 | Complete authored body, sections 1 through 8 and shown code. Success before instructions, observable captured events, targeted deterministic checks, separate rubric grading and positive versus negative invocation prompts | Example harness, CLI and output schema not executed. Version dependent host commands are omitted from this vendor independent package |
| [Hugging Face, Is it agentic enough?](https://huggingface.co/blog/is-it-agentic-enough), 2026-06-18 | Complete authored body and shown snippets through Closing and acknowledgements. Shared task coverage, isolated intended comparison variable, empty run errors and separating adoption markers from correctness and effort | Charts not visually inspected, linked live report and harness not executed. Reported performance and context tiers concern that experiment, not guaranteed effects of skills on other models |

The local evaluation contract also requires preservation, separate capability and
regression results, independent scoring and honest host coverage. This skill
generalizes those evidence practices without embedding repository development
commands or adopting its numerical activation threshold as a universal rule.
