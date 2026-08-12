'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) { router.push('/login'); return; }
    if (user) fetchAnalytics();
  }, [user, authLoading]);

  async function fetchAnalytics() {
    try { const res = await fetch('/api/admin/dashboard'); if (res.ok) { const data = await res.json(); setStats(data.data); } }
    catch {} finally { setLoading(false); }
  }

  const orderData = [
    { name: 'Mon', orders: 12 }, { name: 'Tue', orders: 19 }, { name: 'Wed', orders: 15 },
    { name: 'Thu', orders: 22 }, { name: 'Fri', orders: 28 }, { name: 'Sat', orders: 35 }, { name: 'Sun', orders: 24 },
  ];
  const categoryData = [
    { name: 'Grocery', value: 35 }, { name: 'Electronics', value: 25 },
    { name: 'Fashion', value: 20 }, { name: 'Food', value: 15 }, { name: 'Other', value: 5 },
  ];
  const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#6b7280'];

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Platform Analytics</h1>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign },
            { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag },
            { label: 'Active Users', value: stats?.totalUsers || 0, icon: Users },
            { label: 'Active Sellers', value: stats?.activeSellers || 0, icon: TrendingUp },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className="w-8 h-8 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Orders This Week</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Orders by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
