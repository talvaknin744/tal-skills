import type { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface ExportOptions {
  signal?: AbortSignal;
}

async function closeOwnedStream(stream: Readable | Writable): Promise<void> {
  if (stream.closed) return;

  await new Promise<void>(resolve => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const complete = () => {
      clearTimeout(timer);
      stream.off('close', complete);
      resolve();
    };
    const checkClosed = () => {
      if (stream.closed) complete();
      else timer = setTimeout(checkClosed, 10);
    };

    // Own teardown even with autoDestroy:false. The event handles ordinary
    // streams promptly; .closed also observes cleanup with emitClose:false.
    stream.once('close', complete);
    stream.destroy();
    checkClosed();
  });
}

export async function exportRecords(
  source: Readable,
  destination: Writable,
  options: ExportOptions = {},
): Promise<void> {
  try {
    await pipeline(source, destination, { signal: options.signal });
  } finally {
    // Destruction starts cleanup; wait for both _destroy callbacks to finish.
    await Promise.all([closeOwnedStream(source), closeOwnedStream(destination)]);
  }

  // The pipeline may finish before explicit cleanup of autoDestroy:false
  // streams. Preserve failures or cancellation arriving during that cleanup.
  if (options.signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }
  if (source.errored) throw source.errored;
  if (destination.errored) throw destination.errored;
}
