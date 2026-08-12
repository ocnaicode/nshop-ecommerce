'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function SellerInsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState({ topProducts: [], lowStock: [], revenue: 0, orders: 0, aiInsights: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInsights(); }, []);
  async function fetchInsights() { try { const res = await fetch('/api/seller/insights'); if (res.ok) { const data = await res.json(); setInsights(data.data || {}); } } catch {} finally { setLoading(false); } }

  return (
    <div className="min-h-screen bg-gray-100"><div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center"><BarChart3 className="w-6 h-6 mr-2" />Business Insights</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card><CardHeader><CardTitle className="text-lg flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-600" />Revenue</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(insights.revenue)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-blue-600" />Orders</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{insights.orders}</p></CardContent></Card>
      </div>
      <Card className="mb-6"><CardHeader><CardTitle className="flex items-center"><Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />AI Insights</CardTitle></CardHeader><CardContent>
        {insights.aiInsights ? <p className="text-gray-600">{insights.aiInsights}</p> : <p className="text-gray-400 text-sm">AI insights available when AI provider is configured. Configure AI_API_KEY in environment.</p>}
      </CardContent></Card>
      {insights.lowStock?.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />Low Stock Alerts</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">{insights.lowStock.map((p: any) => (<div key={p._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded"><span className="text-sm">{p.name}</span><Badge variant="warning">{p.stock} left</Badge></div>))}</div>
        </CardContent></Card>
      )}
    </div></div>
  );
}
