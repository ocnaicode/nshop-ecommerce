'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureFlagsPage() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFlags(); }, []);

  async function fetchFlags() {
    try { const res = await fetch('/api/admin/feature-flags'); if (res.ok) { const data = await res.json(); setFlags(data.data || []); } } catch {} finally { setLoading(false); }
  }

  async function toggleFlag(id: string, enabled: boolean) {
    try { const res = await fetch('/api/admin/feature-flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, enabled: !enabled }) }); if ((await res.json()).success) { toast.success('Flag updated'); fetchFlags(); } } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 flex items-center"><Flag className="w-6 h-6 mr-2" />Feature Flags</h1>
        <Card><CardContent className="p-6">
          {loading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> : (
            <div className="space-y-3">{flags.map(f => (
              <div key={f._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div><p className="font-medium">{f.name}</p><p className="text-xs text-gray-500">{f.key} {f.description && `• ${f.description}`}</p></div>
                <button onClick={() => toggleFlag(f._id, f.enabled)} className={`relative w-12 h-6 rounded-full transition-colors ${f.enabled ? 'bg-green-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${f.enabled ? 'left-7' : 'left-1'}`} /></button>
              </div>
            ))}</div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
