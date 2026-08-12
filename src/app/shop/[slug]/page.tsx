'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, MapPin, Clock, Phone, Truck, Shield,
  ShoppingCart, Heart, Share2, CheckCircle, Package
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function ShopPage() {
  const params = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) fetchShop();
  }, [params.slug]);

  async function fetchShop() {
    try {
      const res = await fetch(`/api/shops/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setShop(data.data);
        if (data.data?._id) {
          const prodRes = await fetch(`/api/products?shopId=${data.data._id}&limit=20`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            setProducts(prodData.data || []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch shop:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string) {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Added to cart!');
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch {
      toast.error('Failed to add to cart');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop not found</h2>
          <Link href="/" className="text-green-600 hover:text-green-700">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Header */}
      <div className="bg-white shadow-sm">
        {shop.banner && (
          <div className="h-48 md:h-64 bg-gray-200">
            <img src={shop.banner} alt={shop.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              {shop.logo ? (
                <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Package className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                {shop.isVerified && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
                <Badge variant={shop.isOpen ? 'success' : 'secondary'}>
                  {shop.isOpen ? 'Open Now' : 'Closed'}
                </Badge>
              </div>
              <p className="text-gray-600 mb-2">{shop.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{shop.rating?.toFixed(1)}</span>
                  <span className="ml-1">({shop.totalRatings} reviews)</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {shop.address}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {shop.openingHours?.open} - {shop.openingHours?.close}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {shop.phone}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-1" /> Follow
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Truck className="w-4 h-4 text-green-600" />
            <span>Seller Delivery Available</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Free delivery on ৳500+</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Products ({products.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <Link href={`/products/${product.slug}`}>
                <div className="aspect-square bg-gray-100 relative">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {product.discountPrice && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                    </Badge>
                  )}
                </div>
              </Link>
              <CardContent className="p-3">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(product.discountPrice || product.price)}
                    </span>
                    {product.discountPrice && (
                      <span className="text-xs text-gray-400 line-through ml-1">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => addToCart(product._id)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products available</p>
          </div>
        )}
      </div>
    </div>
  );
}
