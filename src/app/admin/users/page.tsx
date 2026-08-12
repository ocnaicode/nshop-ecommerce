'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Shield, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !['super_admin', 'admin'].includes(user.role))) { router.push('/login'); return; }
    if (user) fetchUsers();
  }, [user, authLoading]);

  async function fetchUsers() {
    try { const res = await fetch('/api/admin/users'); if (res.ok) { const data = await res.json(); setUsers(data.data || []); } }
    catch {} finally { setLoading(false); }
  }

  async function toggleSuspend(userId: string, suspend: boolean) {
    try { const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, isSuspended: suspend }) }); if ((await res.json()).success) { toast.success(suspend ? 'User suspended' : 'User activated'); fetchUsers(); } } catch {}
  }

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search));

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">User Management</h1>
        <Card className="mb-6"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div></CardContent></Card>
        <Card><CardContent className="p-6">
          {loading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-500"><th className="pb-3">User</th><th className="pb-3">Phone</th><th className="pb-3">Role</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
              <tbody className="divide-y">{filtered.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="py-3"><div className="flex items-center space-x-2"><Shield className="w-4 h-4 text-gray-400" /><span className="font-medium">{u.name}</span></div></td>
                  <td className="py-3 text-gray-500">{u.phone}</td>
                  <td className="py-3"><Badge variant={u.role.includes('admin') ? 'default' : 'secondary'}>{u.role}</Badge></td>
                  <td className="py-3">{u.isSuspended ? <Badge variant="destructive">Suspended</Badge> : u.isVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}</td>
                  <td className="py-3">{u.isSuspended ? <Button size="sm" variant="outline" onClick={() => toggleSuspend(u._id, false)}><UserCheck className="w-3 h-3 mr-1" />Activate</Button> : <Button size="sm" variant="outline" onClick={() => toggleSuspend(u._id, true)} className="text-red-600"><UserX className="w-3 h-3 mr-1" />Suspend</Button>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
