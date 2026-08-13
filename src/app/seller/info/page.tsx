import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Store, ShoppingCart, Wallet, BarChart3, Users, Headphones } from 'lucide-react';

export default function SellerCenterPage() {
  const sections = [
    {
      icon: Store,
      title: 'Store Setup',
      desc: 'Create your shop profile, add your logo, set opening hours, and configure delivery options.',
      href: '/register?role=seller',
    },
    {
      icon: ShoppingCart,
      title: 'Orders',
      desc: 'Track incoming orders in real time and update their status from accepted to delivered.',
      href: '/seller/orders',
    },
    {
      icon: Wallet,
      title: 'Wallet & Payouts',
      desc: 'Monitor your earnings, pending balances, and withdraw funds to bKash, Nagad, or bank.',
      href: '/seller/wallet',
    },
    {
      icon: BarChart3,
      title: 'Insights & Analytics',
      desc: 'Understand your sales performance, popular products, and customer behavior.',
      href: '/seller/insights',
    },
    {
      icon: Users,
      title: 'Customers',
      desc: 'Build relationships with repeat customers and keep them coming back.',
      href: '/seller/customers',
    },
    {
      icon: Headphones,
      title: 'Support',
      desc: 'Get help from the LocalMart team whenever you need it.',
      href: '/seller/support',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h1 className="text-3xl font-bold mb-3">Seller Center</h1>
          <p className="text-gray-400 max-w-2xl">
            Everything you need to run your shop on LocalMart — from your first listing
            to your first payout.
          </p>
          <div className="mt-6 flex items-center space-x-3">
            <Link href="/register?role=seller">
              <Button className="bg-green-600 hover:bg-green-500">Become a Seller</Button>
            </Link>
            <Link href="/seller">
              <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-800">
                Open Seller Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Explore Seller Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                    <section.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            {[
              { step: '1', title: 'Register', desc: 'Create your seller account in minutes' },
              { step: '2', title: 'List Products', desc: 'Add products with photos and prices' },
              { step: '3', title: 'Receive Orders', desc: 'Get notified on new customer orders' },
              { step: '4', title: 'Get Paid', desc: 'Withdraw your earnings anytime' },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
