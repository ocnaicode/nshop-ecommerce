# LocalMart - Location-Based Local Marketplace

A production-ready, full-stack location-based marketplace platform for Bangladesh. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## 🌟 Features

### For Customers
- **Location-based discovery** - Find nearby shops and products
- **Multi-vendor marketplace** - Shop from multiple local sellers
- **Multiple payment methods** - Cash on Delivery, bKash, Nagad, SSLCommerz (cards, internet banking, mobile wallets)
- **Multiple delivery options** - Seller delivery, platform delivery, self pickup
- **Advanced shipping calculator** - Distance-based zone pricing, free-delivery thresholds, platform fee caps, live checkout estimates
- **Order tracking** - Real-time order status updates
- **Reviews & ratings** - Rate products and sellers
- **Wishlist & favorites** - Save products and shops
- **Loyalty & rewards program** - Earn points on every order, redeem at checkout, referral bonuses
- **Push notifications** - Web Push (VAPID) alerts for order & payment updates
- **Multi-language** - English and বাংলা (cookie & localStorage backed, switcher in header/footer)

### For Sellers
- **Digital storefront** - Create and manage your shop
- **Product management** - Add products with variants, inventory tracking
- **Order management** - Receive and process orders
- **POS system** - Point of sale for in-store sales
- **Inventory management** - Track stock, purchases, suppliers
- **Customer CRM** - Manage customer relationships
- **Analytics dashboard** - Sales, revenue, customer insights
- **Wallet & withdrawals** - Track earnings and withdraw
- **Coupons & promotions** - Create discount codes
- **Staff management** - Add staff with configurable permissions

### For Platform Admins
- **Complete control** - Manage users, sellers, products, orders
- **Commission engine** - Configurable commission rules
- **Subscription plans** - Free, Basic, Business, Pro tiers
- **Feature flags** - Enable/disable features dynamically
- **Delivery management** - Manage riders and deliveries
- **Dispute resolution** - Handle customer-seller disputes
- **Advanced analytics dashboard** - Revenue, orders, users & sellers with charts
- **Marketing automation** - Create & send in-app/push/SMS/email campaigns to targeted audiences
- **SEO optimization** - sitemap.xml, robots.txt, Open Graph, Twitter cards, JSON-LD, canonical URLs, security headers

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom shadcn/ui-style components
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with secure httpOnly cookies
- **Validation**: Zod
- **File Storage**: Cloudinary (ready)
- **Payment**: bKash (tokenized), Nagad, SSLCommerz (hosted v4) with sandbox-ready gateway abstraction
- **Push Notifications**: Web Push (VAPID) with `web-push`
- **AI**: Optional, provider-agnostic AI features

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+ (local or Atlas)
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd nshop-ecommerce
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `MONGODB_URI` - Your MongoDB connection string
- `AUTH_SECRET` - A secure random string for JWT signing
- `CLOUDINARY_*` - Cloudinary credentials (optional, for image uploads)

### 3. Database Setup

Start MongoDB (if using local):

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 4. Seed the Database

```bash
npm run seed
```

This creates:
- Admin user
- Sample sellers and shops
- Sample products
- Sample customers
- Categories
- Subscription plans
- Commission rules
- Feature flags
- System configuration

**Demo Credentials:**
- Admin: `admin@localmart.com` / `Admin123!`
- Seller: `rahim.store@localmart.com` / `Seller123!`
- Customer: `+8801700000001` / `Customer123!`
- Rider: `+8801700000099` / `Rider123!`

⚠️ **These are development credentials only. Never use in production.**

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
nshop-ecommerce/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (public)/          # Public pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── shops/
│   │   │   ├── orders/
│   │   │   ├── cart/
│   │   │   └── admin/
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   ├── customer/          # Customer dashboard
│   │   ├── products/          # Product pages
│   │   ├── seller/            # Seller dashboard
│   │   ├── shop/              # Shop pages
│   │   └── rider/             # Rider dashboard
│   ├── components/            # React components
│   │   ├── ui/               # UI components (Button, Card, etc.)
│   │   ├── providers/        # Context providers
│   │   ├── layout/           # Layout components
│   │   └── shared/           # Shared components
│   ├── config/               # Configuration
│   │   └── constants.ts
│   ├── lib/                  # Utilities
│   │   ├── db.ts            # Database connection
│   │   ├── auth.ts          # Auth utilities
│   │   └── utils.ts         # General utilities
│   ├── models/               # MongoDB models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Shop.ts
│   │   ├── Order.ts
│   │   ├── Seller.ts
│   │   └── index.ts         # All other models
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   └── validators/           # Zod schemas
│       └── index.ts
├── scripts/
│   └── seed.ts              # Database seeding
├── public/                  # Static assets
├── .env.example            # Environment template
├── .env.local              # Local environment (not in git)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `AUTH_SECRET` - JWT signing secret
- `CLOUDINARY_*` - Image storage (optional)
- `ENABLE_BKASH` + `BKASH_*` - bKash payment gateway (tokenized)
- `ENABLE_NAGAD` + `NAGAD_*` - Nagad payment gateway
- `ENABLE_SSLCOMMERZ` + `SSLCOMMERZ_*` - SSLCommerz payment gateway
- `LOYALTY_*` - Loyalty & rewards program tuning
- `PLATFORM_DELIVERY_MIN_FEE` / `PLATFORM_DELIVERY_MAX_FEE` - Shipping calculator caps
- `NEXT_PUBLIC_ENABLE_PUSH` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` - Push notifications (generate with `npx web-push generate-vapid-keys`)
- `SMS_*` / `SMTP_*` - Marketing automation channels
- `NEXT_PUBLIC_OG_IMAGE` - Open Graph share image
- `AI_*` - AI provider (optional, features disabled if not configured)

### Feature Flags

Feature flags can be managed from the admin dashboard or directly in the database:

- `cod` - Cash on Delivery
- `bkash` - bKash payment
- `nagad` - Nagad payment
- `seller_delivery` - Seller-managed delivery
- `platform_delivery` - Platform delivery
- `self_pickup` - Self pickup
- `ai` - AI features
- `pos` - Point of sale
- `inventory` - Inventory management
- `loyalty` - Loyalty program
- `referral` - Referral program

### Subscription Plans

Four tiers available (configurable from admin):
- **Free** - 10 products, basic features
- **Basic** (৳500/mo) - 50 products, analytics, coupons
- **Business** (৳1500/mo) - 200 products, CRM, promotions
- **Pro** (৳3000/mo) - Unlimited products, POS, inventory

### Commission Rules

Commission can be configured at multiple levels:
- Global (default)
- Category-specific
- Seller-specific
- Product-specific
- Subscription plan-specific
- Delivery mode-specific

## 🎯 Key Workflows

### Customer Flow
1. Register/Login
2. Enable location or select area
3. Browse nearby shops and products
4. Add products to cart
5. Checkout with address, delivery method, payment
6. Track order
7. Receive delivery
8. Leave review
9. Earn loyalty points

### Seller Flow
1. Register as seller
2. Complete verification
3. Choose subscription plan
4. Create shop
5. Configure delivery methods
6. Add products
7. Receive orders
8. Process and deliver
9. Track earnings in wallet
10. Withdraw to bank/MFS

### Admin Flow
1. Login as admin
2. Monitor platform health
3. Approve seller verifications
4. Manage users and content
5. Configure commission and fees
6. Handle disputes
7. View analytics

## 🔐 Security

- Password hashing with bcrypt (12 rounds)
- JWT tokens in httpOnly cookies
- Role-based access control (RBAC)
- Server-side validation with Zod
- CSRF protection
- Rate limiting architecture
- Input sanitization
- Secure file upload validation
- No sensitive data in client bundles

## 📊 Database Models

Core collections:
- User (customers, sellers, admins, riders)
- CustomerProfile
- Seller
- SellerStaff
- Shop
- Product
- ProductVariant
- Category
- Order
- OrderItem
- Payment
- Cart
- Review
- Inventory
- InventoryTransaction
- Supplier
- Purchase
- POSSession
- POSSale
- SellerWallet
- WalletTransaction
- Withdrawal
- Coupon
- Promotion
- SubscriptionPlan
- CommissionRule
- Delivery
- Rider
- Notification
- Conversation
- Message
- LoyaltyAccount
- LoyaltyTransaction
- Referral
- Dispute
- Banner
- SponsoredListing
- BusinessDirectory
- AnalyticsEvent
- AuditLog
- FeatureFlag
- SystemConfig
- AIUsage

All models include proper indexes for performance.

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

The app is compatible with any Node.js hosting platform that supports Next.js.

### MongoDB Atlas

1. Create a free cluster
2. Get connection string
3. Add to environment variables

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run seed         # Seed database with sample data
```

## 🤝 Contributing

This is a production-ready application. When contributing:

1. Follow TypeScript best practices
2. Maintain separation of concerns
3. Use Zod for validation
4. Write meaningful commit messages
5. Test your changes
6. Update documentation

## 📄 License

This project is proprietary software.

## 🆘 Support

For issues and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

## 🌍 Bangladesh-Specific Features

- BDT currency (৳)
- Bangladesh phone number validation
- bKash and Nagad payment integration (ready)
- Local address format (Upazila, District, Division)
- Bangla language support architecture
- Local business directory
- COD with risk management

## 📈 Scalability

The architecture supports:
- Single upazila → District → Division → Nationwide
- Horizontal scaling with MongoDB Atlas
- CDN for static assets
- Caching layer (ready)
- Load balancing (ready)

## 🎨 Customization

### Branding

Update in `SystemConfig` collection or admin dashboard:
- Brand name
- Logo
- Favicon
- Primary color
- Contact information

### Themes

Modify CSS variables in `src/app/globals.css`

## ☁️ Deploying to Vercel

### 1. Import the project

Push this repository to GitHub, then import it at [vercel.com/new](https://vercel.com/new) (or use the CLI):

```bash
npm i -g vercel
vercel --prod
```

### 2. Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `AUTH_SECRET` | ✅ | Long random string — generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_DESCRIPTION` | | Branding |
| `ENABLE_BKASH` / `BKASH_APP_KEY` / `BKASH_APP_SECRET` / `BKASH_USERNAME` / `BKASH_PASSWORD` | 🧾 | Set `ENABLE_BKASH=true` + merchant credentials (sandbox by default) |
| `ENABLE_NAGAD` / `NAGAD_MERCHANT_ID` / `NAGAD_MERCHANT_KEY` / `NAGAD_PG_PUBLIC_KEY` | 🧾 | Set `ENABLE_NAGAD=true` + merchant credentials |
| `ENABLE_SSLCOMMERZ` / `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` | 🧾 | Set `ENABLE_SSLCOMMERZ=true` + store credentials (sandbox by default) |
| `NEXT_PUBLIC_ENABLE_PUSH` | 🍎 | `true` to enable Web Push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | 🍎 | `npx web-push generate-vapid-keys` |
| `LOYALTY_EARN_RATE` / `LOYALTY_REDEEM_RATE` / `LOYALTY_MAX_REDEEM_PCT` / `LOYALTY_REFERRAL_BONUS` | | Loyalty tuning (sane defaults) |
| `PLATFORM_DELIVERY_MIN_FEE` / `PLATFORM_DELIVERY_MAX_FEE` | | Shipping calculator caps |
| `CLOUDINARY_*` | | Product image uploads |
| `SMS_API_KEY` / `SMS_BASE_URL` / `SMTP_*` | | Marketing automation channels (optional) |
| `NEXT_PUBLIC_OG_IMAGE` | | Open Graph image URL |

> 🧾 Payment gateways: leave the `ENABLE_*` flags `false` (and credentials empty) to run COD-only; the checkout hides unconfigured gateways automatically.

### 3. Database

Use **MongoDB Atlas** (or any reachable MongoDB). Add the app's server IP to the Atlas network access allowlist, then run `npm run seed` locally once against the production URI, or call `POST /api/seed` from the Vercel app in demo mode.

## ⚠️ Important Notes

1. **Never commit `.env.local`** - Contains secrets
2. **Change `AUTH_SECRET`** in production
3. **Use strong passwords** for all accounts
4. **Configure Cloudinary** for production image uploads
5. **Set up payment providers** before going live
6. **Enable HTTPS** in production
7. **Configure rate limiting** in production
8. **Set up monitoring and logging**
9. **Regular database backups**
10. **Test thoroughly** before deployment

## 🎉 Acknowledgments

Built with modern web technologies and best practices for Bangladesh's local commerce ecosystem.

**Built with ❤️ for local businesses in Bangladesh**
