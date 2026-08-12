import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: users });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { userId, isSuspended } = await request.json();
    await User.findByIdAndUpdate(userId, { isSuspended });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
