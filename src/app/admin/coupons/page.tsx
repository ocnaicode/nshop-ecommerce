'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminCouponsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', usageLimit: '100', validFrom: '', validUntil: '' });

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) { router.push('/login'); return; }
    if (user) fetchCoupons();
  }, [user, authLoading]);

  async function fetchCoupons() {
    try { const res = await fetch('/api/admin/coupons'); if (res.ok) { const data = await res.json(); setCoupons(data.data || []); } }
    catch {} finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: parseFloat(form.value), minOrder: parseFloat(form.minOrder) || 0, maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined, usageLimit: parseInt(form.usageLimit) }) });
      const data = await res.json();
      if (data.success) { toast.success('Coupon created'); setShowForm(false); fetchCoupons(); } else toast.error(data.error);
    } catch { toast.error('Failed'); }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8"><h1 className="text-2xl font-bold">Coupons</h1><Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />New Coupon</Button></div>
        {showForm && (
          <Card className="mb-6"><CardContent className="p-6"><form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required /></div>
              <div><Label>Type</Label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full h-10 rounded-md border px-3"><option value="percentage">Percentage</option><option value="fixed">Fixed</option><option value="free_delivery">Free Delivery</option></select></div>
              <div><Label>Value *</Label><Input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Min Order</Label><Input type="number" value={form.minOrder} onChange={e => setForm({...form, minOrder: e.target.value})} /></div>
              <div><Label>Max Discount</Label><Input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} /></div>
              <div><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valid From *</Label><Input type="date" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} required /></div>
              <div><Label>Valid Until *</Label><Input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} required /></div>
            </div>
            <div className="flex space-x-3"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Create Coupon</Button></div>
          </form></CardContent></Card>
        )}
        <Card><CardContent className="p-6">
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> : coupons.length > 0 ? (
            <div className="space-y-3">{coupons.map(c => (
              <div key={c._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3"><Tag className="w-5 h-5 text-green-600" /><div><p className="font-bold">{c.code}</p><p className="text-xs text-gray-500">{c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? formatCurrency(c.value) : 'Free Delivery'} • Min: {formatCurrency(c.minOrder)} • Used: {c.usedCount}/{c.usageLimit}</p></div></div>
                <div className="text-right"><Badge variant={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge><p className="text-xs text-gray-400 mt-1">Until {formatDateTime(c.validUntil)}</p></div>
              </div>
            ))}</div>
          ) : <div className="text-center py-12"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No coupons yet</p></div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
