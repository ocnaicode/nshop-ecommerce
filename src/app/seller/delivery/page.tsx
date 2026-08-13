'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Bike, Store, MapPin } from 'lucide-react';

export default function SellerDeliveryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const options = [
    {
      icon: Truck,
      title: 'Seller Delivery',
      desc: 'Deliver orders yourself within your service radius. Set zones, fees, and estimated times.',
      enabled: true,
    },
    {
      icon: Bike,
      title: 'Platform Delivery',
      desc: 'Let LocalMart riders handle delivery to your customers. We take care of routing and tracking.',
      enabled: true,
    },
    {
      icon: Store,
      title: 'Self Pickup',
      desc: 'Allow customers to pick up their orders directly from your shop location.',
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure how your orders reach customers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {options.map((option) => (
            <Card key={option.title}>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <option.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <Badge variant={option.enabled ? 'success' : 'secondary'}>
                    {option.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nearby</p>
                <p className="text-sm text-gray-500">0–2 km • ৳30 fee • ~20 min</p>
              </div>
              <Badge variant="default" className="ml-auto">Default</Badge>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Full zone management, delivery fees, and rider assignment will be editable here in a future update.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/seller">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
