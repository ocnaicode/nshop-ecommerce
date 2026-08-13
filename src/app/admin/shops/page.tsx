'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, MapPin, Star, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminShopsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) {
      router.push('/login');
      return;
    }
    if (user) fetchShops();
  }, [user, authLoading]);

  async function fetchShops() {
    try {
      const res = await fetch('/api/shops?limit=100');
      if (res.ok) {
        const data = await res.json();
        setShops(data.data || []);
      }
    } catch {
      // ignore — DB may be unreachable
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filtered = shops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
            <p className="text-gray-500 text-sm mt-1">All registered shops on the platform</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((shop) => (
              <Card key={shop._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {shop.isFeatured && <Badge variant="default">Featured</Badge>}
                      <Badge variant={shop.isOpen ? 'success' : 'secondary'}>
                        {shop.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{shop.category?.name || 'General'}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span>{shop.address}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{shop.rating?.toFixed(1) || '4.0'} ({shop.totalRatings || 0})</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No shops found</p>
              <p className="text-sm text-gray-400 mt-1">Shops will appear here once sellers register</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
