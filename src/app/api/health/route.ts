import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCacheStatus } from '@/services/cache.service';
import { getQueueStatus } from '@/services/queue.service';
import { isRealtimeAvailable } from '@/server/realtime';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint — reports the state of the database, cache (Redis),
 * queue (BullMQ) and realtime (socket.io) subsystems.
 */
export async function GET() {
  try {
    await dbConnect();
    const [cache, queue] = await Promise.all([getCacheStatus(), getQueueStatus()]);

    return NextResponse.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: { backend: 'mongodb', healthy: true },
        cache: cache,
        queue: queue,
        realtime: { available: isRealtimeAvailable(), mode: isRealtimeAvailable() ? 'socket' : 'serverless' },
        email: { configured: Boolean(process.env.SENDGRID_API_KEY) },
        sms: { configured: Boolean(process.env.TWILIO_ACCOUNT_SID) },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, status: 'error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
