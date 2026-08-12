'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Store, Package, ShoppingCart, Users, TrendingUp,
  DollarSign, AlertCircle, Settings, LogOut, BarChart3,
  Plus, List, Truck, CreditCard, Star
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'seller') {
      fetchDashboard();
    }
  }, [user, authLoading]);

  async function fetchDashboard() {
    try {
      const [ordersRes] = await Promise.all([
        fetch('/api/orders?limit=5'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setRecentOrders(data.data || []);

        // Calculate stats from orders
        const orders = data.data || [];
        const today = new Date().toDateString();
        const todayOrders = orders.filter((o: any) => new Date(o.createdAt).toDateString() === today);
        const pendingOrders = orders.filter((o: any) => o.status === 'pending');

        setStats({
          todayRevenue: todayOrders.reduce((sum: number, o: any) => sum + o.total, 0),
          todayOrders: todayOrders.length,
          pendingOrders: pendingOrders.length,
          totalOrders: orders.length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
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

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Seller Panel</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-green-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : formatCurrency(stats?.todayRevenue || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Today's Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats?.todayOrders || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats?.pendingOrders || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats?.totalOrders || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/seller/products/new">
              <Button className="w-full" size="lg">
                <Plus className="mr-2" /> Add Product
              </Button>
            </Link>
            <Link href="/seller/pos">
              <Button variant="outline" className="w-full" size="lg">
                <CreditCard className="mr-2" /> Open POS
              </Button>
            </Link>
            <Link href="/seller/orders">
              <Button variant="outline" className="w-full" size="lg">
                <ShoppingCart className="mr-2" /> View Orders
              </Button>
            </Link>
            <Link href="/seller/inventory">
              <Button variant="outline" className="w-full" size="lg">
                <Package className="mr-2" /> Inventory
              </Button>
            </Link>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/seller/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      href={`/seller/orders/${order._id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <ShoppingCart className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {order.items.length} items • {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'pending' ? 'warning' :
                            order.status === 'cancelled' ? 'destructive' : 'secondary'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <p className="text-sm text-gray-400 mt-1">Orders will appear here when customers place them</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
