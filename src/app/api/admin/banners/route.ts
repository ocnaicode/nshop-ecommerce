import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Banner } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const banners = await Banner.find({}).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: banners });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
