import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { BusinessDirectory } from '@/models/index';
export async function GET() { try { await dbConnect(); const businesses = await BusinessDirectory.find({}).sort({ name: 1 }).lean(); return NextResponse.json({ success: true, data: businesses }); } catch { return NextResponse.json({ success: true, data: [] }); } }
