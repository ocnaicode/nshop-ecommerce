import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { MarketingCampaign } from '@/models/index';
import { getSession, requireRole } from '@/lib/auth';
import { marketingCampaignSchema } from '@/validators';

export const dynamic = 'force-dynamic';

// GET /api/admin/campaigns/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    requireRole(session, ['super_admin', 'admin', 'marketing_manager']);

    const { id } = await params;
    const campaign = await MarketingCampaign.findById(id).lean();
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 500 ? 'Failed to fetch campaign' : message },
      { status }
    );
  }
}

// PATCH /api/admin/campaigns/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    requireRole(session, ['super_admin', 'admin', 'marketing_manager']);

    const { id } = await params;
    const body = await request.json();
    const validation = marketingCampaignSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const campaign = await MarketingCampaign.findByIdAndUpdate(
      id,
      { $set: validation.data },
      { new: true }
    );
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 500 ? 'Failed to update campaign' : message },
      { status }
    );
  }
}

// DELETE /api/admin/campaigns/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    requireRole(session, ['super_admin', 'admin', 'marketing_manager']);

    const { id } = await params;
    await MarketingCampaign.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 500 ? 'Failed to delete campaign' : message },
      { status }
    );
  }
}
