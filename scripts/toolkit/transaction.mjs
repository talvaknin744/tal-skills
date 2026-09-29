import fs from 'node:fs';
import crypto from 'node:crypto';
import { MANIFEST, JOURNAL, LOCK, allowedFile, allowedDirectory, verifyInstallPreconditions } from './plan.mjs';
import { contained, inspect, readRegular, parentDirectories, sha256 } from './paths.mjs';

const STAGE = /^\.tal-skills-install-stage-[a-f0-9]{32}$/;
class InterruptedInstall extends Error {}
function flushFile(filename, bytes, mode = 0o600) {
  const descriptor = fs.openSync(filename, 'wx', mode);
  try { fs.writeFileSync(descriptor, bytes); fs.fchmodSync(descriptor, mode); fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
}
function writeJournal(target, journal) {
  const temporary = `${journal.stage}/journal-next`;
  const filename = contained(target, temporary);
  if (inspect(target, temporary)) fs.unlinkSync(filename);
  flushFile(filename, `${JSON.stringify(journal, null, 2)}\n`);
  fs.renameSync(filename, contained(target, JOURNAL));
}
function verifyCurrent(target, entry, expected) {
  const stat = inspect(target, entry.path);
  if (!expected) { if (stat) throw new Error(`Destination changed since planning: ${entry.path}`); return; }
  const current = stat?.isFile() ? readRegular(target, entry.path) : null;
  if (!current || sha256(current.bytes) !== expected.sha256 || current.mode !== expected.mode) throw new Error(`File changed since planning: ${entry.path}`);
}
const identity = data => data ? `${data.sha256}:${data.mode}` : null;
function checkStage(target, journal) {
  if (!inspect(target, journal.stage)) return;
  const expected = new Map();
  for (const [i, entry] of (journal.entries ?? []).entries()) {
    if (entry.before) { expected.set(`before/${i}`, entry.before.sha256); expected.set(`restore-${i}`, entry.before.sha256); }
    if (entry.after) { expected.set(`after/${i}`, entry.after.sha256); expected.set(`replacement-${i}`, entry.after.sha256); }
  }
  if (journal.entries) for (const name of ['link-source', 'link-target']) expected.set(name, sha256('probe'));
  function visit(relative) {
    for (const name of fs.readdirSync(contained(target, relative))) {
      const filename = `${relative}/${name}`, stat = inspect(target, filename), local = filename.slice(journal.stage.length + 1);
      if (stat.isDirectory() && ['before', 'after'].includes(local) && journal.entries) visit(filename);
      else if (stat.isFile() && expected.has(local) && sha256(readRegular(target, filename).bytes) === expected.get(local)) continue;
      else if (stat.isFile() && local === 'journal-next' && journal.entries) {
        let candidate;
        try { candidate = validateJournal(JSON.parse(readRegular(target, filename).bytes.toString()), journal); } catch { throw new Error(`Unexpected staging content: ${filename}`); }
        if (JSON.stringify(candidate.entries) !== JSON.stringify(journal.entries)) throw new Error(`Unexpected staging content: ${filename}`);
      } else throw new Error(`Unexpected staging content: ${filename}`);
    }
  }
  visit(journal.stage);
}
function cleanup(target, journal) {
  checkStage(target, journal);
  if (inspect(target, journal.stage)) fs.rmSync(contained(target, journal.stage), { recursive: true });
  if (inspect(target, JOURNAL)) fs.unlinkSync(contained(target, JOURNAL));
  if (inspect(target, LOCK)) fs.unlinkSync(contained(target, LOCK));
}
function lockRecord(target) {
  const record = JSON.parse(readRegular(target, LOCK).bytes.toString());
  if (record.schema_version !== 1 || record.toolkit !== 'tal-skills' || !STAGE.test(record.stage ?? '') || !Number.isSafeInteger(record.pid) || record.pid < 1) throw new Error('Invalid installation lock');
  if (record.pid !== process.pid) {
    try { process.kill(record.pid, 0); throw new Error('Installation process is still active'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  return record;
}
function validateJournal(value, lock) {
  if (value.schema_version !== 1 || value.toolkit !== 'tal-skills' || value.stage !== lock.stage || !['preparing', 'applying', 'committed'].includes(value.phase) || !Array.isArray(value.entries) || !Array.isArray(value.created_directories) || !Array.isArray(value.removed_directories)) throw new Error('Invalid installation journal');
  const paths = new Set();
  for (const entry of value.entries) {
    if (!allowedFile(entry.path) || paths.has(entry.path)) throw new Error(`Invalid journal destination: ${entry.path}`);
    paths.add(entry.path);
    for (const data of [entry.before, entry.after]) if (data !== null && (!data || !/^[a-f0-9]{64}$/.test(data.sha256 ?? '') || !Number.isInteger(data.mode) || data.mode < 0 || data.mode > 0o777)) throw new Error('Invalid journal image');
  }
  for (const dir of value.created_directories) if (!allowedDirectory(dir)) throw new Error(`Invalid journal directory: ${dir}`);
  for (const dir of value.removed_directories) if (!dir || !allowedDirectory(dir.path) || !Number.isInteger(dir.mode) || dir.mode < 0 || dir.mode > 0o777) throw new Error('Invalid removed journal directory');
  return value;
}
export function recoverInstallation(targetInput) {
  const target = fs.realpathSync(targetInput);
  if (!inspect(target, LOCK)) {
    if (inspect(target, JOURNAL)) throw new Error('Journal exists without a valid installation lock');
    return { recovered: false, target, reason: 'No interrupted installation' };
  }
  const lock = lockRecord(target);
  if (!inspect(target, JOURNAL)) { cleanup(target, lock); return { recovered: true, target, action: 'discarded-preparation' }; }
  const journal = validateJournal(JSON.parse(readRegular(target, JOURNAL).bytes.toString()), lock);
  checkStage(target, journal);
  if (journal.phase === 'preparing' || journal.phase === 'committed') { cleanup(target, journal); return { recovered: true, target, action: journal.phase === 'committed' ? 'finished-cleanup' : 'discarded-preparation' }; }
  // Validate every preimage and every current file before recovery changes anything.
  const removedModes = new Map(journal.removed_directories.map(dir => [dir.path, dir.mode]));
  for (const dir of [...journal.created_directories, ...removedModes.keys()]) {
    const stat = inspect(target, dir);
    if (stat && !stat.isDirectory()) throw new Error(`Recovery directory conflict: ${dir}`);
    if (stat && removedModes.has(dir) && process.platform !== 'win32' && (stat.mode & 0o777) !== removedModes.get(dir)) throw new Error(`Recovery directory mode conflict: ${dir}`);
  }
  for (let i = 0; i < journal.entries.length; i++) {
    const entry = journal.entries[i];
    if (entry.before && sha256(readRegular(target, `${journal.stage}/before/${i}`).bytes) !== entry.before.sha256) throw new Error(`Recovery backup is invalid: ${entry.path}`);
    const stat = inspect(target, entry.path), file = stat?.isFile() ? readRegular(target, entry.path) : null;
    const current = identity(file ? { sha256: sha256(file.bytes), mode: file.mode } : null);
    if (stat && !stat.isFile()) throw new Error(`Recovery conflict: ${entry.path}`);
    const permitted = new Set([identity(entry.before), identity(entry.after)]);
    if (!permitted.has(current)) throw new Error(`Recovery conflict; preserving local changes: ${entry.path}`);
  }
  for (let i = journal.entries.length - 1; i >= 0; i--) {
    const entry = journal.entries[i], stat = inspect(target, entry.path);
    const file = stat ? readRegular(target, entry.path) : null;
    const current = identity(file ? { sha256: sha256(file.bytes), mode: file.mode } : null);
    if (![identity(entry.before), identity(entry.after)].includes(current)) throw new Error(`Recovery conflict; preserving local changes: ${entry.path}`);
    if (current === identity(entry.before)) continue;
    if (!entry.before) fs.unlinkSync(contained(target, entry.path));
    else {
      for (const dir of parentDirectories([entry.path])) if (!inspect(target, dir)) {
        const mode = removedModes.get(dir) ?? 0o755;
        fs.mkdirSync(contained(target, dir), { mode });
        if (removedModes.has(dir)) fs.chmodSync(contained(target, dir), mode);
      }
      const temporary = `${journal.stage}/restore-${i}`;
      if (inspect(target, temporary)) fs.unlinkSync(contained(target, temporary));
      fs.copyFileSync(contained(target, `${journal.stage}/before/${i}`), contained(target, temporary), fs.constants.COPYFILE_EXCL);
      fs.chmodSync(contained(target, temporary), entry.before.mode);
      if (stat) fs.renameSync(contained(target, temporary), contained(target, entry.path));
      else { fs.linkSync(contained(target, temporary), contained(target, entry.path)); fs.unlinkSync(contained(target, temporary)); }
    }
  }
  for (const { path: dir, mode } of [...journal.removed_directories].sort((a, b) => a.path.length - b.path.length)) {
    const stat = inspect(target, dir);
    if (!stat) { fs.mkdirSync(contained(target, dir), { mode }); fs.chmodSync(contained(target, dir), mode); }
    else if (!stat.isDirectory()) throw new Error(`Recovery directory conflict: ${dir}`);
  }
  for (const dir of [...journal.created_directories].sort((a, b) => b.length - a.length)) {
    if (!inspect(target, dir)) continue;
    try { fs.rmdirSync(contained(target, dir)); } catch (error) { if (!['ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error; }
  }
  cleanup(target, journal);
  return { recovered: true, target, action: 'rolled-back' };
}
export function applyInstallPlan(plan, { failAt } = {}) {
  if (plan.conflicts.length) throw new Error(`Installation conflicts: ${plan.conflicts.map(x => `${x.path}: ${x.reason}`).join('; ')}`);
  const { target } = plan;
  for (const name of [LOCK, JOURNAL]) if (inspect(target, name)) throw new Error('Incomplete or active installation; recover first');
  verifyInstallPreconditions(plan);
  for (const entry of plan.operations) verifyCurrent(target, entry, entry.before ? { sha256: sha256(entry.before.bytes), mode: entry.before.mode } : null);
  const changes = plan.operations.filter(entry => entry.action !== 'unchanged');
  if (!changes.length) return { applied: false, changed_files: 0, target };
  const stage = `.tal-skills-install-stage-${crypto.randomUUID().replaceAll('-', '')}`;
  const lock = { schema_version: 1, toolkit: 'tal-skills', pid: process.pid, stage };
  flushFile(contained(target, LOCK), `${JSON.stringify(lock)}\n`);
  let journal;
  try {
    fs.mkdirSync(contained(target, stage), { mode: 0o700 });
    journal = { schema_version: 1, toolkit: 'tal-skills', stage, phase: 'preparing', created_directories: [], removed_directories: [], entries: changes.map(entry => ({ path: entry.path, before: entry.before ? { sha256: sha256(entry.before.bytes), mode: entry.before.mode } : null, after: entry.after ? { sha256: sha256(entry.after.bytes), mode: entry.after.mode } : null })) };
    writeJournal(target, journal);
    fs.mkdirSync(contained(target, `${stage}/before`)); fs.mkdirSync(contained(target, `${stage}/after`));
    for (let i = 0; i < changes.length; i++) for (const side of ['before', 'after']) if (changes[i][side]) {
      const file = changes[i][side]; flushFile(contained(target, `${stage}/${side}/${i}`), file.bytes, file.mode);
      if (sha256(readRegular(target, `${stage}/${side}/${i}`).bytes) !== journal.entries[i][side].sha256) throw new Error('Staging verification failed');
    }
    // Prove exclusive hard-link publication is available before managed writes.
    const probeSource = contained(target, `${stage}/link-source`), probeTarget = contained(target, `${stage}/link-target`);
    flushFile(probeSource, 'probe'); fs.linkSync(probeSource, probeTarget); fs.unlinkSync(probeTarget); fs.unlinkSync(probeSource);
    journal.phase = 'applying'; writeJournal(target, journal);
    if (failAt === 'staged') throw new InterruptedInstall('Simulated interruption: staged');
    for (const { path: dir, present } of plan.directoryPreconditions) {
      const stat = inspect(target, dir);
      if (Boolean(stat) !== present) throw new Error(`Directory changed since planning: ${dir}`);
      if (!stat) {
        journal.created_directories.push(dir); writeJournal(target, journal);
        fs.mkdirSync(contained(target, dir), { mode: 0o755 });
      } else if (!stat.isDirectory()) throw new Error(`Directory changed: ${dir}`);
    }
    const order = changes.map((entry, i) => ({ entry, i })).sort((a, b) => Number(a.entry.path === MANIFEST) - Number(b.entry.path === MANIFEST));
    let written = 0;
    for (const { entry, i } of order) {
      if (entry.path === MANIFEST) {
        for (const dir of plan.removedDirectories ?? []) {
          const stat = inspect(target, dir);
          if (!stat) continue;
          journal.removed_directories.push({ path: dir, mode: stat.mode & 0o777 }); writeJournal(target, journal);
          try { fs.rmdirSync(contained(target, dir)); } catch (error) { if (!['ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error; }
        }
        if (failAt === 'before-manifest') throw new InterruptedInstall('Simulated interruption: before-manifest');
      }
      verifyCurrent(target, entry, journal.entries[i].before);
      if (!entry.after) fs.unlinkSync(contained(target, entry.path));
      else if (!entry.before) fs.linkSync(contained(target, `${stage}/after/${i}`), contained(target, entry.path));
      else {
        const temporary = `${stage}/replacement-${i}`;
        fs.copyFileSync(contained(target, `${stage}/after/${i}`), contained(target, temporary), fs.constants.COPYFILE_EXCL);
        fs.chmodSync(contained(target, temporary), entry.after.mode);
        fs.renameSync(contained(target, temporary), contained(target, entry.path));
      }
      written++;
      if (failAt === `after-write:${written}`) throw new InterruptedInstall(`Simulated interruption: after-write:${written}`);
    }
    journal.phase = 'committed'; writeJournal(target, journal);
    cleanup(target, journal);
    return { applied: true, changed_files: changes.length, target };
  } catch (error) {
    if (error instanceof InterruptedInstall) throw error;
    try { recoverInstallation(target); } catch (recovery) { throw new Error(`${error.message}; recovery requires attention: ${recovery.message}`, { cause: error }); }
    throw error;
  }
}
