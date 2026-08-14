'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, ShoppingBag, ReceiptText, PackageCheck,
  Banknote, UserPlus, Download,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#6b7280'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [o, t, p, c, pm] = await Promise.all([
        fetch('/api/analytics/overview').then((r) => r.json()),
        fetch(`/api/analytics/timeseries?days=${days}`).then((r) => r.json()),
        fetch('/api/analytics/top-products?limit=8').then((r) => r.json()),
        fetch('/api/analytics/categories').then((r) => r.json()),
        fetch('/api/analytics/payment-methods').then((r) => r.json()),
      ]);
      if (o.success) setOverview(o.data);
      if (t.success) setTimeseries(t.data);
      if (p.success) setTopProducts(p.data);
      if (c.success) setCategories(c.data);
      if (pm.success) setPaymentMethods(pm.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) { router.push('/login'); return; }
    if (user) fetchAll();
  }, [user, authLoading, days, fetchAll]);

  async function exportCsv() {
    try {
      const res = await fetch('/api/export/orders');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'localmart-orders.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported');
      } else {
        toast.error('Export failed');
      }
    } catch {
      toast.error('Export failed');
    }
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(overview?.totalRevenue || 0), icon: DollarSign },
    { label: 'Total Orders', value: overview?.totalOrders || 0, icon: ShoppingBag },
    { label: 'Active Users', value: overview?.totalUsers || 0, icon: Users },
    { label: 'Active Sellers', value: overview?.totalSellers || 0, icon: TrendingUp },
    { label: 'Avg Order Value', value: formatCurrency(overview?.avgOrderValue || 0), icon: ReceiptText },
    { label: 'Orders Today', value: overview?.ordersToday || 0, icon: PackageCheck },
    { label: 'Revenue Today', value: formatCurrency(overview?.revenueToday || 0), icon: Banknote },
    { label: 'New Users (Month)', value: overview?.newUsersThisMonth || 0, icon: UserPlus },
  ];

  const chartData = timeseries.map((p) => ({
    ...p,
    label: p.date.slice(5),
  }));

  const paymentData = paymentMethods.map((m) => ({
    name: m.method,
    value: m.amount,
  }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Platform Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              {overview?.totalOrders || 0} orders · {overview?.totalPayments || 0} payments · {overview?.paidPayments || 0} paid
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Analytics range (days)"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-9 px-3 rounded-lg border bg-white text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & orders timeseries */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue &amp; Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (৳)" stroke="#16a34a" fill="url(#rev)" />
                  <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top products */}
          <Card>
            <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment methods */}
          <Card>
            <CardHeader><CardTitle>Revenue by Payment Method</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader><CardTitle>Orders by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
