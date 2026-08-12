import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SellerWallet, WalletTransaction, Withdrawal } from '@/models/index';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';
import { withdrawalSchema } from '@/validators';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = withdrawalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, method, accountNumber, accountName } = validation.data;
    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });

    const wallet = await SellerWallet.findOne({ sellerId: seller._id });
    if (!wallet || wallet.availableBalance < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      sellerId: seller._id,
      amount,
      method,
      accountDetails: { accountNumber, accountName },
      status: 'pending',
    });

    // Deduct from available balance
    const prevBalance = wallet.availableBalance;
    wallet.availableBalance -= amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      sellerId: seller._id,
      type: 'withdrawal',
      amount: -amount,
      previousBalance: prevBalance,
      newBalance: wallet.availableBalance,
      referenceId: withdrawal._id.toString(),
      referenceType: 'withdrawal',
      description: `Withdrawal request via ${method}`,
    });

    return NextResponse.json({ success: true, data: withdrawal, message: 'Withdrawal request submitted' });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
