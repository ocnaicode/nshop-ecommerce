'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Store, MapPin, Phone, Search, Star } from 'lucide-react';

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    try {
      const res = await fetch('/api/shops?limit=60');
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

  const filtered = shops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
            <p className="text-gray-500">Explore local shops in your area</p>
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
              <div key={i} className="h-44 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((shop) => (
              <Link key={shop._id} href={`/shop/${shop.slug}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                        {shop.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Store className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {shop.isFeatured && <Badge variant="default">Featured</Badge>}
                        <Badge variant={shop.isOpen ? 'success' : 'secondary'}>
                          {shop.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{shop.category?.name || 'General Store'}</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{shop.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3" />
                        <span>{shop.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1 pt-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-gray-500">
                          {shop.rating?.toFixed(1) || '4.0'} ({shop.totalRatings || 0} ratings)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No shops found</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon — new shops join every day</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
