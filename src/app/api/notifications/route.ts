import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    const query: any = { userId: session.id };
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: session.id, isRead: false });

    return NextResponse.json({ success: true, data: notifications, meta: { unreadCount } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (body.markAllRead) {
      await Notification.updateMany({ userId: session.id, isRead: false }, { isRead: true });
    } else if (body.notificationId) {
      await Notification.findOneAndUpdate(
        { _id: body.notificationId, userId: session.id },
        { isRead: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}
