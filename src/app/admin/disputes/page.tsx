'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function DisputesPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDisputes(); }, []);
  async function fetchDisputes() { try { const res = await fetch('/api/admin/disputes'); if (res.ok) { const data = await res.json(); setDisputes(data.data || []); } } catch {} finally { setLoading(false); } }

  return (
    <div className="min-h-screen bg-gray-100"><div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />Disputes</h1>
      <Card><CardContent className="p-6">
        {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div> : disputes.length > 0 ? (
          <div className="space-y-3">{disputes.map(d => (
            <div key={d._id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2"><Badge variant={d.status === 'open' ? 'warning' : d.status === 'resolved' ? 'success' : 'secondary'}>{d.status}</Badge><span className="text-xs text-gray-500">{formatDateTime(d.createdAt)}</span></div>
              <p className="font-medium">{d.reason}</p><p className="text-sm text-gray-600 mt-1">{d.description}</p><p className="text-xs text-gray-400 mt-2">Type: {d.type}</p>
            </div>
          ))}</div>
        ) : <div className="text-center py-12"><AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No disputes</p></div>}
      </CardContent></Card>
    </div></div>
  );
}
