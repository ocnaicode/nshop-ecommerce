'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image, Plus } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminBannersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) { router.push('/login'); return; }
    if (user) fetchBanners();
  }, [user, authLoading]);

  async function fetchBanners() {
    try { const res = await fetch('/api/admin/banners'); if (res.ok) { const data = await res.json(); setBanners(data.data || []); } }
    catch {} finally { setLoading(false); }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8"><h1 className="text-2xl font-bold">Banners</h1><Button><Plus className="w-4 h-4 mr-2" />New Banner</Button></div>
        <Card><CardContent className="p-6">
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}</div> : banners.length > 0 ? (
            <div className="space-y-3">{banners.map(b => (
              <div key={b._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-32 h-16 bg-gray-200 rounded overflow-hidden">{b.image && <img src={b.image} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1"><p className="font-medium">{b.title}</p><p className="text-xs text-gray-500">{b.position} • {formatDateTime(b.startDate)} - {formatDateTime(b.endDate)}</p></div>
                <Badge variant={b.isActive ? 'success' : 'secondary'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            ))}</div>
          ) : <div className="text-center py-12"><Image className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No banners configured</p><p className="text-sm text-gray-400 mt-1">Configure Cloudinary to manage banners</p></div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
