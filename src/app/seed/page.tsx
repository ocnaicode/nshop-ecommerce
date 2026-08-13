'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const runSeed = async () => {
    setStatus('loading');
    setMessage('Seeding database... (10-30 seconds)');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setResults(data.results || []);
      } else {
        setStatus('error');
        setMessage(data.error || 'Seed failed');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">🌱 Database Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'idle' && (
              <Button onClick={runSeed} size="lg" className="w-full">
                🚀 Start Seeding
              </Button>
            )}
            {status === 'loading' && <p className="text-center">{message}</p>}
            {status === 'success' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-green-600 text-center">{message}</h2>
                <div className="bg-green-50 p-4 rounded">
                  {results.map((r, i) => <p key={i} className="text-sm">{r}</p>)}
                </div>
                <Button onClick={() => window.location.href = '/'} className="w-full">
                  Go to Homepage
                </Button>
              </div>
            )}
            {status === 'error' && (
              <div className="text-center space-y-4">
                <p className="text-red-600">{message}</p>
                <Button onClick={runSeed}>Try Again</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
