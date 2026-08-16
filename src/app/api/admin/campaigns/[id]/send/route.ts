import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { MarketingCampaign } from '@/models/index';
import { User } from '@/models/User';
import { getSession, requireRole } from '@/lib/auth';
import {
  sendInAppNotification,
  sendPushNotification,
  sendSmsNotification,
  sendEmailNotification,
} from '@/lib/notify';

export const dynamic = 'force-dynamic';

// POST /api/admin/campaigns/[id]/send — dispatch the campaign now.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    requireRole(session, ['super_admin', 'admin', 'marketing_manager']);

    const { id } = await params;
    const campaign = await MarketingCampaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return NextResponse.json(
        { success: false, error: `Campaign already ${campaign.status}` },
        { status: 400 }
      );
    }

    // Resolve audience
    const audienceQuery: Record<string, unknown> = { isActive: true };
    if (campaign.audience.roles?.length) {
      audienceQuery.role = { $in: campaign.audience.roles };
    }
    if (campaign.audience.userIds?.length) {
      audienceQuery._id = { $in: campaign.audience.userIds };
    }
    const users = await User.find(audienceQuery).select('name email phone').lean();

    campaign.status = 'sending';
    await campaign.save();

    let sent = 0;
    let failed = 0;
    for (const user of users) {
      try {
        const userId = String(user._id);
        const channel = campaign.type === 'multi' ? 'multi' : campaign.type;
        let ok = false;

        if (channel === 'in_app' || channel === 'multi') {
          ok = await sendInAppNotification({
            userId,
            type: 'marketing',
            title: campaign.title,
            message: campaign.body,
            data: { campaignId: String(campaign._id), campaignName: campaign.name },
          });
        }
        if (channel === 'push' || channel === 'multi') {
          const res = await sendPushNotification({
            userId,
            title: campaign.title,
            body: campaign.body,
            url: '/offers',
          });
          if (res.sent > 0) ok = true;
        }
        if (channel === 'sms' || channel === 'multi') {
          if (await sendSmsNotification(user.phone, `${campaign.title}: ${campaign.body}`)) ok = true;
        }
        if (channel === 'email' || channel === 'multi') {
          if (
            await sendEmailNotification(user.email, {
              subject: campaign.subject || campaign.title,
              html: `<h2>${campaign.title}</h2><p>${campaign.body}</p>`,
              text: campaign.body,
            })
          ) ok = true;
        }

        if (ok) sent += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    campaign.sentCount = sent;
    campaign.failedCount = failed;
    campaign.stats = { delivered: sent, opened: 0, clicked: 0 };
    campaign.status = 'sent';
    await campaign.save();

    return NextResponse.json({
      success: true,
      data: { sent, failed, total: users.length, campaignId: String(campaign._id) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 500 ? 'Failed to send campaign' : message },
      { status }
    );
  }
}
