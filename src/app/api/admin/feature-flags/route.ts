import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { FeatureFlag } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try { await dbConnect(); const session = await getSession(); if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false }, { status: 401 }); const flags = await FeatureFlag.find({}).sort({ name: 1 }).lean(); return NextResponse.json({ success: true, data: flags }); } catch { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try { await dbConnect(); const session = await getSession(); if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false }, { status: 401 }); const { id, enabled } = await request.json(); await FeatureFlag.findByIdAndUpdate(id, { enabled }); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ success: false }, { status: 500 }); }
}
