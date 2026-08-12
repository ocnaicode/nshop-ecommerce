'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign, TrendingUp, Clock, ArrowDownRight, ArrowUpRight,
  Wallet, CreditCard, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'bkash',
    accountNumber: '',
    accountName: '',
  });
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'seller') fetchWallet();
  }, [user, authLoading]);

  async function fetchWallet() {
    try {
      const res = await fetch('/api/seller/wallet');
      if (res.ok) {
        const data = await res.json();
        setWallet(data.data.wallet);
        setTransactions(data.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawing(true);
    try {
      const res = await fetch('/api/seller/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawForm.amount),
          method: withdrawForm.method,
          accountNumber: withdrawForm.accountNumber,
          accountName: withdrawForm.accountName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Withdrawal request submitted');
        setShowWithdraw(false);
        setWithdrawForm({ amount: '', method: 'bkash', accountNumber: '', accountName: '' });
        fetchWallet();
      } else {
        toast.error(data.error || 'Withdrawal failed');
      }
    } catch {
      toast.error('Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Wallet</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white">Available</Badge>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(wallet?.availableBalance || 0)}</p>
              <p className="text-sm text-green-100 mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
                <Badge variant="warning">Pending</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(wallet?.pendingBalance || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting settlement</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary">Total</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(wallet?.totalEarned || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="mb-8">
          <Button
            size="lg"
            onClick={() => setShowWithdraw(true)}
            disabled={!wallet?.availableBalance || wallet.availableBalance < 100}
          >
            <ArrowUpRight className="w-5 h-5 mr-2" />
            Withdraw Funds
          </Button>
          {wallet?.availableBalance < 100 && (
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Minimum withdrawal is ৳100
            </p>
          )}
        </div>

        {/* Withdraw Form Modal */}
        {showWithdraw && (
          <Card className="mb-8 border-green-200">
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <Label>Amount (৳)</Label>
                  <Input
                    type="number"
                    min="100"
                    max={wallet?.availableBalance || 0}
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(wallet?.availableBalance || 0)}
                  </p>
                </div>

                <div>
                  <Label>Method</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['bkash', 'nagad', 'bank_transfer'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setWithdrawForm({ ...withdrawForm, method })}
                        className={`p-3 rounded-lg border-2 text-sm font-medium ${
                          withdrawForm.method === method
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        {method.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    placeholder="Your account number"
                    required
                  />
                </div>

                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={withdrawForm.accountName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                    placeholder="Account holder name"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowWithdraw(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={withdrawing}>
                    {withdrawing ? 'Processing...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.amount > 0 ? (
                          <ArrowDownRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {tx.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{tx.description}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
