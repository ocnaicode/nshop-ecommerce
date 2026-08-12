import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CommissionRule } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';
export async function GET() { try { await dbConnect(); const s = await getSession(); if (!s || !isAdmin(s.role)) return NextResponse.json({ success: false }, { status: 401 }); const rules = await CommissionRule.find({}).sort({ priority: -1 }).lean(); return NextResponse.json({ success: true, data: rules }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
