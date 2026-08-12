'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, MapPin, Clock, CheckCircle, Truck, Phone,
  ArrowLeft, Star, MessageCircle, RotateCcw
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, text: '' });

  useEffect(() => {
    if (!authLoading && !user) {
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

  async function submitReview(productId: string) {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          productId,
          ...reviewData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review submitted!');
        setShowReview(false);
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Failed to submit review');
    }
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'ready', label: 'Ready', icon: Package },
    { key: 'on_the_way', label: 'On the Way', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order?.status);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Order not found</h2>
          <Link href="/customer" className="text-green-600 mt-2 inline-block">Go back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/customer">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>

        {/* Order Status Progress */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStepIndex
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs text-center ${
                    index <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {index < statusSteps.length - 1 && (
                    <div className={`absolute h-1 w-full mt-5 ${
                      index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                    }`} style={{ left: '50%', width: '100%' }} />
                  )}
                </div>
              ))}
            </div>

            {order.status === 'delivered' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-900">Order Delivered!</p>
                <Button size="sm" className="mt-2" onClick={() => setShowReview(true)}>
                  <Star className="w-4 h-4 mr-1" /> Leave a Review
                </Button>
              </div>
            )}

            {order.pickupCode && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-700">Pickup Code</p>
                <p className="text-3xl font-bold text-blue-900 tracking-wider">{order.pickupCode}</p>
                <p className="text-xs text-blue-600 mt-1">Show this code at the shop</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center space-x-3 py-2 border-b last:border-b-0">
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
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{order.deliveryAddress?.name}</p>
                  <p className="text-sm text-gray-600">{order.deliveryAddress?.address}</p>
                  <p className="text-sm text-gray-500">{order.deliveryAddress?.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium capitalize">
                    {order.deliveryMethod?.replace('_', ' ')}
                  </p>
                  <Badge variant={
                    order.paymentMethod === 'cod' ? 'warning' :
                    order.paymentStatus === 'paid' ? 'success' : 'secondary'
                  }>
                    {order.paymentMethod?.toUpperCase()} - {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">COD Fee</span>
                  <span>{formatCurrency(order.codFee)}</span>
                </div>
              )}
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(order.couponDiscount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Modal */}
        {showReview && (
          <Card className="mt-6 border-green-200">
            <CardHeader>
              <CardTitle>Rate Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                  >
                    <Star className={`w-8 h-8 ${
                      star <= reviewData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Tell us about your experience..."
                value={reviewData.text}
                onChange={(e) => setReviewData({ ...reviewData, text: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowReview(false)}>Cancel</Button>
                <Button onClick={() => submitReview(order.items[0]?.productId)}>Submit Review</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {order.timeline?.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.timeline.map((entry: any, i: number) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium capitalize">{entry.status?.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{entry.description}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</p>
                    </div>
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
