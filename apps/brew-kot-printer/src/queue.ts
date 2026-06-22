import type { PrintJob } from '@brew/contracts';

/**
 * Offline-buffered print queue. Jobs are persisted (file/SQLite in a full build)
 * so a connectivity drop never silently loses a ticket; failed jobs retry with
 * backoff and remain available for manual reprint.
 */
export class PrintQueue {
  private readonly pending: PrintJob[] = [];
  private readonly printed: PrintJob[] = [];

  enqueue(job: PrintJob): void {
    if (this.pending.some((j) => j.id === job.id)) return; // dedupe
    this.pending.push(job);
  }

  next(): PrintJob | undefined {
    return this.pending[0];
  }

  markPrinted(jobId: string): void {
    const idx = this.pending.findIndex((j) => j.id === jobId);
    if (idx >= 0) this.printed.push(...this.pending.splice(idx, 1));
  }

  markFailed(jobId: string): void {
    const job = this.pending.find((j) => j.id === jobId);
    if (job) job.attempts += 1; // stays queued for retry
  }

  /** Manual reprint of an already-printed ticket. */
  reprint(jobId: string): PrintJob | undefined {
    const job = this.printed.find((j) => j.id === jobId);
    if (job) this.pending.push({ ...job, status: 'QUEUED' });
    return job;
  }

  get depth(): number {
    return this.pending.length;
  }
}
