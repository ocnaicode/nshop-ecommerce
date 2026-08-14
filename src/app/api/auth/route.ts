import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { CustomerProfile } from '@/models/index';
import { Seller } from '@/models/Seller';
import { registerSchema, loginSchema } from '@/validators';
import { hashPassword, verifyPassword, createToken, setSessionToken } from '@/lib/auth';
import { generateOTP, normalizeBangladeshPhone, slugify } from '@/lib/utils';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'register':
        return await handleRegister(body);
      case 'login':
        return await handleLogin(body);
      case 'logout':
        return await handleLogout();
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRegister(body: any) {
  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, phone, email, password, role, referralCode } = validation.data;
  const normalizedPhone = normalizeBangladeshPhone(phone);

  // Check if user already exists
  const existingUser = await User.findOne({ phone: normalizedPhone });
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: 'Phone number already registered' },
      { status: 400 }
    );
  }

  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
  }

  // Create user
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    phone: normalizedPhone,
    email: email?.toLowerCase() || undefined,
    password: hashedPassword,
    role: role || 'customer',
    isVerified: process.env.DEMO_MODE === 'true', // Auto-verify in demo mode
  });

  // Create profile based on role
  if (role === 'customer' || !role) {
    const generatedCode = normalizedPhone.slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();
    const profile = await CustomerProfile.create({
      userId: user._id,
      referralCode: generatedCode,
      savedAddresses: [],
      favoriteShops: [],
      favoriteProducts: [],
      wishlist: [],
      recentlyViewed: [],
      loyaltyPoints: 0,
    });

    // Apply referral code if provided
    if (referralCode) {
      try {
        const { applyReferralCode } = await import('@/services/referral.service');
        const result = await applyReferralCode(user._id.toString(), referralCode);
        if (!result.success) {
          console.warn(`[referral] ${result.error}`);
        }
      } catch (err) {
        console.error('[referral] apply failed:', err);
      }
    } else {
      // Ensure profile has its own code even when referral applied
      await profile.save();
    }
  }

  // Generate token and set session
  const token = await createToken({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  });

  await setSessionToken(token);

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    },
    message: 'Registration successful',
  });
}

async function handleLogin(body: any) {
  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { phone, password } = validation.data;
  const normalizedPhone = normalizeBangladeshPhone(phone);

  // Find user by phone or email
  const user = await User.findOne({
    $or: [{ phone: normalizedPhone }, { email: phone.toLowerCase() }],
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  if (!user.isActive || user.isSuspended) {
    return NextResponse.json(
      { success: false, error: 'Account is suspended. Please contact support.' },
      { status: 403 }
    );
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  // Get seller ID if seller
  let sellerId: string | undefined;
  if (user.role === 'seller') {
    const seller = await Seller.findOne({ userId: user._id });
    sellerId = seller?._id?.toString();
  }

  // Generate token
  const token = await createToken({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    sellerId,
  });

  await setSessionToken(token);

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        sellerId,
      },
    },
    message: 'Login successful',
  });
}

async function handleLogout() {
  const { clearSession } = await import('@/lib/auth');
  await clearSession();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
