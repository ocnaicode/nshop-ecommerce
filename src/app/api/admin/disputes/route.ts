import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Dispute } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';
export async function GET() { try { await dbConnect(); const s = await getSession(); if (!s || !isAdmin(s.role)) return NextResponse.json({ success: false }, { status: 401 }); const disputes = await Dispute.find({}).sort({ createdAt: -1 }).lean(); return NextResponse.json({ success: true, data: disputes }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
