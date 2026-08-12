'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Phone, Search, Star } from 'lucide-react';
import Link from 'next/link';

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDirectory(); }, []);
  async function fetchDirectory() { try { const res = await fetch('/api/directory'); if (res.ok) { const data = await res.json(); setBusinesses(data.data || []); } } catch {} finally { setLoading(false); } }

  const filtered = businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Local Business Directory</h1>
        <p className="text-gray-500 mb-6">Discover local businesses in your area</p>
        <div className="relative mb-6"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(b => (
            <Link key={b._id} href={`/directory/${b.slug}`}>
              <Card className="hover:shadow-lg transition-shadow"><CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Building className="w-6 h-6 text-gray-400" /></div>
                  <div className="flex-1"><h3 className="font-semibold">{b.name}</h3><p className="text-sm text-gray-500">{b.category}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400"><MapPin className="w-3 h-3" /><span>{b.address}</span></div>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400"><Phone className="w-3 h-3" /><span>{b.phone}</span></div>
                  </div>
                  {b.isClaimed ? <Badge variant="success">Claimed</Badge> : <Badge variant="outline">Unclaimed</Badge>}
                </div>
              </CardContent></Card>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500"><Building className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>No businesses found</p></div>}
      </div>
    </div>
  );
}
