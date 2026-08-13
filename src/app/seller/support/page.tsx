'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Headphones, Phone, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerSupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      // Support tickets endpoint coming soon — simulate for now
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Support request submitted! We will get back to you within 24 hours.');
      setForm({ subject: '', message: '' });
    } catch {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Seller Support</h1>
          <p className="text-gray-500 text-sm mt-1">We are here to help your shop succeed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            { icon: Phone, label: 'Call Us', value: '+880 1700-000000' },
            { icon: Mail, label: 'Email', value: 'support@localmart.com' },
            { icon: MessageCircle, label: 'Live Chat', value: 'Mon–Sat, 9am–10pm' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500 mt-1">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit a Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input
                  placeholder="Briefly describe your issue"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Message</Label>
                <textarea
                  className="w-full min-h-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Tell us more about the problem..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Link href="/seller">
                  <Button type="button" variant="outline">Back to Dashboard</Button>
                </Link>
                <Button type="submit" disabled={sending}>
                  {sending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
