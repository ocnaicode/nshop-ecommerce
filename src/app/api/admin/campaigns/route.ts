import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { MarketingCampaign } from '@/models/index';
import { getSession, requireRole } from '@/lib/auth';
import { marketingCampaignSchema } from '@/validators';

export const dynamic = 'force-dynamic';

// GET /api/admin/campaigns — list marketing campaigns
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    requireRole(session, ['super_admin', 'admin', 'marketing_manager']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const campaigns = await MarketingCampaign.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 500 ? 'Failed to fetch campaigns' : message },
      { status }
    );
  }
}

// POST /api/admin/campaigns — create a campaign
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    requireRole(session, ['super_admin', 'admin', 'marketing_manager']);

    const body = await request.json();
    const validation = marketingCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const campaign = await MarketingCampaign.create({
      ...data,
      status: data.scheduleAt ? 'scheduled' : data.status || 'draft',
      createdBy: session.id,
    });

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 500 ? 'Failed to create campaign' : message },
      { status }
    );
  }
}

