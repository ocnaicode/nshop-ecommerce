'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, MapPin, Phone, Clock, CheckCircle, Truck,
  ArrowLeft, User, CreditCard, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (params.id) fetchOrder();
  }, [user, authLoading, params.id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/seller/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
        fetchOrder();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  const statusActions: Record<string, { label: string; next: string; color: string }[]> = {
    pending: [{ label: 'Accept Order', next: 'accepted', color: 'bg-green-600' }, { label: 'Reject', next: 'cancelled', color: 'bg-red-600' }],
    accepted: [{ label: 'Start Preparing', next: 'preparing', color: 'bg-blue-600' }],
    preparing: [{ label: 'Mark Ready', next: 'ready', color: 'bg-yellow-600' }],
    ready: order?.deliveryMethod === 'self_pickup'
      ? [{ label: 'Customer Picked Up', next: 'delivered', color: 'bg-green-600' }]
      : [{ label: 'Hand to Rider', next: 'on_the_way', color: 'bg-blue-600' }],
    on_the_way: [{ label: 'Mark Delivered', next: 'delivered', color: 'bg-green-600' }],
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center"><p>Order not found</p></div>;
  }

  const actions = statusActions[order.status] || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/seller/orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
          <Badge variant={
            order.status === 'delivered' ? 'success' :
            order.status === 'cancelled' ? 'destructive' :
            order.status === 'pending' ? 'warning' : 'secondary'
          } className="ml-auto text-sm px-3 py-1">
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Status Actions */}
        {actions.length > 0 && (
          <Card className="mb-6 border-green-200">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Update Order Status:</p>
              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Button
                    key={action.next}
                    onClick={() => updateStatus(action.next)}
                    disabled={updating}
                    className={action.color}
                  >
                    {updating ? 'Updating...' : action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{order.deliveryAddress?.name}</p>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Phone className="w-4 h-4 mr-1" /> {order.deliveryAddress?.phone}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{order.deliveryAddress?.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Delivery</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium capitalize">{order.deliveryMethod?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment</p>
                <p className="font-medium flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  {order.paymentMethod?.toUpperCase()} - {order.paymentStatus}
                </p>
              </div>
              {order.pickupCode && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">Pickup Code</p>
                  <p className="text-2xl font-bold text-blue-900">{order.pickupCode}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Items ({order.items?.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center space-x-3 py-3 border-b last:border-b-0">
                  <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku} | Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Delivery Fee</span><span>{formatCurrency(order.deliveryFee)}</span></div>
              {order.codFee > 0 && <div className="flex justify-between"><span className="text-gray-600">COD Fee</span><span>{formatCurrency(order.codFee)}</span></div>}
              {order.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>-{formatCurrency(order.couponDiscount)}</span></div>}
              <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span className="text-green-600">{formatCurrency(order.total)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Commission</span><span>{formatCurrency(order.commission)}</span></div>
              <div className="flex justify-between font-medium"><span>You Earn</span><span className="text-green-600">{formatCurrency(order.total - order.commission - order.platformFee)}</span></div>
            </div>
          </CardContent>
        </Card>

        {order.notes && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2" />Customer Notes</h3>
              <p className="text-gray-600">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
