'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, ShieldCheck, LogOut } from 'lucide-react';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const details = [
    { icon: User, label: 'Name', value: user.name || '—' },
    { icon: Phone, label: 'Phone', value: user.phone || '—' },
    { icon: Mail, label: 'Email', value: user.email || '—' },
    { icon: ShieldCheck, label: 'Role', value: user.role?.replace(/_/g, ' ') || '—' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500">Your account information</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/customer">
              <Button variant="outline">Back to Account</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-700">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <div className="mt-1">
                  <Badge variant="success">{user.role?.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <detail.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-500">{detail.label}</span>
                  </div>
                  <span className="font-medium text-gray-900">{detail.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Profile editing will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
