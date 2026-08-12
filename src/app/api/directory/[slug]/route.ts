import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { BusinessDirectory } from '@/models/index';
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) { try { await dbConnect(); const { slug } = await params; const business = await BusinessDirectory.findOne({ slug }).lean(); if (!business) return NextResponse.json({ success: false }, { status: 404 }); return NextResponse.json({ success: true, data: business }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
