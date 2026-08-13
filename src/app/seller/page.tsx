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
  Store, Package, ShoppingCart, Users, TrendingUp,
  DollarSign, Settings, BarChart3, Plus, List,
  Truck, CreditCard, Star, Menu, Percent, Receipt, Star as StarIcon,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface DashboardData {
  stats: {
    todayRevenue: number;
    todayOrders: number;
    pendingOrders: number;
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  trends: {
    revenue: number;
    orders: number;
  };
  rating: number;
  totalRatings: number;
  recentOrders: OrderRow[];
  topProducts: ProductRow[];
}

interface OrderRow {
  _id: string;
  orderNumber: string;
  items?: { length?: number };
  total: number;
  status: string;
  createdAt: string;
}

interface ProductRow {
  _id: string;
  name: string;
  price: number;
  totalSold: number;
  images?: string[];
}

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/seller', active: true },
  { icon: Package, label: 'Products', href: '/seller/products' },
  { icon: ShoppingCart, label: 'Orders', href: '/seller/orders' },
  { icon: List, label: 'Inventory', href: '/seller/inventory' },
  { icon: CreditCard, label: 'POS', href: '/seller/pos' },
  { icon: Users, label: 'Customers', href: '/seller/customers' },
  { icon: Truck, label: 'Delivery', href: '/seller/delivery' },
  { icon: DollarSign, label: 'Wallet', href: '/seller/wallet' },
  { icon: Star, label: 'Reviews', href: '/seller/reviews' },
  { icon: Settings, label: 'Settings', href: '/seller/settings' },
];

function statusVariant(status: string) {
  if (status === 'delivered') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'cancelled') return 'destructive';
  return 'secondary';
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/seller/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'seller') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboard();
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

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        variant="light"
        brandTitle="Seller Panel"
        brandSubtitle="LocalMart"
        brandIcon={Store}
        items={menuItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600">
              <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-semibold">{data?.rating?.toFixed?.(1) ?? '0.0'}</span>
              <span className="text-gray-400">({data?.totalRatings || 0})</span>
            </div>
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-green-700">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Stats with trends */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              index={0}
              label="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue || 0)}
              icon={DollarSign}
              trend={data?.trends.revenue}
              tone="green"
              loading={loading}
            />
            <StatCard
              index={1}
              label="Today's Orders"
              value={stats?.todayOrders || 0}
              icon={ShoppingCart}
              trend={data?.trends.orders}
              tone="blue"
              loading={loading}
            />
            <StatCard
              index={2}
              label="Pending Orders"
              value={stats?.pendingOrders || 0}
              icon={Package}
              tone="yellow"
              sublabel="Awaiting confirmation"
              loading={loading}
            />
            <StatCard
              index={3}
              label="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={TrendingUp}
              tone="purple"
              sublabel={`${stats?.totalOrders || 0} lifetime orders`}
              loading={loading}
            />
          </div>

          {/* Performance metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-green-100 text-sm">Avg Order Value</p>
                    <Receipt className="w-5 h-5 text-green-200" />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {loading ? '…' : formatCurrency(stats?.avgOrderValue || 0)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-blue-100 text-sm">Conversion Rate</p>
                    <Percent className="w-5 h-5 text-blue-200" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{loading ? '…' : `${stats?.conversionRate || 0}%`}</p>
                  <p className="text-xs text-blue-200 mt-1">Delivered vs total orders</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">Store Rating</p>
                    <StarIcon className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-gray-900">
                    {loading ? '…' : data?.rating?.toFixed?.(1) ?? '0.0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{data?.totalRatings || 0} ratings</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">Total Products</p>
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-gray-900">
                    {data?.topProducts?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Top sellers shown</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick actions */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/seller/products/new">
                <Button className="w-full justify-start" size="lg">
                  <Plus className="mr-2" /> Add Product
                </Button>
              </Link>
              <Link href="/seller/pos">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <CreditCard className="mr-2" /> Open POS
                </Button>
              </Link>
              <Link href="/seller/orders">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <ShoppingCart className="mr-2" /> Orders
                </Button>
              </Link>
              <Link href="/seller/inventory">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Package className="mr-2" /> Inventory
                </Button>
              </Link>
            </div>
          </motion.section>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent orders */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <Link href="/seller/orders">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : data?.recentOrders?.length ? (
                    <div className="divide-y divide-gray-100">
                      {data.recentOrders.map((order) => (
                        <Link
                          key={order._id}
                          href={`/seller/orders/${order._id}`}
                          className="flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-green-700">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · {formatDateTime(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top products */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Top Products</CardTitle>
                  <Link href="/seller/products">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : data?.topProducts?.length ? (
                    <div className="space-y-3">
                      {data.topProducts.map((product, i) => (
                        <div key={product._id} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {product.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                          </div>
                          <span className="text-xs font-medium text-green-600 shrink-0">
                            {product.totalSold || 0} sold
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No products yet</p>
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
