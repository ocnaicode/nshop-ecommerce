import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { CustomerProfile, SellerWallet, SubscriptionPlan, CommissionRule, Coupon, FeatureFlag, SystemConfig, Rider } from '@/models/index';
import { Seller } from '@/models/Seller';
import { Shop, Category } from '@/models/Shop';
import { Product } from '@/models/Product';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting seed...');
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    const results: string[] = [];

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Seller.deleteMany({}),
      CustomerProfile.deleteMany({}),
      SellerWallet.deleteMany({}),
      Shop.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      CommissionRule.deleteMany({}),
      Coupon.deleteMany({}),
      FeatureFlag.deleteMany({}),
      SystemConfig.deleteMany({}),
      Rider.deleteMany({}),
    ]);
    results.push('🧹 Cleared existing data');

    // Create Admin
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    await User.create({
      name: 'Super Admin',
      email: 'admin@localmart.com',
      phone: '+8801700000000',
      password: adminPassword,
      role: 'super_admin',
      isVerified: true,
      isActive: true,
    });
    results.push('👤 Admin created');

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Grocery', slug: 'grocery', icon: '🛒', order: 1, isActive: true },
      { name: 'Electronics', slug: 'electronics', icon: '📱', order: 2, isActive: true },
      { name: 'Fashion', slug: 'fashion', icon: '👗', order: 3, isActive: true },
      { name: 'Restaurant', slug: 'restaurant', icon: '🍽️', order: 4, isActive: true },
      { name: 'Pharmacy', slug: 'pharmacy', icon: '💊', order: 5, isActive: true },
    ]);
    results.push(`📂 Created ${categories.length} categories`);

    // Create Sellers + Shops + Products
    const sellerPassword = await bcrypt.hash('Seller123!', 12);
    const sellerData = [
      { name: 'Rahim Store', business: 'Rahim General Store', phone: '+8801700000001', cat: 0, lat: 23.8103, lng: 90.4125, area: 'Dhanmondi' },
      { name: 'Karim Electronics', business: 'Karim Electronics', phone: '+8801700000002', cat: 1, lat: 23.7925, lng: 90.4078, area: 'Gulshan' },
    ];

    const sellers = [];
    const shops = [];

    for (const data of sellerData) {
      const user = await User.create({
        name: data.name,
        phone: data.phone,
        email: `${data.name.toLowerCase().replace(/\s+/g, '.')}@localmart.com`,
        password: sellerPassword,
        role: 'seller',
        isVerified: true,
        isActive: true,
      });

      const seller = await Seller.create({
        userId: user._id,
        businessName: data.business,
        ownerName: data.name,
        phone: data.phone,
        status: 'active',
        verificationStatus: 'approved',
        isVerified: true,
        subscription: { plan: 'business', status: 'active', startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        codConfig: { enabled: true, fee: 10, maxOrderAmount: 10000 },
        deliveryConfig: {
          sellerDelivery: { enabled: true, radius: 10, zones: [{ name: 'Nearby', minDistance: 0, maxDistance: 2, fee: 30, estimatedTime: 20 }], minimumOrder: 50, estimatedPreparationTime: 30 },
          platformDelivery: { enabled: true },
          selfPickup: { enabled: true },
        },
        openingHours: { open: '09:00', close: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
      });

      const shop = await Shop.create({
        sellerId: seller._id,
        name: data.business,
        slug: data.business.toLowerCase().replace(/\s+/g, '-'),
        description: `Welcome to ${data.business}`,
        category: categories[data.cat]._id,
        location: { type: 'Point', coordinates: [data.lng, data.lat], address: `${data.area}, Dhaka` },
        address: `${data.area}, Dhaka`,
        phone: data.phone,
        rating: 4.5,
        totalRatings: 50,
        totalOrders: 100,
        isOpen: true,
        isFeatured: true,
        isVerified: true,
        openingHours: { open: '09:00', close: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
      });

      await Seller.findByIdAndUpdate(seller._id, { shopId: shop._id });
      await SellerWallet.create({ sellerId: seller._id, pendingBalance: 0, availableBalance: 5000, totalEarned: 20000, totalWithdrawn: 15000 });

      sellers.push(seller);
      shops.push(shop);
    }
    results.push(`🏪 Created ${sellers.length} sellers and shops`);

    // Create Products
    const productData: [string, number, number, number][] = [
      ['Fresh Rice 5kg', 650, 50, 0],
      ['Soybean Oil 5L', 890, 30, 0],
      ['Wireless Earbuds', 1500, 25, 1],
      ['USB-C Charger', 450, 40, 1],
    ];

    for (const [name, price, stock, shopIndex] of productData) {
      await Product.create({
        sellerId: sellers[shopIndex]._id,
        shopId: shops[shopIndex]._id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `High quality ${name}`,
        images: [],
        category: categories[shopIndex]._id,
        sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        price,
        stock,
        lowStockThreshold: 5,
        unit: 'piece',
        status: 'active',
        rating: 4.0,
        totalRatings: 20,
        totalSold: 50,
        tags: [],
        searchKeywords: name.toLowerCase().split(' '),
        location: shops[shopIndex].location,
      });
    }
    results.push(`📦 Created ${productData.length} products`);

    // Create Customers
    const customerPassword = await bcrypt.hash('Customer123!', 12);
    await User.create({ name: 'Aminul Islam', phone: '+8801700000001', password: customerPassword, role: 'customer', isVerified: true, isActive: true });
    results.push('👥 Created 1 customer');

    // Create Rider
    const riderPassword = await bcrypt.hash('Rider123!', 12);
    const riderUser = await User.create({ name: 'Hasan Rider', phone: '+8801700000099', password: riderPassword, role: 'rider', isVerified: true, isActive: true });
    await Rider.create({ userId: riderUser._id, name: 'Hasan Rider', phone: '+8801700000099', vehicleType: 'motorcycle', vehicleNumber: 'DHAKA-M-123456', serviceArea: { type: 'Point', coordinates: [90.4, 23.75] }, isOnline: true, isActive: true, isAvailable: true, rating: 4.8 });
    results.push('🏍️ Created 1 rider');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      results,
      credentials: {
        admin: { email: 'admin@localmart.com', password: 'Admin123!' },
        seller: { email: 'rahim.store@localmart.com', password: 'Seller123!' },
        customer: { phone: '+8801700000001', password: 'Customer123!' },
        rider: { phone: '+8801700000099', password: 'Rider123!' },
      },
    });
  } catch (error: any) {
    console.error('❌ Seed failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST only', usage: 'POST /api/seed' });
}
