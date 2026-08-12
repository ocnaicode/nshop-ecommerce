import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Shop, Category } from '@/models/Shop';
import { Seller } from '@/models/Seller';
import { getSession, isAdmin } from '@/lib/auth';
import { shopSchema, categorySchema } from '@/validators';
import { slugify, getPaginationParams } from '@/lib/utils';

// Shops API
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const query: Record<string, unknown> = {};
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const isOpen = searchParams.get('isOpen');

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };

    // Geospatial query
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const maxDistance = searchParams.get('maxDistance') || '10000';

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    const [shops, total] = await Promise.all([
      Shop.find(query)
        .sort({ rating: -1, totalOrders: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug icon')
        .lean(),
      Shop.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: shops,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Shops GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shops' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || (session.role !== 'seller' && !isAdmin(session.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = shopSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get seller
    let sellerId = session.sellerId;
    if (!sellerId && isAdmin(session.role)) sellerId = body.sellerId;
    if (!sellerId) {
      return NextResponse.json({ success: false, error: 'Seller profile required' }, { status: 400 });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    if (seller.shopId) {
      return NextResponse.json({ success: false, error: 'Shop already exists' }, { status: 400 });
    }

    let slug = slugify(data.name);
    const slugCount = await Shop.countDocuments({ slug });
    if (slugCount > 0) slug = `${slug}-${Date.now().toString(36)}`;

    const shop = await Shop.create({
      name: data.name,
      slug,
      description: data.description || '',
      category: data.categoryId,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
        address: data.address,
        area: data.area,
        upazila: data.upazila,
        district: data.district,
        division: data.division,
      },
      address: data.address,
      phone: data.phone,
      logo: data.logo,
      banner: data.banner,
      openingHours: data.openingHours || { open: '09:00', close: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      sellerId,
    });

    // Update seller with shop ID
    await Seller.findByIdAndUpdate(sellerId, { shopId: shop._id, status: 'active' });

    return NextResponse.json({ success: true, data: shop, message: 'Shop created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Shops POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create shop' }, { status: 500 });
  }
}
