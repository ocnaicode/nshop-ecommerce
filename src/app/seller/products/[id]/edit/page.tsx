'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', discountPrice: '', stock: '', status: 'active' });

  useEffect(() => { if (params.id) fetchProduct(); }, [params.id]);

  async function fetchProduct() {
    try { const res = await fetch(`/api/seller/products/${params.id}`); if (res.ok) { const data = await res.json(); setProduct(data.data); setForm({ name: data.data.name, description: data.data.description || '', price: String(data.data.price), discountPrice: data.data.discountPrice ? String(data.data.discountPrice) : '', stock: String(data.data.stock), status: data.data.status }); } } catch {} finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { const res = await fetch(`/api/seller/products/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: parseFloat(form.price), discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null, stock: parseInt(form.stock) }) }); const data = await res.json(); if (data.success) { toast.success('Product updated'); router.push('/seller/products'); } else toast.error(data.error); } catch { toast.error('Failed'); } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8"><Link href="/seller/products"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link><h1 className="text-2xl font-bold">Edit Product</h1></div>
        <Card><CardHeader><CardTitle>Product Details</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>Description</Label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} className="w-full rounded-md border px-3 py-2" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Price (৳)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
              <div><Label>Discount (৳)</Label><Input type="number" value={form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value})} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required /></div>
            </div>
            <div><Label>Status</Label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 rounded-md border px-3"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
            <div className="flex space-x-3"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
          </form>
        </CardContent></Card>
      </div>
    </div>
  );
}
