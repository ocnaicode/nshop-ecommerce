import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateAccount, getPointsBalance, getTransactionHistory, redeemPoints } from '@/services/loyalty.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 20);

    const [balance, history, account] = await Promise.all([
      getPointsBalance(session.id),
      getTransactionHistory(session.id, limit),
      getOrCreateAccount(session.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        lifetimePoints: account.totalEarned,
        redeemedPoints: account.totalRedeemed,
        history,
      },
    });
  } catch (error) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { points, orderId } = body as { points?: number; orderId?: string };

    if (!points || points <= 0) {
      return NextResponse.json({ success: false, error: 'Valid points amount required' }, { status: 400 });
    }

    const result = await redeemPoints(session.id, points, orderId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to redeem points' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { value: result.value, points },
      message: `Redeemed ${points} points for ৳${result.value} discount`,
    });
  } catch (error) {
    console.error('Loyalty POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to redeem points' }, { status: 500 });
  }
}
