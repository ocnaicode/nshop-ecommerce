'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerAddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: 'Home',
    address: '',
    area: '',
    city: 'Dhaka',
    phone: '',
    coordinates: { lat: '', lng: '' },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchAddresses();
  }, [user, authLoading]);

  async function fetchAddresses() {
    try {
      const res = await fetch('/api/customer/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.data || []);
      }
    } catch {
      // ignore — DB may be unreachable
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label,
          address: form.address,
          area: form.area,
          city: form.city,
          phone: form.phone,
          coordinates: form.coordinates.lat && form.coordinates.lng
            ? { lat: parseFloat(form.coordinates.lat), lng: parseFloat(form.coordinates.lng) }
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Address added');
        setShowForm(false);
        setForm({ label: 'Home', address: '', area: '', city: 'Dhaka', phone: '', coordinates: { lat: '', lng: '' } });
        fetchAddresses();
      } else {
        toast.error(data.error || 'Failed to add address');
      }
    } catch {
      toast.error('Failed to add address');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
            <p className="text-gray-500">Manage your delivery addresses</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/customer">
              <Button variant="outline">Back to Account</Button>
            </Link>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" /> Add Address
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Address</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    placeholder="Home / Office / Other"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Full Address</Label>
                  <Input
                    placeholder="House, road, block..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Area</Label>
                    <Input
                      placeholder="e.g. Dhanmondi"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    placeholder="+8801XXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude (optional)</Label>
                    <Input
                      placeholder="23.8103"
                      value={form.coordinates.lat}
                      onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lat: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Longitude (optional)</Label>
                    <Input
                      placeholder="90.4125"
                      value={form.coordinates.lng}
                      onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lng: e.target.value } })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address._id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {address.label}
                          {address.isDefault && <span className="ml-2 text-xs text-green-600">Default</span>}
                        </p>
                        <p className="text-sm text-gray-500">{address.address}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {address.area ? `${address.area}, ` : ''}{address.city}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No saved addresses</p>
                <p className="text-sm text-gray-400 mt-1">Add an address to speed up checkout</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
