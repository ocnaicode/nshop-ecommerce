'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Megaphone, Send, Trash2, Plus, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const CAMPAIGN_TYPES = ['in_app', 'push', 'email', 'sms', 'multi'] as const;
const AUDIENCE_ROLES = ['customer', 'seller', 'rider'] as const;

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  draft: 'secondary',
  scheduled: 'warning',
  sending: 'warning',
  sent: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
};

interface Campaign {
  _id: string;
  name: string;
  type: string;
  status: string;
  title: string;
  body: string;
  createdAt: string;
  sentCount?: number;
  failedCount?: number;
  audience?: { roles?: string[] };
}

export default function AdminCampaignsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'in_app' as string,
    subject: '',
    title: '',
    body: '',
    roles: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin', 'marketing_manager'].includes(user.role))) {
      router.push('/login');
      return;
    }
    if (user) fetchCampaigns();
  }, [user, authLoading]);

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/admin/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data || []);
      }
    } catch {
      // ignore — DB may be unreachable
    } finally {
      setLoading(false);
    }
  }

  function toggleRole(role: string) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  }

  async function createCampaign() {
    if (!form.name.trim() || !form.title.trim() || !form.body.trim()) {
      toast.error('Name, title and body are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          subject: form.subject || undefined,
          title: form.title,
          body: form.body,
          audience: { roles: form.roles },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Campaign created');
        setShowForm(false);
        setForm({ name: '', type: 'in_app', subject: '', title: '', body: '', roles: [] });
        fetchCampaigns();
      } else {
        toast.error(data.error || 'Failed to create campaign');
      }
    } catch {
      toast.error('Failed to create campaign');
    }
  }

  async function sendCampaign(id: string) {
    setSendingId(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Campaign sent to ${data.data.sent} users`);
      } else {
        toast.error(data.error || 'Failed to send campaign');
      }
      fetchCampaigns();
    } catch {
      toast.error('Failed to send campaign');
    } finally {
      setSendingId(null);
    }
  }

  async function deleteCampaign(id: string) {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch {
      toast.error('Failed to delete campaign');
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
              <p className="text-sm text-gray-500">Automate in-app, push, SMS & email outreach</p>
            </div>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Close' : 'New Campaign'}
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Ramadan Sale 2026"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Channel</Label>
                  <select
                    id="campaign-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  >
                    {CAMPAIGN_TYPES.map((type) => (
                      <option key={type} value={type}>{type.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="campaign-title">Title / Subject</Label>
                <Input
                  id="campaign-title"
                  placeholder="Up to 20% off this week!"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              {form.type === 'email' && (
                <div>
                  <Label htmlFor="campaign-subject">Email Subject</Label>
                  <Input
                    id="campaign-subject"
                    placeholder="Exclusive offer for you"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="campaign-body">Message</Label>
                <textarea
                  id="campaign-body"
                  rows={4}
                  placeholder="Write your campaign message…"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm resize-y"
                />
              </div>
              <div>
                <Label>Audience</Label>
                <div className="flex gap-2 mt-2">
                  {AUDIENCE_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.roles.includes(role)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-green-600'
                      }`}
                    >
                      {role === 'customer' ? 'Customers' : role === 'seller' ? 'Sellers' : 'Riders'}
                    </button>
                  ))}
                  {form.roles.length === 0 && (
                    <span className="text-xs text-gray-400 self-center">All active users</span>
                  )}
                </div>
              </div>
              <Button onClick={createCampaign} className="w-full sm:w-auto">Create Campaign</Button>
            </CardContent>
          </Card>
        )}

        {/* Campaign list */}
        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No campaigns yet</p>
              <p className="text-sm text-gray-400">Create your first marketing campaign to reach customers, sellers & riders.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <Card key={c._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        <Badge variant={STATUS_VARIANTS[c.status]}>{c.status}</Badge>
                        <Badge variant="secondary">{c.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 font-medium">{c.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.body}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>Created {formatDateTime(c.createdAt)}</span>
                        {(c.sentCount ?? 0) > 0 && <span>{c.sentCount} sent</span>}
                        {(c.failedCount ?? 0) > 0 && <span>{c.failedCount} failed</span>}
                        <span>
                          Audience:{' '}
                          {c.audience?.roles?.length
                            ? c.audience.roles.join(', ')
                            : 'All active users'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status !== 'sent' && c.status !== 'sending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendCampaign(c._id)}
                          disabled={sendingId === c._id}
                        >
                          <Send className="w-4 h-4 mr-1.5" />
                          {sendingId === c._id ? 'Sending…' : 'Send'}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteCampaign(c._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
