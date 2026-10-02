export class LabelService {
  constructor(database, cache) {
    this.database = database;
    this.cache = cache;
  }

  async read(id) {
    const cached = await this.cache.get(id);
    if (cached) return cached;
    const record = await this.database.read(id);
    await this.cache.publishIfFresh(id, record);
    return record;
  }

  async write(id, label) {
    const record = await this.database.write(id, label);
    await this.cache.publishIfFresh(id, record);
    return record;
  }
}
