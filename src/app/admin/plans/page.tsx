'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPlans(); }, []);
  async function fetchPlans() { try { const res = await fetch('/api/admin/plans'); if (res.ok) { const data = await res.json(); setPlans(data.data || []); } } catch {} finally { setLoading(false); } }

  return (
    <div className="min-h-screen bg-gray-100"><div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center"><CreditCard className="w-6 h-6 mr-2" />Subscription Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(p => (
          <Card key={p._id}><CardContent className="p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold">{p.name}</h3><Badge variant={p.isActive ? 'success' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></div>
            <p className="text-gray-600 mb-4">{p.description}</p>
            <div className="space-y-2 text-sm"><p><strong>Monthly:</strong> {formatCurrency(p.monthlyPrice)}</p><p><strong>Yearly:</strong> {formatCurrency(p.yearlyPrice)}</p><p><strong>Products:</strong> {p.productLimit === -1 ? 'Unlimited' : p.productLimit}</p><p><strong>Staff:</strong> {p.staffLimit === -1 ? 'Unlimited' : p.staffLimit}</p></div>
          </CardContent></Card>
        ))}
      </div>
    </div></div>
  );
}
