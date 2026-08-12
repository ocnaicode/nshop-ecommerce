'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Star, ShoppingCart, Heart, Share2, Minus, Plus,
  Truck, Shield, RotateCcw, Store, Package, CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (params.slug) fetchProduct();
  }, [params.slug]);

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Added to cart!');
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link href="/" className="text-green-600 hover:text-green-700">Go back home</Link>
        </div>
      </div>
    );
  }

  const effectivePrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span>/</span>
          <Link href={`/categories/${product.category?.slug}`} className="hover:text-green-600">
            {product.category?.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <Card className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-lg px-3 py-1">
                    -{discount}%
                  </Badge>
                )}
              </div>
            </Card>
            {product.images?.length > 1 && (
              <div className="flex space-x-2 mt-4 overflow-x-auto">
                {product.images.map((img: string, i: number) => (
                  <div key={i} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-green-600">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">{product.rating?.toFixed(1)}</span>
                  <span className="ml-1 text-gray-500">({product.totalRatings} reviews)</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">{product.totalSold} sold</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-green-600">
                  {formatCurrency(effectivePrice)}
                </span>
                {product.discountPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
              {product.unit && (
                <p className="text-sm text-gray-500 mt-1">per {product.unit}</p>
              )}
            </div>

            {/* Shop Info */}
            <Link href={`/shop/${product.shopId?.slug}`} className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product.shopId?.logo ? (
                      <img src={product.shopId.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Store className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">{product.shopId?.name}</p>
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500">
                      <Star className="w-3 h-3 inline text-yellow-400 fill-current" />{' '}
                      {product.shopId?.rating?.toFixed(1)} • Visit Shop
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center"
                    min="1"
                    max={product.stock}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock} available
                </span>
              </div>

              <div className="flex space-x-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={addToCart}
                  disabled={product.stock === 0 || adding}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Truck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Delivery Available</p>
                  <p className="text-gray-500">Estimated 30-50 minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-gray-500">COD, bKash, Nagad</p>
                </div>
              </div>
              {product.returnPolicy && (
                <div className="flex items-center space-x-3 text-sm">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Return Policy</p>
                    <p className="text-gray-500">{product.returnPolicy}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            <div className="space-y-4">
              {product.reviews.map((review: any) => (
                <Card key={review._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{review.customerId?.name}</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.text && <p className="text-gray-600 text-sm">{review.text}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {product.related?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.related.map((related: any) => (
                <Link key={related._id} href={`/products/${related.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      {related.images?.[0] ? (
                        <img src={related.images[0]} alt={related.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{related.name}</h3>
                      <p className="font-bold text-green-600 mt-1">{formatCurrency(related.discountPrice || related.price)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
