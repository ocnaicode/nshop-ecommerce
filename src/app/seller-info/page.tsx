import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store, TrendingUp, Truck, Wallet, Package, ShieldCheck } from 'lucide-react';

export default function SellerInfoPage() {
  const benefits = [
    { icon: TrendingUp, title: 'Grow Your Sales', desc: 'Reach thousands of nearby customers actively looking for products in your area.' },
    { icon: Truck, title: 'Flexible Delivery', desc: 'Deliver yourself, use LocalMart riders, or offer self-pickup — you choose.' },
    { icon: Wallet, title: 'Fast Payouts', desc: 'Withdraw your earnings anytime to bKash, Nagad, or your bank account.' },
    { icon: Package, title: 'Easy Inventory', desc: 'Manage products, stock levels, and prices from a simple dashboard.' },
    { icon: ShieldCheck, title: 'Trusted Platform', desc: 'Secure payments, verified customers, and dispute resolution when you need it.' },
    { icon: Store, title: 'Your Own Storefront', desc: 'Get a beautiful shop page with your branding, ratings, and product catalog.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Bring Your Shop Online</h1>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Join LocalMart and connect with customers in your neighborhood. Set up your
            storefront in minutes — no technical skills needed.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/register?role=seller">
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                Become a Seller — Free
              </Button>
            </Link>
            <Link href="/seller/plans">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-green-600">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Why Sell on LocalMart?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-500">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to start selling?</h2>
          <p className="text-gray-500 mb-6">Create your seller account today and get your first listing live in minutes.</p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/register?role=seller">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Login to Seller Panel</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
