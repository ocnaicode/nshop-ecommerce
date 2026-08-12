'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSellersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) { router.push('/login'); return; }
    if (user) fetchSellers();
  }, [user, authLoading]);

  async function fetchSellers() {
    try { const res = await fetch('/api/admin/sellers'); if (res.ok) { const data = await res.json(); setSellers(data.data || []); } }
    catch {} finally { setLoading(false); }
  }

  async function verifySeller(sellerId: string, approve: boolean) {
    try { const res = await fetch('/api/admin/sellers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sellerId, action: approve ? 'approve' : 'reject' }) }); if ((await res.json()).success) { toast.success(approve ? 'Seller approved' : 'Seller rejected'); fetchSellers(); } } catch {}
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const pending = sellers.filter(s => s.verificationStatus === 'pending');
  const approved = sellers.filter(s => s.verificationStatus === 'approved');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Seller Management</h1>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">Total Sellers</p><p className="text-2xl font-bold">{sellers.length}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">Pending Verification</p><p className="text-2xl font-bold text-yellow-600">{pending.length}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600">{approved.length}</p></CardContent></Card>
        </div>
        {pending.length > 0 && (
          <Card className="mb-6 border-yellow-200"><CardContent className="p-6"><h2 className="font-bold mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-yellow-600" />Pending Verifications</h2>
            <div className="space-y-3">{pending.map(s => (
              <div key={s._id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div><p className="font-medium">{s.businessName}</p><p className="text-sm text-gray-500">{s.ownerName} • {s.phone}</p></div>
                <div className="flex space-x-2"><Button size="sm" onClick={() => verifySeller(s._id, true)}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button><Button size="sm" variant="outline" onClick={() => verifySeller(s._id, false)} className="text-red-600"><XCircle className="w-4 h-4 mr-1" />Reject</Button></div>
              </div>
            ))}</div>
          </CardContent></Card>
        )}
        <Card><CardContent className="p-6"><h2 className="font-bold mb-4 flex items-center"><Store className="w-5 h-5 mr-2" />All Sellers</h2>
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> : (
            <div className="space-y-3">{sellers.map(s => (
              <div key={s._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div><p className="font-medium">{s.businessName}</p><p className="text-xs text-gray-500">{s.ownerName} • {s.phone} • Plan: {s.subscription?.plan}</p></div>
                <Badge variant={s.verificationStatus === 'approved' ? 'success' : s.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>{s.verificationStatus}</Badge>
              </div>
            ))}</div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
