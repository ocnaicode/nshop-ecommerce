'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const PROVIDER_NAMES: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  sslcommerz: 'SSLCommerz',
};

function SimulateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);

  const provider = searchParams.get('provider') || 'bkash';
  const orderId = searchParams.get('orderId') || '';
  const amount = Number(searchParams.get('amount') || 0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  async function simulatePayment() {
    setProcessing(true);
    try {
      // In simulation mode, the paymentID equals the merchant invoice (order number)
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, paymentId: orderId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Payment successful!');
        router.push('/payments');
      } else {
        toast.error(json.error || 'Payment failed');
        setProcessing(false);
      }
    } catch {
      toast.error('Payment verification failed');
      setProcessing(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {PROVIDER_NAMES[provider] || 'Payment'} Sandbox
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            This is a simulated {PROVIDER_NAMES[provider] || 'payment'} page.
            In production, the customer is redirected to the real gateway.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Order</span>
              <span className="font-mono font-medium">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={simulatePayment} disabled={processing}>
            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            No real money is charged in sandbox mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <SimulateContent />
    </Suspense>
  );
}
