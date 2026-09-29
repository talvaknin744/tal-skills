import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, chmod } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  REPO, SKILLS, sha256, treeDigest, inventory, copySnapshot, freezeCandidates, prepareTrial,
  nativeArguments, parseEvents, fileChanges, acquireSlot, captureProcess,
  runTrial, scoringInputs, validateScore, assertSealedEvidence, requireIndependentVerification, verifyTrial,
} from '../../scripts/evals/lib.mjs';

async function scratch(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tal-eval-unit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function syntheticRepo(t, implementation = false) {
  const base = await scratch(t);
  const repo = path.join(base, 'repo');
  await mkdir(repo);
  await copySnapshot(path.join(REPO, 'scripts/evals'), path.join(repo, 'scripts/evals'), await inventory(path.join(REPO, 'scripts/evals')));
  for (const filename of ['package.json', 'package-lock.json']) await writeFile(path.join(repo, filename), await readFile(path.join(REPO, filename)));
  for (const [skill, relative] of Object.entries(SKILLS)) {
    await mkdir(path.join(repo, relative, 'references'), { recursive: true });
    await writeFile(path.join(repo, relative, 'SKILL.md'), `---\nname: ${skill}\ndescription: Handle the relevant synthetic engineering task.\n---\n# Candidate ${skill}\nRead the supplied project and report its concrete observations.\n`);
    await writeFile(path.join(repo, relative, 'references', 'details.md'), 'Conditional detail belongs to the complete package snapshot.\n');
    const fixture = `evals/${skill}/fixtures/review`;
    await mkdir(path.join(repo, fixture), { recursive: true });
    await writeFile(path.join(repo, fixture, 'request.md'), 'Please review this synthetic project and report a bounded observation.\n');
    const item = {
      id: 'review', prompt: 'Review the supplied synthetic request without changing any files.', fixture_dir: fixture,
      fixtures: ['request.md'], task_mode: 'review', activation: 'activate', capabilities: { commands: true, web: false, subagents: false },
      rubric: [{ id: 'scope', severity: 'critical', criterion: 'Respect the observed task boundary and leave the project unchanged.' }],
    };
    await writeFile(path.join(repo, 'evals', skill, 'cases.json'), JSON.stringify({ format_version: 1, cases: [item] }));
  }
  if (implementation) {
    const corpusPath = path.join(repo, 'evals/python-backend/cases.json');
    const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
    Object.assign(corpus.cases[0], { task_mode: 'implementation', editable_files: ['request.md'], verification_argv: [process.execPath, 'verify.mjs'], fixtures: ['request.md', 'verify.mjs'] });
    await writeFile(corpusPath, JSON.stringify(corpus));
    await writeFile(path.join(repo, corpus.cases[0].fixture_dir, 'verify.mjs'), "import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs'; assert.equal(readFileSync('request.md','utf8'),'verified final input'); console.log('PASS supplied verifier');\n");
  }
  const freezePath = path.join(base, 'freeze.json');
  await writeFile(freezePath, JSON.stringify(await freezeCandidates(repo)));
  return { base, repo, freezePath };
}
async function stage(t) {
  const state = await syntheticRepo(t);
  return { ...state, ...await prepareTrial({ ...state, skill: 'python-backend', caseId: 'review', destination: path.join(state.base, 'trial') }) };
}
async function fakeHost(base, body = '') {
  const filename = path.join(base, 'fake-host');
  await writeFile(filename, `#!${process.execPath}
if (process.argv.includes('--version')) { console.log('synthetic-host 1'); process.exit(0); }
if (process.argv.includes('app-server')) {
 const fs = require('node:fs'), path = require('node:path');
 require('node:readline').createInterface({input:process.stdin}).on('line', line => {
  const request=JSON.parse(line); if(!request.id)return;
  let result={};
  if(request.method==='skills/list') {
   const base=path.join(process.cwd(),'.agents/skills');
   result={data:[{skills:fs.readdirSync(base).map(name=>({name,description:'Handle the relevant synthetic engineering task.',path:path.join(base,name,'SKILL.md'),enabled:true,scope:'repo'})),errors:[]}]};
  }
  if(request.method==='config/read')result={config:{model:'synthetic-inherited',model_reasoning_effort:'synthetic',sandbox_mode:'read-only',approval_policy:'never',agents:{enabled:false}}};
  console.log(JSON.stringify({id:request.id,result}));
 });
} else {
 ${body}
 console.log(JSON.stringify({type:'item.completed',item:{id:'m',type:'agent_message',text:'Observed answer.'}}));
 console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:3,output_tokens:2}}));
}
`);
  await chmod(filename, 0o755);
  return filename;
}

test('snapshot identity covers content, added files and executable modes', async t => {
  const root = await scratch(t);
  await writeFile(path.join(root, 'a'), 'one');
  const before = await inventory(root);
  await chmod(path.join(root, 'a'), 0o755);
  assert.notEqual(treeDigest(before), treeDigest(await inventory(root)));
  await writeFile(path.join(root, 'b'), 'two');
  assert.equal(fileChanges(before, await inventory(root)).length, 2);
});
test('snapshot refuses symlinks, including links outside the source', async t => {
  const root = await scratch(t);
  await symlink('/etc/hosts', path.join(root, 'escape'));
  await assert.rejects(inventory(root), /Symlink/);
});
test('copy detects source mutation after inventory', async t => {
  const root = await scratch(t); const source = path.join(root, 'source'); await mkdir(source);
  await writeFile(path.join(source, 'a'), 'before'); const records = await inventory(source);
  await writeFile(path.join(source, 'a'), 'after');
  await assert.rejects(copySnapshot(source, path.join(root, 'copy'), records), /changed/);
});
test('staging exposes complete package and fixture without rubric or body prompt', async t => {
  const state = await stage(t);
  const files = await inventory(state.workspace);
  assert.ok(files.some(entry => entry.path === '.agents/skills/python-backend/references/details.md'));
  assert.equal(files.some(entry => /cases\.json|rubric|control|score/.test(entry.path)), false);
  const prompt = await readFile(path.join(state.trial, 'evidence', 'prompt.txt'), 'utf8');
  assert.equal(prompt.includes('Candidate python-backend'), false);
  assert.equal(state.run.case_compliant, false);
  assert.equal(state.run.filesystem_read_isolation, false);
});
test('post-freeze package or case mutation prevents staging', async t => {
  const state = await syntheticRepo(t);
  await writeFile(path.join(state.repo, SKILLS['python-backend'], 'references/details.md'), 'changed');
  await assert.rejects(prepareTrial({ ...state, skill: 'python-backend', caseId: 'review', destination: path.join(state.base, 'trial') }), /changed after freeze/);
});
test('natural native arguments preserve models and disable only child delegation', () => {
  const args = nativeArguments('/tmp/project space', 'Explain $(literal) safely.', 'implementation');
  assert.ok(args.includes('--ephemeral') && args.includes('--json'));
  assert.ok(args.includes('workspace-write') && args.includes('agents.enabled=false'));
  assert.equal(args.some(value => value === '--model' || /^model=|reasoning/.test(value)), false);
  assert.ok(args.at(-1).includes('$(literal)'));
  assert.equal(args.includes('--resume'), false);
});
test('read observation requires a successful tool result containing source body', () => {
  const body = '---\nname: sample\n---\n# Actual skill body\nThis source text must be present in the successful recorded read result.\n';
  const events = [
    { type: 'item.completed', item: { id: 'c', type: 'command_execution', command: 'cat .agents/skills/sample/SKILL.md', aggregated_output: body, exit_code: 0 } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Answer' } },
    { type: 'turn.completed', usage: { output_tokens: 5 } },
  ];
  const parsed = parseEvents(events.map(JSON.stringify).join('\n'), 'sample', body);
  assert.equal(parsed.activation_observation.status, 'body_read_observed');
  events[0].item.aggregated_output = 'I read sample/SKILL.md';
  assert.equal(parseEvents(events.map(JSON.stringify).join('\n'), 'sample', body).activation_observation.status, 'not_observed');
  assert.equal(parseEvents('bad JSON\n', 'sample').parseErrors.length, 1);
});
test('dry run never starts even a missing native executable', async t => {
  const state = await stage(t);
  const result = await runTrial({ trial: state.trial, binary: '/no/such/executable' });
  assert.equal(result.execution_status, 'dry_run');
  assert.equal(JSON.parse(await readFile(path.join(state.trial, 'evidence/run.json'))).execution_status, 'prepared');
});
test('execution records fake-host evidence without automatically grading', async t => {
  const state = await stage(t);
  const binary = await fakeHost(state.base);
  const result = await runTrial({ trial: state.trial, binary, execute: true, slotsPath: path.join(state.base, 'slots') });
  assert.equal(result.execution_status, 'completed');
  assert.equal(result.rubric_result, 'unscored');
  assert.equal(result.model, 'synthetic-inherited');
  assert.equal(result.skill_discovery.candidate_metadata_observed, true);
  assert.equal(result.prompt_sha256, sha256((await readFile(path.join(state.trial, 'evidence/prompt.txt'), 'utf8')).replace(/\n$/, '')));
  assert.equal(result.command_argv.at(-1), (await readFile(path.join(state.trial, 'evidence/prompt.txt'), 'utf8')).replace(/\n$/, ''));
  assert.equal(result.input_integrity.baseline_unchanged, true);
  assert.equal(result.input_integrity.allowed_changes_only, true);
  assert.equal(result.token_usage.output_tokens, 2);
  await assert.rejects(runTrial({ trial: state.trial, binary, execute: true }), /only once/);
  const scorer = path.join(state.base, 'scorer');
  await scoringInputs({ trial: state.trial, destination: scorer });
  const score = JSON.parse(await readFile(path.join(scorer, 'score-template.json')));
  assert.equal(score.candidate_tree_sha256, result.candidate_tree_sha256);
  assert.equal(score.criteria[0].score, null);
});
test('protected-file changes remain visible in completed process evidence', async t => {
  const state = await stage(t);
  const binary = await fakeHost(state.base, "require('node:fs').writeFileSync('project/request.md','changed');");
  const result = await runTrial({ trial: state.trial, binary, execute: true, slotsPath: path.join(state.base, 'slots') });
  assert.equal(result.input_integrity.allowed_changes_only, false);
  assert.deepEqual(result.input_integrity.forbidden_changes, ['project/request.md']);
});
test('timeout is preserved and process output is captured', async () => {
  const result = await captureProcess(process.execPath, ['-e', "console.log('started'); setInterval(()=>{},1000)"], { timeoutMs: 100, killGraceMs: 50 });
  assert.equal(result.timed_out, true);
  assert.match(result.stdout, /started/);
  assert.notEqual(result.exit_code, 0);
});
test('two-slot limiter rejects an unscheduled third native process', async t => {
  const root = await scratch(t);
  const first = await acquireSlot(root), second = await acquireSlot(root);
  await assert.rejects(acquireSlot(root), /Both native/);
  await first(); const third = await acquireSlot(root); await second(); await third();
});
test('independent scores require complete criteria and exact candidate binding', () => {
  const rubric = [{ id: 'effect', severity: 'critical' }, { id: 'clarity', severity: 'major' }];
  const score = { reviewer: 'independent-7', candidate_tree_sha256: sha256('candidate'), independence: { authored_candidate: false, authored_response: false }, criteria: rubric.map(rule => ({ id: rule.id, score: 2, evidence: { artifact: 'answer.md', observation: 'Observed at line 3' } })) };
  assert.equal(validateScore(score, rubric, { candidate_tree_sha256: score.candidate_tree_sha256 }).rubric_result, 'pass');
  assert.throws(() => validateScore(score, rubric, { candidate_tree_sha256: sha256('other') }), /binding mismatch/);
  score.criteria[0].score = 0;
  assert.equal(validateScore(score, rubric).rubric_result, 'fail');
  score.independence.authored_candidate = true;
  assert.throws(() => validateScore(score, rubric), /independent scoring/);
});

test('post-run answer replacement cannot enter a scoring package', async t => {
  const state = await stage(t);
  await runTrial({ trial: state.trial, binary: await fakeHost(state.base), execute: true, slotsPath: path.join(state.base, 'slots') });
  await writeFile(path.join(state.trial, 'evidence/answer.md'), 'A substituted answer');
  await assert.rejects(scoringInputs({ trial: state.trial, destination: path.join(state.base, 'scorer') }), /evidence changed/);
});
test('post-run editable-project substitution is detected before verification or scoring', async t => {
  const state = await stage(t);
  const run = await runTrial({ trial: state.trial, binary: await fakeHost(state.base), execute: true, slotsPath: path.join(state.base, 'slots') });
  await writeFile(path.join(state.workspace, 'project/request.md'), 'A substituted project');
  await assert.rejects(assertSealedEvidence(state.trial, run), /workspace changed/);
});
test('grade gates reject blocked runs, invalid input scope and substituted rubrics', () => {
  const rubric = [{ id: 'effect', severity: 'critical' }];
  const score = { reviewer: 'reviewer', independence: { authored_candidate: false, authored_response: false }, criteria: [{ id: 'effect', score: 2, evidence: { artifact: 'answer.md', observation: 'Evidence' } }] };
  assert.throws(() => validateScore(score, rubric, { execution_status: 'blocked' }), /not eligible/);
  assert.throws(() => validateScore(score, rubric, { input_integrity: { allowed_changes_only: false, baseline_unchanged: true } }), /integrity failed/);
  assert.throws(() => validateScore(score, rubric, { rubric_sha256: sha256('different rubric') }), /rubric content/);
});

test('an implementation pass needs a successful independent check on the final snapshot', async t => {
  const state = await stage(t);
  const run = await runTrial({ trial: state.trial, binary: await fakeHost(state.base), execute: true, slotsPath: path.join(state.base, 'slots') });
  const requiring = { ...run, verification_argv: ['node', 'verify.mjs'] };
  await assert.rejects(requireIndependentVerification(state.trial, requiring), /requires a successful/);
  await mkdir(path.join(state.trial, 'evidence/checks'));
  await writeFile(path.join(state.trial, 'evidence/checks.json'), JSON.stringify({checks:[{
    kind:'independent_execution_of_supplied_verifier',run_id:run.run_id,run_evidence_sha256:run.run_evidence_sha256,
    executed:true,exit_code:1,timed_out:false,status:'fail',fixture_input_tree_sha256:treeDigest(await inventory(path.join(state.workspace,'project'))),command_argv:requiring.verification_argv,
  }]}));
  await assert.rejects(requireIndependentVerification(state.trial, requiring), /No successful independent/);
});

test('independent verifier runs a fresh final-project copy and seals its actual streams', async t => {
  const source = await syntheticRepo(t, true);
  const state = { ...source, ...await prepareTrial({ ...source, skill:'python-backend', caseId:'review', destination:path.join(source.base,'trial') }) };
  const binary = await fakeHost(state.base, "require('node:fs').writeFileSync('project/request.md','verified final input');");
  const run = await runTrial({trial:state.trial,binary,execute:true,slotsPath:path.join(state.base,'slots')});
  await assert.rejects(requireIndependentVerification(state.trial,run), /requires a successful/);
  const check = await verifyTrial({trial:state.trial,checkId:'reviewer-01'});
  assert.equal(check.status,'pass');
  assert.equal(check.run_evidence_sha256,run.run_evidence_sha256);
  await assertSealedEvidence(state.trial,run);
  assert.equal((await requireIndependentVerification(state.trial,run)).check_id,'reviewer-01');
  await writeFile(path.join(state.trial,'evidence',check.stdout),'substituted check output');
  await assert.rejects(assertSealedEvidence(state.trial,run), /verification stream changed/);
});

test('owned descendants are stopped even when their leader closes its pipes', { skip: process.platform === 'win32' }, async t => {
  const root = await scratch(t);
  const heartbeat = path.join(root, 'heartbeat');
  await writeFile(heartbeat, '');
  const grandchild = `const fs=require('node:fs');setInterval(()=>fs.appendFileSync(${JSON.stringify(heartbeat)},'x'),10);`;
  const leader = `const {spawn}=require('node:child_process');spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});setTimeout(()=>process.exit(0),50);`;
  const result = await captureProcess(process.execPath, ['-e', leader], { timeoutMs: 2000, killGraceMs: 50 });
  assert.equal(result.exit_code, 0);
  assert.equal(result.owned_group_cleanup, 'owned_group_signaled_term_then_kill');
  const stopped = await readFile(heartbeat, 'utf8');
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(await readFile(heartbeat, 'utf8'), stopped);
});
