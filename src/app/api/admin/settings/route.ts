import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SystemConfig } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';
export async function GET() { try { await dbConnect(); const s = await getSession(); if (!s || !isAdmin(s.role)) return NextResponse.json({ success: false }, { status: 401 }); const config = await SystemConfig.find({}).sort({ key: 1 }).lean(); return NextResponse.json({ success: true, data: config }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
export async function PUT(request: NextRequest) { try { await dbConnect(); const s = await getSession(); if (!s || !isAdmin(s.role)) return NextResponse.json({ success: false }, { status: 401 }); const { key, value } = await request.json(); await SystemConfig.findOneAndUpdate({ key }, { value }, { upsert: true }); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
