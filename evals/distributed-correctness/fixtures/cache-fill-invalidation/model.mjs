const copy = value => value === undefined ? undefined : structuredClone(value);

export function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

export class Database {
  constructor(records) {
    this.records = new Map(records.map(record => [record.id, copy(record)]));
    this.readCount = 0;
    this.nextReadGate = undefined;
  }

  pauseNextRead() {
    const captured = deferred();
    const resume = deferred();
    this.nextReadGate = { captured, resume };
    return { captured: captured.promise, release: () => resume.resolve() };
  }

  async read(id) {
    this.readCount++;
    const record = copy(this.records.get(id));
    if (!record) throw new Error(`Unknown account: ${id}`);
    const gate = this.nextReadGate;
    this.nextReadGate = undefined;
    if (gate) {
      gate.captured.resolve();
      await gate.resume.promise;
    }
    return record;
  }

  async write(id, label) {
    const previous = this.records.get(id);
    if (!previous) throw new Error(`Unknown account: ${id}`);
    const record = { id, label, revision: previous.revision + 1 };
    this.records.set(id, record);
    return copy(record);
  }
}

export class Cache {
  constructor() {
    this.values = new Map();
    this.floors = new Map();
  }

  async get(id) { return copy(this.values.get(id)); }
  async set(id, record) { this.values.set(id, copy(record)); }
  async delete(id) { this.values.delete(id); }
  async evict(id) { this.values.delete(id); }

  async advanceFloor(id, revision) {
    const floor = Math.max(this.floors.get(id) ?? 0, revision);
    this.floors.set(id, floor);
    if ((this.values.get(id)?.revision ?? Infinity) < floor) this.values.delete(id);
  }

  async publishIfFresh(id, record) {
    const floor = Math.max(this.floors.get(id) ?? 0, this.values.get(id)?.revision ?? 0);
    if (record.revision < floor) return false;
    this.floors.set(id, record.revision);
    this.values.set(id, copy(record));
    return true;
  }
}
