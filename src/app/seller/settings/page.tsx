'use client';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Truck, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerSettingsPage() {
  const { user } = useAuth();
  const [codFee, setCodFee] = useState('10');
  const [codMax, setCodMax] = useState('10000');
  const [prepTime, setPrepTime] = useState('30');

  const handleSave = () => { toast.success('Settings saved'); };

  return (
    <div className="min-h-screen bg-gray-100"><div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center"><Settings className="w-6 h-6 mr-2" />Shop Settings</h1>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center"><CreditCard className="w-5 h-5 mr-2" />Cash on Delivery</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>COD Fee (৳)</Label><Input type="number" value={codFee} onChange={e => setCodFee(e.target.value)} /></div><div><Label>Max COD Amount (৳)</Label><Input type="number" value={codMax} onChange={e => setCodMax(e.target.value)} /></div></div>
          <p className="text-xs text-gray-500">COD fee is charged to customers who choose cash on delivery.</p>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center"><Truck className="w-5 h-5 mr-2" />Delivery Settings</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>Preparation Time (minutes)</Label><Input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} /></div>
          <p className="text-xs text-gray-500">Average time to prepare orders for delivery/pickup.</p>
        </CardContent></Card>
        <Button onClick={handleSave} size="lg">Save Settings</Button>
      </div>
    </div></div>
  );
}
