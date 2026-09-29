import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownTargets } from '../scripts/lib/markdown-links.mjs';

test('prose links remain checked around a Go code example', () => {
  const document = '[Before](references/before.md)\n```go\ncompensations[i](compCtx)\n```\n[After](references/after.md)';
  assert.deepEqual(markdownTargets(document), ['references/before.md', 'references/after.md']);
});

test('tilde fences do not hide subsequent broken resource references', () => {
  assert.deepEqual(markdownTargets('~~~js\n[value](not-a-link)\n~~~\n[Missing](missing.md)'), ['missing.md']);
});

test('a shorter nested fence stays inside the outer code example', () => {
  assert.deepEqual(markdownTargets('````md\n```go\n[i](ctx)\n```\n````\n[Guide](guide.md)'), ['guide.md']);
});

test('ordinary links and images retain their resource targets', () => {
  assert.deepEqual(markdownTargets('[Docs](https://docs.temporal.io)\n![Diagram](assets/flow.svg "Flow")\n[Section](#scope)'),
    ['https://docs.temporal.io', 'assets/flow.svg', '#scope']);
});
