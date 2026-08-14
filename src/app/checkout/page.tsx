'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, CreditCard, CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    addressId: '',
    deliveryMethod: 'seller_delivery',
    paymentMethod: 'cod',
    couponCode: '',
    notes: '',
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [codFee, setCodFee] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchCart();
      fetchAddresses();
    }
  }, [user, authLoading]);

  async function fetchCart() {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        if (!data.data?.items?.length) {
          router.push('/cart');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAddresses() {
    try {
      const res = await fetch('/api/customer/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.data || []);
        const defaultAddr = data.data?.find((a: any) => a.isDefault);
        if (defaultAddr) {
          setFormData(prev => ({ ...prev, addressId: defaultAddr._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function placeOrder() {
    if (!formData.addressId) {
      toast.error('Please select a delivery address');
      return;
    }
    setPlacing(true);
    try {
      const items = cart.items.map((item: any) => ({
        productId: item.productId._id || item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const orderId = data.data._id;

        // Online payment: initiate the gateway session and redirect
        if (formData.paymentMethod !== 'cod') {
          const payRes = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              method: formData.paymentMethod,
            }),
          });
          const payData = await payRes.json();
          if (payData.success && payData.data?.redirectUrl) {
            toast.success('Order placed! Redirecting to payment...');
            window.location.href = payData.data.redirectUrl;
            return;
          }
          toast.error(payData.error || 'Payment initiation failed');
          router.push(`/customer/orders/${orderId}`);
          return;
        }

        toast.success('Order placed successfully!');
        router.push(`/customer/orders/${data.data._id}`);
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch {
      toast.error('Failed to place order');
    } finally {
      setPlacing(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const subtotal = cart?.subtotal || 0;
  const total = subtotal + deliveryFee + codFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>Delivery Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.addressId === addr._id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={formData.addressId === addr._id}
                        onChange={(e) => setFormData({ ...formData, addressId: e.target.value })}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{addr.label}</span>
                          {addr.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                        <p className="text-sm text-gray-500">{addr.area}, {addr.district}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No addresses saved yet</p>
                    <Link href="/customer/addresses">
                      <Button>Add Address</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Delivery Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span>Delivery Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { id: 'seller_delivery', label: 'Seller Delivery', desc: 'Delivered by the shop', fee: 30 },
                  { id: 'platform_delivery', label: 'Platform Delivery', desc: 'Delivered by LocalMart', fee: '15%' },
                  { id: 'self_pickup', label: 'Self Pickup', desc: 'Pick up from the shop', fee: 0 },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.deliveryMethod === method.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="delivery"
                        value={method.id}
                        checked={formData.deliveryMethod === method.id}
                        onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                      />
                      <div>
                        <p className="font-medium">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </div>
                    <span className="font-medium text-gray-700">
                      {method.fee === 0 ? 'Free' : typeof method.fee === 'number' ? formatCurrency(method.fee) : method.fee}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Step 3: Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', fee: '৳10' },
                  { id: 'bkash', label: 'bKash', desc: 'Pay with bKash', fee: 'Secure' },
                  { id: 'nagad', label: 'Nagad', desc: 'Pay with Nagad', fee: 'Secure' },
                  { id: 'sslcommerz', label: 'SSLCommerz', desc: 'Cards, internet banking & wallets', fee: 'Secure' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.paymentMethod === method.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={formData.paymentMethod === method.id}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      />
                      <div>
                        <p className="font-medium">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{method.fee}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-4">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any special instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart?.items?.map((item: any) => (
                    <div key={item._id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Calculated'}</span>
                  </div>
                  {formData.paymentMethod === 'cod' && (
                    <div className="flex justify-between text-sm">
                      <span>COD Fee</span>
                      <span>৳10</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={placeOrder}
                  disabled={placing || !formData.addressId}
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
