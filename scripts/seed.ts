import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';
import { CustomerProfile, SellerWallet, SubscriptionPlan, CommissionRule, Coupon, FeatureFlag, SystemConfig, Rider } from '../src/models/index';
import { Seller } from '../src/models/Seller';
import { Shop, Category } from '../src/models/Shop';
import { Product } from '../src/models/Product';
import { Order } from '../src/models/Order';
import { resetIndexes } from '../src/lib/seed-utils';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/localmart';

async function seed() {
  console.log('🌱 Starting seed...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Seller.deleteMany({}),
    CustomerProfile.deleteMany({}),
    SellerWallet.deleteMany({}),
    Shop.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Order.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
    CommissionRule.deleteMany({}),
    Coupon.deleteMany({}),
    FeatureFlag.deleteMany({}),
    SystemConfig.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // Drop every non-_id index and rebuild them from the current schemas.
  // Stale indexes from older deploys (e.g. an orphaned unique `id_1`) would
  // otherwise make inserts fail with E11000 duplicate-key errors.
  await resetIndexes([
    User,
    Seller,
    CustomerProfile,
    SellerWallet,
    Shop,
    Product,
    Category,
    Order,
    SubscriptionPlan,
    CommissionRule,
    Coupon,
    FeatureFlag,
    SystemConfig,
    Rider,
  ]);
  console.log('🔁 Indexes reset');

  // Create Admin
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@localmart.com',
    phone: '+8801700000000',
    password: adminPassword,
    role: 'super_admin',
    isVerified: true,
    isActive: true,
  });
  console.log('👤 Admin created: admin@localmart.com / Admin123!');

  // Create Categories
  const categories = await Category.insertMany([
    { name: 'Grocery', slug: 'grocery', icon: '🛒', description: 'Daily groceries and essentials', order: 1, isActive: true },
    { name: 'Electronics', slug: 'electronics', icon: '📱', description: 'Gadgets and electronics', order: 2, isActive: true },
    { name: 'Fashion', slug: 'fashion', icon: '👗', description: 'Clothing and accessories', order: 3, isActive: true },
    { name: 'Restaurant', slug: 'restaurant', icon: '🍽️', description: 'Food and dining', order: 4, isActive: true },
    { name: 'Pharmacy', slug: 'pharmacy', icon: '💊', description: 'Medicines and health', order: 5, isActive: true },
    { name: 'Bakery', slug: 'bakery', icon: '🍰', description: 'Fresh baked goods', order: 6, isActive: true },
    { name: 'Furniture', slug: 'furniture', icon: '🪑', description: 'Home and office furniture', order: 7, isActive: true },
    { name: 'Mobile', slug: 'mobile', icon: '📲', description: 'Mobile phones and accessories', order: 8, isActive: true },
    { name: 'Cosmetics', slug: 'cosmetics', icon: '💄', description: 'Beauty and cosmetics', order: 9, isActive: true },
    { name: 'Hardware', slug: 'hardware', icon: '🔧', description: 'Tools and hardware', order: 10, isActive: true },
    { name: 'Stationery', slug: 'stationery', icon: '📝', description: 'Books and stationery', order: 11, isActive: true },
    { name: 'Agriculture', slug: 'agriculture', icon: '🌾', description: 'Farming and agriculture', order: 12, isActive: true },
    { name: 'Home Appliances', slug: 'home-appliances', icon: '🏠', description: 'Home appliances', order: 13, isActive: true },
    { name: 'Shoes', slug: 'shoes', icon: '👟', description: 'Footwear', order: 14, isActive: true },
    { name: 'Gift', slug: 'gift', icon: '🎁', description: 'Gifts and celebrations', order: 15, isActive: true },
    { name: 'Local Services', slug: 'local-services', icon: '🔌', description: 'Local service providers', order: 16, isActive: true },
  ]);
  console.log(`📂 Created ${categories.length} categories`);

  // Create Subscription Plans
  const plans = await SubscriptionPlan.insertMany([
    {
      name: 'Free',
      slug: 'free',
      description: 'Get started with basic features',
      monthlyPrice: 0,
      yearlyPrice: 0,
      productLimit: 10,
      staffLimit: 1,
      features: { dashboard: true, products: true, orders: true, basic_analytics: true },
      order: 1,
    },
    {
      name: 'Basic',
      slug: 'basic',
      description: 'For growing businesses',
      monthlyPrice: 500,
      yearlyPrice: 5000,
      productLimit: 50,
      staffLimit: 3,
      features: { dashboard: true, products: true, orders: true, analytics: true, coupons: true, reviews: true },
      order: 2,
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'For established businesses',
      monthlyPrice: 1500,
      yearlyPrice: 15000,
      productLimit: 200,
      staffLimit: 10,
      features: { dashboard: true, products: true, orders: true, analytics: true, advanced_analytics: true, coupons: true, promotions: true, crm: true, reviews: true },
      order: 3,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Full featured for power sellers',
      monthlyPrice: 3000,
      yearlyPrice: 30000,
      productLimit: -1,
      staffLimit: -1,
      features: { dashboard: true, products: true, orders: true, analytics: true, advanced_analytics: true, coupons: true, promotions: true, crm: true, pos: true, inventory: true, reviews: true, premium_promotions: true },
      order: 4,
    },
  ]);
  console.log(`💎 Created ${plans.length} subscription plans`);

  // Create Commission Rules
  await CommissionRule.insertMany([
    { name: 'Global Commission', type: 'global', rate: 5, priority: 0, isActive: true },
    { name: 'Grocery Commission', type: 'category', targetId: categories[0]._id.toString(), rate: 2, priority: 1, isActive: true },
    { name: 'Electronics Commission', type: 'category', targetId: categories[1]._id.toString(), rate: 3, priority: 1, isActive: true },
    { name: 'Fashion Commission', type: 'category', targetId: categories[2]._id.toString(), rate: 5, priority: 1, isActive: true },
    { name: 'Restaurant Commission', type: 'category', targetId: categories[3]._id.toString(), rate: 8, priority: 1, isActive: true },
  ]);
  console.log('💰 Created commission rules');

  // Create Feature Flags
  await FeatureFlag.insertMany([
    { key: 'cod', name: 'Cash on Delivery', enabled: true },
    { key: 'bkash', name: 'bKash Payment', enabled: false },
    { key: 'nagad', name: 'Nagad Payment', enabled: false },
    { key: 'seller_delivery', name: 'Seller Delivery', enabled: true },
    { key: 'platform_delivery', name: 'Platform Delivery', enabled: true },
    { key: 'self_pickup', name: 'Self Pickup', enabled: true },
    { key: 'ai', name: 'AI Features', enabled: false },
    { key: 'pos', name: 'POS System', enabled: true },
    { key: 'inventory', name: 'Inventory Management', enabled: true },
    { key: 'crm', name: 'Customer CRM', enabled: true },
    { key: 'loyalty', name: 'Loyalty Program', enabled: true },
    { key: 'referral', name: 'Referral Program', enabled: true },
    { key: 'sponsored_ads', name: 'Sponsored Ads', enabled: true },
    { key: 'food_marketplace', name: 'Food Marketplace', enabled: true },
    { key: 'services_marketplace', name: 'Services Marketplace', enabled: false },
  ]);
  console.log('🚩 Created feature flags');

  // Create System Config
  await SystemConfig.insertMany([
    { key: 'platform_delivery_percentage', value: 15, type: 'number', description: 'Platform delivery fee percentage' },
    { key: 'default_cod_fee', value: 10, type: 'number', description: 'Default COD fee in BDT' },
    { key: 'min_cod_amount', value: 50, type: 'number', description: 'Minimum COD order amount' },
    { key: 'max_cod_amount', value: 10000, type: 'number', description: 'Maximum COD order amount' },
    { key: 'loyalty_points_per_taka', value: 0.01, type: 'number', description: 'Loyalty points earned per taka spent' },
    { key: 'referral_reward', value: 50, type: 'number', description: 'Referral reward in BDT' },
    { key: 'min_withdrawal', value: 100, type: 'number', description: 'Minimum withdrawal amount' },
    { key: 'settlement_days', value: 3, type: 'number', description: 'Days before settlement' },
    { key: 'maintenance_mode', value: false, type: 'boolean', description: 'Enable maintenance mode' },
    { key: 'brand_name', value: 'LocalMart', type: 'string', description: 'Platform brand name' },
  ]);
  console.log('⚙️ Created system config');

  // Create Sellers
  const sellerPassword = await bcrypt.hash('Seller123!', 12);
  const sellers = [];
  const shops = [];

  const sellerData = [
    { name: 'Rahim Store', business: 'Rahim General Store', phone: '+8801700000001', category: categories[0], lat: 23.8103, lng: 90.4125, area: 'Dhanmondi' },
    { name: 'Karim Electronics', business: 'Karim Electronics', phone: '+8801700000002', category: categories[1], lat: 23.7925, lng: 90.4078, area: 'Gulshan' },
    { name: 'Fatima Fashion', business: 'Fatima Fashion House', phone: '+8801700000003', category: categories[2], lat: 23.7505, lng: 90.3919, area: 'Mirpur' },
    { name: 'Alif Restaurant', business: 'Alif Restaurant', phone: '+8801700000004', category: categories[3], lat: 23.7461, lng: 90.3742, area: 'Uttara' },
    { name: 'MediCare Pharmacy', business: 'MediCare Pharmacy', phone: '+8801700000005', category: categories[4], lat: 23.7381, lng: 90.3941, area: 'Banani' },
  ];

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
        sellerDelivery: {
          enabled: true,
          radius: 10,
          zones: [
            { name: 'Nearby', minDistance: 0, maxDistance: 2, fee: 30, estimatedTime: 20 },
            { name: 'Medium', minDistance: 2, maxDistance: 5, fee: 50, estimatedTime: 35 },
            { name: 'Far', minDistance: 5, maxDistance: 10, fee: 80, estimatedTime: 50 },
          ],
          freeDeliveryThreshold: 500,
          minimumOrder: 50,
          estimatedPreparationTime: 30,
        },
        platformDelivery: { enabled: true },
        selfPickup: { enabled: true },
      },
      openingHours: { open: '09:00', close: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
    });

    const shop = await Shop.create({
      sellerId: seller._id,
      name: data.business,
      slug: data.business.toLowerCase().replace(/\s+/g, '-'),
      description: `Welcome to ${data.business}. We provide quality products and services.`,
      category: data.category._id,
      location: {
        type: 'Point',
        coordinates: [data.lng, data.lat],
        address: `${data.area}, Dhaka`,
        area: data.area,
        upazila: 'Dhaka Sadar',
        district: 'Dhaka',
        division: 'Dhaka',
      },
      address: `${data.area}, Dhaka`,
      phone: data.phone,
      rating: 4 + Math.random(),
      totalRatings: Math.floor(Math.random() * 100) + 10,
      totalOrders: Math.floor(Math.random() * 500) + 50,
      isOpen: true,
      isFeatured: Math.random() > 0.5,
      isVerified: true,
      openingHours: { open: '09:00', close: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
    });

    await Seller.findByIdAndUpdate(seller._id, { shopId: shop._id });
    await SellerWallet.create({
      sellerId: seller._id,
      pendingBalance: 0,
      availableBalance: Math.floor(Math.random() * 10000),
      totalEarned: Math.floor(Math.random() * 50000),
      totalWithdrawn: Math.floor(Math.random() * 30000),
    });

    sellers.push(seller);
    shops.push(shop);
  }
  console.log(`🏪 Created ${sellers.length} sellers and shops`);

  // Create Products
  const productData = [
    // Grocery products (shop 0)
    { name: 'Fresh Basmati Rice 5kg', price: 650, stock: 50, category: categories[0], shop: shops[0], seller: sellers[0] },
    { name: 'Soybean Oil 5L', price: 890, discountPrice: 820, stock: 30, category: categories[0], shop: shops[0], seller: sellers[0] },
    { name: 'Sugar 1kg', price: 120, stock: 100, category: categories[0], shop: shops[0], seller: sellers[0] },
    { name: 'Red Lentils (Masoor Dal) 1kg', price: 140, stock: 80, category: categories[0], shop: shops[0], seller: sellers[0] },
    { name: 'Fresh Milk 1L', price: 80, stock: 40, category: categories[0], shop: shops[0], seller: sellers[0] },
    { name: 'Wheat Flour (Atta) 2kg', price: 130, stock: 60, category: categories[0], shop: shops[0], seller: sellers[0] },

    // Electronics (shop 1)
    { name: 'Wireless Bluetooth Earbuds', price: 1500, discountPrice: 1200, stock: 25, category: categories[1], shop: shops[1], seller: sellers[1] },
    { name: 'USB-C Fast Charger 20W', price: 450, stock: 40, category: categories[1], shop: shops[1], seller: sellers[1] },
    { name: 'Power Bank 10000mAh', price: 1200, discountPrice: 999, stock: 20, category: categories[1], shop: shops[1], seller: sellers[1] },
    { name: 'LED Desk Lamp', price: 800, stock: 15, category: categories[1], shop: shops[1], seller: sellers[1] },
    { name: 'Smart Watch Fitness Tracker', price: 2500, discountPrice: 1999, stock: 12, category: categories[1], shop: shops[1], seller: sellers[1] },

    // Fashion (shop 2)
    { name: 'Cotton Panjabi - White', price: 1200, discountPrice: 999, stock: 20, category: categories[2], shop: shops[2], seller: sellers[2] },
    { name: 'Saree - Jamdani', price: 3500, stock: 10, category: categories[2], shop: shops[2], seller: sellers[2] },
    { name: 'Kids T-Shirt Pack (3pc)', price: 600, discountPrice: 450, stock: 30, category: categories[2], shop: shops[2], seller: sellers[2] },
    { name: 'Leather Wallet', price: 800, stock: 25, category: categories[2], shop: shops[2], seller: sellers[2] },

    // Restaurant (shop 3)
    { name: 'Chicken Biryani', price: 250, stock: 100, category: categories[3], shop: shops[3], seller: sellers[3] },
    { name: 'Beef Tehari', price: 280, stock: 80, category: categories[3], shop: shops[3], seller: sellers[3] },
    { name: 'Mixed Vegetable Curry', price: 120, stock: 60, category: categories[3], shop: shops[3], seller: sellers[3] },
    { name: 'Naan Bread (2pc)', price: 40, stock: 200, category: categories[3], shop: shops[3], seller: sellers[3] },

    // Pharmacy (shop 4)
    { name: 'Paracetamol 500mg (10 tabs)', price: 20, stock: 500, category: categories[4], shop: shops[4], seller: sellers[4] },
    { name: 'Vitamin C 1000mg (30 tabs)', price: 350, stock: 100, category: categories[4], shop: shops[4], seller: sellers[4] },
    { name: 'Hand Sanitizer 500ml', price: 180, discountPrice: 150, stock: 70, category: categories[4], shop: shops[4], seller: sellers[4] },
    { name: 'Digital Thermometer', price: 450, stock: 30, category: categories[4], shop: shops[4], seller: sellers[4] },
  ];

  const products = [];
  for (const data of productData) {
    const product = await Product.create({
      sellerId: data.seller._id,
      shopId: data.shop._id,
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
      description: `High quality ${data.name}. Available at ${data.shop.name}.`,
      images: [],
      category: data.category._id,
      sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      price: data.price,
      discountPrice: data.discountPrice,
      stock: data.stock,
      lowStockThreshold: 5,
      unit: 'piece',
      status: 'active',
      rating: 3.5 + Math.random() * 1.5,
      totalRatings: Math.floor(Math.random() * 50),
      totalSold: Math.floor(Math.random() * 100),
      tags: [data.category.name.toLowerCase()],
      searchKeywords: data.name.toLowerCase().split(' '),
      location: data.shop.location,
    });
    products.push(product);
  }
  console.log(`📦 Created ${products.length} products`);

  // Create Customers
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customers = [];

  const customerData = [
    { name: 'Aminul Islam', phone: '+8801700000001' },
    { name: 'Nusrat Jahan', phone: '+8801700000002' },
    { name: 'Karim Uddin', phone: '+8801700000003' },
    { name: 'Sumaiya Akter', phone: '+8801700000004' },
    { name: 'Rafiq Ahmed', phone: '+8801700000005' },
  ];

  for (const data of customerData) {
    const user = await User.create({
      name: data.name,
      phone: data.phone,
      password: customerPassword,
      role: 'customer',
      isVerified: true,
      isActive: true,
    });

    await CustomerProfile.create({
      userId: user._id,
      referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      savedAddresses: [{
        label: 'Home',
        name: data.name,
        phone: data.phone,
        address: 'House 12, Road 5, Dhanmondi',
        area: 'Dhanmondi',
        upazila: 'Dhaka Sadar',
        district: 'Dhaka',
        division: 'Dhaka',
        location: { type: 'Point', coordinates: [90.3800 + Math.random() * 0.05, 23.7500 + Math.random() * 0.05] },
        isDefault: true,
      }],
      loyaltyPoints: Math.floor(Math.random() * 100),
      totalOrders: Math.floor(Math.random() * 10),
      totalSpent: Math.floor(Math.random() * 5000),
    });

    customers.push(user);
  }
  console.log(`👥 Created ${customers.length} customers`);

  // Create Rider
  const riderPassword = await bcrypt.hash('Rider123!', 12);
  const riderUser = await User.create({
    name: 'Hasan Rider',
    phone: '+8801700000099',
    password: riderPassword,
    role: 'rider',
    isVerified: true,
    isActive: true,
  });
  
  await Rider.create({
    userId: riderUser._id,
    name: 'Hasan Rider',
    phone: '+8801700000099',
    vehicleType: 'motorcycle',
    vehicleNumber: 'DHAKA-M-123456',
    serviceArea: { type: 'Point', coordinates: [90.4, 23.75] },
    isOnline: true,
    isActive: true,
    isAvailable: true,
    rating: 4.8,
  });
  console.log('🏍️ Created rider: +8801700000099 / Rider123!');

  // Create Sample Coupons
  await Coupon.insertMany([
    {
      code: 'WELCOME50',
      type: 'fixed',
      value: 50,
      minOrder: 200,
      usageLimit: 1000,
      usedCount: 0,
      perUserLimit: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdBy: 'system',
    },
    {
      code: 'FIRST10',
      type: 'percentage',
      value: 10,
      minOrder: 100,
      maxDiscount: 100,
      usageLimit: 500,
      usedCount: 0,
      perUserLimit: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdBy: 'system',
    },
    {
      code: 'FREEDEL',
      type: 'free_delivery',
      value: 0,
      minOrder: 300,
      usageLimit: 200,
      usedCount: 0,
      perUserLimit: 2,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdBy: 'system',
    },
  ]);
  console.log('🎟️ Created sample coupons');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Demo Credentials:');
  console.log('==================');
  console.log('Admin:    admin@localmart.com / Admin123!');
  console.log('Sellers:  rahim.store@localmart.com / Seller123!');
  console.log('          karim.electronics@localmart.com / Seller123!');
  console.log('          (and more...)');
  console.log('Customer: +8801700000001 / Customer123!');
  console.log('Rider:    +8801700000099 / Rider123!');
  console.log('\n⚠️  These are DEVELOPMENT credentials. Never use in production.');

  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
