'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, DollarSign } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function PurchasesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) { router.push('/login'); return; }
    if (user?.role === 'seller') fetchPurchases();
  }, [user, authLoading]);

  async function fetchPurchases() {
    try { const res = await fetch('/api/seller/purchases'); if (res.ok) { const data = await res.json(); setPurchases(data.data || []); } }
    catch {} finally { setLoading(false); }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const totalPurchased = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalDue = purchases.reduce((s, p) => s + p.dueAmount, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold">Purchase History</h1><p className="text-gray-500">Track your inventory purchases</p></div>
          <Button><Plus className="w-4 h-4 mr-2" />New Purchase</Button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">Total Purchases</p><p className="text-2xl font-bold">{purchases.length}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">Total Amount</p><p className="text-2xl font-bold">{formatCurrency(totalPurchased)}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">Total Due</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</p></CardContent></Card>
        </div>
        <Card>
          <CardContent className="p-6">
            {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div> : purchases.length > 0 ? (
              <div className="space-y-3">{purchases.map(p => (
                <div key={p._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{p.supplierId?.name || 'Unknown Supplier'}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(p.createdAt)} • {p.items?.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(p.totalAmount)}</p>
                    {p.dueAmount > 0 ? <Badge variant="destructive">Due: {formatCurrency(p.dueAmount)}</Badge> : <Badge variant="success">Paid</Badge>}
                  </div>
                </div>
              ))}</div>
            ) : <div className="text-center py-12"><Package className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No purchases recorded</p></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
