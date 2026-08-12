'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard,
  Banknote, Smartphone, Pause, Play, X, User
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface POSProduct {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  images: string[];
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  image?: string;
}

export default function POSPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<{ id: string; items: CartItem[]; timestamp: Date }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'seller') {
      fetchProducts();
      openSession();
    }
  }, [user, authLoading]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  async function openSession() {
    try {
      const res = await fetch('/api/pos/session', { method: 'POST' });
      const data = await res.json();
      if (data.success) setSessionId(data.data._id);
    } catch (err) {
      console.error('Failed to open POS session:', err);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?limit=100&status=active');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }

  function addToCart(product: POSProduct) {
    const existing = cart.find(item => item.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('No more stock available');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        price: product.discountPrice || product.price,
        quantity: 1,
        discount: 0,
        image: product.images?.[0],
      }]);
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(item => item.productId !== productId));
  }

  function holdCart() {
    if (cart.length === 0) return;
    const held = {
      id: Date.now().toString(36),
      items: [...cart],
      timestamp: new Date(),
    };
    setHeldCarts([...heldCarts, held]);
    setCart([]);
    setDiscount(0);
    toast.success('Cart held');
  }

  function resumeCart(id: string) {
    const held = heldCarts.find(h => h.id === id);
    if (held) {
      setCart(held.items);
      setHeldCarts(heldCarts.filter(h => h.id !== id));
      toast.success('Cart resumed');
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity - item.discount, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function completeSale() {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        paymentMethod,
        customerPhone: customerPhone || undefined,
        discount,
      };

      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Sale completed! Total: ${formatCurrency(total)}`);
        setCart([]);
        setDiscount(0);
        setCustomerPhone('');
        setShowPayment(false);
      } else {
        toast.error(data.error || 'Sale failed');
      }
    } catch {
      toast.error('Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  }

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="bg-white shadow-sm p-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={searchRef}
              placeholder="Search products or scan barcode... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">{products.length} products</Badge>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product._id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="bg-white rounded-lg shadow-sm p-3 text-left hover:shadow-md transition-shadow disabled:opacity-50"
              >
                <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(product.discountPrice || product.price)}
                  </span>
                  <span className="text-xs text-gray-400">
                    Stock: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white shadow-lg flex flex-col border-l">
        {/* Cart Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-lg">Current Sale</h2>
            <Badge>{itemCount}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={holdCart} disabled={cart.length === 0}>
              <Pause className="w-4 h-4 mr-1" /> Hold
            </Button>
          </div>
        </div>

        {/* Held Carts */}
        {heldCarts.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-b">
            <p className="text-xs font-medium text-yellow-700 mb-1">Held Carts ({heldCarts.length})</p>
            <div className="flex space-x-2 overflow-x-auto">
              {heldCarts.map((held) => (
                <button
                  key={held.id}
                  onClick={() => resumeCart(held.id)}
                  className="flex-shrink-0 text-xs bg-yellow-100 px-2 py-1 rounded hover:bg-yellow-200"
                >
                  <Play className="w-3 h-3 inline mr-1" />
                  {held.items.length} items
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Add products to start a sale</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Discount */}
        <div className="px-4 py-3 border-t space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Customer phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 w-16">Discount:</span>
            <Input
              type="number"
              placeholder="0"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              min="0"
            />
          </div>
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-600 mb-1">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span className="text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="p-4 border-t">
          {!showPayment ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
            >
              Charge {formatCurrency(total)}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Method:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    paymentMethod === 'cash' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    paymentMethod === 'bkash' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">bKash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    paymentMethod === 'nagad' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Nagad</span>
                </button>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1">
                  Back
                </Button>
                <Button onClick={completeSale} disabled={processing} className="flex-1">
                  {processing ? 'Processing...' : 'Complete Sale'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
