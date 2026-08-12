'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddAddressPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: 'Home', name: '', phone: '', address: '',
    area: '', upazila: '', district: 'Dhaka', division: 'Dhaka',
    latitude: 23.8103, longitude: 90.4125, isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) setForm(prev => ({ ...prev, name: user.name, phone: user.phone }));
  }, [user, authLoading]);

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
        () => toast.error('Location permission denied')
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Address added');
        router.push('/customer');
      } else {
        toast.error(data.error || 'Failed to add address');
      }
    } catch { toast.error('Failed to add address'); }
    finally { setLoading(false); }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/customer"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-2xl font-bold">Add New Address</h1>
        </div>
        <Card>
          <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Label *</Label><Input value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="Home, Office..." required /></div>
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              </div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
              <div><Label>Address *</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="House, Road, Area" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Area</Label><Input value={form.area} onChange={e => setForm({...form, area: e.target.value})} /></div>
                <div><Label>Upazila</Label><Input value={form.upazila} onChange={e => setForm({...form, upazila: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>District</Label><Input value={form.district} onChange={e => setForm({...form, district: e.target.value})} /></div>
                <div><Label>Division</Label><Input value={form.division} onChange={e => setForm({...form, division: e.target.value})} /></div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Location</Label>
                  <Button type="button" variant="outline" size="sm" onClick={getLocation}><MapPin className="w-4 h-4 mr-1" /> Use GPS</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs">Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: parseFloat(e.target.value)})} /></div>
                  <div><Label className="text-xs">Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: parseFloat(e.target.value)})} /></div>
                </div>
              </div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />
                <span className="text-sm">Set as default address</span>
              </label>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Adding...' : 'Add Address'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
