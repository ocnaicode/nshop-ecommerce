'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Store, MapPin, Phone, Search, Star, ChevronRight, SlidersHorizontal, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shop {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  category?: { name: string };
  address?: string;
  phone?: string;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  isOpen: boolean;
  isFeatured: boolean;
  isVerified: boolean;
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'orders', label: 'Most Popular' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'open', label: 'Open First' },
];

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const fetchShops = async () => {
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
    fetchShops();
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    let list = [...shops];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category?.name?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter((s) => s.category?.name === category);
    if (openOnly) list = list.filter((s) => s.isOpen);

    switch (sort) {
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'orders':
        list.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'open':
        list.sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
        break;
    }
    return list;
  }, [shops, search, category, openOnly, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Local Shops</h1>
        <p className="text-gray-500 mt-1">Explore {filtered.length} shop{filtered.length !== 1 ? 's' : ''} in your area</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search shops, categories, areas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
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
              'h-11 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors',
              showFilters || category || openOnly ? 'border-green-600 text-green-700 bg-green-50' : 'border-input'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {(category || openOnly) && <span className="w-2 h-2 rounded-full bg-green-600" />}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => { setCategory(''); setOpenOnly(false); }}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Clear all
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? '' : c)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border transition-colors',
                      category === c
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Open now only</span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((shop) => (
            <Link key={shop._id} href={`/shop/${shop.slug}`} className="group">
              <Card className="hover:shadow-lg transition-all h-full overflow-hidden group-hover:-translate-y-0.5">
                {/* Banner */}
                <div className="relative h-24 bg-gradient-to-r from-green-500/10 via-green-500/20 to-green-500/10">
                  {shop.banner && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.banner} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {shop.isFeatured && <Badge variant="default">Featured</Badge>}
                    <Badge variant={shop.isOpen ? 'success' : 'secondary'}>
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-start gap-4 -mt-10 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {shop.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-9">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>
                        {shop.isVerified && (
                          <Badge variant="outline" className="text-[10px] px-1.5 border-green-300 text-green-700">✓</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{shop.category?.name || 'General Store'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{shop.address || 'Location on request'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{shop.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold text-gray-900">{(shop.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({shop.totalRatings || 0})</span>
                    </div>
                    <span className="flex items-center text-sm font-medium text-green-600">
                      Visit Shop <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
              <Store className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No shops found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearch(''); setCategory(''); setOpenOnly(false); }}
              className="mt-4 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              <X className="w-4 h-4" /> Clear filters
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
