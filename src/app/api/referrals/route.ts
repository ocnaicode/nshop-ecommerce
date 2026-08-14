import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { applyReferralCode, generateReferralCode, getReferralCode } from '@/services/referral.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let code = await getReferralCode(session.id);
    if (!code) {
      code = await generateReferralCode(session.id, session.phone);
    }

    return NextResponse.json({
      success: true,
      data: {
        code,
        shareLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?ref=${code}`,
      },
    });
  } catch (error) {
    console.error('Referral GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch referral code' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { code } = body as { code?: string };
    if (!code) return NextResponse.json({ success: false, error: 'Referral code is required' }, { status: 400 });

    const result = await applyReferralCode(session.id, code);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to apply referral code' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Referral code applied successfully' });
  } catch (error) {
    console.error('Referral POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to apply referral code' }, { status: 500 });
  }
}
