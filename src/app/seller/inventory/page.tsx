'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Package, Search, AlertTriangle, TrendingDown, TrendingUp,
  ArrowUpDown, Filter, Download
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'seller') {
      fetchInventory();
      fetchTransactions();
    }
  }, [user, authLoading]);

  async function fetchInventory() {
    try {
      const res = await fetch('/api/products?limit=200');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions() {
    try {
      const res = await fetch('/api/seller/inventory?transactions=true&limit=20');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function adjustStock(productId: string, adjustment: number, reason: string) {
    try {
      const res = await fetch('/api/seller/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, adjustment, reason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInventory();
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const availableStock = p.stock - (p.reservedStock || 0);

    if (filter === 'low') return matchSearch && availableStock <= p.lowStockThreshold && availableStock > 0;
    if (filter === 'out') return matchSearch && availableStock === 0;
    return matchSearch;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter(p => {
      const avail = p.stock - (p.reservedStock || 0);
      return avail <= p.lowStockThreshold && avail > 0;
    }).length,
    outOfStock: products.filter(p => p.stock - (p.reservedStock || 0) === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.discountPrice || p.price) * p.stock, 0),
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500">Track and manage your product stock</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              {(['all', 'low', 'out'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">SKU</th>
                      <th className="pb-3 font-medium text-right">Price</th>
                      <th className="pb-3 font-medium text-center">Stock</th>
                      <th className="pb-3 font-medium text-center">Reserved</th>
                      <th className="pb-3 font-medium text-center">Available</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((product) => {
                      const available = product.stock - (product.reservedStock || 0);
                      const isLow = available <= product.lowStockThreshold && available > 0;
                      const isOut = available === 0;
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                {product.images?.[0] ? (
                                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-gray-900 truncate max-w-[200px]">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-500 text-xs font-mono">{product.sku}</td>
                          <td className="py-3 text-right">{formatCurrency(product.discountPrice || product.price)}</td>
                          <td className="py-3 text-center font-medium">{product.stock}</td>
                          <td className="py-3 text-center text-gray-500">{product.reservedStock || 0}</td>
                          <td className="py-3 text-center font-medium">{available}</td>
                          <td className="py-3 text-center">
                            {isOut ? (
                              <Badge variant="destructive">Out</Badge>
                            ) : isLow ? (
                              <Badge variant="warning">Low</Badge>
                            ) : (
                              <Badge variant="success">OK</Badge>
                            )}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatCurrency((product.discountPrice || product.price) * product.stock)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.map((tx: any) => (
                  <div key={tx._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`font-medium text-sm ${tx.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
