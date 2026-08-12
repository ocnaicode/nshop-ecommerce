import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Category } from '@/models/Shop';
import { getSession, isAdmin } from '@/lib/auth';
import { categorySchema } from '@/validators';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const active = searchParams.get('active');

    const query: Record<string, unknown> = {};
    if (parentId !== null) query.parentId = parentId || null;
    if (active === 'true') query.isActive = true;

    const categories = await Category.find(query).sort({ order: 1, name: 1 }).lean();

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    let slug = slugify(data.name);
    const exists = await Category.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const category = await Category.create({ ...data, slug });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}
