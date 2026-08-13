'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin } from 'lucide-react';

export default function AdminDeliveryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) {
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

  const zones = [
    { name: 'Dhanmondi', fee: 30, minDistance: 0, maxDistance: 2, estimatedTime: 20 },
    { name: 'Gulshan', fee: 40, minDistance: 2, maxDistance: 5, estimatedTime: 30 },
    { name: 'Mirpur', fee: 50, minDistance: 5, maxDistance: 10, estimatedTime: 40 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-500 text-sm mt-1">Configure platform-wide delivery zones and fees</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Active Riders', value: '0' },
            { label: 'Active Zones', value: `${zones.length}` },
            { label: 'Avg Delivery Time', value: '30 min' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Zones</CardTitle>
          </CardHeader>
          <CardContent>
            {zones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{zone.name}</p>
                    <p className="text-sm text-gray-500">
                      {zone.minDistance}–{zone.maxDistance} km • ~{zone.estimatedTime} min
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">৳{zone.fee}</Badge>
              </div>
            ))}
            <div className="text-center py-6">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Delivery zone management will be fully configurable here in a future update.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
