import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export function createFixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tal toolkit-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'source'), target = path.join(directory, 'target ü');
  fs.mkdirSync(source); fs.mkdirSync(target);
  const write = (relative, text) => { const f = path.join(source, relative); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
  write('skills/languages/python-backend/SKILL.md', '---\nname: python-backend\ndescription: Implement Python backend changes.\n---\nRead [details](references/details.md).\n');
  write('skills/languages/python-backend/references/details.md', '# Details\nUse the project conventions.\n');
  write('skills/languages/python-backend/LICENSE', 'MIT\n');
  write('agents/CONTRACT.md', '# Contract\nReport changes, checks, findings and limits.\n');
  write('agents/languages/tal-python.md', '---\nschema_version: 1\nname: tal-python\ndescription: Python implementation and review.\nskills:\n  - python-backend\n---\nImplement the assigned Python work.\n');
  write('workflows/_shared/handoff.md', '# Handoff\nRead [contract](../../agents/CONTRACT.md).\n');
  write('workflows/tal-backend-delivery/WORKFLOW.md', '---\nschema_version: 1\nname: tal-backend-delivery\ndescription: Deliver a backend change.\nagents:\n  - tal-python\nskills: []\n---\nUse the [handoff](../_shared/handoff.md), implement and verify.\n');
  return { directory, source, target, write, read: relative => fs.readFileSync(path.join(target, relative), 'utf8') };
}
