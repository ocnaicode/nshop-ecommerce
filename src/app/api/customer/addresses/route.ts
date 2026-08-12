import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CustomerProfile } from '@/models/index';
import { getSession } from '@/lib/auth';
import { addressSchema } from '@/validators';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await CustomerProfile.findOne({ userId: session.id }).lean();
    return NextResponse.json({ success: true, data: profile?.savedAddresses || [] });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = addressSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const address = {
      label: data.label,
      name: data.name,
      phone: data.phone,
      address: data.address,
      area: data.area,
      union: data.union,
      upazila: data.upazila,
      district: data.district,
      division: data.division,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      isDefault: data.isDefault,
    };

    let profile = await CustomerProfile.findOne({ userId: session.id });
    if (!profile) {
      profile = new CustomerProfile({ userId: session.id, savedAddresses: [] });
    }

    if (data.isDefault) {
      profile.savedAddresses.forEach((a: any) => { a.isDefault = false; });
    }

    profile.savedAddresses.push(address);
    await profile.save();

    return NextResponse.json({ success: true, data: profile.savedAddresses }, { status: 201 });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add address' }, { status: 500 });
  }
}
