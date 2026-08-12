'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); toast.success('Message sent! We will get back to you soon.'); setForm({ name: '', email: '', message: '' }); };
  return (
    <div className="min-h-screen bg-gray-50"><div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card><CardHeader><CardTitle>Get in Touch</CardTitle></CardHeader><CardContent>
          <div className="space-y-4"><div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-green-600" /><span>support@localmart.com</span></div><div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-green-600" /><span>+880-1234-567890</span></div><div className="flex items-center space-x-3"><MapPin className="w-5 h-5 text-green-600" /><span>Dhaka, Bangladesh</span></div></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Send a Message</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="space-y-4"><div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div><div><Label>Message</Label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4} className="w-full rounded-md border px-3 py-2" required /></div><Button type="submit" className="w-full">Send Message</Button></form>
        </CardContent></Card>
      </div>
    </div></div>
  );
}
