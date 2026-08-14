import { NextResponse } from 'next/server';
import { isRealtimeAvailable } from '@/server/realtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      available: isRealtimeAvailable(),
      mode: isRealtimeAvailable() ? 'socket' : 'serverless',
      endpoint: '/socket.io',
      note: isRealtimeAvailable()
        ? 'Realtime server active — live order/notification/chat updates enabled'
        : 'Realtime server not active — UI falls back to REST polling',
    },
  });
}
