'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Zap, Building, Crown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function SellerPlansPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
      return;
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const plans = [
    {
      icon: Building,
      name: 'Basic',
      price: 0,
      period: 'free forever',
      desc: 'For new shops getting started',
      features: ['Up to 20 products', 'Standard commission (5%)', 'Seller delivery', 'Email support'],
      current: true,
    },
    {
      icon: Zap,
      name: 'Business',
      price: 999,
      period: '/ month',
      desc: 'For growing shops',
      features: ['Unlimited products', 'Reduced commission (3%)', 'Platform delivery access', 'Priority support'],
      current: false,
      popular: true,
    },
    {
      icon: Crown,
      name: 'Premium',
      price: 2499,
      period: '/ month',
      desc: 'For established stores',
      features: ['Unlimited products', 'Lowest commission (2%)', 'Featured placement', 'Dedicated account manager'],
      current: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-2">Pick a plan that fits your shop — upgrade or downgrade anytime</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? 'ring-2 ring-green-600' : ''}>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <plan.icon className="w-6 h-6 text-green-600" />
                  </div>
                  {plan.popular && <Badge variant="default">Popular</Badge>}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <p className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                </p>
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.current ? 'outline' : 'default'} className="w-full" disabled={plan.current}>
                  {plan.current ? 'Current Plan' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/seller">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
