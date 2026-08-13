'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Package, Search, Star, ShoppingBag, SlidersHorizontal, X, Store,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: string[];
  rating: number;
  totalRatings: number;
  totalSold: number;
  stock: number;
  category?: { name: string };
  shopId?: { name: string; slug: string };
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 4.5, label: '4.5 & up' },
  { value: 4, label: '4.0 & up' },
  { value: 3, label: '3.0 & up' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100&sort=popular');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch {
      // ignore — DB may be unreachable
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?active=true');
      if (res.ok) {
        const data = await res.json();
        setCategories((data.data || []).map((c: { name: string }) => c.name));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Sync search box if URL query changes externally (e.g. header search).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q) ||
          p.shopId?.name?.toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter((p) => p.category?.name === category);
    if (minPrice) list = list.filter((p) => (p.discountPrice ?? p.price) >= parseFloat(minPrice));
    if (maxPrice) list = list.filter((p) => (p.discountPrice ?? p.price) <= parseFloat(maxPrice));
    if (minRating > 0) list = list.filter((p) => (p.rating || 0) >= minRating);

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case 'price_desc':
        list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        list.sort((a, b) => (b._id > a._id ? 1 : -1));
        break;
      case 'popular':
      default:
        list.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
        break;
    }
    return list;
  }, [products, search, category, minPrice, maxPrice, minRating, sort]);

  const discountPct = (p: Product) =>
    p.discountPrice ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;

  const hasActiveFilters = Boolean(category || minPrice || maxPrice || minRating > 0);

  function clearFilters() {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-1">{filtered.length} product{filtered.length !== 1 ? 's' : ''} from local shops</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative flex-1"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products, shops, brands…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </form>
        <div className="flex gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'h-11 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors lg:hidden',
              showFilters || hasActiveFilters ? 'border-green-600 text-green-700 bg-green-50' : 'border-input'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-green-600" />}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-green-600 hover:text-green-700">Clear</button>
                )}
              </div>

              {/* Category */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(category === c ? '' : c)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs border transition-colors',
                        category === c
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Price Range (৳)</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-9"
                  />
                  <span className="text-gray-400">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
                <div className="space-y-1.5">
                  {RATING_OPTIONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === r.value}
                        onChange={() => setMinRating(r.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      {r.label}
                      {r.value > 0 && (
                        <span className="flex items-center text-xs text-yellow-500">
                          <Star className="w-3 h-3 fill-current" />+
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile filter panel */}
        {showFilters && (
          <Card className="lg:hidden mb-6 w-full">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-green-600">Clear all</button>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(category === c ? '' : c)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs border',
                        category === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Min Price</p>
                  <Input type="number" placeholder="৳ Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Max Price</p>
                  <Input type="number" placeholder="৳ Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {RATING_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setMinRating(r.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs border',
                      minRating === r.value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <Link key={product._id} href={`/products/${product.slug}`} className="group">
                  <Card className="hover:shadow-lg transition-all h-full overflow-hidden group-hover:-translate-y-0.5">
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {discountPct(product) > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-500 border-0">
                          -{discountPct(product)}%
                        </Badge>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-white text-gray-700">Out of stock</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-[10px]">{product.category?.name || 'General'}</Badge>
                        <span className="flex items-center text-xs text-gray-500">
                          <Star className="w-3 h-3 text-yellow-500 fill-current mr-0.5" />
                          {(product.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-0.5">{product.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2 line-clamp-1">
                        <Store className="w-3 h-3 shrink-0" /> {product.shopId?.name || 'Local shop'}
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="font-bold text-green-600">
                            {formatCurrency(product.discountPrice ?? product.price)}
                          </span>
                          {product.discountPrice && (
                            <span className="text-xs text-gray-400 line-through ml-1">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 flex items-center">
                          <ShoppingBag className="w-3 h-3 mr-0.5" />
                          {product.totalSold || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No products found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearch(''); clearFilters(); }}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                >
                  <X className="w-4 h-4" /> Clear filters
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ProductsContent />
    </Suspense>
  );
}
