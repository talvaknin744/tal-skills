import type { Readable, Writable } from 'node:stream';

export interface ExportOptions {
  signal?: AbortSignal;
}

export async function exportRecords(
  source: Readable,
  destination: Writable,
  options: ExportOptions = {},
): Promise<void> {
  for await (const record of source) {
    destination.write(record);
  }
  destination.end();
}
