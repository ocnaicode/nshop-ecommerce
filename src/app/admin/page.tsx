'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart,
  DollarSign, Truck, Star, Settings, LogOut, Shield,
  TrendingUp, AlertCircle, Tag, BarChart3, Flag, Bell
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) {
      router.push('/login');
      return;
    }
    if (user && ['super_admin', 'admin'].includes(user.role)) {
      fetchDashboard();
    }
  }, [user, authLoading]);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Store, label: 'Sellers', href: '/admin/sellers' },
    { icon: Store, label: 'Shops', href: '/admin/shops' },
    { icon: Package, label: 'Products', href: '/admin/products' },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: DollarSign, label: 'Payments', href: '/admin/payments' },
    { icon: Truck, label: 'Delivery', href: '/admin/delivery' },
    { icon: Users, label: 'Riders', href: '/admin/riders' },
    { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
    { icon: Star, label: 'Reviews', href: '/admin/reviews' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Flag, label: 'Disputes', href: '/admin/disputes' },
    { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="default">
              <Shield className="w-3 h-3 mr-1" /> {user.role.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-gray-600">{user.name}</span>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
              { label: 'Total Sellers', value: stats?.totalSellers || 0, icon: Store, color: 'green' },
              { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'purple' },
              { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'yellow' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {menuItems.slice(0, 6).map((item) => (
              <Link key={item.label} href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <item.icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Platform Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Active Sellers', value: stats?.activeSellers || 0 },
                  { label: 'Pending Verifications', value: stats?.pendingVerifications || 0 },
                  { label: 'Open Disputes', value: stats?.openDisputes || 0 },
                  { label: 'Pending Withdrawals', value: stats?.pendingWithdrawals || 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="font-semibold">{loading ? '...' : item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'COD', enabled: true },
                  { label: 'bKash', enabled: false },
                  { label: 'Nagad', enabled: false },
                  { label: 'Platform Delivery', enabled: true },
                  { label: 'AI Features', enabled: false },
                  { label: 'POS', enabled: true },
                ].map((flag) => (
                  <div key={flag.label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{flag.label}</span>
                    <Badge variant={flag.enabled ? 'success' : 'secondary'}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
