'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, Truck, Store, Package, ChevronRight, Tag, Shield,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: string[];
  rating: number;
  totalSold: number;
  shopId: { name: string; slug: string };
}

interface Shop {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  rating: number;
  isOpen: boolean;
  category: { name: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
}

export default function HomePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number; area: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchData = async (lat?: number, lng?: number) => {
    try {
      const params = new URLSearchParams();
      if (lat && lng) {
        params.set('lat', lat.toString());
        params.set('lng', lng.toString());
        params.set('maxDistance', '10000');
      }
      params.set('limit', '8');
      params.set('sort', 'popular');

      const [productsRes, shopsRes] = await Promise.all([
        fetch(`/api/products?${params.toString()}`),
        fetch(`/api/shops?${params.toString()}`),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.data || []);
      }
      if (shopsRes.ok) {
        const data = await shopsRes.json();
        setShops(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?active=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    // Try to get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            area: 'Your Area',
          });
          fetchData(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Location denied - fetch without location
          fetchData();
        }
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    fetchCategories();
  }, []);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              All Local Shops in One Place
            </h1>
            <p className="text-lg md:text-xl mb-6 text-green-50">
              Discover nearby shops, order fresh products, and support your local community.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shops">
                <Button size="lg" variant="secondary">
                  Browse Shops <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                  Shop Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <Link href="/categories" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.length > 0 ? categories.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-center text-gray-700">{cat.name}</span>
              </Link>
            )) : (
              <>
                {['Grocery', 'Electronics', 'Fashion', 'Restaurant', 'Pharmacy', 'Bakery', 'Furniture', 'Mobile'].map((name) => (
                  <div key={name} className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-center text-gray-700">{name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Nearby Shops */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nearby Shops</h2>
              <p className="text-sm text-gray-600 mt-1">
                {location ? `Shops near ${location.area}` : 'Shops in your area'}
              </p>
            </div>
            <Link href="/shops" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {shops.length > 0 ? shops.slice(0, 4).map((shop) => (
              <Link key={shop._id} href={`/shop/${shop.slug}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {shop.logo ? (
                          <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Store className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>
                        <p className="text-sm text-gray-500">{shop.category?.name}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium ml-1">{shop.rating.toFixed(1)}</span>
                          </div>
                          <Badge variant={shop.isOpen ? 'success' : 'secondary'} className="text-xs">
                            {shop.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                          <div className="h-3 bg-gray-200 rounded w-1/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Quick local delivery' },
            { icon: Shield, title: 'Secure Payment', desc: 'COD, bKash, Nagad' },
            { icon: Store, title: 'Local Shops', desc: 'Support local business' },
            { icon: Tag, title: 'Best Prices', desc: 'Great deals daily' },
          ].map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardContent className="p-6">
                <feature.icon className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Popular Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Popular Products</h2>
              <p className="text-sm text-gray-600 mt-1">Trending near you</p>
            </div>
            <Link href="/products" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.length > 0 ? products.slice(0, 8).map((product) => (
              <Link key={product._id} href={`/products/${product.slug}`}>
                <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
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
                  <CardContent className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{product.shopId?.name}</p>
                    <div className="flex items-center justify-between">
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
                      <div className="flex items-center text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-400 fill-current mr-0.5" />
                        {product.rating.toFixed(1)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="animate-pulse overflow-hidden">
                    <div className="aspect-square bg-gray-200" />
                    <CardContent className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Become a Seller CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Are You a Local Business Owner?
            </h2>
            <p className="text-lg mb-6 text-blue-50">
              Join LocalMart and reach thousands of customers in your area. Create your digital shop, manage orders, and grow your business.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register?role=seller">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Start Selling
                </Button>
              </Link>
              <Link href="/seller-info">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
