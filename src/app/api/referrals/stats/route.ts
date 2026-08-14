import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getReferralStats } from '@/services/referral.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const stats = await getReferralStats(session.id);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch referral stats' }, { status: 500 });
  }
}
