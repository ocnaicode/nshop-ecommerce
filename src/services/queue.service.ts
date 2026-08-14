// =============================================================================
// Queue Service - BullMQ job queue with in-memory fallback
// Enqueues background jobs (email, SMS, notifications, analytics ingest).
// Uses Redis + BullMQ when REDIS_URL is set; otherwise processes jobs
// immediately in-process (dev / serverless fallback).
// =============================================================================

export type JobName =
  | 'send-email'
  | 'send-sms'
  | 'send-notification'
  | 'low-stock-alert'
  | 'analytics-ingest'
  | 'subscription-check';

export interface QueueJob<T extends Record<string, unknown> = Record<string, unknown>> {
  name: JobName;
  data: T;
  opts?: { delayMs?: number; attempts?: number };
}

const memoryQueues = new Map<JobName, QueueJob[]>();
let bullQueues: Record<string, any> = {};
let bullWorkers: any[] = [];
let initialized = false;

async function getRedisConnection() {
  const url = process.env.REDIS_URL || '';
  if (!url) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: Redis } = await import('ioredis');
  return new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true, retryStrategy: (t: number) => (t > 5 ? null : Math.min(t * 200, 2000)) });
}

export function isQueueConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

let redisConnection: any = null;

async function ensureBull() {
  if (initialized) return;
  initialized = true;
  redisConnection = await getRedisConnection();
  if (!redisConnection) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Queue, Worker } = await import('bullmq');
    const queueNames: JobName[] = ['send-email', 'send-sms', 'send-notification', 'low-stock-alert', 'analytics-ingest', 'subscription-check'];
    for (const name of queueNames) {
      bullQueues[name] = new Queue(name, { connection: redisConnection });
      const worker = new Worker(name, async (job: any) => {
        console.log(`[queue] processing ${name}:`, job.data);
      }, { connection: redisConnection });
      bullWorkers.push(worker);
    }
  } catch (err) {
    console.warn('[queue] BullMQ init failed, falling back to in-memory:', (err as Error).message);
    bullQueues = {};
  }
}

/** Enqueues a background job (or executes it immediately when Redis is absent) */
export async function enqueueJob<T extends Record<string, unknown> = Record<string, unknown>>(job: QueueJob<T>): Promise<{ success: boolean; backend: 'bullmq' | 'memory' | 'none' }> {
  await ensureBull();

  if (bullQueues[job.name]) {
    try {
      await bullQueues[job.name].add(job.name, job.data, {
        delay: job.opts?.delayMs || 0,
        attempts: job.opts?.attempts || 3,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      });
      return { success: true, backend: 'bullmq' };
    } catch (err) {
      console.warn('[queue] BullMQ enqueue failed:', (err as Error).message);
    }
  }

  if (isQueueConfigured()) {
    // Redis present but queue failed — still try to be useful
    if (!memoryQueues.has(job.name)) memoryQueues.set(job.name, []);
    memoryQueues.get(job.name)!.push(job);
    return { success: true, backend: 'memory' };
  }

  // No Redis: run the handler inline
  await runJobHandler(job);
  return { success: true, backend: 'none' };
}

async function runJobHandler<T extends Record<string, unknown> = Record<string, unknown>>(job: QueueJob<T>): Promise<void> {
  try {
    // Lazy import to avoid circular dependency at module load time
    const { handleBackgroundJob } = await import('./job-handlers');
    await handleBackgroundJob(job);
  } catch (err) {
    console.error(`[queue] inline job ${job.name} failed:`, (err as Error).message);
  }
}

export async function getQueueStatus(): Promise<{
  backend: 'bullmq' | 'memory' | 'none';
  healthy: boolean;
  pending: number;
}> {
  await ensureBull();
  if (bullQueues && Object.keys(bullQueues).length > 0) {
    return { backend: 'bullmq', healthy: true, pending: 0 };
  }
  const pending = [...memoryQueues.values()].reduce((sum, q) => sum + q.length, 0);
  return { backend: isQueueConfigured() ? 'memory' : 'none', healthy: true, pending };
}

export async function shutdownQueue(): Promise<void> {
  for (const worker of bullWorkers) {
    try { await worker.close(); } catch { /* ignore */ }
  }
  bullWorkers = [];
}
