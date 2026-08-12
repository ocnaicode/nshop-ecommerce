'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConfig(); }, []);
  async function fetchConfig() { try { const res = await fetch('/api/admin/settings'); if (res.ok) { const data = await res.json(); setConfig(data.data || []); } } catch {} finally { setLoading(false); } }

  async function saveConfig(key: string, value: any) {
    try { const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) }); if ((await res.json()).success) toast.success('Saved'); } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-100"><div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center"><Settings className="w-6 h-6 mr-2" />System Settings</h1>
      <Card><CardContent className="p-6 space-y-4">
        {loading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> : config.map(c => (
          <div key={c.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><p className="font-medium text-sm">{c.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p><p className="text-xs text-gray-500">{c.description}</p></div>
            <div className="flex items-center space-x-2">
              {c.type === 'boolean' ? (
                <button onClick={() => saveConfig(c.key, !c.value)} className={`w-12 h-6 rounded-full ${c.value ? 'bg-green-600' : 'bg-gray-300'} relative`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${c.value ? 'left-7' : 'left-1'}`} /></button>
              ) : (
                <Input type={c.type === 'number' ? 'number' : 'text'} defaultValue={String(c.value)} onBlur={e => saveConfig(c.key, c.type === 'number' ? parseFloat(e.target.value) : e.target.value)} className="w-32 h-8 text-sm" />
              )}
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div></div>
  );
}
