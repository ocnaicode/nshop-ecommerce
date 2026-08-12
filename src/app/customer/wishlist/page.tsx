'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Package, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchWishlist();
  }, [user, authLoading]);

  async function fetchWishlist() {
    try {
      const res = await fetch('/api/customer/wishlist');
      if (res.ok) { const data = await res.json(); setWishlist(data.data || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function removeFromWishlist(productId: string) {
    try {
      const res = await fetch(`/api/customer/wishlist?productId=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setWishlist(wishlist.filter(p => p._id !== productId)); toast.success('Removed'); }
    } catch { toast.error('Failed to remove'); }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center"><Heart className="w-6 h-6 mr-2 text-red-500" />My Wishlist</h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><div className="aspect-square bg-gray-200" /></Card>)}</div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wishlist.map(product => (
              <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-100">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>}
                  </div>
                </Link>
                <CardContent className="p-3">
                  <Link href={`/products/${product.slug}`}><h3 className="text-sm font-medium line-clamp-2">{product.name}</h3></Link>
                  <p className="font-bold text-green-600 mt-1">{formatCurrency(product.discountPrice || product.price)}</p>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" className="flex-1"><ShoppingCart className="w-3 h-3 mr-1" />Add</Button>
                    <Button size="sm" variant="outline" onClick={() => removeFromWishlist(product._id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-16 text-center"><Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2><p className="text-gray-500 mb-6">Save products you love for later</p><Link href="/"><Button>Browse Products</Button></Link></CardContent></Card>
        )}
      </div>
    </div>
  );
}
