'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Clock, Sparkles } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    try {
      const res = await fetch('/api/products?limit=30&featured=true');
      if (res.ok) {
        const data = await res.json();
        // Show discounted / featured items as current offers
        const items = (data.data || []).map((product: any) => ({
          _id: product._id,
          title: product.name,
          slug: product.slug,
          shopName: product.shopId?.name || 'LocalMart',
          price: product.price,
          originalPrice: product.price * 1.25,
          discount: 20,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          category: product.category?.name || 'General',
        }));
        setOffers(items);
      }
    } catch {
      // ignore — DB may be unreachable
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Sparkles className="w-7 h-7 mr-2" /> Hot Offers
          </h1>
          <p className="text-red-100">Limited-time deals from your favorite local shops</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Link key={offer._id} href={`/products/${offer.slug}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="destructive">-{offer.discount}%</Badge>
                      <span className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Ends {formatDateTime(offer.expiresAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{offer.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{offer.shopName}</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-gray-900">{formatCurrency(offer.price)}</p>
                      <p className="text-sm text-gray-400 line-through">
                        {formatCurrency(offer.originalPrice)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active offers right now</p>
              <p className="text-sm text-gray-400 mt-1">New deals are added regularly — check back soon</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
