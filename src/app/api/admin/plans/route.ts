import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SubscriptionPlan } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';
export async function GET() { try { await dbConnect(); const s = await getSession(); if (!s || !isAdmin(s.role)) return NextResponse.json({ success: false }, { status: 401 }); const plans = await SubscriptionPlan.find({}).sort({ order: 1 }).lean(); return NextResponse.json({ success: true, data: plans }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
