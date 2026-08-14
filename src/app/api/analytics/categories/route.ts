import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { getCategoryBreakdown } from '@/services/analytics.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getCategoryBreakdown();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analytics categories error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
