import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CustomerProfile } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Address id required' }, { status: 400 });
    }

    const profile = await CustomerProfile.findOne({ userId: session.id });
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const before = profile.savedAddresses.length;
    profile.savedAddresses = profile.savedAddresses.filter(
      (a: { _id?: { toString: () => string } }) => a._id?.toString() !== id
    );

    if (profile.savedAddresses.length === before) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    await profile.save();
    return NextResponse.json({ success: true, data: profile.savedAddresses });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete address' }, { status: 500 });
  }
}
