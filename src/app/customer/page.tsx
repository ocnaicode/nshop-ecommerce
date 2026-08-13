'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, Heart, MapPin, Gift, ShoppingCart, ChevronRight,
  LogOut, ArrowRight, Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

interface RecentOrder {
  _id: string;
  orderNumber: string;
  items?: { length?: number };
  total: number;
  status: string;
  createdAt: string;
}

interface Summary {
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
  addressesCount: number;
  loyaltyPoints: number;
  recentOrders: RecentOrder[];
}

function statusVariant(status: string) {
  if (status === 'delivered') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'cancelled') return 'destructive';
  return 'secondary';
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/customer/dashboard');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const firstName = user.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Total Orders', value: summary?.totalOrders ?? 0, icon: Package, href: '/customer/orders', tone: 'bg-green-100 text-green-600' },
    { label: 'Wishlist Items', value: summary?.wishlistCount ?? 0, icon: Heart, href: '/customer/wishlist', tone: 'bg-rose-100 text-rose-600' },
    { label: 'Saved Addresses', value: summary?.addressesCount ?? 0, icon: MapPin, href: '/customer/addresses', tone: 'bg-blue-100 text-blue-600' },
    { label: 'Loyalty Points', value: summary?.loyaltyPoints ?? 0, icon: Gift, href: '/customer/profile', tone: 'bg-amber-100 text-amber-600' },
  ];

  const quickActions = [
    { label: 'Shop Now', desc: 'Discover local shops', icon: ShoppingCart, href: '/products', primary: true },
    { label: 'Track Orders', desc: 'View order history', icon: Package, href: '/customer/orders' },
    { label: 'My Wishlist', desc: 'Saved items', icon: Heart, href: '/customer/wishlist' },
    { label: 'Edit Profile', desc: 'Manage account', icon: Sparkles, href: '/customer/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">My Account</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </motion.div>

        {/* Welcome banner */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 text-white p-8 md:p-10 mb-8"
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 bottom-0 w-40 h-40 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-green-100 text-sm mb-1">{greeting},</p>
              <h1 className="text-3xl font-bold">{firstName}! 👋</h1>
              <p className="text-green-50 mt-2 max-w-md">
                You&apos;ve spent {formatCurrency(summary?.totalSpent || 0)} across {summary?.totalOrders || 0} orders.
                Keep supporting local businesses!
              </p>
            </div>
            <Link href="/products" className="shrink-0">
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 rounded-full px-8">
                Start Shopping <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Stats cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Link href={stat.href}>
                <Card className="hover:shadow-md transition-shadow h-full group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.tone}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      {loading ? (
                        <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 ml-auto transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div
                  className={`p-5 rounded-xl border h-full transition-all hover:shadow-md ${
                    action.primary
                      ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                      : 'bg-white border-gray-200 text-gray-900 hover:border-green-200'
                  }`}
                >
                  <action.icon className={`w-6 h-6 mb-3 ${action.primary ? 'text-white' : 'text-green-600'}`} />
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className={`text-xs mt-0.5 ${action.primary ? 'text-green-100' : 'text-gray-500'}`}>{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Recent orders */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Link href="/customer/orders">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : summary?.recentOrders?.length ? (
                <div className="divide-y divide-gray-100">
                  {summary.recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      href={`/customer/orders/${order._id}`}
                      className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} ·{' '}
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                          <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <Link href="/products" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block font-medium">
                    Start Shopping
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
