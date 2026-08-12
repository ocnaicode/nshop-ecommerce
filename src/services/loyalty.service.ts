// =============================================================================
// Loyalty Service - Points earning, redemption, expiry management
// =============================================================================

import dbConnect from '@/lib/db';
import { LoyaltyAccount, LoyaltyTransaction } from '@/models/index';

const DEFAULT_POINTS_PER_TAKA = 0.01; // 1 point per 100 taka
const DEFAULT_REDEMPTION_RATE = 1; // 1 point = 1 taka

export async function getOrCreateAccount(customerId: string) {
  await dbConnect();
  let account = await LoyaltyAccount.findOne({ customerId });
  if (!account) {
    account = await LoyaltyAccount.create({
      customerId,
      points: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      totalExpired: 0,
    });
  }
  return account;
}

export async function earnPoints(
  customerId: string,
  orderAmount: number,
  referenceId?: string,
  pointsPerTaka?: number
): Promise<{ points: number; success: boolean }> {
  try {
    await dbConnect();
    const rate = pointsPerTaka || DEFAULT_POINTS_PER_TAKA;
    const points = Math.floor(orderAmount * rate);

    if (points <= 0) return { points: 0, success: true };

    const account = await getOrCreateAccount(customerId);
    account.points += points;
    account.totalEarned += points;
    await account.save();

    await LoyaltyTransaction.create({
      accountId: account._id,
      customerId,
      type: 'earned',
      points,
      description: `Earned from order of ৳${orderAmount}`,
      referenceId,
      referenceType: 'order',
    });

    return { points, success: true };
  } catch (error) {
    console.error('Earn points error:', error);
    return { points: 0, success: false };
  }
}

export async function redeemPoints(
  customerId: string,
  points: number,
  referenceId?: string
): Promise<{ value: number; success: boolean; error?: string }> {
  try {
    await dbConnect();
    const account = await getOrCreateAccount(customerId);

    if (account.points < points) {
      return { value: 0, success: false, error: 'Insufficient points' };
    }

    const value = points * DEFAULT_REDEMPTION_RATE;

    account.points -= points;
    account.totalRedeemed += points;
    await account.save();

    await LoyaltyTransaction.create({
      accountId: account._id,
      customerId,
      type: 'redeemed',
      points: -points,
      description: `Redeemed for ৳${value} discount`,
      referenceId,
      referenceType: 'order',
    });

    return { value, success: true };
  } catch (error) {
    console.error('Redeem points error:', error);
    return { value: 0, success: false, error: 'Failed to redeem points' };
  }
}

export async function addBonusPoints(
  customerId: string,
  points: number,
  reason: string
): Promise<boolean> {
  try {
    await dbConnect();
    const account = await getOrCreateAccount(customerId);
    account.points += points;
    account.totalEarned += points;
    await account.save();

    await LoyaltyTransaction.create({
      accountId: account._id,
      customerId,
      type: 'bonus',
      points,
      description: reason,
    });

    return true;
  } catch (error) {
    console.error('Bonus points error:', error);
    return false;
  }
}

export async function getPointsBalance(customerId: string): Promise<number> {
  const account = await getOrCreateAccount(customerId);
  return account.points;
}

export async function getTransactionHistory(customerId: string, limit = 20) {
  await dbConnect();
  return LoyaltyTransaction.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
