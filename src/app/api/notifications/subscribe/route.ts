import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PushSubscription } from '@/models/index';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/notifications/subscribe
// Stores a Web Push subscription for the logged-in user.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const subscription = body.subscription as
      | { endpoint: string; keys?: { p256dh?: string; auth?: string } }
      | undefined;

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription payload' },
        { status: 400 }
      );
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId: session.id,
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
          userAgent: request.headers.get('user-agent') || undefined,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: { subscribed: true } });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
  }
}

// DELETE /api/notifications/subscribe — remove a subscription (e.g. on logout).
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'endpoint is required' }, { status: 400 });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint, userId: session.id },
      { $set: { isActive: false } }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove subscription' }, { status: 500 });
  }
}
