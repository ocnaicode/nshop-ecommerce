// =============================================================================
// Referral Service - referral codes, application, rewards and stats
// Rewards both the referrer and the referred customer when the referred
// customer's first order is placed.
// =============================================================================

import dbConnect from '@/lib/db';
import { CustomerProfile, Referral } from '@/models/index';
import { addBonusPoints } from './loyalty.service';
import { sendNotification } from './notification.service';
import { sendSms } from './sms.service';
import { toE164 } from './sms.service';

const REFERRER_REWARD_POINTS = Number(process.env.REFERRER_REWARD_POINTS || 100);
const REFERRED_REWARD_POINTS = Number(process.env.REFERRED_REWARD_POINTS || 50);

export async function generateReferralCode(userId: string, phone: string): Promise<string> {
  await dbConnect();
  const profile = await CustomerProfile.findOne({ userId });
  if (!profile) throw new Error('Customer profile not found');

  if (profile.referralCode) return profile.referralCode;

  const base = phone.replace(/[^0-9]/g, '').slice(-6);
  let code = `${base}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  while (await CustomerProfile.findOne({ referralCode: code })) {
    code = `${base}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  }

  profile.referralCode = code;
  await profile.save();
  return code;
}

export async function getReferralCode(userId: string): Promise<string | null> {
  await dbConnect();
  const profile = await CustomerProfile.findOne({ userId }).lean();
  return profile?.referralCode || null;
}

/**
 * Applies a referral code when a new customer registers.
 * Creates the Referral record (pending) and rewards the referred user.
 */
export async function applyReferralCode(newUserId: string, code: string): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  const normalized = code.trim().toUpperCase();
  if (!normalized) return { success: false, error: 'Referral code is required' };

  const referrer = await CustomerProfile.findOne({ referralCode: normalized });
  if (!referrer) return { success: false, error: 'Invalid referral code' };
  if (referrer.userId.toString() === newUserId) return { success: false, error: 'You cannot refer yourself' };

  const existing = await Referral.findOne({ referredId: newUserId });
  if (existing) return { success: false, error: 'Referral already applied' };

  const newProfile = await CustomerProfile.findOne({ userId: newUserId });
  if (newProfile) {
    newProfile.referredBy = normalized;
    await newProfile.save();
  }

  await Referral.create({
    referrerId: referrer.userId,
    referrerType: 'customer',
    referredId: newUserId,
    referredType: 'customer',
    status: 'pending',
    rewardType: 'loyalty_points',
    rewardAmount: REFERRER_REWARD_POINTS,
  });

  // Reward the referred customer immediately
  await addBonusPoints(newUserId, REFERRED_REWARD_POINTS, 'Welcome bonus from referral');

  const user = await (await import('@/models/User')).User.findById(newUserId).lean();
  if (user?.phone) {
    await sendSms({
      to: toE164(user.phone),
      body: `Welcome to LocalMart! You earned ${REFERRED_REWARD_POINTS} bonus points from your referral code.`,
    });
  }

  return { success: true };
}

/**
 * Completes a referral when the referred customer places their first order.
 * Marks the referral completed and rewards the referrer.
 */
export async function completeReferral(referredUserId: string): Promise<void> {
  await dbConnect();

  const referral = await Referral.findOne({ referredId: referredUserId, status: 'pending' });
  if (!referral) return;

  referral.status = 'completed';
  await referral.save();

  // Reward the referrer
  await addBonusPoints(referral.referrerId.toString(), REFERRER_REWARD_POINTS, 'Referral reward');

  await sendNotification({
    userId: referral.referrerId.toString(),
    event: 'referral_rewarded',
    data: { amount: REFERRER_REWARD_POINTS, points: REFERRER_REWARD_POINTS },
    channels: ['in_app', 'email'],
  });
}

export async function getReferralStats(userId: string) {
  await dbConnect();

  const [total, completed, pending] = await Promise.all([
    Referral.countDocuments({ referrerId: userId }),
    Referral.countDocuments({ referrerId: userId, status: 'completed' }),
    Referral.countDocuments({ referrerId: userId, status: 'pending' }),
  ]);

  const completedRefs = await Referral.find({ referrerId: userId, status: 'completed' })
    .populate('referredId', 'name phone')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const profile = await CustomerProfile.findOne({ userId }).lean();

  return {
    code: profile?.referralCode || null,
    shareLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?ref=${profile?.referralCode || ''}`,
    total,
    completed,
    pending,
    rewardPoints: REFERRER_REWARD_POINTS,
    completedReferrals: completedRefs,
  };
}
