'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';

export default function CommissionsPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRules(); }, []);
  async function fetchRules() { try { const res = await fetch('/api/admin/commissions'); if (res.ok) { const data = await res.json(); setRules(data.data || []); } } catch {} finally { setLoading(false); } }

  return (
    <div className="min-h-screen bg-gray-100"><div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center"><Percent className="w-6 h-6 mr-2" />Commission Rules</h1>
      <Card><CardContent className="p-6">
        {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> : (
          <div className="space-y-3">{rules.map(r => (
            <div key={r._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div><p className="font-medium">{r.name}</p><p className="text-xs text-gray-500">Type: {r.type} {r.targetId && `• Target: ${r.targetId}`}</p></div>
              <Badge>{r.rate}%</Badge>
            </div>
          ))}</div>
        )}
      </CardContent></Card>
    </div></div>
  );
}
