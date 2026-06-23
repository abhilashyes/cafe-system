import type { PrintJob } from '@brew/contracts';
import { config } from './config';

/** Secure channel to the KOT/Fulfilment service: poll queued jobs, ACK results. */
export class BackendClient {
  private readonly headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${config.token}`,
  };

  async pollJobs(deviceId: string): Promise<PrintJob[]> {
    const url = `${config.apiBase}/v1/print-jobs?deviceId=${encodeURIComponent(deviceId)}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`poll ${deviceId} -> ${res.status}`);
    return (await res.json()) as PrintJob[];
  }

  async ack(jobId: string, status: 'PRINTED' | 'FAILED'): Promise<void> {
    const res = await fetch(`${config.apiBase}/v1/print-jobs/${jobId}/ack`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`ack ${jobId} -> ${res.status}`);
  }
}
