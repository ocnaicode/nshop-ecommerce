'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Smartphone } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const METHOD_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  cod: { label: 'Cash on Delivery', icon: Wallet, color: 'bg-gray-100 text-gray-700' },
  bkash: { label: 'bKash', icon: Smartphone, color: 'bg-pink-100 text-pink-700' },
  nagad: { label: 'Nagad', icon: Smartphone, color: 'bg-orange-100 text-orange-700' },
  sslcommerz: { label: 'SSLCommerz', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  authorized: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchPayments();
  }, [user, authLoading]);

  async function fetchPayments() {
    try {
      const res = await fetch('/api/payments?limit=50');
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-500 mb-8">Your payment history across all orders.</p>

        <Card>
          <CardContent className="p-4">
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No payments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p: any) => {
                  const method = METHOD_LABELS[p.method] || { label: p.method, icon: CreditCard, color: 'bg-gray-100 text-gray-700' };
                  const Icon = method.icon;
                  return (
                    <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {p.orderId?.orderNumber || 'Order payment'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(p.createdAt)}
                            {p.transactionId ? ` · ${p.transactionId}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{formatCurrency(p.amount)}</span>
                        <Badge className={STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
