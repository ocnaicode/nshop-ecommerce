'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Phone, MapPin, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'seller') fetchSuppliers();
  }, [user, authLoading]);

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/seller/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Supplier added');
        setShowForm(false);
        setForm({ name: '', phone: '', address: '', email: '' });
        fetchSuppliers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-500">Manage your product suppliers</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Supplier
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 border-green-200">
            <CardHeader><CardTitle>New Supplier</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Supplier'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : suppliers.length > 0 ? (
              <div className="space-y-3">
                {suppliers.map(s => (
                  <div key={s._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{s.phone}</span>
                          {s.address && <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{s.address}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Balance</p>
                      <p className={`font-bold ${s.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(s.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No suppliers yet</p>
                <p className="text-sm text-gray-400 mt-1">Add suppliers to track purchases and dues</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
