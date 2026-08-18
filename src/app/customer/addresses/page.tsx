'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import type { IAddress } from '@/types';

const DHAKA_LAT = 23.8103;
const DHAKA_LNG = 90.4125;

type AddressForm = {
  label: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  upazila: string;
  district: string;
  division: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

function emptyForm(user?: { name?: string; phone?: string } | null): AddressForm {
  return {
    label: 'Home',
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    area: '',
    upazila: '',
    district: 'Dhaka',
    division: 'Dhaka',
    latitude: DHAKA_LAT,
    longitude: DHAKA_LNG,
    isDefault: false,
  };
}

function firstApiError(data: { error?: string; errors?: Record<string, string[] | undefined> }) {
  if (data.errors) {
    const first = Object.values(data.errors).flat().find(Boolean);
    if (first) return first;
  }
  return data.error || 'Failed to add address';
}

function locationLine(address: IAddress) {
  return [address.area, address.upazila, address.district, address.division]
    .filter(Boolean)
    .join(', ');
}

export default function CustomerAddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const formCardRef = useRef<HTMLDivElement>(null);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
      fetchAddresses(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function fetchAddresses(openWhenEmpty = false) {
    try {
      const res = await fetch('/api/customer/addresses');
      if (res.ok) {
        const data = await res.json();
        const list: IAddress[] = data.data || [];
        setAddresses(list);
        if (openWhenEmpty && list.length === 0) {
          setShowForm(true);
        }
      }
    } catch {
      // ignore — DB may be unreachable
    } finally {
      setLoading(false);
    }
  }

  function openForm() {
    setForm(emptyForm(user));
    setShowForm(true);
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function cancelForm() {
    setShowForm(false);
    setForm(emptyForm(user));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        toast.success('Location detected');
        setLocating(false);
      },
      () => {
        toast.error('Location permission denied');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      toast.error('Please enter a full address');
      return;
    }
    if (!Number.isFinite(form.latitude) || !Number.isFinite(form.longitude)) {
      toast.error('Latitude and longitude are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          area: form.area.trim() || undefined,
          upazila: form.upazila.trim() || undefined,
          district: form.district.trim() || undefined,
          division: form.division.trim() || undefined,
          latitude: form.latitude,
          longitude: form.longitude,
          isDefault: form.isDefault,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Address added');
        setShowForm(false);
        setForm(emptyForm(user));
        fetchAddresses();
      } else {
        toast.error(firstApiError(data));
      }
    } catch {
      toast.error('Failed to add address');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this address?')) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Address deleted');
        fetchAddresses();
      } else {
        toast.error(data.error || 'Failed to delete address');
      }
    } catch {
      toast.error('Failed to delete address');
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
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
            <p className="text-gray-500">Manage your delivery addresses</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/customer">
              <Button variant="outline">Back to Account</Button>
            </Link>
            <Button onClick={() => (showForm ? cancelForm() : openForm())}>
              <Plus className="w-4 h-4 mr-2" /> Add New Address
            </Button>
          </div>
        </div>

        {showForm && (
          <Card ref={formCardRef} id="add-address-form" className="mb-6">
            <CardHeader>
              <CardTitle>New Address</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addr-label">Label *</Label>
                    <Input
                      id="addr-label"
                      placeholder="Home / Office / Other"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr-name">Name *</Label>
                    <Input
                      id="addr-name"
                      placeholder="Recipient name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      minLength={2}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="addr-phone">Phone *</Label>
                  <Input
                    id="addr-phone"
                    placeholder="+8801XXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="addr-full">Full Address *</Label>
                  <Input
                    id="addr-full"
                    placeholder="House, road, block..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                    minLength={5}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addr-area">Area</Label>
                    <Input
                      id="addr-area"
                      placeholder="e.g. Dhanmondi"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr-upazila">Upazila</Label>
                    <Input
                      id="addr-upazila"
                      placeholder="e.g. Dhanmondi"
                      value={form.upazila}
                      onChange={(e) => setForm({ ...form, upazila: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addr-district">District</Label>
                    <Input
                      id="addr-district"
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr-division">Division</Label>
                    <Input
                      id="addr-division"
                      value={form.division}
                      onChange={(e) => setForm({ ...form, division: e.target.value })}
                    />
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <Label>Location *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={locating}>
                      <Crosshair className="w-4 h-4 mr-1" />
                      {locating ? 'Detecting...' : 'Use GPS'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addr-lat" className="text-xs">Latitude</Label>
                      <Input
                        id="addr-lat"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addr-lng" className="text-xs">Longitude</Label>
                      <Input
                        id="addr-lng"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  <span className="text-sm">Set as default address</span>
                </label>
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={cancelForm}>
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
                  <div key={address._id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {address.label}
                          {address.isDefault && <span className="ml-2 text-xs text-green-600">Default</span>}
                        </p>
                        <p className="text-sm text-gray-500">{address.address}</p>
                        {locationLine(address) && (
                          <p className="text-sm text-gray-400 mt-1">{locationLine(address)}</p>
                        )}
                        {(address.name || address.phone) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {[address.name, address.phone].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(address._id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No saved addresses</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Add an address to speed up checkout</p>
                <Button onClick={openForm}>
                  <Plus className="w-4 h-4 mr-2" /> Add New Address
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
