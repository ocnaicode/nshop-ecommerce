import { NextResponse } from 'next/server';
import { getEnabledPaymentMethods } from '@/lib/payments';
import { LOYALTY_CONFIG, PUSH_CONFIG } from '@/config/constants';

export const dynamic = 'force-dynamic';

// Public runtime configuration consumed by client pages (checkout, header…).
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      app: {
        name: process.env.NEXT_PUBLIC_APP_NAME || 'LocalMart',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      payments: {
        enabledMethods: getEnabledPaymentMethods(),
        codFeeEnabled: true,
      },
      loyalty: {
        enabled: true,
        earnRate: LOYALTY_CONFIG.earnRate,
        redeemRate: LOYALTY_CONFIG.redeemRate,
        maxRedeemPct: LOYALTY_CONFIG.maxRedeemPct,
        referralBonus: LOYALTY_CONFIG.referralBonus,
      },
      push: {
        enabled: PUSH_CONFIG.enabled,
        publicKey: PUSH_CONFIG.publicKey,
      },
      languages: ['en', 'bn'],
    },
  });
}
