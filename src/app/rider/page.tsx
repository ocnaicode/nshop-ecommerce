'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bike, MapPin, Clock, DollarSign, Package, Phone,
  Navigation, CheckCircle, XCircle, LogOut, ToggleLeft, ToggleRight
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function RiderDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDeliveries: 0, totalEarnings: 0, todayDeliveries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'rider')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'rider') {
      fetchRiderData();
    }
  }, [user, authLoading]);

  async function fetchRiderData() {
    try {
      const [currentRes, availableRes, historyRes] = await Promise.all([
        fetch('/api/rider/current'),
        fetch('/api/rider/available'),
        fetch('/api/rider/history'),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentDelivery(data.data);
      }
      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableDeliveries(data.data || []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setDeliveryHistory(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOnline() {
    try {
      const res = await fetch('/api/rider/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !isOnline }),
      });
      const data = await res.json();
      if (data.success) {
        setIsOnline(!isOnline);
        toast.success(isOnline ? 'You are now offline' : 'You are now online');
      }
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function acceptDelivery(deliveryId: string) {
    try {
      const res = await fetch('/api/rider/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, action: 'accept' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Delivery accepted');
        fetchRiderData();
      }
    } catch {
      toast.error('Failed to accept delivery');
    }
  }

  async function updateDeliveryStatus(status: string) {
    if (!currentDelivery) return;
    try {
      const res = await fetch('/api/rider/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId: currentDelivery._id, action: status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${status.replace('_', ' ')}`);
        fetchRiderData();
      }
    } catch {
      toast.error('Failed to update status');
    }
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bike className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Rider</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleOnline}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-sm ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">Earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
              <p className="text-xs text-gray-500">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Delivery */}
        {currentDelivery ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-green-600" />
                <span>Current Delivery</span>
                <Badge variant="success">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pickup</p>
                    <p className="text-sm text-gray-600">{currentDelivery.pickupLocation?.address || 'Shop address'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Drop-off</p>
                    <p className="text-sm text-gray-600">{currentDelivery.dropoffLocation?.address || 'Customer address'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Est. 30 min</span>
                <span className="font-medium text-green-600">{formatCurrency(currentDelivery.riderEarnings || 50)}</span>
              </div>

              {/* Status Actions */}
              <div className="grid grid-cols-2 gap-2">
                {currentDelivery.status === 'assigned' && (
                  <Button onClick={() => updateDeliveryStatus('accepted')} className="col-span-2">
                    Accept & Start Pickup
                  </Button>
                )}
                {currentDelivery.status === 'accepted' && (
                  <Button onClick={() => updateDeliveryStatus('picked_up')} className="col-span-2">
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm Pickup
                  </Button>
                )}
                {currentDelivery.status === 'picked_up' && (
                  <Button onClick={() => updateDeliveryStatus('on_the_way')} className="col-span-2">
                    <Navigation className="w-4 h-4 mr-2" /> On the Way
                  </Button>
                )}
                {currentDelivery.status === 'on_the_way' && (
                  <>
                    <Button onClick={() => updateDeliveryStatus('delivered')} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" /> Delivered
                    </Button>
                    <Button variant="outline" onClick={() => updateDeliveryStatus('failed')} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" /> Failed
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Delivery</h3>
              <p className="text-gray-500 text-sm">
                {isOnline ? 'Waiting for new delivery assignments...' : 'Go online to receive deliveries'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Deliveries */}
        {availableDeliveries.length > 0 && isOnline && !currentDelivery && (
          <Card>
            <CardHeader>
              <CardTitle>Available Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableDeliveries.map((delivery) => (
                <div key={delivery._id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Order #{delivery.orderId?.orderNumber?.slice(-6)}</p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" /> {delivery.dropoffLocation?.address || 'Nearby'}
                    </p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {formatCurrency(delivery.riderEarnings || 50)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => acceptDelivery(delivery._id)}>
                    Accept
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Delivery History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryHistory.length > 0 ? (
              <div className="space-y-3">
                {deliveryHistory.slice(0, 10).map((delivery) => (
                  <div key={delivery._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        delivery.status === 'delivered' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {delivery.status === 'delivered' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order #{delivery.orderId?.orderNumber?.slice(-6) || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(delivery.updatedAt)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(delivery.riderEarnings || 50)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No delivery history yet
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
