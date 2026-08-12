import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SellerWallet, WalletTransaction } from '@/models/index';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });

    let wallet = await SellerWallet.findOne({ sellerId: seller._id });
    if (!wallet) {
      wallet = await SellerWallet.create({
        sellerId: seller._id,
        pendingBalance: 0, availableBalance: 0, totalEarned: 0, totalWithdrawn: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const transactions = await WalletTransaction.find({ sellerId: seller._id })
      .sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({ success: true, data: { wallet, transactions } });
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
