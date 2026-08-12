import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { Category } from '@/models/Shop';
import { getSession, isAdmin } from '@/lib/auth';
import { Seller } from '@/models/Seller';
import { productSchema } from '@/validators';
import { slugify, getPaginationParams } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const query: Record<string, unknown> = {};
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const shopId = searchParams.get('shopId');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || '-createdAt';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (status) query.status = status;
    else query.status = { $in: ['active', 'published'] };
    if (category) query.category = category;
    if (shopId) query.shopId = shopId;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as any).$gte = parseFloat(minPrice);
      if (maxPrice) (query.price as any).$lte = parseFloat(maxPrice);
    }

    // Geospatial query for nearby products
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const maxDistance = searchParams.get('maxDistance') || '10000'; // meters

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

    // Sort
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'popular') sortObj = { totalSold: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };
    if (search && sort === 'relevance') sortObj = { score: { $meta: 'textScore' } as any };

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('shopId', 'name slug logo')
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
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
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get seller and shop info
    let sellerId = session.sellerId;
    if (!sellerId && isAdmin(session.role)) {
      sellerId = body.sellerId;
    }
    if (!sellerId) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 400 });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller || !seller.shopId) {
      return NextResponse.json({ success: false, error: 'Shop not found. Create a shop first.' }, { status: 400 });
    }

    const shop = await Shop.findById(seller.shopId);
    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    // Generate unique slug
    let slug = slugify(data.name);
    let slugCount = await Product.countDocuments({ slug });
    if (slugCount > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await Product.create({
      ...data,
      slug,
      sellerId,
      shopId: seller.shopId,
      location: shop.location,
      discountPrice: data.discountPrice || undefined,
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
