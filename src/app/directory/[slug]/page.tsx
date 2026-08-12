'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Phone, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectoryDetailPage() {
  const params = useParams();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (params.slug) fetchBusiness(); }, [params.slug]);
  async function fetchBusiness() { try { const res = await fetch(`/api/directory/${params.slug}`); if (res.ok) { const data = await res.json(); setBusiness(data.data); } } catch {} finally { setLoading(false); } }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center"><p>Business not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50"><div className="max-w-3xl mx-auto px-4 py-8">
      <Card><CardContent className="p-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center"><Building className="w-10 h-10 text-gray-400" /></div>
          <div><h1 className="text-2xl font-bold">{business.name}</h1><p className="text-gray-500">{business.category}</p>{business.isClaimed ? <Badge variant="success" className="mt-2">Verified Business</Badge> : <Badge variant="outline" className="mt-2">Unclaimed</Badge>}</div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3"><MapPin className="w-5 h-5 text-gray-400" /><span>{business.address}</span></div>
          <div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-gray-400" /><span>{business.phone}</span></div>
          {business.openingHours && <div className="flex items-center space-x-3"><Clock className="w-5 h-5 text-gray-400" /><span>{business.openingHours.open} - {business.openingHours.close}</span></div>}
        </div>
        {business.description && <p className="text-gray-600 mb-6">{business.description}</p>}
        {!business.isClaimed && <Button onClick={() => toast.info('Claim business feature coming soon')}>Are you the owner? Claim this Business</Button>}
      </CardContent></Card>
    </div></div>
  );
}
