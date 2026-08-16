'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/dashboard/sidebar';
import StatCard from '@/components/dashboard/stat-card';
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart, DollarSign,
  Truck, Star, Settings, Shield, Tag, BarChart3, Flag, Bell, Megaphone,
  Menu, Activity, Cpu, CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react';
import { formatCurrency, getTimeAgo, cn } from '@/lib/utils';

interface AdminData {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalProducts: number;
  totalShops: number;
  activeSellers: number;
  pendingVerifications: number;
  openDisputes: number;
  pendingWithdrawals: number;
  totalRevenue: number;
  trends: { users: number; orders: number };
  recentActivity: ActivityRow[];
}

interface ActivityRow {
  _id: string;
  action: string;
  target: string;
  createdAt: string;
  actorId?: { name?: string; role?: string };
}

interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin', active: true },
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
  { icon: Megaphone, label: 'Campaigns', href: '/admin/campaigns' },
  { icon: Flag, label: 'Disputes', href: '/admin/disputes' },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (res.ok) {
        const json = await res.json();
        setFlags(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch feature flags:', err);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) {
      router.push('/login');
      return;
    }
    if (user && ['super_admin', 'admin'].includes(user.role)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboard();
      fetchFlags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function toggleFlag(flag: FeatureFlag) {
    setTogglingFlag(flag._id);
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag._id, enabled: !flag.enabled }),
      });
      if (res.ok) {
        setFlags((prev) => prev.map((f) => (f._id === flag._id ? { ...f, enabled: !f.enabled } : f)));
      }
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    } finally {
      setTogglingFlag(null);
    }
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const healthItems = [
    { label: 'Active Sellers', value: data?.activeSellers ?? 0, icon: CheckCircle2, tone: 'text-green-500 bg-green-500/10' },
    { label: 'Pending Verifications', value: data?.pendingVerifications ?? 0, icon: Clock, tone: 'text-amber-500 bg-amber-500/10' },
    { label: 'Open Disputes', value: data?.openDisputes ?? 0, icon: AlertTriangle, tone: 'text-red-500 bg-red-500/10' },
    { label: 'Pending Withdrawals', value: data?.pendingWithdrawals ?? 0, icon: DollarSign, tone: 'text-blue-500 bg-blue-500/10' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex">
      <Sidebar
        variant="dark"
        brandTitle="Admin Panel"
        brandSubtitle="LocalMart Control"
        brandIcon={Shield}
        items={menuItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        headerClassName="from-gray-900 via-gray-900 to-indigo-950 border-b border-white/10"
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-gray-900/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/5">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              <Shield className="w-3 h-3 mr-1" /> {user.role.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-gray-400">{user.name}</span>
            <div className="w-9 h-9 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-300">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Control center banner */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8"
          >
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-200 text-sm mb-1">
                  <Cpu className="w-4 h-4" /> Platform Control Center
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {loading ? 'Loading overview…' : `${data?.totalShops ?? 0} shops · ${data?.totalProducts ?? 0} products live`}
                </h2>
                <p className="text-indigo-100 mt-1 text-sm">
                  {formatCurrency(data?.totalRevenue || 0)} revenue from {data?.totalOrders ?? 0} orders
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href="/admin/users">
                  <Button className="bg-white text-indigo-700 hover:bg-indigo-50">Manage Users</Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">Analytics</Button>
                </Link>
              </div>
            </div>
          </motion.section>

          {/* Stats with trends */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard index={0} label="Total Users" value={data?.totalUsers ?? 0} icon={Users} trend={data?.trends.users} trendLabel="vs last week" tone="blue" loading={loading} />
            <StatCard index={1} label="Total Sellers" value={data?.totalSellers ?? 0} icon={Store} trend={null} tone="green" loading={loading} />
            <StatCard index={2} label="Total Orders" value={data?.totalOrders ?? 0} icon={ShoppingCart} trend={data?.trends.orders} trendLabel="vs last week" tone="purple" loading={loading} />
            <StatCard index={3} label="Total Revenue" value={formatCurrency(data?.totalRevenue || 0)} icon={DollarSign} trend={null} tone="yellow" loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform health */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gray-900 border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" /> Platform Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {healthItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center', item.tone)}>
                          <item.icon className="w-4 h-4" />
                        </span>
                        <span className="text-sm text-gray-300">{item.label}</span>
                      </div>
                      <span className="font-semibold text-white">{loading ? '…' : item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent activity feed */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="bg-gray-900 border-white/10 h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white text-lg">Recent Activity</CardTitle>
                  <Activity className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  {data?.recentActivity?.length ? (
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {data.recentActivity.map((log) => (
                        <div key={log._id} className="flex items-start gap-3 py-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Activity className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-200">
                              <span className="font-medium text-white">{log.actorId?.name || 'System'}</span>{' '}
                              <span className="text-gray-400">{log.action}</span>{' '}
                              <span className="text-gray-500">{log.target}</span>
                            </p>
                            <p className="text-xs text-gray-500">{getTimeAgo(log.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature flags */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
              <Card className="bg-gray-900 border-white/10 h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white text-lg">Feature Flags</CardTitle>
                  <Link href="/admin/feature-flags">
                    <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">Manage</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {flags.length ? (
                    flags.slice(0, 6).map((flag) => (
                      <div key={flag._id} className="flex items-center justify-between py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-200">{flag.name}</p>
                          <p className="text-xs text-gray-500 truncate">{flag.key}</p>
                        </div>
                        <button
                          onClick={() => toggleFlag(flag)}
                          disabled={togglingFlag === flag._id}
                          className={cn(
                            'relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
                            flag.enabled ? 'bg-green-500' : 'bg-gray-700'
                          )}
                          aria-label={`Toggle ${flag.name}`}
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                              flag.enabled ? 'translate-x-5' : 'translate-x-0.5'
                            )}
                          />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      {['COD Payments', 'bKash', 'Nagad', 'Platform Delivery', 'AI Features', 'POS'].map((name) => (
                        <div key={name} className="flex items-center justify-between py-2">
                          <p className="text-sm text-gray-400">{name}</p>
                          <div className="w-11 h-6 rounded-full bg-gray-800" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
