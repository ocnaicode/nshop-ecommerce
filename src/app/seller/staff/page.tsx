'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ALL_PERMISSIONS = ['dashboard', 'products', 'inventory', 'pos', 'orders', 'customers', 'crm', 'promotions', 'coupons', 'analytics', 'finance', 'delivery', 'settings'];

export default function StaffPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', permissions: ['dashboard', 'orders', 'pos'] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) { router.push('/login'); return; }
    if (user?.role === 'seller') fetchStaff();
  }, [user, authLoading]);

  async function fetchStaff() {
    try { const res = await fetch('/api/seller/staff'); if (res.ok) { const data = await res.json(); setStaff(data.data || []); } }
    catch {} finally { setLoading(false); }
  }

  function togglePermission(perm: string) {
    setForm(prev => ({ ...prev, permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch('/api/seller/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast.success('Staff member added'); setShowForm(false); setForm({ name: '', phone: '', password: '', permissions: ['dashboard', 'orders', 'pos'] }); fetchStaff(); }
      else toast.error(data.error);
    } catch { toast.error('Failed'); } finally { setSubmitting(false); }
  }

  async function removeStaff(staffId: string) {
    try { const res = await fetch(`/api/seller/staff?staffId=${staffId}`, { method: 'DELETE' }); if ((await res.json()).success) { setStaff(staff.filter(s => s._id !== staffId)); toast.success('Removed'); } } catch {}
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold">Staff Management</h1><p className="text-gray-500">Manage your shop staff and permissions</p></div>
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
        </div>
        {showForm && (
          <Card className="mb-6 border-green-200">
            <CardHeader><CardTitle>New Staff Member</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
                  <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ALL_PERMISSIONS.map(p => (
                      <button key={p} type="button" onClick={() => togglePermission(p)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.permissions.includes(p) ? 'bg-green-100 border-green-600 text-green-700' : 'border-gray-200 text-gray-500'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Staff'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-6">
            {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div> : staff.length > 0 ? (
              <div className="space-y-3">{staff.map(s => (
                <div key={s._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Shield className="w-5 h-5 text-blue-600" /></div>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.userId?.phone}</p>
                      <div className="flex flex-wrap gap-1 mt-1">{s.permissions?.map((p: string) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeStaff(s._id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}</div>
            ) : <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No staff members yet</p></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
