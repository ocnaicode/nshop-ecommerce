'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Coins, History, Gift } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoyaltyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchLoyalty();
    }
  }, [user, authLoading]);

  async function fetchLoyalty() {
    try {
      const res = await fetch('/api/loyalty');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
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

  const history = data?.history || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loyalty Program</h1>
        <p className="text-gray-500 mb-8">
          Earn points on every order and redeem them for discounts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Available Points</p>
                  <p className="text-4xl font-bold mt-1">{data?.balance || 0}</p>
                  <p className="text-green-100 text-xs mt-2">1 point = ৳1 discount</p>
                </div>
                <Coins className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Lifetime Earned</p>
                  <p className="text-3xl font-bold mt-1">{data?.lifetimePoints || 0}</p>
                </div>
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Points Redeemed</p>
                  <p className="text-3xl font-bold mt-1">{data?.redeemedPoints || 0}</p>
                </div>
                <Gift className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-green-600" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No loyalty transactions yet</p>
                <Link href="/products">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((tx: any) => (
                  <div key={tx._id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <Badge
                      variant={tx.points >= 0 ? 'default' : 'secondary'}
                      className={tx.points >= 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                    >
                      {tx.points >= 0 ? '+' : ''}{tx.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-green-800 mb-2">How it works</h3>
          <p className="text-sm text-green-700">
            Earn 1 point for every ৳100 you spend. Invite friends to earn bonus
            points through the referral program!
          </p>
        </div>
      </div>
    </div>
  );
}
