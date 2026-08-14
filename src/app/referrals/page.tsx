'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Share2, Copy, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ReferralsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchStats();
  }, [user, authLoading]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/referrals/stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!stats?.shareLink) return;
    try {
      await navigator.clipboard.writeText(stats.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Referral link copied!');
    } catch {
      toast.error('Failed to copy link');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Refer &amp; Earn</h1>
        <p className="text-gray-500 mb-8">
          Invite friends to LocalMart and earn {stats?.rewardPoints || 100} points for every successful referral!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold">{stats?.total || 0}</p>
              <p className="text-gray-500 text-sm">Total Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold">{stats?.completed || 0}</p>
              <p className="text-gray-500 text-sm">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-bold">{stats?.pending || 0}</p>
              <p className="text-gray-500 text-sm">Pending</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 bg-gray-50 border-2 border-dashed border-green-300 rounded-xl p-6 text-center">
                <p className="text-3xl font-mono font-bold tracking-widest text-green-700">
                  {stats?.code || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Share this code or your link — friends get {stats?.rewardPoints || 100} pts too!
                </p>
              </div>
              <div className="flex flex-col gap-3 justify-center">
                <Button onClick={copyLink}>
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Share Link'}
                </Button>
                <Button variant="outline" onClick={() => router.push(`/register?ref=${stats?.code || ''}`)}>
                  View Registration Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.completedReferrals?.length ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No referrals yet. Share your code to get started!</p>
                <Link href="/products">
                  <Button variant="outline">Browse Products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.completedReferrals.map((ref: any) => (
                  <div key={ref._id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{ref.referredId?.name || 'Referred user'}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(ref.createdAt)}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      +{stats.rewardPoints} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
